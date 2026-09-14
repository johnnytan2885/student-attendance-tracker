import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, studentLogin, setToken, setStudentToken } from '../api/client.js';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      try {
        const data = await login(username, password);
        setToken(data.token);
        if (data.mustChangePassword) {
          navigate('/change-password');
        } else {
          navigate('/dashboard');
        }
      } catch (adminErr) {
        const data = await studentLogin(username, password);
        if (data.token) {
          setStudentToken(data.token);
        }
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
          <h1 className="login-title" style={{ textAlign: 'center' }}>TutorTrack</h1>
        <p className="login-subtitle" style={{ textAlign: 'center' }}>Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary login-btn" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>
          New student? <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
