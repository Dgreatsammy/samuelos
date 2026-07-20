import React from 'react';
import { Shield, Sparkles, User, LogOut, Terminal, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function Navbar({ currentView, onNavigate, isAdmin, onLogout, onOpenLogin }: NavbarProps) {
  const publicLinks = [
    { key: 'home', label: 'Systems Positioning' },
    { key: 'services', label: 'Capabilities' },
    { key: 'solutions', label: 'Offers' },
    { key: 'work', label: 'Case Studies' },
  ];

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-40 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-display font-black text-lg text-white">
            S
          </div>
          <div>
            <p className="font-display font-extrabold text-sm tracking-tight text-slate-800 leading-none">SAMUEL OLUWADAMILARE</p>
            <p className="text-[9px] uppercase tracking-widest text-blue-600 font-semibold leading-none mt-1">Professional Operating System</p>
          </div>
        </button>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase font-semibold text-slate-600">
          {publicLinks.map(link => {
            const isActive = currentView === link.key;
            return (
              <button
                key={link.key}
                onClick={() => onNavigate(link.key)}
                className={`hover:text-blue-600 transition-colors cursor-pointer ${isActive ? 'text-slate-900 font-bold border-b-2 border-blue-600 pb-1' : ''}`}
              >
                {link.label}
              </button>
            );
          })}
          
          <button
            onClick={() => onNavigate('audit')}
            className={`inline-flex items-center gap-1 hover:text-blue-700 transition-colors cursor-pointer text-xs uppercase font-mono tracking-wider font-bold ${
              currentView === 'audit' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-blue-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse-slow" />
            Digital Audit
          </button>
        </nav>

        {/* User state buttons */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('admin')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  currentView === 'admin' 
                    ? 'bg-blue-600 text-white border border-blue-500 shadow-sm' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Admin OS
              </button>

              <button
                onClick={onLogout}
                className="p-2 bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                title="Exit Admin Panel"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-md text-white text-xs font-semibold shadow-sm cursor-pointer transition-all"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
