import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StudentList from './pages/StudentList.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import AttendanceForm from './pages/AttendanceForm.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import ClassList from './pages/ClassList.jsx';
import ClassDetail from './pages/ClassDetail.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import StudentSignup from './pages/StudentSignup.jsx';
import ExamList from './pages/ExamList.jsx';
import ExamDetail from './pages/ExamDetail.jsx';
import StudentExamList from './pages/StudentExamList.jsx';
import StudentExamTake from './pages/StudentExamTake.jsx';
import StudentExamResult from './pages/StudentExamResult.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentChangePassword from './pages/StudentChangePassword.jsx';
import StudentClassList from './pages/StudentClassList.jsx';
import StudentClassDetail from './pages/StudentClassDetail.jsx';
import SubAdminList from './pages/SubAdminList.jsx';
import { getToken, clearToken, getMe, getStudentToken, clearStudentToken, getStudentMe } from './api/client.js';

function AuthGuard({ children }) {
  const [authState, setAuthState] = useState('loading');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthState('unauthenticated');
      return;
    }
    getMe()
      .then(() => setAuthState('authenticated'))
      .catch(() => {
        clearToken();
        setAuthState('unauthenticated');
      });
  }, []);

  if (authState === 'loading') {
    return <div className="page-center"><p>Loading...</p></div>;
  }
  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function StudentGuard({ children }) {
  const [authState, setAuthState] = useState('loading');

  useEffect(() => {
    const token = getStudentToken();
    if (!token) {
      setAuthState('unauthenticated');
      return;
    }
    getStudentMe()
      .then(() => setAuthState('authenticated'))
      .catch(() => {
        clearStudentToken();
        setAuthState('unauthenticated');
      });
  }, []);

  if (authState === 'loading') {
    return <div className="page-center"><p>Loading...</p></div>;
  }
  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RootRedirect() {
  const token = getToken();
  const studentToken = getStudentToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  if (studentToken) {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  const navigate = useNavigate();

  function handleLogout() {
    const token = getToken();
    const studentToken = getStudentToken();
    if (token) {
      clearToken();
    }
    if (studentToken) {
      clearStudentToken();
    }
    navigate('/login');
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<StudentSignup />} />
          <Route
            path="/change-password"
            element={
              <AuthGuard>
                <ChangePasswordPage />
              </AuthGuard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/students"
            element={
              <AuthGuard>
                <StudentList />
              </AuthGuard>
            }
          />
          <Route
            path="/students/:id"
            element={
              <AuthGuard>
                <StudentProfile />
              </AuthGuard>
            }
          />
          <Route
            path="/attendance"
            element={
              <AuthGuard>
                <AttendanceForm />
              </AuthGuard>
            }
          />
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/reset-password"
            element={
              <AuthGuard>
                <ResetPasswordPage />
              </AuthGuard>
            }
          />
          <Route
            path="/classes"
            element={
              <AuthGuard>
                <ClassList />
              </AuthGuard>
            }
          />
          <Route
            path="/classes/:id"
            element={
              <AuthGuard>
                <ClassDetail />
              </AuthGuard>
            }
          />
          <Route
            path="/schedule"
            element={
              <AuthGuard>
                <SchedulePage />
              </AuthGuard>
            }
          />
          <Route
            path="/exams"
            element={
              <AuthGuard>
                <ExamList />
              </AuthGuard>
            }
          />
          <Route
            path="/exams/:id"
            element={
              <AuthGuard>
                <ExamDetail />
              </AuthGuard>
            }
          />
          <Route
            path="/sub-admins"
            element={
              <AuthGuard>
                <SubAdminList />
              </AuthGuard>
            }
          />
          <Route
            path="/student/exams"
            element={
              <StudentGuard>
                <StudentExamList />
              </StudentGuard>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <StudentGuard>
                <StudentDashboard />
              </StudentGuard>
            }
          />
          <Route
            path="/student/change-password"
            element={
              <StudentGuard>
                <StudentChangePassword />
              </StudentGuard>
            }
          />
          <Route
            path="/student/classes"
            element={
              <StudentGuard>
                <StudentClassList />
              </StudentGuard>
            }
          />
          <Route
            path="/student/classes/:id"
            element={
              <StudentGuard>
                <StudentClassDetail />
              </StudentGuard>
            }
          />
          <Route
            path="/student/exams/:id"
            element={
              <StudentGuard>
                <StudentExamTake />
              </StudentGuard>
            }
          />
          <Route
            path="/student/exams/:id/result"
            element={
              <StudentGuard>
                <StudentExamResult />
              </StudentGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;