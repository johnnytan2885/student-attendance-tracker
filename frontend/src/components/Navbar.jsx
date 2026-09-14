import { Link, useLocation } from 'react-router-dom';
import { getToken, getStudentToken, getAdminRole, getAdminPermissions } from '../api/client.js';
import { useState } from 'react';

function Navbar({ onLogout }) {
  const location = useLocation();
  const isAdmin = !!getToken();
  const isStudent = !!getStudentToken();
  const adminRole = getAdminRole();
  const isSuperAdmin = isAdmin && adminRole === 'admin';
  const adminPermissions = getAdminPermissions();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';
  const [showDropdown, setShowDropdown] = useState(false);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', permission: null, alwaysShow: true, group: 'core' },
    { label: 'Students', path: '/students', permission: 'can_manage_students', group: 'manage' },
    { label: 'Attendance', path: '/attendance', permission: 'can_manage_students', group: 'manage' },
    { label: 'Schedule', path: '/schedule', permission: 'can_manage_students', group: 'manage' },
    { label: 'Classes', path: '/classes', permission: 'can_manage_students', group: 'manage' },
    { label: 'Exams', path: '/exams', permission: 'can_manage_exams', group: 'manage' },
    { label: 'Sub-Admins', path: '/sub-admins', permission: 'can_manage_admins', group: 'manage' },
  ];

  function canViewLink(link) {
    if (isSuperAdmin) return true;
    if (isAdmin && !isSuperAdmin) {
      return link.alwaysShow ? true : !!(adminPermissions && adminPermissions[link.permission]);
    }
    return false;
  }

  const visibleLinks = navLinks.filter(canViewLink);

  if (isLoginPage) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={isStudent ? '/student/exams' : '/dashboard'} className="navbar-brand">
          TutorTrack
        </Link>
        {isAdmin && (
          <div className="navbar-links">
            {visibleLinks.length > 4 ? (
              <div className="navbar-group">
                <button
                  className="nav-link dropdown-toggle"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  Menu
                </button>
                {showDropdown && (
                  <div className="navbar-dropdown">
                    {visibleLinks.map(link => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="nav-link dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              visibleLinks.map(link => (
                <Link key={link.path} to={link.path} className="nav-link">
                  {link.label}
                </Link>
              ))
            )}
            <Link to="/reset-password" className="nav-link">Reset Password</Link>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        )}
        {isStudent && (
          <div className="navbar-links">
            <Link to="/student/dashboard" className="nav-link">My Profile</Link>
            <Link to="/student/classes" className="nav-link">Classes</Link>
            <Link to="/student/exams" className="nav-link">My Exams</Link>
            <Link to="/student/change-password" className="nav-link">Change Password</Link>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
