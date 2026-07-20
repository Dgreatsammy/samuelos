import React from 'react';
import { ArrowRight, Shield, Cpu, Layers } from 'lucide-react';

interface HeroProps {
  onNavigate: (view: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <div id="hero-section" className="relative bg-slate-50 text-slate-900 overflow-hidden py-20 lg:py-24">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Hero Left Content */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-mono font-medium tracking-wide text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-slow" />
            PROFESSIONAL OPERATING SYSTEM V1.0
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-[48px] font-bold tracking-tight text-slate-900 leading-[1.1]">
            Engineering <span className="text-blue-600">Business Growth</span> <br className="hidden sm:inline" />
            through Systems Intelligence.
          </h1>

          <p className="text-slate-600 text-base sm:text-lg max-w-xl font-light leading-relaxed">
            Bridging the gap between strategy and execution. I build scalable digital ecosystems that transform business operations using AI, automation, and systems engineering managed under <strong>SamuelOS</strong>, with commercial delivery by <strong>Accessmart Solutions</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              id="cta-audit-btn"
              onClick={() => onNavigate('audit')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider font-mono shadow-sm hover:shadow-md transition-all cursor-pointer duration-200"
            >
              Request a Digital Audit
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="cta-contact-btn"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs uppercase tracking-wider font-mono transition-all cursor-pointer"
            >
              Book a Consultation
            </button>
          </div>

          {/* Visual trust markers */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 font-mono text-[11px] text-slate-500">
            <div>
              <p className="text-slate-900 text-sm font-bold font-display uppercase tracking-tight">Systems First</p>
              <p className="mt-1 leading-normal font-light">Relational integrity & secure architecture</p>
            </div>
            <div>
              <p className="text-slate-900 text-sm font-bold font-display uppercase tracking-tight">Service-Driven</p>
              <p className="mt-1 leading-normal font-light">Value-first diagnostics before sales</p>
            </div>
            <div>
              <p className="text-slate-900 text-sm font-bold font-display uppercase tracking-tight">AI Enabled</p>
              <p className="mt-1 leading-normal font-light">Practical LLM workflows & automation</p>
            </div>
          </div>
        </div>

        {/* Hero Right Visual Column - Aesthetic System Mockup */}
        <div className="lg:col-span-5 relative mt-8 lg:mt-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-emerald-500/5 rounded-3xl blur-2xl -z-10 pointer-events-none" />
          
          {/* Aesthetic Dashboard Grid Mockup (Systems Concept) */}
          <div className="relative border border-slate-200 bg-white rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-[11px] text-slate-400 tracking-wider">samuel_os.sh</span>
            </div>

            <div className="space-y-4 font-mono text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold select-none">$</span>
                <p className="text-slate-600">load_diagnostics --target accessmart_solutions</p>
              </div>
              <div className="pl-6 text-slate-400 space-y-1 text-[11px]">
                <p>Initializing SamuelOS core intelligence...</p>
                <p className="text-emerald-600 font-semibold">✔ Connected to secure local databases [100% OK]</p>
                <p className="text-blue-600 font-semibold">✔ Gemini Flash LLM system integrated securely</p>
              </div>

              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                  <span>SYSTEM LOAD STATUS</span>
                  <span className="text-emerald-600 font-bold">STABLE</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-[68%]" />
                </div>
              </div>

              {/* Miniature Audit Score widget mockup */}
              <div className="flex items-center justify-between border border-slate-150 rounded-lg p-3.5 bg-slate-50/50">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Lead Score Analysis</span>
                  <p className="text-xs font-bold text-slate-800">Apex Dental Group</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-emerald-500/20 bg-emerald-50 text-emerald-600 font-bold text-xs">
                  82%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
