import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ADMIN_ROLES = ['CITY_ADMIN', 'DEPT_MANAGER'];

function Navbar() {
  const { user, isAuthenticated, hasRole, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setProfileOpen(false);
    navigate('/login');
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary-600">
            SmartCity Hub
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600">Home</Link>
            <Link to="/events" className="text-gray-700 hover:text-primary-600">Events</Link>
            <Link to="/report" className="text-gray-700 hover:text-primary-600">Report Issue</Link>
            {isAuthenticated && (
              <Link to="/requests/my" className="text-gray-700 hover:text-primary-600">My Requests</Link>
            )}
            {isAuthenticated && hasRole(ADMIN_ROLES) && (
              <Link to="/admin" className="text-gray-700 hover:text-primary-600">Dashboard</Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                >
                  {user?.name || 'Profile'}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg py-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-700 hover:text-primary-600">Login</Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/events" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Events</Link>
            <Link to="/report" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Report Issue</Link>
            {isAuthenticated && (
              <Link to="/requests/my" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>My Requests</Link>
            )}
            {isAuthenticated && hasRole(ADMIN_ROLES) && (
              <Link to="/admin" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>
            )}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="block text-gray-700 hover:text-primary-600">Logout</button>
            ) : (
              <>
                <Link to="/login" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block text-gray-700 hover:text-primary-600" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
