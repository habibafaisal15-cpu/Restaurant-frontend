import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const from = location.state?.from?.pathname || '/';

  if (loading) {
    return (
      <div className="login-page">
        <div className="auth-loading">
          <div className="auth-spinner" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-atmosphere" aria-hidden="true" />
      <div className="login-grid" aria-hidden="true" />

      <div className="login-container animate-slide-up">
        <header className="login-header">
          <div className="login-brand-icon">
            <UtensilsCrossed size={28} strokeWidth={1.5} />
          </div>
          <h1 className="login-brand">Your Kitchen</h1>
          <p className="login-subtitle">Restaurant Admin Dashboard</p>
        </header>

        <form className="login-form panel" onSubmit={handleSubmit} noValidate>
          <h2 className="login-form-title">Sign in</h2>
          <p className="login-form-desc">Enter your credentials to access the admin panel.</p>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="login-input-wrap">
              <Mail size={18} className="login-input-icon" />
              <input
                id="email"
                type="email"
                className={`form-control ${errors.email ? 'invalid' : ''}`}
                placeholder="admin@yourkitchen.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={submitting}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <Lock size={18} className="login-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'invalid' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-demo-hint">
            <span className="login-demo-label">Backend login</span>
            <code>admin@restaurant.com</code>
            <span className="login-demo-sep">/</span>
            <code>Admin@123</code>
          </div>
        </form>

        <p className="login-footer">© {new Date().getFullYear()} Your Kitchen. All rights reserved.</p>
      </div>
    </div>
  );
}
