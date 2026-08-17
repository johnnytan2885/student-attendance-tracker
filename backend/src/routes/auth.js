const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const { createSession, destroySession, requireAuth } = require('../auth');

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

  const token = createSession(admin.id);
  res.json({
    token,
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

router.post('/logout', requireAuth, (req, res) => {
  destroySession(req.sessionToken);
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  const admin = db.prepare('SELECT id, username, must_change_password FROM admin WHERE id = ?').get(req.adminId);
  res.json({ id: admin.id, username: admin.username, mustChangePassword: admin.must_change_password === 1 });
});

module.exports = router;