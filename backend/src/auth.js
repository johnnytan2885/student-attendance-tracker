const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('./db');
const sessions = new Map();
const studentSessions = new Map();

function createSession(adminId, role) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { adminId, role, createdAt: Date.now() });
  return token;
}

function createStudentSession(studentId) {
  const token = crypto.randomBytes(32).toString('hex');
  studentSessions.set(token, { studentId, createdAt: Date.now() });
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function destroyStudentSession(token) {
  studentSessions.delete(token);
}

function getSession(token) {
  return sessions.get(token);
}

function getStudentSession(token) {
  return studentSessions.get(token);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.adminId = session.adminId;
  req.adminRole = session.role;
  req.sessionToken = token;
  if (session.role === 'sub_admin') {
    const admin = db.prepare('SELECT permissions FROM admin WHERE id = ?').get(session.adminId);
    if (admin && admin.permissions) {
      try {
        req.adminPermissions = JSON.parse(admin.permissions);
      } catch (e) {
        req.adminPermissions = {};
      }
    } else {
      req.adminPermissions = {};
    }
  } else {
    req.adminPermissions = {};
  }
  next();
}

function requireStudentAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7);
  const session = getStudentSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.studentId = session.studentId;
  req.studentToken = token;
  next();
}

function hasPermission(req, permission) {
  if (req.adminRole === 'admin') return true;
  if (req.adminRole === 'sub_admin') {
    const perms = req.adminPermissions || {};
    return !!perms[permission];
  }
  return false;
}

function requirePermission(permission) {
  return function(req, res, next) {
    if (!hasPermission(req, permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
}

module.exports = {
  createSession,
  createStudentSession,
  destroySession,
  destroyStudentSession,
  getSession,
  getStudentSession,
  requireAuth,
  requireStudentAuth,
  hasPermission,
  requirePermission
};
