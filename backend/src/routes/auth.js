const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { createSession, destroySession, requireAuth, createStudentSession, destroyStudentSession, getStudentSession, requireStudentAuth, hasPermission, requirePermission } = require('../auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createSession(admin.id, admin.role);
  let permissions = null;
  if (admin.role === 'sub_admin' && admin.permissions) {
    try {
      permissions = JSON.parse(admin.permissions);
    } catch (e) {
      permissions = {};
    }
  }
  res.json({
    token,
    role: admin.role,
    permissions,
    mustChangePassword: admin.must_change_password === 1
  });
});

router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.adminId);
  const valid = bcrypt.compareSync(currentPassword, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, req.adminId);
  res.json({ message: 'Password changed successfully' });
});

router.post('/reset-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.adminId);
  const valid = bcrypt.compareSync(currentPassword, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?').run(hash, req.adminId);
  res.json({ message: 'Password reset successfully' });
});

router.post('/logout', requireAuth, (req, res) => {
  destroySession(req.sessionToken);
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  const admin = db.prepare('SELECT id, username, must_change_password, role, permissions FROM admin WHERE id = ?').get(req.adminId);
  let permissions = null;
  if (admin.role === 'sub_admin' && admin.permissions) {
    try {
      permissions = JSON.parse(admin.permissions);
    } catch (e) {
      permissions = {};
    }
  }
  res.json({ 
    id: admin.id, 
    username: admin.username, 
    role: admin.role,
    permissions,
    mustChangePassword: admin.must_change_password === 1 
  });
});

// --- Sub-Admin Management ---

router.get('/sub-admins', requireAuth, (req, res) => {
  const subAdmins = db.prepare(
    "SELECT id, username, must_change_password, role, permissions FROM admin WHERE role = 'sub_admin' ORDER BY username"
  ).all();
  const result = subAdmins.map(a => {
    let perms = {};
    if (a.permissions) {
      try { perms = JSON.parse(a.permissions); } catch (e) { perms = {}; }
    }
    return { id: a.id, username: a.username, mustChangePassword: a.must_change_password === 1, permissions: perms };
  });
  res.json(result);
});

router.post('/sub-admins', requireAuth, requirePermission('can_manage_admins'), (req, res) => {
  const { username, password, permissions } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM admin WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const perms = permissions || {};
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO admin (username, password_hash, must_change_password, role, permissions) VALUES (?, ?, 1, 'sub_admin', ?)"
  ).run(username, hash, JSON.stringify(perms));
  const admin = db.prepare('SELECT id, username, must_change_password FROM admin WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ id: admin.id, username: admin.username, mustChangePassword: admin.must_change_password === 1, permissions: perms });
});

router.put('/sub-admins/:id', requireAuth, requirePermission('can_manage_admins'), (req, res) => {
  const subAdmin = db.prepare('SELECT * FROM admin WHERE id = ? AND role = ?').get(req.params.id, 'sub_admin');
  if (!subAdmin) return res.status(404).json({ error: 'Sub-admin not found' });

  const { username, password, permissions } = req.body;
  if (username && username !== subAdmin.username) {
    const existing = db.prepare('SELECT id FROM admin WHERE username = ? AND id != ?').get(username, req.params.id);
    if (existing) return res.status(400).json({ error: 'Username already exists' });
  }

  const updates = [];
  const values = [];
  if (username) { updates.push('username = ?'); values.push(username); }
  if (password) { 
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    updates.push('password_hash = ?'); values.push(bcrypt.hashSync(password, 10)); 
  }
  if (permissions !== undefined) { updates.push('permissions = ?'); values.push(JSON.stringify(permissions)); }
  values.push(req.params.id);

  db.prepare(`UPDATE admin SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare('SELECT id, username, must_change_password, role, permissions FROM admin WHERE id = ?').get(req.params.id);
  let perms = {};
  if (updated.permissions) {
    try { perms = JSON.parse(updated.permissions); } catch (e) { perms = {}; }
  }
  res.json({ id: updated.id, username: updated.username, mustChangePassword: updated.must_change_password === 1, permissions: perms });
});

router.delete('/sub-admins/:id', requireAuth, requirePermission('can_manage_admins'), (req, res) => {
  const subAdmin = db.prepare('SELECT id FROM admin WHERE id = ? AND role = ?').get(req.params.id, 'sub_admin');
  if (!subAdmin) return res.status(404).json({ error: 'Sub-admin not found' });
  db.prepare('DELETE FROM admin WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// --- Student Auth ---

router.post('/student/signup', (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existingUsername = db.prepare('SELECT id FROM student WHERE username = ?').get(username);
  if (existingUsername) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  if (email) {
    const existingEmail = db.prepare('SELECT id FROM student WHERE email = ?').get(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO student (name, username, email, password_hash, active) VALUES (?, ?, ?, ?, 1)').run(name.trim(), username.trim(), email || null, hash);
  const student = db.prepare('SELECT id, name, username, email FROM student WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(student);
});

router.post('/student/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const student = db.prepare('SELECT * FROM student WHERE username = ? AND active = 1').get(username);
  if (!student || !student.password_hash) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, student.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createStudentSession(student.id);
  res.json({
    token,
    student: { id: student.id, name: student.name, username: student.username, email: student.email }
  });
});

router.post('/student/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) destroyStudentSession(token);
  res.json({ message: 'Logged out' });
});

router.get('/student/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  const session = getStudentSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  const student = db.prepare('SELECT id, name, username, email FROM student WHERE id = ?').get(session.studentId);
  res.json(student);
});

router.get('/student/profile', requireStudentAuth, (req, res) => {
  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const classes = db.prepare(
    `SELECT c.id, c.name, c.description, cs.stage_id, cs_st.name as stage_name
     FROM class_student cs
     JOIN class c ON c.id = cs.class_id
     LEFT JOIN class_stage cs_st ON cs_st.id = cs.stage_id
     WHERE cs.student_id = ?`
  ).all(req.studentId);

  res.json({ ...student, classes });
});

router.get('/student/attendance', requireStudentAuth, (req, res) => {
  const attendance = db.prepare(
    `SELECT ar.id, ar.date, ar.status, ar.replacement_date, ar.time, ar.end_time, ar.scheduled_class_id,
            c.name as class_name, sc.time as scheduled_time, sc.end_time as scheduled_end_time
     FROM attendance_record ar
     LEFT JOIN scheduled_class sc ON sc.id = ar.scheduled_class_id
     LEFT JOIN class c ON c.id = sc.class_id
     WHERE ar.student_id = ?
     ORDER BY ar.date DESC`
  ).all(req.studentId);
  res.json(attendance);
});

router.post('/student/change-password', requireStudentAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const student = db.prepare('SELECT * FROM student WHERE id = ?').get(req.studentId);
  const valid = bcrypt.compareSync(currentPassword, student.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE student SET password_hash = ? WHERE id = ?').run(hash, req.studentId);
  res.json({ message: 'Password changed successfully' });
});

module.exports = router;
