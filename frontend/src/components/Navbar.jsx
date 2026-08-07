import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, HardHat, LogOut, LayoutDashboard, User } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('rcms_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('rcms_token');
    localStorage.removeItem('rcms_user');
    setUser(null);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'employee') return '/employee';
    return '/customer';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/#services' },
    { name: 'Projects', path: '/#projects' },
    { name: 'House Plans', path: '/#plans' },
  ];

  const handleScrollLink = (path) => {
    setIsOpen(false);
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <div className="bg-amber-500 p-2 rounded-lg text-slate-950">
              <HardHat className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight uppercase">Rohana</span>
              <span className="block text-[10px] text-amber-500 tracking-widest uppercase font-semibold">Construction</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleScrollLink(link.path)}
                className="text-slate-300 hover:text-amber-500 font-medium text-sm transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 border-l border-slate-800 pl-4">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-2 text-sm font-semibold bg-amber-500 text-slate-950 px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center space-x-2 text-slate-300">
                  <User className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                Portal Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleScrollLink(link.path)}
              className="w-full text-left block px-3 py-2.5 rounded-md text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {link.name}
            </button>
          ))}
          <div className="border-t border-slate-800 mt-4 pt-4">
            {user ? (
              <div className="space-y-3 px-3">
                <div className="flex items-center space-x-2 text-slate-300">
                  <User className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">{user.username} ({user.role})</span>
                </div>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full bg-amber-500 text-slate-950 py-2.5 rounded-md font-semibold text-center hover:bg-amber-400 transition-all"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center space-x-2 w-full bg-slate-800 text-red-500 py-2.5 rounded-md font-semibold text-center hover:bg-slate-700 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center bg-amber-500 text-slate-950 font-semibold py-2.5 rounded-md text-base hover:bg-amber-400 transition-all mx-3"
              >
                Portal Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
