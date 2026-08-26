import React from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Phone, Mail, MapPin, MessageSquare, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Col 1: Brand & Bio (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" onClick={scrollToTop} className="flex items-center space-x-3 group">
              <div className="bg-amber-500 p-2 rounded-xl text-slate-950 group-hover:scale-105 transition-transform shadow-md shadow-amber-500/20">
                <HardHat className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-white leading-none">
                  ROHANA<span className="text-amber-500">.</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">
                  Construction Management
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-md font-normal">
              Sri Lanka's trusted residential and commercial construction partner. Over 25 years of excellence in custom home builds, structural engineering, live cost estimations, and quality finishes across the island.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://wa.me/94769117398"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
                title="WhatsApp Direct Contact"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="tel:0769117398"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer shadow-sm"
                title="Direct Phone Call"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href="mailto:admindew@gamil.com"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all cursor-pointer shadow-sm"
                title="Email Us"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-2">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="/#services" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>Services Overview</span>
                </a>
              </li>
              <li>
                <a href="/#projects" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>Showcase Projects</span>
                </a>
              </li>
              <li>
                <a href="/#plans" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>Architectural Plans</span>
                </a>
              </li>
              <li>
                <a href="/#for-sale" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>Houses For Sale</span>
                </a>
              </li>
              <li>
                <Link to="/careers" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>Join As Worker</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Specialized Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-2">
              Specialized Trades
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="hover:text-slate-200 transition-colors">Masonry & Foundation</li>
              <li className="hover:text-slate-200 transition-colors">CEB/LECO Electrical Wiring</li>
              <li className="hover:text-slate-200 transition-colors">Plumbing & Sewage Systems</li>
              <li className="hover:text-slate-200 transition-colors">Rocell Porcelain Tiling</li>
              <li className="hover:text-slate-200 transition-colors">Roofing & Metal Framing</li>
              <li className="hover:text-slate-200 transition-colors">Teak Carpentry & Joinery</li>
            </ul>
          </div>

          {/* Col 4: Regional Offices & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800/80 pb-2">
              CONTACT
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>133/34 Vishwakalawa Rd, Mampe, Piliyandala</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                <a href="tel:0769117398" className="hover:text-amber-400 transition-colors font-semibold text-slate-300">076 911 73 98</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <a href="mailto:admindew@gamil.com" className="hover:text-amber-400 transition-colors truncate">admindew@gamil.com</a>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center space-x-1 text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="h-3 w-3" />
                  <span>ICTAD / CIDA Certified</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Rohana Construction Management System. All Rights Reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy Policy</span>
            <button
              onClick={scrollToTop}
              className="text-amber-500 hover:text-amber-400 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
