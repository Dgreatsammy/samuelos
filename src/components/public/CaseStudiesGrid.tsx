import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CaseStudy } from '../../types';
import { BookOpen, CheckCircle2, Quote, Loader2 } from 'lucide-react';

export default function CaseStudiesGrid() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getCaseStudies();
        setCaseStudies(list.filter(cs => cs.publishedStatus === 'Published'));
      } catch (err) {
        console.error('Failed to load case studies:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section id="work-section" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase">
            Proven Outcomes
          </h2>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Evidence-Based Project Case Studies
          </h3>
          <p className="text-slate-500 font-light text-base">
            No fabricated metrics. We represent real, uncompromised strategic results from verified business transformations.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="font-mono text-xs text-slate-500">Loading case studies...</p>
          </div>
        ) : caseStudies.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-mono text-sm">No published case studies available yet.</p>
          </div>
        ) : (
          <div className="space-y-12 text-left">
            {caseStudies.map(cs => (
              <div 
                key={cs.id} 
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch animate-fade-in"
              >
                {/* Case Left - Structured Outline */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {cs.isDemo ? (
                      <span className="font-mono text-[10px] text-amber-700 font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        DEMO / HYPOTHETICAL SIMULATION
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-blue-600 font-bold uppercase tracking-wider bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                        VERIFIED CASE EVIDENCE
                      </span>
                    )}
                    <h4 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                      {cs.title}
                    </h4>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-4 border-b border-slate-100">
                      <span className="sm:col-span-3 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">THE PROBLEM</span>
                      <p className="sm:col-span-9 text-slate-600 font-light leading-relaxed">{cs.problem}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-4 border-b border-slate-100">
                      <span className="sm:col-span-3 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">OUR APPROACH</span>
                      <p className="sm:col-span-9 text-slate-600 font-light leading-relaxed">{cs.approach}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pb-4 border-b border-slate-100">
                      <span className="sm:col-span-3 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">THE SOLUTION</span>
                      <p className="sm:col-span-9 text-slate-600 font-light leading-relaxed">{cs.solution}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <span className="sm:col-span-3 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">THE RESULT</span>
                      <div className="sm:col-span-9 flex items-start gap-2.5 text-slate-900 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-display text-base font-semibold">{cs.result}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tech stack tags */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {cs.technologies.map(tag => (
                      <span key={tag} className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Case Right - Testimonial Card */}
                {cs.testimonial && (
                  <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden text-left">
                    <div className="absolute right-4 top-4 text-blue-500/10 pointer-events-none">
                      <Quote className="w-32 h-32 transform rotate-180" />
                    </div>
                    
                    <div className="relative space-y-6">
                      <div className="flex items-center gap-1 text-blue-400">
                        <Quote className="w-5 h-5" />
                        <span className="font-mono text-[10px] tracking-widest uppercase text-slate-500 font-bold">CLIENT REVIEW</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed font-light italic">
                        {cs.testimonial}
                      </p>
                    </div>

                    <div className="relative pt-6 border-t border-slate-850 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-display font-bold text-blue-300 text-sm">
                        {cs.clientName ? cs.clientName.charAt(0) : 'C'}
                      </div>
                      <div>
                        <p className="font-display font-bold text-sm text-white">{cs.clientName}</p>
                        <p className="text-[10px] font-mono text-slate-500 tracking-wider">VERIFIED PARTNER</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
