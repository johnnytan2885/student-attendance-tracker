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

export async function resetPassword(currentPassword, newPassword) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

export async function getStudents(showAll = false, classId = null) {
  let url = showAll ? '/api/students?showAll=true' : '/api/students';
  if (classId) url += (showAll ? '&' : '?') + `class_id=${classId}`;
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

export async function getAttendanceDates(from, to) {
  return apiFetch('/api/attendance/dates?from=' + from + '&to=' + to);
}

export async function getTodayAttendance() {
  return apiFetch('/api/attendance/today');
}

export async function editReplacementDate(attendanceId, replacementDate) {
  return apiFetch(`/api/attendance/${attendanceId}/replacement`, {
    method: 'PATCH',
    body: JSON.stringify({ replacement_date: replacementDate }),
  });
}

export async function editAttendance(attendanceId, status) {
  return apiFetch(`/api/attendance/${attendanceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAttendance(attendanceId) {
  return apiFetch(`/api/attendance/${attendanceId}`, { method: 'DELETE' });
}

export async function setReplacement(studentId, attendanceId, replacementDate) {
  return apiFetch('/api/attendance/replacement', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, attendance_id: attendanceId, replacement_date: replacementDate }),
  });
}

// --- Classes ---

export async function getClasses(showAll) {
  const url = showAll ? '/api/classes?showAll=true' : '/api/classes';
  return apiFetch(url);
}

export async function getClass(id) {
  return apiFetch(`/api/classes/${id}`);
}

export async function createClass(data) {
  return apiFetch('/api/classes', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateClass(id, data) {
  return apiFetch(`/api/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteClass(id) {
  return apiFetch(`/api/classes/${id}`, { method: 'DELETE' });
}

export async function createStage(classId, name) {
  return apiFetch(`/api/classes/${classId}/stages`, { method: 'POST', body: JSON.stringify({ name }) });
}

export async function updateStage(stageId, name) {
  return apiFetch(`/api/classes/stages/${stageId}`, { method: 'PUT', body: JSON.stringify({ name }) });
}

export async function deleteStage(stageId) {
  return apiFetch(`/api/classes/stages/${stageId}`, { method: 'DELETE' });
}

export async function getAvailableStudents(classId) {
  return apiFetch(`/api/classes/${classId}/available-students`);
}

export async function assignStudent(classId, studentId) {
  return apiFetch(`/api/classes/${classId}/students`, { method: 'POST', body: JSON.stringify({ student_id: studentId }) });
}

export async function removeStudent(classId, studentId) {
  return apiFetch(`/api/classes/${classId}/students/${studentId}`, { method: 'DELETE' });
}

export async function setStudentStage(classId, studentId, stageId) {
  return apiFetch(`/api/classes/${classId}/students/${studentId}/stage`, { method: 'PATCH', body: JSON.stringify({ stage_id: stageId }) });
}

// --- Schedules ---

export async function createSchedule(data) {
  return apiFetch('/api/schedules', { method: 'POST', body: JSON.stringify(data) });
}

export async function getSchedules() {
  return apiFetch('/api/schedules');
}

export async function getSchedulesRange(from, to) {
  return apiFetch(`/api/schedules/range?from=${from}&to=${to}`);
}

export async function deleteSchedule(id) {
  return apiFetch(`/api/schedules/${id}`, { method: 'DELETE' });
}
