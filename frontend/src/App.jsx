import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import AttendanceForm from './pages/AttendanceForm.jsx';
import { getToken, clearToken, getMe } from './api/client.js';

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

function RootRedirect() {
  const token = getToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;