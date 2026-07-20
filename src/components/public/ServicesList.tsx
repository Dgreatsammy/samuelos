import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Service, ServiceCategory } from '../../types';
import { Laptop, Cpu, TrendingUp, Network, CheckCircle, Loader2 } from 'lucide-react';

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ServiceCategory>('DIGITAL_PRESENCE');

  useEffect(() => {
    async function load() {
      try {
        const list = await api.getServices();
        setServices(list.filter(s => s.active));
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories: { key: ServiceCategory; title: string; icon: any }[] = [
    { key: 'DIGITAL_PRESENCE', title: 'Digital Presence', icon: Laptop },
    { key: 'AI_AUTOMATION', title: 'AI & Automation', icon: Cpu },
    { key: 'GROWTH_TECH', title: 'Growth Technology', icon: TrendingUp },
    { key: 'IT_INFRASTRUCTURE', title: 'IT & Infrastructure', icon: Network },
  ];

  const filtered = services.filter(s => s.category === activeTab);

  return (
    <section id="services-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-blue-600 uppercase">
            Service Catalog
          </h2>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Comprehensive Capabilities for Modern Enterprises
          </h3>
          <p className="text-slate-500 font-light text-base">
            Structured, high-integrity service lines managed under the rigorous standards of SamuelOS.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white border-slate-900 shadow' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {cat.title}
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="font-mono text-xs text-slate-400">Loading dynamic service catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <p className="text-slate-400 font-mono text-sm">No services listed in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map(service => (
              <div 
                key={service.id} 
                className="group border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between text-left"
              >
                <div className="space-y-4">
                  <h4 className="font-display font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-slate-600 text-sm font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200/60 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Deliverables & Standards:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {service.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 font-mono text-xs text-slate-500">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
