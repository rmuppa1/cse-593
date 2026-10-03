import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/events', label: 'Events' },
    ...(user?.role !== 'MANAGER' ? [{ to: '/report', label: 'Report an Issue' }] : []),
    ...(user ? [{ to: '/my-requests', label: user.role === 'CITIZEN' ? 'My Reports' : null }] : []),
    ...(isStaff ? [{ to: '/admin', label: 'Dashboard' }] : []),
  ].filter((l) => l.label);

  const cls = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <img src="/favicon.svg" alt="" className="h-7 w-7" /> SmartCity Hub
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.name} <span className="text-xs text-slate-400">({user.role.toLowerCase()})</span></span>
              <button onClick={() => { logout(); navigate('/'); }} className="text-sm font-medium text-brand-600 hover:underline">Log out</button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Log in</Link>
          )}
        </div>

        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {links.map((l) => <NavLink key={l.to} to={l.to} className={cls}>{l.label}</NavLink>)}
          {user ? (
            <button onClick={() => { logout(); navigate('/'); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-600">Log out ({user.name})</button>
          ) : (
            <NavLink to="/login" className={cls}>Log in</NavLink>
          )}
        </div>
      )}
    </header>
  );
}
