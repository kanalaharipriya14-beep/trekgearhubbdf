// ============================================================================
// TrekGear Hub - Database Connection Module
// Purpose: Initializes and configures the SQLite database connection
//          and exports Promise-based query helpers for clean async/await code.
// ============================================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Determine database file path (allows override via environment variable)
const DB_PATH = process.env.DB_FILE || path.join(__dirname, '..', 'trekgear.db');

// Create SQLite database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else if (process.env.NODE_ENV !== 'test') {
    console.log(`Connected to SQLite database at: ${DB_PATH}`);
  }
});

// Enable SQLite Foreign Key constraints (disabled by default in SQLite)
db.run('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error('Failed to enable foreign keys:', err.message);
  }
});

/**
 * Helper to run a query that returns multiple rows (SELECT).
 * @param {string} sql - SQL query string with parameter placeholders (?)
 * @param {Array} params - Array of parameter values to bind
 * @returns {Promise<Array>} Resolves to array of matching rows
 */
db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

/**
 * Helper to run a query that returns a single row (SELECT ... LIMIT 1).
 * @param {string} sql - SQL query string with parameter placeholders (?)
 * @param {Array} params - Array of parameter values to bind
 * @returns {Promise<Object|undefined>} Resolves to the row object or undefined
 */
db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

/**
 * Helper to run a command query (INSERT, UPDATE, DELETE).
 * @param {string} sql - SQL command string with parameter placeholders (?)
 * @param {Array} params - Array of parameter values to bind
 * @returns {Promise<{lastID: number, changes: number}>} Resolves with metadata
 */
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Helper to close the database connection gracefully.
 * @returns {Promise<void>}
 */
db.closeAsync = function () {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = db;

