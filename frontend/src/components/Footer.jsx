import React from 'react';
import { HardHat, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Logo & Pitch */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 p-2 rounded-lg text-slate-950">
                <HardHat className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl uppercase tracking-tight text-white">
                Rohana <span className="block text-[10px] text-amber-500 tracking-widest font-semibold uppercase">Construction</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Welcome to our company. Join us to build your dream house with quality, trust, and structural excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Home</a></li>
              <li><a href="#services" className="hover:text-amber-500 transition-colors">Our Services</a></li>
              <li><a href="#projects" className="hover:text-amber-500 transition-colors">Recent Projects</a></li>
              <li><a href="#plans" className="hover:text-amber-500 transition-colors">House Designs</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Contact Details</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <span className="block text-white">076 911 73 98</span>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-white truncate">rohanaconstruction@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-white">Colombo Road, Piliyandala, Sri Lanka</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-900 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs">
          <p>&copy; {new Date().getFullYear()} Rohana Construction. All rights reserved.</p>
          <p className="mt-2 md:mt-0 text-slate-500">Developed for University Academic Presentation</p>
        </div>
      </div>
    </footer>
  );
}
