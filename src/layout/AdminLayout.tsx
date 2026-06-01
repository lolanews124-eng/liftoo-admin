import { useState } from 'react';

import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';



const links = [

  { to: '/', label: 'Dashboard', icon: '📊' },

  { to: '/users', label: 'Users', icon: '👥' },

  { to: '/assistants', label: 'Assistants', icon: '⭐' },

  { to: '/verifications', label: 'KYC', icon: '✅' },

  { to: '/bookings', label: 'Bookings', icon: '📅' },

  { to: '/categories', label: 'Pricing', icon: '💰' },

  { to: '/cities', label: 'Service area', icon: '📍' },

  { to: '/payments', label: 'Payments', icon: '💳' },

  { to: '/earnings', label: 'Earnings', icon: '📈' },

  { to: '/reviews', label: 'Reviews', icon: '★' },

  { to: '/referrals', label: 'Referrals', icon: '🎁' },

  { to: '/promos', label: 'Promos', icon: '🏷️' },

  { to: '/payouts', label: 'Payouts', icon: '💸' },

  { to: '/support', label: 'Support', icon: '💬' },

  { to: '/rejections', label: 'Rejections', icon: '↩️' },

  { to: '/audit-logs', label: 'Audit logs', icon: '📋' },

  { to: '/settings', label: 'Settings', icon: '⚙️' },

];



function NavLinks({ onNavigate }: { onNavigate?: () => void }) {

  return (

    <>

      {links.map((l) => (

        <NavLink

          key={l.to}

          to={l.to}

          end={l.to === '/'}

          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}

          onClick={onNavigate}

        >

          <span className="nav-icon">{l.icon}</span> {l.label}

        </NavLink>

      ))}

    </>

  );

}



export function AdminLayout() {

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);



  return (

    <div className="layout">

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>

        <div className="sidebar-brand">Liftoo Admin</div>

        <nav>

          <NavLinks onNavigate={() => setMenuOpen(false)} />

        </nav>

      </aside>

      {menuOpen && <button type="button" className="sidebar-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <div className="main-column">

        <header className="topbar">

          <div className="topbar-left">

            <button type="button" className="menu-toggle btn btn-outline btn-sm" onClick={() => setMenuOpen((o) => !o)}>

              ☰ Menu

            </button>

            <div>

              <strong>{user?.name ?? 'Admin'}</strong>

              <div className="topbar-email">{user?.email}</div>

            </div>

          </div>

          <button

            type="button"

            className="btn btn-outline"

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

