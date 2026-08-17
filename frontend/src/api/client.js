const TOKEN_KEY = 'sat_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function login(username, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

export async function getStudents(showAll = false) {
  const url = showAll ? '/api/students?showAll=true' : '/api/students';
  return apiFetch(url);
}

export async function getStudent(id) {
  return apiFetch(`/api/students/${id}`);
}

export async function createStudent(data) {
  return apiFetch('/api/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStudent(id, data) {
  return apiFetch(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id) {
  return apiFetch(`/api/students/${id}`, { method: 'DELETE' });
}

export async function archiveStudent(id) {
  return apiFetch(`/api/students/${id}/archive`, { method: 'PATCH' });
}

export async function markAttendance(date, records) {
  return apiFetch('/api/attendance', {
    method: 'POST',
    body: JSON.stringify({ date, records }),
  });
}

export async function getStudentAttendance(studentId) {
  return apiFetch(`/api/attendance/student/${studentId}`);
}

export async function setReplacement(studentId, attendanceId, replacementDate) {
  return apiFetch('/api/attendance/replacement', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, attendance_id: attendanceId, replacement_date: replacementDate }),
  });
}