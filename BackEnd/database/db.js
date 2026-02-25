const Database = require("better-sqlite3");
const path = require("path");

// Connect to SQLite database
const dbPath = path.join(__dirname, "app.db");
const db = new Database(dbPath);

// Create a sample table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE,
        email TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT CHECK(role IN ('student', 'teacher')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

module.exports = db;

/**
 * By default everyone is a student (is_student = 1). 
 */