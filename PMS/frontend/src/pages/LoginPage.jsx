import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { setAuth, clearAuth } from '../lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onRoleChange = (role) => {
    setCurrentRole(role);
    setError('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      clearAuth();

      const data = await api.login({ email, password, role: currentRole });
      setAuth(data.token, data.role);

      if (data.role === 'ADMIN' || data.role === 'ROLE_ADMIN') {
        navigate('/admin-dashboard');
        return;
      }

      if (data.role === 'STUDENT' || data.role === 'ROLE_STUDENT') {
        navigate('/student-dashboard');
        return;
      }

      setError(`Unknown role: ${data.role}`);
    } catch {
      setError(`Invalid email or password for ${currentRole}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Placement Management System</h2>
        <p>Sign in to continue</p>

        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${currentRole === 'student' ? 'active' : ''}`}
            onClick={() => onRoleChange('student')}
          >
            Login as Student
          </button>
          <button
            type="button"
            className={`role-tab ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => onRoleChange('admin')}
          >
            Login as Admin
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button className="btn" type="submit" style={{ width: '100%', marginTop: 14 }} disabled={loading}>
            {loading ? 'Please wait...' : `Login as ${currentRole === 'student' ? 'Student' : 'Admin'}`}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        <div className="register-link">
          Don&apos;t have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
}
