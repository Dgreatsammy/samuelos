import React, { useState } from 'react';
import { Prospect, PipelineStatus } from '../../types';
import { api } from '../../lib/api';
import { ChevronRight, ChevronLeft, Calendar, FileText, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface CRMBoardProps {
  prospects: Prospect[];
  onRefresh: () => void;
}

export default function CRMBoard({ prospects, onRefresh }: CRMBoardProps) {
  const [movingId, setMovingId] = useState<string | null>(null);

  const columns: { key: PipelineStatus; title: string; color: string }[] = [
    { key: 'Research', title: 'Research & Discover', color: 'bg-slate-100 border-slate-200 text-slate-700' },
    { key: 'Qualified', title: 'Qualified Leads', color: 'bg-blue-50 border-blue-100 text-blue-700' },
    { key: 'Contacted', title: 'Outreach Initiated', color: 'bg-amber-50 border-amber-100 text-amber-700' },
    { key: 'Proposal', title: 'Proposal Delivered', color: 'bg-purple-50 border-purple-100 text-purple-700' },
    { key: 'Won', title: 'Clients Won', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  ];

  const moveStage = async (p: Prospect, direction: 'forward' | 'backward') => {
    const currentIndex = columns.findIndex(col => col.key === p.status);
    if (currentIndex === -1) return;

    let targetIndex = currentIndex + (direction === 'forward' ? 1 : -1);
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const targetStage = columns[targetIndex].key;
    setMovingId(p.id);

    try {
      const updated: Prospect = { ...p, status: targetStage };
      await api.saveProspect(updated);
      onRefresh();
    } catch (err) {
      alert('Failed to update CRM status');
    } finally {
      setMovingId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'A') return 'bg-rose-500/15 text-rose-500 border-rose-500/20';
    if (priority === 'B') return 'bg-amber-500/15 text-amber-600 border-amber-500/20';
    return 'bg-slate-500/15 text-slate-500 border-slate-500/20';
  };

  return (
    <div id="crm-kanban-board" className="space-y-6 text-left">
      <div>
        <h3 className="font-display text-xl font-bold text-slate-900">CRM Opportunity Pipeline</h3>
        <p className="text-slate-500 text-xs font-light">
          Track prospect conversion states from initial discovery through active research and successful client onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 pipeline-scroll">
        {columns.map(column => {
          const columnProspects = prospects.filter(p => p.status === column.key);
          return (
            <div 
              key={column.key} 
              className="flex-shrink-0 min-w-[240px] bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4 flex flex-col h-[70vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${column.color}`}>
                  {column.title}
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {columnProspects.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-grow overflow-y-auto">
                {columnProspects.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                    <p className="text-slate-400 font-mono text-[10px]">No active leads</p>
                  </div>
                ) : (
                  columnProspects.map(p => (
                    <div 
                      key={p.id} 
                      className={`bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:shadow transition-shadow space-y-3 relative ${
                        movingId === p.id ? 'opacity-50 animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getPriorityColor(p.priority)}`}>
                          Prio {p.priority} ({p.leadScore}%)
                        </span>
                        {p.websiteStatus === 'NO_WEBSITE' && (
                          <span className="text-[9px] font-mono text-rose-500 bg-rose-50 px-1 py-0.5 rounded">
                            No Website
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-display font-bold text-xs text-slate-900 line-clamp-1">
                          {p.businessName}
                        </h4>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">{p.industry}</p>
                      </div>

                      {p.digitalGap && (
                        <p className="text-[10px] text-slate-500 font-light line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100">
                          {p.digitalGap}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {p.researchDate}
                        </span>
                        
                        {/* Directional Action controls */}
                        <div className="flex items-center gap-1">
                          <button
                            disabled={column.key === 'Research'}
                            onClick={() => moveStage(p, 'backward')}
                            className="p-1 rounded hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            disabled={column.key === 'Won'}
                            onClick={() => moveStage(p, 'forward')}
                            className="p-1 rounded hover:bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
