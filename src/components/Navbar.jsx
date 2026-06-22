import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import * as Icons from 'lucide-react';

export default function Navbar({ onSearchChange, searchQuery, onNavigate, currentTab }) {
  const {
    activeRole,
    setActiveRole,
    currentUser,
    currentAdmin,
    notifications,
    settings,
    logout,
    markNotificationsRead,
    clearNotifications
  } = useDb();

  const [theme, setTheme] = useState(() => localStorage.getItem('airbnb_theme') || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(null); // 'user' | 'admin' | 'register' | 'admin_register' | null

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [adminRole, setAdminRole] = useState('Super Admin');

  const { registerUser, registerAdmin, loginUser, loginAdmin } = useDb();

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('airbnb_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Get current user notifications
  const myNotifications = notifications.filter(n => {
    if (activeRole === 'admin') return n.userId === 'a1';
    return currentUser ? n.userId === currentUser.id : false;
  });

  const unreadCount = myNotifications.filter(n => !n.read).length;

  // Handle logins (async because Supabase calls are async)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (showLoginModal === 'user') {
        await loginUser(email, password);
        setShowLoginModal(null);
      } else if (showLoginModal === 'admin') {
        await loginAdmin(email, password);
        setShowLoginModal(null);
      } else if (showLoginModal === 'register') {
        await registerUser(name, email, password, phone);
        setShowLoginModal(null);
      } else if (showLoginModal === 'admin_register') {
        await registerAdmin(name, email, password, adminRole);
        setShowLoginModal(null);
      }
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Render Lucide Icon from dynamic name
  const renderIcon = (iconName, size = 20) => {
    const IconComponent = Icons[iconName] || Icons.Home;
    return <IconComponent size={size} />;
  };

  return (
    <>
      <header className="glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container flex align-center justify-between">
          {/* Logo */}
          <div className="flex align-center gap-2" style={{ cursor: 'pointer' }} onClick={() => onNavigate('home')}>
            <span style={{ color: 'var(--color-primary)' }}>
              {renderIcon(settings.logoIcon || 'Home', 28)}
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {settings.logoText || 'HavenShare'}
            </span>
          </div>

          {/* Search bar (visible in guest view) */}
          {currentTab === 'home' && activeRole === 'guest' && (
            <div className="no-print" style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              width: '100%',
              maxWidth: '380px',
              gap: '12px',
              transition: 'box-shadow var(--transition-fast)'
            }}
            className="input-search-container"
            >
              <Icons.Search size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search by city, country or title..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button onClick={() => onSearchChange('')} style={{ color: 'var(--text-secondary)' }}>
                  <Icons.X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex align-center gap-3 no-print">
            {/* Theme Toggle */}
            <button className="btn-icon" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'light' ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markNotificationsRead();
              }}>
                <Icons.Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifycontent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="glass" style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '320px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  zIndex: 100
                }}>
                  <div className="flex align-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                    {myNotifications.length > 0 && (
                      <button onClick={clearNotifications} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Clear All</button>
                    )}
                  </div>
                  {myNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    myNotifications.map(n => (
                      <div key={n.id} style={{
                        fontSize: '0.82rem',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: n.read ? 'transparent' : 'var(--color-primary-light)',
                        borderLeft: `3px solid ${n.type === 'success' ? 'var(--color-success)' : (n.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)')}`
                      }}>
                        <p style={{ color: 'var(--text-primary)', fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                className="flex align-center gap-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--bg-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icons.Menu size={16} style={{ color: 'var(--text-secondary)' }} />
                {activeRole === 'admin' && currentAdmin ? (
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    A
                  </div>
                ) : (currentUser ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icons.User size={16} />
                  </div>
                ))}
              </button>

              {showUserMenu && (
                <div className="glass" style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '220px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 0',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Context Header */}
                  {activeRole === 'admin' && currentAdmin ? (
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 700 }}>{currentAdmin.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>{currentAdmin.role}</p>
                    </div>
                  ) : (currentUser ? (
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 700 }}>{currentUser.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.email}</p>
                    </div>
                  ) : null)}

                  {/* Menu Options */}
                  {activeRole === 'admin' && currentAdmin ? (
                    <>
                      <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem' }} onClick={() => { onNavigate('admin_dashboard'); setShowUserMenu(false); }}>
                        Admin Dashboard
                      </button>
                      <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem' }} onClick={() => { onNavigate('admin_properties'); setShowUserMenu(false); }}>
                        Manage Listings
                      </button>
                      <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem' }} onClick={() => { onNavigate('admin_bookings'); setShowUserMenu(false); }}>
                        Bookings & Calendar
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem' }} onClick={() => { onNavigate('home'); setShowUserMenu(false); }}>
                        Browse Stays
                      </button>
                      {currentUser && (
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem' }} onClick={() => { onNavigate('guest_dashboard'); setShowUserMenu(false); }}>
                          My Reservations
                        </button>
                      )}
                    </>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                  {/* Session Toggle */}
                  {currentUser || (activeRole === 'admin' && currentAdmin) ? (
                    <button
                      className="btn-text"
                      onClick={() => { logout(); setShowUserMenu(false); onNavigate('home'); }}
                      style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Icons.LogOut size={16} /> Sign Out
                    </button>
                  ) : (
                     <>
                       <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', fontWeight: 600 }} onClick={() => { setShowLoginModal('user'); setShowUserMenu(false); }}>
                         Sign In as Guest
                       </button>
                       <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem' }} onClick={() => { setShowLoginModal('register'); setShowUserMenu(false); }}>
                         Create Guest Account
                       </button>
                       <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', color: 'var(--color-success)' }} onClick={() => { setShowLoginModal('admin'); setShowUserMenu(false); }}>
                         Sign In as Host/Admin
                       </button>
                       <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', color: 'var(--color-success)' }} onClick={() => { setShowLoginModal('admin_register'); setShowUserMenu(false); }}>
                         Create Admin Account
                       </button>
                     </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Developer floating Controller Bar */}
      <div className="dev-controller glass no-print">
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Demo Switcher:</span>
        <button
          onClick={() => {
            setActiveRole('guest');
            onNavigate('home');
          }}
          className={`btn ${activeRole === 'guest' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)' }}
        >
          <Icons.UserCheck size={14} /> Guest Portal
        </button>
        <button
          onClick={async () => {
            if (!currentAdmin) {
              // Auto login admin for demo ease
              await loginAdmin('admin@booking.com', 'admin123');
            }
            setActiveRole('admin');
            onNavigate('admin_dashboard');
          }}
          className={`btn ${activeRole === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)', backgroundColor: activeRole === 'admin' ? 'var(--color-success)' : undefined }}
        >
          <Icons.ShieldAlert size={14} /> Admin Dashboard
        </button>
      </div>

      {/* Auth Modals */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowLoginModal(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-secondary)' }}
            >
              <Icons.X size={20} />
            </button>

             <h3 style={{ marginBottom: '24px' }}>
              {showLoginModal === 'user' && 'Guest Sign In'}
              {showLoginModal === 'admin' && 'Administrator Sign In'}
              {showLoginModal === 'register' && 'Create Guest Account'}
              {showLoginModal === 'admin_register' && 'Create Admin Account'}
            </h3>

            {authError && (
              <div style={{
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                fontWeight: 600,
                marginBottom: '16px'
              }}>
                {authError}
              </div>
            )}

             <form onSubmit={handleAuthSubmit} className="flex flex-col gap-2">
               {(showLoginModal === 'register' || showLoginModal === 'admin_register') && (
                <>
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  {showLoginModal === 'register' && (
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="+1 (555) 012-3456"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  {showLoginModal === 'admin_register' && (
                    <div className="input-group">
                      <label>Role</label>
                      <select className="input-field" value={adminRole} onChange={e => setAdminRole(e.target.value)}>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder={showLoginModal === 'admin' ? 'admin@booking.com' : 'guest@example.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {showLoginModal === 'admin' && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  💡 Demo Credentials: <code>admin@booking.com</code> / <code>admin123</code>
                </p>
              )}
              {showLoginModal === 'user' && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  💡 Demo Credentials: <code>guest@example.com</code> / <code>password123</code>
                </p>
              )}

               <button
                 type="submit"
                 className="btn btn-primary"
                 style={{ width: '100%', marginTop: '8px', backgroundColor: (showLoginModal === 'admin' || showLoginModal === 'admin_register') ? 'var(--color-success)' : undefined }}
               >
                 {showLoginModal === 'register' || showLoginModal === 'admin_register' ? 'Register Account' : 'Authenticate'}
               </button>

               {showLoginModal === 'admin' && (
                 <button
                   type="button"
                   className="btn-text"
                   onClick={() => setShowLoginModal('admin_register')}
                   style={{ fontSize: '0.85rem', width: '100%', marginTop: '8px' }}
                 >
                   Don't have an admin account? Create one
                 </button>
               )}
               {showLoginModal === 'admin_register' && (
                 <button
                   type="button"
                   className="btn-text"
                   onClick={() => setShowLoginModal('admin')}
                   style={{ fontSize: '0.85rem', width: '100%', marginTop: '8px' }}
                 >
                   Already have an admin account? Sign In
                 </button>
               )}

              {showLoginModal === 'user' && (
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setShowLoginModal('register')}
                  style={{ fontSize: '0.85rem', width: '100%', marginTop: '8px' }}
                >
                  Don't have an account? Create one
                </button>
              )}
              {showLoginModal === 'register' && (
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setShowLoginModal('user')}
                  style={{ fontSize: '0.85rem', width: '100%', marginTop: '8px' }}
                >
                  Already have an account? Sign In
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
