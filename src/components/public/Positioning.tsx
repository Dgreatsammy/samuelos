import React from 'react';
import { ShieldCheck, Zap, Activity, Users, ArrowUpRight, HelpCircle } from 'lucide-react';

interface PositioningProps {
  onNavigate: (view: string) => void;
}

export default function Positioning({ onNavigate }: PositioningProps) {
  const challenges = [
    {
      title: 'Mobile Squeeze & Load Friction',
      description: 'Slow load times and non-responsive mobile menus cause over 40% of local search intent to bounce instantly to competitors.',
      icon: Zap,
    },
    {
      title: 'Missing Booking Pathways',
      description: 'Forcing high-value prospects to make a manual telephone call during working hours restricts client booking velocity to zero.',
      icon: Activity,
    },
    {
      title: 'Faded Trust & Security Gaps',
      description: 'Broken SSL certificates, missing Google reviews, and outdated visual layouts drive away prospects seeking elite security.',
      icon: ShieldCheck,
    },
  ];

  const pillars = [
    {
      title: 'SYSTEMS ENGINEERING',
      desc: 'We construct secure server-side proxy routes and type-safe databases to protect credentials and private client records.',
    },
    {
      title: 'PRACTICAL AI INTEGRATIONS',
      desc: 'No AI hype. We implement functional LLM workflows (using Gemini) to automate research, personalization, and audit generation.',
    },
    {
      title: 'SERVICE BEFORE SALES',
      desc: 'Our entire ecosystem is predicated on diagnostics. We show our clients exactly where their digital leaks are before pitching custom services.',
    },
  ];

  return (
    <section id="positioning-section" className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Visual Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase">
            Strategic Brand Framework
          </h2>
          <p className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Connecting Personal Authority with Scalable Delivery
          </p>
          <p className="text-slate-600 font-light leading-relaxed">
            <strong>Samuel Oluwadamilare</strong> acts as your principal strategic consultant, operating through 
            <strong> Accessmart Solutions</strong> as the technical vehicle to engineer, build, and support your platforms.
          </p>
        </div>

        {/* Section 1: Problems I Solve */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {challenges.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm font-light leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 2: Core Philosophy Pillars */}
        <div className="mt-20 border border-blue-900/40 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase">
                THE SAMUELOS CONSTITUTION
              </h3>
              <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Our Three Unifying Principles
              </p>
              <p className="text-slate-300 text-sm font-light leading-relaxed">
                We believe that technology must solve immediate business bottlenecks without compromising data integrity, user security, or human authenticity.
              </p>
              <div>
                <button
                  onClick={() => onNavigate('about')}
                  className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-300 hover:text-white transition-colors cursor-pointer"
                >
                  LEARN MORE ABOUT SAMUEL
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {pillars.map((p, idx) => (
                <div key={idx} className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-3">
                  <span className="font-mono text-xs text-blue-400 font-bold">0{idx + 1}.</span>
                  <p className="font-display font-bold text-sm tracking-wide text-white">{p.title}</p>
                  <p className="text-slate-300 text-xs font-light leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
