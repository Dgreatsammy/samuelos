import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Offer } from '../../types';
import { ShieldAlert, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface SolutionsProps {
  onNavigate: (view: string) => void;
}

export default function SolutionsLadder({ onNavigate }: SolutionsProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getOffers();
        setOffers(list.filter(o => o.active));
      } catch (err) {
        console.error('Failed to load offers:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section id="solutions-section" className="py-20 bg-slate-900 text-white relative overflow-hidden text-left">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 tracking-wide">
            <Sparkles className="w-3 h-3" />
            COMMERCIAL SOLUTIONS LADDER
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Our Business Offer Architecture
          </h3>
          <p className="text-slate-400 font-light text-base leading-relaxed">
            From low-friction diagnostics to complete digital transformations, we package our capabilities into structured, high-value solutions.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="font-mono text-xs text-slate-500">Loading offer ladder...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offers.map((offer, idx) => {
              const isAudit = offer.id === 'o-audit';
              return (
                <div 
                  key={offer.id} 
                  className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 ${
                    isAudit 
                      ? 'bg-gradient-to-br from-blue-950 to-slate-950 border-blue-500/30 shadow-lg shadow-blue-500/5' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-blue-400 tracking-widest uppercase">
                          LADDER 0{idx + 1}
                        </span>
                        {offer.startingPrice && (
                          <span className="font-mono text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {offer.pricingModel}: {offer.startingPrice}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">{offer.name}</h4>
                    </div>

                    <p className="text-slate-400 text-xs font-light leading-relaxed">{offer.description}</p>

                    <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Problem Solved:</span>
                        <p className="text-slate-300 text-xs font-light mt-0.5">{offer.problemSolved}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Audience:</span>
                        <p className="text-slate-300 text-xs font-light mt-0.5">{offer.targetAudience}</p>
                      </div>
                    </div>

                    {/* Deliverables List */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">Deliverables include:</span>
                      <ul className="space-y-1.5">
                        {offer.deliverables.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 font-mono text-[10px] text-slate-400 leading-normal">
                            <span className="text-blue-400 mt-1 select-none">▪</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8 mt-6 border-t border-slate-900">
                    <button
                      onClick={() => onNavigate(isAudit ? 'audit' : 'contact')}
                      className={`w-full py-3 px-4 rounded-xl font-medium text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                        isAudit 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/10' 
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {offer.cta}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
