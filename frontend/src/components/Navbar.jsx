import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, HardHat, LogOut, LayoutDashboard, User, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import BackButton from './BackButton';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('rcms_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-xl shadow-black/40 py-2.5' 
        : 'bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent backdrop-blur-md border-b border-slate-800/40 py-3.5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo & Back Button */}
          <div className="flex items-center space-x-3 shrink-0">
            {location.pathname !== '/' && (
              <BackButton variant="subtle" showLabel={false} className="mr-1" />
            )}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 group-hover:shadow-amber-500/40 transition-all duration-300">
                <HardHat className="h-5.5 w-5.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-amber-300 transition-all">
                  ROHANA
                </span>
                <span className="text-[9px] font-extrabold tracking-[0.2em] text-amber-500 uppercase leading-tight mt-0.5">
                  CONSTRUCTION
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-full backdrop-blur-lg shadow-inner">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleScrollLink(link.path)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800/80 p-1 rounded-full text-xs shadow-sm">
              <Globe className="h-3.5 w-3.5 text-amber-400 ml-2 mr-1" />
              <div className="flex space-x-0.5">
                <button
                  onClick={() => setLang('en')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('si')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider transition-all cursor-pointer ${
                    lang === 'si'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SI
                </button>
              </div>
            </div>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800/80">
                {/* User Pill Info */}
                <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="font-semibold max-w-[100px] truncate">{user.username}</span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {user.role}
                  </span>
                </div>

                {/* Dashboard Button */}
                <Link
                  to={getDashboardLink()}
                  className="flex items-center space-x-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 px-4 py-2 rounded-full hover:shadow-lg hover:shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>{t.navDashboard}</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title={t.navLogout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-extrabold px-5 py-2 rounded-full text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>{t.navLogin}</span>
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-full">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lang === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('si')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lang === 'si' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                SI
              </button>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleScrollLink(link.path)}
              className="w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-amber-400 transition-colors"
            >
              <span>{link.name}</span>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          ))}

          <div className="border-t border-slate-800/80 mt-3 pt-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
                  <User className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-200">{user.username} ({user.role})</span>
                </div>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 py-3 rounded-xl font-extrabold text-sm text-center shadow-md shadow-amber-500/20"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t.navDashboard}</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center space-x-2 w-full bg-slate-900 border border-slate-800 text-red-400 py-3 rounded-xl font-bold text-sm text-center hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.navLogout}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold py-3 rounded-xl text-sm shadow-md shadow-amber-500/20"
              >
                {t.navLogin}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
