import { Link, useLocation } from 'react-router-dom';
import { getToken } from '../api/client.js';

function Navbar({ onLogout }) {
  const location = useLocation();
  const isLoggedIn = !!getToken();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          Student Attendance Tracker
        </Link>
        {isLoggedIn && (
          <div className="navbar-links">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/students" className="nav-link">Students</Link>
            <Link to="/attendance" className="nav-link">Attendance</Link>
            <Link to="/schedule" className="nav-link">Schedule</Link>
            <Link to="/classes" className="nav-link">Classes</Link>
            <Link to="/reset-password" className="nav-link">Reset Password</Link>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;