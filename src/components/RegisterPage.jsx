import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import * as Icons from 'lucide-react';

export default function RegisterPage({ onNavigate }) {
  const { registerUser, settings } = useDb();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser(name, email, password, phone);
      onNavigate('guest_dashboard', '/guest/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
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
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Create Guest Account</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Register to instantly reserve luxury stays and manage your bookings online.
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Full Name</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={e => setName(e.target.value)}
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
              <Icons.User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Email Address</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Phone Number</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <input
                type="tel"
                required
                placeholder="+61 400 000 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
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
              <Icons.Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
            <div style={{ position: 'relative', marginTop: '4px' }}>
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
                <Icons.Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating Account…
              </span>
            ) : (
              <span className="flex align-center gap-2">
                Create Account <Icons.UserPlus size={18} />
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button 
              onClick={() => onNavigate('login', '/login')} 
              style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
