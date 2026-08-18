import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, HardHat, LogOut, LayoutDashboard, User, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import BackButton from './BackButton';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

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
    { name: t.navHome, path: '/' },
    { name: t.navServices, path: '/#services' },
    { name: t.navProjects, path: '/#projects' },
    { name: t.navHousePlans, path: '/#plans' },
    { name: t.navHousesForSale, path: '/#for-sale' },
    { name: t.navJoinWorker, path: '/careers' },
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
          
          {/* Logo & Back Button */}
          <div className="flex items-center space-x-3 mr-6 lg:mr-10 shrink-0">
            {location.pathname !== '/' && (
              <BackButton variant="default" className="mr-1 sm:mr-2" />
            )}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <div className="bg-amber-500 p-2 rounded-lg text-slate-950">
                <HardHat className="h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight uppercase">Rohana</span>
                <span className="block text-[10px] text-amber-500 tracking-widest uppercase font-semibold">Construction</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-5 lg:space-x-6 xl:space-x-7">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleScrollLink(link.path)}
                className="text-slate-300 hover:text-amber-500 font-medium text-sm transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ))}

            {/* Language Selector Dropdown / Pills */}
            <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
              <Globe className="h-3.5 w-3.5 text-amber-500 ml-1.5 mr-0.5" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => setLang('si')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'si' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="සිංහල (Sinhala)"
              >
                SI
              </button>
            </div>

            {user ? (
              <div className="flex items-center space-x-4 border-l border-slate-800 pl-4">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-2 text-sm font-semibold bg-amber-500 text-slate-950 px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t.navDashboard}</span>
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
                  title={t.navLogout}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                {t.navLogin}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Language Selector */}
            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 px-1 py-0.5 rounded-lg">
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('si')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${lang === 'si' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                SI
              </button>
            </div>

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
              key={link.path}
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
                  <span>{t.navDashboard}</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center space-x-2 w-full bg-slate-800 text-red-500 py-2.5 rounded-md font-semibold text-center hover:bg-slate-700 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  <span>{t.navLogout}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center bg-amber-500 text-slate-950 font-semibold py-2.5 rounded-md text-base hover:bg-amber-400 transition-all mx-3"
              >
                {t.navLogin}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
