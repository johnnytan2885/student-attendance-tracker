const db = require('../src/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS student (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      credits INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
      replacement_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date
      ON attendance_record(student_id, date);

    CREATE TABLE IF NOT EXISTS class (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS class_stage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS class_student (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      stage_id INTEGER,
      FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
      FOREIGN KEY (stage_id) REFERENCES class_stage(id) ON DELETE SET NULL,
      UNIQUE(class_id, student_id)
    );
  `);

  const existing = db.prepare('SELECT id FROM admin WHERE username = ?').get(process.env.ADMIN_USERNAME || 'admin');
  if (!existing) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.prepare('INSERT INTO admin (username, password_hash, must_change_password) VALUES (?, ?, 1)').run(
      process.env.ADMIN_USERNAME || 'admin',
      hash
    );
    console.log('Default admin user seeded.');
  }
}

module.exports = { initialize };
