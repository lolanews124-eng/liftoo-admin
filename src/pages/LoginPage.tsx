import { FormEvent, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-split">
        <div className="login-hero">
          <div className="login-brand">Liftoo</div>
          <h1>Admin console</h1>
          <p>Manage bookings, KYC, payments, and platform settings for the customer & assistant apps.</p>
          <ul className="login-features">
            <li>Post-completion payment tracking</li>
            <li>Assistant settlement & cash OTP flow</li>
            <li>KYC, payouts, promos & support</li>
          </ul>
        </div>
        <form className="login-card" onSubmit={onSubmit}>
          <h2>Sign in</h2>
          <p className="login-card-sub">Use your admin credentials</p>
          {sessionExpired && !error && (
            <div className="error-banner">Your session expired. Please sign in again.</div>
          )}
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
