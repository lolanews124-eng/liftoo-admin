import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    links: [{ to: '/', label: 'Dashboard', icon: '📊', end: true }],
  },
  {
    title: 'Operations',
    links: [
      { to: '/bookings', label: 'Bookings', icon: '📅' },
      { to: '/users', label: 'Users', icon: '👥' },
      { to: '/assistants', label: 'Assistants', icon: '⭐' },
      { to: '/verifications', label: 'KYC', icon: '✅', badgeKey: 'kyc' as const },
      { to: '/rejections', label: 'Rejections', icon: '↩️' },
      { to: '/support', label: 'Support', icon: '💬', badgeKey: 'support' as const },
    ],
  },
  {
    title: 'Finance',
    links: [
      { to: '/payments', label: 'Payments', icon: '💳' },
      { to: '/earnings', label: 'Earnings', icon: '📈' },
      { to: '/payouts', label: 'Payouts', icon: '💸' },
      { to: '/referrals', label: 'Referrals', icon: '🎁' },
      { to: '/promos', label: 'Promos', icon: '🏷️' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { to: '/categories', label: 'Pricing', icon: '💰' },
      { to: '/cities', label: 'Service area', icon: '📍' },
      { to: '/reviews', label: 'Reviews', icon: '★' },
      { to: '/settings', label: 'Settings', icon: '⚙️' },
      { to: '/audit-logs', label: 'Audit logs', icon: '📋' },
    ],
  },
];

function NavLinks({
  onNavigate,
  badges,
}: {
  onNavigate?: () => void;
  badges: { kyc: number; support: number };
}) {
  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="nav-section">
          <div className="nav-section-title">{section.title}</div>
          {section.links.map((l) => {
            const key = 'badgeKey' in l ? l.badgeKey : undefined;
            const badge =
              key === 'kyc' && badges.kyc > 0
                ? badges.kyc
                : key === 'support' && badges.support > 0
                  ? badges.support
                  : 0;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={'end' in l && l.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={onNavigate}
              >
                <span className="nav-icon">{l.icon}</span>
                <span className="nav-label">{l.label}</span>
                {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
              </NavLink>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [badges, setBadges] = useState({ kyc: 0, support: 0 });

  useEffect(() => {
    adminApi
      .dashboard()
      .then((s) =>
        setBadges({
          kyc: s.pendingVerifications ?? 0,
          support: s.openSupportTickets ?? 0,
        }),
      )
      .catch(() => undefined);
  }, []);

  return (
    <div className="layout">
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">Lif<span>too</span></span>
          <span className="sidebar-tagline">Admin console</span>
        </div>
        <nav>
          <NavLinks onNavigate={() => setMenuOpen(false)} badges={badges} />
        </nav>
      </aside>
      {menuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="menu-toggle btn btn-outline btn-sm" onClick={() => setMenuOpen((o) => !o)}>
              ☰
            </button>
            <div className="topbar-user">
              <div className="topbar-avatar">{(user?.name ?? 'A')[0].toUpperCase()}</div>
              <div>
                <strong>{user?.name ?? 'Admin'}</strong>
                <div className="topbar-email">{user?.email}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
