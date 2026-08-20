import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChefHat, Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginKitchen, loginRider, isAuthenticated, isRider } = useAuth();
  const [mode, setMode] = useState('kitchen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={isRider ? '/rider' : '/'} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'kitchen') {
        await loginKitchen(email.trim(), password);
        toast.success('Welcome to Kitchen');
      } else {
        await loginRider(email.trim(), password);
        toast.success('Welcome, rider');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            {mode === 'kitchen' ? <ChefHat size={22} /> : <Bike size={22} />}
          </div>
          <div>
            <h1>{mode === 'kitchen' ? 'Restaurant Kitchen' : 'Rider Portal'}</h1>
            <p>
              {mode === 'kitchen'
                ? 'Kitchen handler sign-in only'
                : 'Rider staff sign-in only'}
            </p>
          </div>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'kitchen' ? 'active' : ''}
            onClick={() => setMode('kitchen')}
          >
            <ChefHat size={15} /> Kitchen
          </button>
          <button
            type="button"
            className={mode === 'rider' ? 'active' : ''}
            onClick={() => setMode('rider')}
          >
            <Bike size={15} /> Rider
          </button>
        </div>

        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'kitchen' ? 'kitchen@restaurant.com' : 'rider@restaurant.com'}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint">
          Admin creates your account under Staff with role{' '}
          <strong>{mode === 'kitchen' ? 'Kitchen' : 'Rider'}</strong>. Admin accounts cannot sign
          in here.
        </p>
      </div>
    </div>
  );
}
