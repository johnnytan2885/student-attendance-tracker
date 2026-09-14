const db = require('../src/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

function randomSeed() {
  return crypto.randomBytes(8).toString('hex');
}

function initialize() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      role TEXT NOT NULL DEFAULT 'admin',
      permissions TEXT
    );

    CREATE TABLE IF NOT EXISTS student (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      notes TEXT,
      credits INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance_record (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
      replacement_date TEXT,
      time TEXT,
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

    CREATE TABLE IF NOT EXISTS scheduled_class (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      end_time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS scheduled_class_student (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheduled_class_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      FOREIGN KEY (scheduled_class_id) REFERENCES scheduled_class(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
      UNIQUE(scheduled_class_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS exam (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      time_limit_minutes INTEGER NOT NULL DEFAULT 30,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exam_question (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL CHECK(correct_option IN ('A','B','C','D')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES exam(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_exam (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      started_at TEXT,
      started_at_ms INTEGER,
      submitted_at TEXT,
      score INTEGER,
      total_questions INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
      FOREIGN KEY (exam_id) REFERENCES exam(id) ON DELETE CASCADE,
      UNIQUE(student_id, exam_id)
    );

    CREATE TABLE IF NOT EXISTS student_answer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_exam_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option TEXT,
      is_correct INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_exam_id) REFERENCES student_exam(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES exam_question(id) ON DELETE CASCADE,
      UNIQUE(student_exam_id, question_id)
    );
  `);

  const studentCols = db.prepare('PRAGMA table_info(student)').all().map(c => c.name);
  if (!studentCols.includes('avatar_seed')) {
    db.exec('ALTER TABLE student ADD COLUMN avatar_seed TEXT;');
  }

  const needBackfill = db.prepare('SELECT id FROM student WHERE avatar_seed IS NULL').all();
  if (needBackfill.length > 0) {
    const upd = db.prepare('UPDATE student SET avatar_seed = ? WHERE id = ?');
    const tx = db.transaction(rows => {
      for (const row of rows) upd.run(randomSeed(), row.id);
    });
    tx(needBackfill);
    console.log(`Backfilled avatar seed for ${needBackfill.length} student(s).`);
  }

  if (!studentCols.includes('password_hash')) {
    db.exec('ALTER TABLE student ADD COLUMN password_hash TEXT;');
  }

  if (!studentCols.includes('username')) {
    db.exec('ALTER TABLE student ADD COLUMN username TEXT;');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_student_username ON student(username);');
  }

  const needUsername = db.prepare('SELECT id, name FROM student WHERE username IS NULL').all();
  if (needUsername.length > 0) {
    const upd = db.prepare('UPDATE student SET username = ? WHERE id = ?');
    const tx = db.transaction(rows => {
      for (const row of rows) {
        let base = (row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'user';
        let username = base;
        let counter = 1;
        while (db.prepare('SELECT id FROM student WHERE username = ?').get(username)) {
          username = base + '_' + counter++;
        }
        upd.run(username, row.id);
      }
    });
    tx(needUsername);
    console.log(`Backfilled username for ${needUsername.length} student(s).`);
  }

  const examCols = db.prepare('PRAGMA table_info(student_exam)').all().map(c => c.name);
  if (!examCols.includes('started_at_ms')) {
    db.exec('ALTER TABLE student_exam ADD COLUMN started_at_ms INTEGER;');
  }

  const needExamMs = db.prepare('SELECT id, started_at FROM student_exam WHERE started_at IS NOT NULL AND started_at_ms IS NULL').all();
  if (needExamMs.length > 0) {
    const upd = db.prepare('UPDATE student_exam SET started_at_ms = ? WHERE id = ?');
    const tx = db.transaction(rows => {
      for (const row of rows) {
        const d = new Date(row.started_at + 'Z').getTime();
        upd.run(d, row.id);
      }
    });
    tx(needExamMs);
    console.log(`Backfilled started_at_ms for ${needExamMs.length} student_exam(s).`);
  }

  const adminCols = db.prepare('PRAGMA table_info(admin)').all().map(c => c.name);
  if (!adminCols.includes('role')) {
    db.exec("ALTER TABLE admin ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';");
  }
  if (!adminCols.includes('permissions')) {
    db.exec('ALTER TABLE admin ADD COLUMN permissions TEXT;');
  }

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
