// knexfile.js — Knex configuration for SQLite
const path = require('path');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(__dirname, '../../orgchart.db'),
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    useNullAsDefault: true,
  },
};
