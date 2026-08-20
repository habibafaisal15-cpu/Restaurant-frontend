import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChefHat, Bike } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginKitchen, loginRider } = useAuth();
  const [mode, setMode] = useState('kitchen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'kitchen') {
        await loginKitchen(email.trim(), password);
        toast.success('Kitchen signed in');
      } else {
        await loginRider(phone.trim());
        toast.success('Rider signed in');
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
          <ChefHat size={28} />
          <div>
            <h1>Kitchen Ops</h1>
            <p>Prep board & rider handoff</p>
          </div>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'kitchen' ? 'active' : ''}
            onClick={() => setMode('kitchen')}
          >
            <ChefHat size={16} /> Kitchen
          </button>
          <button
            type="button"
            className={mode === 'rider' ? 'active' : ''}
            onClick={() => setMode('rider')}
          >
            <Bike size={16} /> Rider
          </button>
        </div>

        <form onSubmit={submit} className="login-form">
          {mode === 'kitchen' ? (
            <>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kitchen@restaurant.com"
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
            </>
          ) : (
            <label>
              Rider phone
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XXXXXXXXX"
              />
            </label>
          )}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint">
          Kitchen uses a staff account. Riders use the phone number saved in Admin → Riders.
          {' '}
          <Link to="/login">Refresh</Link>
        </p>
      </div>
    </div>
  );
}
