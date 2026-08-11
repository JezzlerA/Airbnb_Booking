import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import * as Icons from 'lucide-react';

export default function LoginPage({ onNavigate }) {
  const { loginUnified, settings } = useDb();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUnified(email, password);
      if (res.role === 'admin') {
        onNavigate('admin_dashboard', '/admin/dashboard', 'admin');
      } else {
        onNavigate('guest_dashboard', '/guest/dashboard', 'guest');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const renderIcon = (iconName, size = 28) => {
    const IconComponent = Icons[iconName] || Icons.Home;
    return <IconComponent size={size} />;
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Back Link & Logo */}
        <div className="flex align-center justify-between">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onNavigate('home', '/')}
            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
          >
            <Icons.ArrowLeft size={16} /> Home
          </button>
          <div className="flex align-center gap-2" style={{ cursor: 'pointer' }} onClick={() => onNavigate('home', '/')}>
            <span style={{ color: 'var(--color-primary)' }}>
              {renderIcon(settings.logoIcon || 'Home', 24)}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {settings.logoText || 'HavenShare'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sign In to Your Account</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Enter your credentials to access your dashboard. The system will automatically direct you based on your account role.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icons.AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email Address</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
              <Icons.Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              />
              <Icons.Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
          >
            {loading ? (
              <span className="flex align-center gap-2">
                <Icons.Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating…
              </span>
            ) : (
              <span className="flex align-center gap-2">
                Sign In <Icons.LogIn size={18} />
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '4px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Don't have an account yet?{' '}
            <button 
              onClick={() => onNavigate('register', '/register')} 
              style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
