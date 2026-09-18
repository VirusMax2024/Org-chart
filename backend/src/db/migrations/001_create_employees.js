// Migration: สร้าง employees table
exports.up = function (knex) {
  return knex.schema.createTable('employees', function (table) {
    table.increments('id').primary();
    table.string('full_name').notNullable();
    table.string('position').notNullable();
    table.string('department').notNullable();
    table.string('avatar_url').defaultTo('');
    // parent_id อ้างอิงตัวเองในตาราง employees (nullable = top-level CEO)
    table.integer('parent_id').unsigned().references('id').inTable('employees').onDelete('SET NULL').nullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employees');
};
