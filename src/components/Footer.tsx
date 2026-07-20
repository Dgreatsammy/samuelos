import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
}

export default function Footer({ onNavigate, onOpenLogin }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-500 py-16 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        
        {/* Identity block */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-display font-black text-sm text-white">
              S
            </div>
            <div>
              <p className="font-display font-bold text-sm tracking-wide">SAMUEL OLUWADAMILARE</p>
              <p className="font-mono text-[9px] text-blue-400 tracking-widest leading-none font-bold">PROFESSIONAL OPERATING SYSTEM</p>
            </div>
          </div>
          <p className="text-slate-400 font-light text-xs leading-relaxed max-w-sm">
            High-integrity digital engineering, workflow automation, and infrastructure solutions managed securely under SamuelOS. Delivering client excellence through Accessmart Solutions.
          </p>
          <p className="text-slate-500 font-mono text-[10px] flex items-center gap-1.5 font-bold">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            100% Client RLS Security • Encrypted Keys
          </p>
        </div>

        {/* Links Column 1 - Brand Navigation */}
        <div className="md:col-span-3 space-y-3 font-mono text-xs">
          <p className="text-white font-bold tracking-wider uppercase text-[10px]">Brand Navigation</p>
          <ul className="space-y-1.5 font-light">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors cursor-pointer text-left">
                Positioning Pillars
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors cursor-pointer text-left">
                Core Service Catalog
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('solutions')} className="hover:text-white transition-colors cursor-pointer text-left">
                Solutions Ladder
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('work')} className="hover:text-white transition-colors cursor-pointer text-left">
                Verified Case Studies
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 2 - Diagnostic Gateways */}
        <div className="md:col-span-2 space-y-3 font-mono text-xs">
          <p className="text-white font-bold tracking-wider uppercase text-[10px]">Diagnostic Portals</p>
          <ul className="space-y-1.5 font-light">
            <li>
              <button onClick={() => onNavigate('audit')} className="hover:text-white transition-colors cursor-pointer text-left">
                Request Visual Audit
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer text-left">
                Consultation Calendar
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 3 - Administration Entry */}
        <div className="md:col-span-2 space-y-3 font-mono text-xs">
          <p className="text-white font-bold tracking-wider uppercase text-[10px]">Administrative</p>
          <ul className="space-y-1.5 font-light">
            <li>
              <button onClick={onOpenLogin} className="hover:text-white transition-colors cursor-pointer text-left">
                Console Sign In
              </button>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px]">
        <p>© {new Date().getFullYear()} Samuel Oluwadamilare. All rights reserved. Technology delivery through Accessmart Solutions.</p>
        <p className="text-slate-600">Built securely in Cloud Run containers</p>
      </div>
    </footer>
  );
}
