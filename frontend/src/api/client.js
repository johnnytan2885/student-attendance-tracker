const TOKEN_KEY = 'sat_token';
const STUDENT_TOKEN_KEY = 'sat_student_token';
const ADMIN_ROLE_KEY = 'sat_admin_role';
const ADMIN_PERMS_KEY = 'sat_admin_perms';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_ROLE_KEY);
  localStorage.removeItem(ADMIN_PERMS_KEY);
}

export function getStudentToken() {
  return localStorage.getItem(STUDENT_TOKEN_KEY);
}

export function setStudentToken(token) {
  localStorage.setItem(STUDENT_TOKEN_KEY, token);
}

export function clearStudentToken() {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
}

export function getAdminRole() {
  return localStorage.getItem(ADMIN_ROLE_KEY);
}

export function setAdminRole(role) {
  if (role) {
    localStorage.setItem(ADMIN_ROLE_KEY, role);
  } else {
    localStorage.removeItem(ADMIN_ROLE_KEY);
  }
}

export function getAdminPermissions() {
  const perms = localStorage.getItem(ADMIN_PERMS_KEY);
  if (!perms) return {};
  try {
    return JSON.parse(perms);
  } catch (e) {
    return {};
  }
}

export function setAdminPermissions(permissions) {
  if (permissions && Object.keys(permissions).length > 0) {
    localStorage.setItem(ADMIN_PERMS_KEY, JSON.stringify(permissions));
  } else {
    localStorage.removeItem(ADMIN_PERMS_KEY);
  }
}

export function hasPermission(permission) {
  if (getAdminRole() === 'admin') return true;
  const perms = getAdminPermissions();
  return !!perms[permission];
}

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const studentToken = getStudentToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (studentToken) {
    headers['Authorization'] = `Bearer ${studentToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !options.skipAuthRedirect) {
    clearToken();
    clearStudentToken();
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
    skipAuthRedirect: true,
  });
  if (data.role) {
    setAdminRole(data.role);
    setAdminPermissions(data.permissions || {});
  }
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

// --- Student Auth ---

export async function studentSignup(data) {
  return apiFetch('/api/auth/student/signup', { method: 'POST', body: JSON.stringify(data) });
}

export async function studentLogin(username, password) {
  const data = await apiFetch('/api/auth/student/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuthRedirect: true,
  });
  return data;
}

export async function studentLogout() {
  await apiFetch('/api/auth/student/logout', { method: 'POST' });
  clearStudentToken();
}

export async function getStudentMe() {
  return apiFetch('/api/auth/student/me');
}

export async function getStudentProfile() {
  return apiFetch('/api/auth/student/profile');
}

export async function getMyStudentAttendance() {
  return apiFetch('/api/auth/student/attendance');
}

export async function studentChangePassword(currentPassword, newPassword) {
  return apiFetch('/api/auth/student/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// --- Exams ---

export async function getExams() {
  return apiFetch('/api/exams');
}

export async function createExam(data) {
  return apiFetch('/api/exams', { method: 'POST', body: JSON.stringify(data) });
}

export async function getExam(id) {
  return apiFetch(`/api/exams/${id}`);
}

export async function updateExam(id, data) {
  return apiFetch(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteExam(id) {
  return apiFetch(`/api/exams/${id}`, { method: 'DELETE' });
}

export async function addQuestion(examId, data) {
  return apiFetch(`/api/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateQuestion(questionId, data) {
  return apiFetch(`/api/exams/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteQuestion(questionId) {
  return apiFetch(`/api/exams/questions/${questionId}`, { method: 'DELETE' });
}

export async function allocateExam(examId, studentIds) {
  return apiFetch(`/api/exams/${examId}/allocate`, { method: 'POST', body: JSON.stringify({ student_ids: studentIds }) });
}

export async function getExamAllocated(examId) {
  return apiFetch(`/api/exams/${examId}/allocated`);
}

export async function getStudentAvailableExams() {
  return apiFetch('/api/exams/student/available');
}

export async function getStudentExam(id) {
  return apiFetch(`/api/exams/student/${id}`);
}

export async function getStudentExamQuestions(id) {
  return apiFetch(`/api/exams/student/${id}/questions`);
}

export async function startStudentExam(id) {
  return apiFetch(`/api/exams/student/${id}/start`, { method: 'POST' });
}

export async function submitStudentAnswer(examId, data) {
  return apiFetch(`/api/exams/student/${examId}/answer`, { method: 'POST', body: JSON.stringify(data) });
}

export async function submitStudentExam(id) {
  return apiFetch(`/api/exams/student/${id}/submit`, { method: 'POST' });
}

export async function getStudentExamResult(id) {
  return apiFetch(`/api/exams/student/${id}/result`);
}

export async function getStudentExamHistory() {
  return apiFetch('/api/exams/student/history');
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

export async function getAttendanceByDate(dateStr) {
  return apiFetch('/api/attendance/date/' + dateStr);
}

export async function editReplacementDate(attendanceId, replacementDate, time, endTime) {
  return apiFetch('/api/attendance/' + attendanceId + '/replacement', {
    method: 'PATCH',
    body: JSON.stringify({ replacement_date: replacementDate, time: time || null, end_time: endTime || null }),
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

export async function setReplacement(studentId, attendanceId, replacementDate, time, endTime) {
  return apiFetch('/api/attendance/replacement', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, attendance_id: attendanceId, replacement_date: replacementDate, time: time || null, end_time: endTime || null }),
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

export async function getStudentClasses() {
  return apiFetch('/api/student/classes');
}

export async function getStudentClass(id) {
  return apiFetch(`/api/student/classes/${id}`);
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

export async function markScheduleAttendance(scheduleId, studentId, status) {
  return apiFetch('/api/schedules/' + scheduleId + '/mark', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, status: status }),
  });
}

export async function markReplacementAttendance(sourceAbsentId, studentId, status) {
  return apiFetch('/api/schedules/' + sourceAbsentId + '/mark-replacement', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, status: status, source_absent_id: sourceAbsentId }),
  });
}

export async function resetStudentExam(examId, studentId) {
  return apiFetch('/api/exams/' + examId + '/reset', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  });
}

export async function getSubAdmins() {
  return apiFetch('/api/auth/sub-admins');
}

export async function createSubAdmin(data) {
  return apiFetch('/api/auth/sub-admins', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSubAdmin(id, data) {
  return apiFetch('/api/auth/sub-admins/' + id, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSubAdmin(id) {
  return apiFetch('/api/auth/sub-admins/' + id, {
    method: 'DELETE',
  });
}
