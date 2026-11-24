import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from './Logo.jsx';

const navClass = ({ isActive }) => `text-sm font-semibold transition ${isActive ? 'text-forest-800' : 'text-slate-600 hover:text-forest-700'}`;
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, isStaff } = useAuth();
  const links = <><NavLink to="/" className={navClass} onClick={() => setOpen(false)}>Home</NavLink><NavLink to="/events" className={navClass} onClick={() => setOpen(false)}>Explore events</NavLink>{user?.role === 'CITIZEN' && <><NavLink to="/report" className={navClass} onClick={() => setOpen(false)}>Report an issue</NavLink><NavLink to="/requests" className={navClass} onClick={() => setOpen(false)}>My requests</NavLink></>}{isStaff && <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>Operations</NavLink>}{user?.role === 'ADMIN' && <NavLink to="/admin/review" className={navClass} onClick={() => setOpen(false)}>Approvals & flags</NavLink>}</>;
  return <header className="sticky top-0 z-40 border-b border-forest-900/10 bg-[#faf9f6]/90 backdrop-blur-xl"><div className="page-wrap flex h-18 items-center justify-between py-4"><Link to="/"><Logo /></Link><nav className="hidden items-center gap-7 lg:flex">{links}</nav><div className="hidden items-center gap-3 lg:flex">{user ? <><span className="max-w-32 truncate text-sm font-bold text-forest-900">{user.name}</span>{isStaff && <ShieldCheck className="h-4 w-4 text-coral-600" />}<button onClick={logout} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-coral-600" title="Sign out"><LogOut size={17} /></button></> : <><Link to="/login" className="px-3 text-sm font-bold text-forest-800">Sign in</Link><Link to="/login?mode=register" className="btn-primary !px-4 !py-2.5">Join the community</Link></>}</div><button className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <div className="border-t border-slate-200 bg-white px-6 py-5 lg:hidden"><nav className="flex flex-col gap-5">{links}{user ? <button onClick={() => { logout(); setOpen(false); }} className="text-left text-sm font-bold text-coral-600">Sign out</button> : <Link to="/login" className="text-sm font-bold text-forest-700">Sign in</Link>}</nav></div>}</header>;
}

