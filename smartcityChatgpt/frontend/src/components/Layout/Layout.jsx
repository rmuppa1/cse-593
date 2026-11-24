import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
export default function Layout() { return <div className="min-h-screen bg-[#faf9f6]"><Navbar /><main><Outlet /></main><Footer /></div>; }

