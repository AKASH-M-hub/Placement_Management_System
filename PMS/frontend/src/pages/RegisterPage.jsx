import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [studentError, setStudentError] = useState('');
  const [adminError, setAdminError] = useState('');

  const validateForm = ({ name, email, password, confirmPassword }) => {
    if (!name || !email || !password || !confirmPassword) {
      return 'All fields are required';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const registerStudent = async (event) => {
    event.preventDefault();
    const validationError = validateForm(studentForm);
    if (validationError) {
      setStudentError(validationError);
      return;
    }

    try {
      setStudentError('');
      await api.registerStudent({
        name: studentForm.name,
        email: studentForm.email,
        password: studentForm.password,
      });
      window.alert('Student registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      setStudentError(`Registration failed: ${error.message}`);
    }
  };

  const registerAdmin = async (event) => {
    event.preventDefault();
    const validationError = validateForm(adminForm);
    if (validationError) {
      setAdminError(validationError);
      return;
    }

    try {
      setAdminError('');
      await api.registerAdmin({
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password,
      });
      window.alert('Admin registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      setAdminError(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Placement Management System</h2>
        <p>Create a new account</p>

        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => setRole('student')}
          >
            Register as Student
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Register as Admin
          </button>
        </div>

        {role === 'student' ? (
          <form onSubmit={registerStudent}>
            <div className="field">
              <label htmlFor="student-name">Full Name</label>
              <input
                id="student-name"
                type="text"
                value={studentForm.name}
                onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="field">
              <label htmlFor="student-email">Email</label>
              <input
                id="student-email"
                type="email"
                value={studentForm.email}
                onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })}
                placeholder="name@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="student-password">Password</label>
              <input
                id="student-password"
                type="password"
                value={studentForm.password}
                onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value })}
                placeholder="Your password"
              />
            </div>
            <div className="field">
              <label htmlFor="student-confirm-password">Confirm Password</label>
              <input
                id="student-confirm-password"
                type="password"
                value={studentForm.confirmPassword}
                onChange={(event) =>
                  setStudentForm({ ...studentForm, confirmPassword: event.target.value })
                }
                placeholder="Confirm password"
              />
            </div>
            <button className="btn" type="submit" style={{ width: '100%', marginTop: 14 }}>
              Register as Student
            </button>
            {studentError && <div className="error">{studentError}</div>}
          </form>
        ) : (
          <form onSubmit={registerAdmin}>
            <div className="field">
              <label htmlFor="admin-name">Full Name</label>
              <input
                id="admin-name"
                type="text"
                value={adminForm.name}
                onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })}
                placeholder="name@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={adminForm.password}
                onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
                placeholder="Your password"
              />
            </div>
            <div className="field">
              <label htmlFor="admin-confirm-password">Confirm Password</label>
              <input
                id="admin-confirm-password"
                type="password"
                value={adminForm.confirmPassword}
                onChange={(event) => setAdminForm({ ...adminForm, confirmPassword: event.target.value })}
                placeholder="Confirm password"
              />
            </div>
            <button className="btn" type="submit" style={{ width: '100%', marginTop: 14 }}>
              Register as Admin
            </button>
            {adminError && <div className="error">{adminError}</div>}
          </form>
        )}

        <div className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}
