// services/r2Service.js — Cloudflare R2 Object Storage Integration
// รองรับการอัปโหลดรูปภาพ Avatar ไปยัง Cloudflare R2 ผ่าน S3-Compatible API
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

let s3Client = null;

/**
 * สร้างหรือดึง S3Client สำหรับเชื่อมต่อ Cloudflare R2
 */
function getS3Client() {
  const accountId       = process.env.R2_ACCOUNT_ID;
  const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

/**
 * อัปโหลดไฟล์รูปภาพขึ้น Cloudflare R2
 * @param {Buffer} buffer - ข้อมูลไฟล์รูปในหน่วยความจำ
 * @param {string} originalname - ชื่อไฟล์ต้นฉบับ
 * @param {string} mimetype - ประเภทของไฟล์รูปภาพ
 * @returns {Promise<string>} Public URL ของรูปภาพ
 */
async function uploadImageToR2(buffer, originalname, mimetype) {
  const client     = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  // หากไม่ได้ตั้งค่า R2 ให้บันทึกเป็น Base64 Data URL ตรงลงในฐานข้อมูล (ฟรี 100% ไม่ต้องใช้ R2)
  if (!client || !bucketName) {
    console.log('📸 [Storage] Storing avatar directly in PostgreSQL as Base64 Data URL (100% Free Mode)');
    const mime = mimetype || 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  const ext = path.extname(originalname) || '.png';
  const uniqueKey = `avatars/avatar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    Body: buffer,
    ContentType: mimetype || 'image/jpeg',
  });

  await client.send(command);

  // สร้าง Public URL สำหรับรูป
  const publicDomain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');
  if (publicDomain) {
    return `${publicDomain}/${uniqueKey}`;
  }

  return `https://${bucketName}.r2.dev/${uniqueKey}`;
}

/**
 * ลบรูปภาพออกจาก Cloudflare R2
 * @param {string} avatarUrl - URL ของรูปที่ต้องการลบ
 */
async function deleteImageFromR2(avatarUrl) {
  const client     = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!client || !bucketName || !avatarUrl) return;

  try {
    let key = '';
    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');
    if (publicDomain && avatarUrl.startsWith(publicDomain)) {
      key = avatarUrl.replace(`${publicDomain}/`, '');
    } else if (avatarUrl.includes('avatars/')) {
      key = 'avatars/' + avatarUrl.split('avatars/')[1];
    }

    if (key) {
      await client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      }));
      console.log(`🗑️ [R2] Deleted old avatar: ${key}`);
    }
  } catch (err) {
    console.warn('⚠️ [R2] Failed to delete old avatar:', err.message);
  }
}

module.exports = {
  uploadImageToR2,
  deleteImageFromR2,
};
