import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import * as Icons from 'lucide-react';

export default function Navbar({ onSearchChange, searchQuery, onNavigate, currentTab, currentPath }) {
  const {
    activeRole,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('airbnb_theme', theme);
  }, [theme]);

  // Track active scroll section when on landing page
  useEffect(() => {
    if (currentTab !== 'home') return;

    const handleScroll = () => {
      const sections = ['hero', 'properties', 'about', 'amenities', 'reviews', 'contact'];
      const scrollPos = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentTab]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNavClick = (sectionId, tabName = 'home', path = '/') => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    onNavigate(tabName, path);

    if (tabName === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const myNotifications = notifications.filter(n => {
    if (activeRole === 'admin') return n.userId === 'a1';
    return currentUser ? n.userId === currentUser.id : false;
  });

  const unreadCount = myNotifications.filter(n => !n.read).length;

  const renderIcon = (iconName, size = 20) => {
    const IconComponent = Icons[iconName] || Icons.Home;
    return <IconComponent size={size} />;
  };

  // Determine auth state
  const isAuthenticated = !!(currentUser || (activeRole === 'admin' && currentAdmin));
  const isGuest = activeRole === 'guest' && !!currentUser;
  const isAdmin = activeRole === 'admin' && !!currentAdmin;
  const isOnGuestDashboard = currentTab.startsWith('guest');
  const isOnAdminDashboard = currentTab.startsWith('admin');

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
          {/* Company Logo */}
          <div className="flex align-center gap-2" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('hero', 'home', '/')}>
            <span style={{ color: 'var(--color-primary)' }}>
              {renderIcon(settings.logoIcon || 'Home', 28)}
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {settings.logoText || 'HavenShare'}
            </span>
          </div>

          {/* Center Navigation Links — changes based on role and context */}
          <nav className="no-print flex align-center gap-1" style={{ display: 'flex' }}>
            {/* PUBLIC: Show landing page section links when on home/login/register and not on a dashboard */}
            {!isOnGuestDashboard && !isOnAdminDashboard && (
              <>
                <button 
                  className={`nav-link ${activeSection === 'hero' && currentTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('hero', 'home', '/')}
                >
                  Home
                </button>
                <button 
                  className={`nav-link ${activeSection === 'properties' && currentTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('properties', 'home', '/')}
                >
                  Properties
                </button>
                <button 
                  className={`nav-link ${activeSection === 'about' && currentTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('about', 'home', '/')}
                >
                  About Us
                </button>
                <button 
                  className={`nav-link ${activeSection === 'amenities' && currentTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('amenities', 'home', '/')}
                >
                  Amenities
                </button>
                <button 
                  className={`nav-link ${activeSection === 'reviews' && currentTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('reviews', 'home', '/')}
                >
                  Reviews
                </button>
                <button 
                  className={`nav-link ${activeSection === 'contact' && currentTab === 'home' ? 'active' : ''}`}
                  onClick={() => handleNavClick('contact', 'home', '/')}
                >
                  Contact
                </button>
              </>
            )}

            {/* GUEST DASHBOARD: Show guest-specific nav links */}
            {isGuest && isOnGuestDashboard && (
              <>
                <button
                  className={`nav-link ${currentTab === 'guest_dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavClick(null, 'guest_dashboard', '/guest/dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`nav-link ${currentTab === 'guest_properties' ? 'active' : ''}`}
                  onClick={() => handleNavClick(null, 'guest_properties', '/guest/dashboard')}
                >
                  Browse Properties
                </button>
                <button
                  className={`nav-link ${currentTab === 'guest_bookings' ? 'active' : ''}`}
                  onClick={() => handleNavClick(null, 'guest_bookings', '/guest/dashboard')}
                >
                  My Bookings
                </button>
                <button
                  className={`nav-link ${currentTab === 'guest_payments' ? 'active' : ''}`}
                  onClick={() => handleNavClick(null, 'guest_payments', '/guest/dashboard')}
                >
                  Payments
                </button>
              </>
            )}

            {/* ADMIN DASHBOARD: center nav hidden — admin uses sidebar */}
          </nav>

          {/* Action Row */}
          <div className="flex align-center gap-2 no-print">
            {/* Theme Toggle */}
            <button className="btn-icon" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'light' ? <Icons.Moon size={20} /> : <Icons.Sun size={20} />}
            </button>

            {/* Admin: System Settings shortcut */}
            {isAdmin && (
              <button
                className="btn-icon"
                onClick={() => handleNavClick(null, 'admin_settings', '/admin/dashboard')}
                title="System Settings"
              >
                <Icons.Settings size={20} />
              </button>
            )}

            {/* Notification Bell (Only if authenticated) */}
            {isAuthenticated && (
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
            )}

            {/* Authentication Action Buttons (If Unauthenticated) */}
            {!isAuthenticated ? (
              <div className="flex align-center gap-2">
                <button 
                  className={`btn btn-secondary ${currentTab === 'login' ? 'active' : ''}`}
                  onClick={() => handleNavClick(null, 'login', '/login')}
                  style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleNavClick(null, 'register', '/register')}
                  style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                >
                  Register
                </button>
              </div>
            ) : (
              /* User Profile Menu Dropdown (If Authenticated) */
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
                  {isAdmin ? (
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
                  ) : null)}
                </button>

                {showUserMenu && (
                  <div className="glass" style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '240px',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 0',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* User Identity Context */}
                    {isAdmin ? (
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <p style={{ fontWeight: 700 }}>{currentAdmin.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>{currentAdmin.role}</p>
                      </div>
                    ) : (currentUser ? (
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <div className="flex align-center gap-2">
                          <img src={currentUser.avatar} alt="avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <p style={{ fontWeight: 700 }}>{currentUser.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{currentUser.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : null)}

                    {/* Role-specific Navigation Options */}
                    <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'home', '/')}>
                      <Icons.Globe size={16} /> Public Homepage
                    </button>

                    {isAdmin ? (
                      <>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'admin_dashboard', '/admin/dashboard')}>
                          <Icons.LayoutDashboard size={16} /> Admin Dashboard
                        </button>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'admin_properties', '/admin/dashboard')}>
                          <Icons.Home size={16} /> Properties
                        </button>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'admin_settings', '/admin/dashboard')}>
                          <Icons.Settings size={16} /> Website Settings
                        </button>
                      </>
                    ) : isGuest ? (
                      <>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'guest_dashboard', '/guest/dashboard')}>
                          <Icons.LayoutDashboard size={16} /> Guest Dashboard
                        </button>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'guest_properties', '/guest/dashboard')}>
                          <Icons.Search size={16} /> Browse Properties
                        </button>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'guest_bookings', '/guest/dashboard')}>
                          <Icons.CalendarCheck size={16} /> My Bookings
                        </button>
                        <button className="btn-text" style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleNavClick(null, 'guest_profile', '/guest/dashboard')}>
                          <Icons.User size={16} /> My Profile
                        </button>
                      </>
                    ) : null}

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

                    <button
                      className="btn-text"
                      onClick={() => { logout(); setShowUserMenu(false); handleNavClick(null, 'home', '/'); }}
                      style={{ textAlign: 'left', width: '100%', fontSize: '0.9rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                    >
                      <Icons.LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button 
              className="btn-icon mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }} 
            >
              {mobileMenuOpen ? <Icons.X size={24} /> : <Icons.Menu size={24} />}
            </button>
          </div>
        </div>

        {/* CSS rule for mobile menu toggle visibility */}
        <style>{`
          @media (max-width: 900px) {
            nav.no-print { display: none !important; }
            .mobile-menu-toggle { display: flex !important; }
          }
        `}</style>
      </header>

      {/* Mobile Navigation Drawer — Role-Aware */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer no-print">
          {/* Unauthenticated: show public landing links + Login/Register */}
          {!isAuthenticated && (
            <>
              <button className="nav-link" onClick={() => handleNavClick('hero', 'home', '/')}>Home</button>
              <button className="nav-link" onClick={() => handleNavClick('properties', 'home', '/')}>Properties</button>
              <button className="nav-link" onClick={() => handleNavClick('about', 'home', '/')}>About Us</button>
              <button className="nav-link" onClick={() => handleNavClick('amenities', 'home', '/')}>Amenities</button>
              <button className="nav-link" onClick={() => handleNavClick('reviews', 'home', '/')}>Reviews</button>
              <button className="nav-link" onClick={() => handleNavClick('contact', 'home', '/')}>Contact</button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

              <div className="flex flex-col gap-2" style={{ marginTop: '12px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleNavClick(null, 'login', '/login')} 
                  style={{ width: '100%' }}
                >
                  Login
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleNavClick(null, 'register', '/register')} 
                  style={{ width: '100%' }}
                >
                  Register
                </button>
              </div>
            </>
          )}

          {/* Guest Authenticated: show guest-specific mobile nav */}
          {isGuest && (
            <>
              <button className="nav-link" onClick={() => handleNavClick(null, 'guest_dashboard', '/guest/dashboard')}>
                <Icons.LayoutDashboard size={16} /> Dashboard
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'guest_properties', '/guest/dashboard')}>
                <Icons.Search size={16} /> Browse Properties
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'guest_bookings', '/guest/dashboard')}>
                <Icons.CalendarCheck size={16} /> My Bookings
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'guest_payments', '/guest/dashboard')}>
                <Icons.CreditCard size={16} /> Payment History
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'guest_profile', '/guest/dashboard')}>
                <Icons.User size={16} /> My Profile
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'guest_notifications', '/guest/dashboard')}>
                <Icons.Bell size={16} /> Notifications
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

              <button className="nav-link" onClick={() => handleNavClick('hero', 'home', '/')}>
                <Icons.Globe size={16} /> Public Homepage
              </button>

              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); setMobileMenuOpen(false); handleNavClick(null, 'home', '/'); }}>
                  <Icons.LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}

          {/* Admin Authenticated: show admin-specific mobile nav */}
          {isAdmin && (
            <>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_dashboard', '/admin/dashboard')}>
                <Icons.LayoutDashboard size={16} /> Dashboard
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_properties', '/admin/dashboard')}>
                <Icons.Home size={16} /> Properties
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_units', '/admin/dashboard')}>
                <Icons.Box size={16} /> Units
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_bookings', '/admin/dashboard')}>
                <Icons.Calendar size={16} /> Bookings
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_payments', '/admin/dashboard')}>
                <Icons.CreditCard size={16} /> Payments
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_reviews', '/admin/dashboard')}>
                <Icons.Star size={16} /> Reviews
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_reports', '/admin/dashboard')}>
                <Icons.BarChart3 size={16} /> Reports
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_settings', '/admin/dashboard')}>
                <Icons.Settings size={16} /> Website Settings
              </button>
              <button className="nav-link" onClick={() => handleNavClick(null, 'admin_logs', '/admin/dashboard')}>
                <Icons.Lock size={16} /> Activity Logs
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

              <button className="nav-link" onClick={() => handleNavClick('hero', 'home', '/')}>
                <Icons.Globe size={16} /> Public Homepage
              </button>

              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); setMobileMenuOpen(false); handleNavClick(null, 'home', '/'); }}>
                  <Icons.LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
