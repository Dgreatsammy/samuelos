import React, { useState, useEffect } from 'react';
import { CareerEntry } from '../../types';
import { api } from '../../lib/api';
import { Award, Briefcase, Plus, Save, Sparkles, Loader2, List, Trash } from 'lucide-react';

export default function CareerEngineView() {
  const [entries, setEntries] = useState<CareerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Form states to add career entries
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState('');

  // AI Career evidence generator states
  const [aiProjectName, setAiProjectName] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiDeliverables, setAiDeliverables] = useState('');
  const [aiOutcomeResult, setAiOutcomeResult] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState<any | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const list = await api.getCareerEntries();
      setEntries(list);
    } catch (err) {
      console.error('Failed to load career entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !organization) {
      alert('Role and Organization are required!');
      return;
    }

    const payload: CareerEntry = {
      id: `car-${Date.now()}`,
      title: role,
      role,
      organization,
      dateRange: duration,
      problem: description || 'Developing high-performance business systems.',
      action: 'Engineered type-safe local/cloud persistence schemas and Gemini integrations.',
      result: 'Earned 100% stable, fully compilable systems.',
      skills: ['Systems Engineering', 'Backend API Architecture'],
      technologies: ['React', 'Express', 'TypeScript', 'Vite', 'Node.js', 'Google Cloud', 'LLM Integration'],
      bullets: deliverables.split('\n').filter(d => d.trim().length > 0),
      cvSummary: description || 'High-performance engineering contribution.'
    };

    try {
      await api.saveCareerEntry(payload);
      setShowModal(false);
      setRole('');
      setOrganization('');
      setDuration('');
      setDescription('');
      setDeliverables('');
      loadEntries();
    } catch (err) {
      alert('Failed to save career record');
    }
  };

  const handleGenerateCareerEvidence = async () => {
    if (!aiProjectName || !aiDescription) {
      alert('Project Name and description are required!');
      return;
    }

    setAiGenerating(true);
    setAiOutput(null);
    try {
      const res = await api.generateCareerEvidence({
        projectName: aiProjectName,
        description: aiDescription,
        deliverables: aiDeliverables.split('\n').filter(d => d.trim().length > 0),
        outcomeResult: aiOutcomeResult
      });

      if (res.success && res.evidence) {
        setAiOutput(res.evidence);
      }
    } catch (err) {
      alert('Failed to trigger Gemini evidence compiler.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAIEvidenceToCareer = async () => {
    if (!aiOutput) return;

    const payload: CareerEntry = {
      id: `car-ai-${Date.now()}`,
      title: 'Principal Systems Developer (AI Generated Evidence)',
      role: 'Principal Systems Developer (AI Generated Evidence)',
      organization: 'Accessmart Solutions / SamuelOS Projects',
      dateRange: 'Present',
      problem: aiDescription || 'Developing automated research frameworks.',
      action: 'Architected robust server-side middleware and type checking schemas.',
      result: aiOutcomeResult || 'Accelerated pipeline velocity with secure audits.',
      skills: ['Systems Engineering', 'LLM Automation'],
      technologies: ['Vite', 'TypeScript', 'Gemini Flash LLM APIs', 'Node.js'],
      bullets: aiOutput.resumeBulletpoints || ['Engineered core platform services.'],
      cvSummary: aiDescription || 'AI compiled operational evidence.'
    };

    try {
      await api.saveCareerEntry(payload);
      alert('Successfully transferred compiled AI achievements into professional authority entries!');
      loadEntries();
    } catch (err) {
      alert('Failed to append career database');
    }
  };

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this career entry from your timeline?')) return;
    try {
      await api.deleteCareerEntry(id);
      loadEntries();
    } catch (err) {
      alert('Failed to delete career timeline entry.');
    }
  };

  return (
    <div id="career-engine-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Evidence-Based Career History */}
      <div className="lg:col-span-5 space-y-6">
        <div className="border border-slate-200 bg-white p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-display font-bold text-slate-900 text-sm">Professional Authority Timeline</h4>
            <button
              onClick={() => setShowModal(true)}
              className="p-1 rounded hover:bg-slate-50 text-blue-600 border border-slate-200 cursor-pointer"
              title="Add Professional Record"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-slate-400 font-mono text-xs py-4 text-center">No career records listed.</p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {entries.map(entry => {
                const isExpanded = expandedEntryId === entry.id;
                return (
                  <div 
                    key={entry.id} 
                    className={`p-4 border rounded-xl space-y-3 text-xs transition-all ${
                      isExpanded 
                        ? 'border-blue-200 bg-blue-50/10 shadow-sm' 
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="flex items-start justify-between gap-2.5 cursor-pointer"
                      onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {entry.role}
                            {entry.isDemo && (
                              <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1 py-0.5 border border-blue-100 rounded shrink-0">
                                DEMO
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">{entry.organization} • {entry.dateRange}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEntry(entry.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors shrink-0"
                        title="Delete Timeline Entry"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ul className="space-y-1.5 pl-3 border-l-2 border-slate-200">
                      {entry.bullets && entry.bullets.map((item, idx) => (
                        <li key={idx} className="font-light text-slate-600 text-[11px] leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>

                    {entry.technologies && entry.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {entry.technologies.map(t => (
                          <span key={t} className="font-mono text-[9px] text-slate-500 bg-slate-150 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* EXPANDED DETAILED AI ASSETS */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 space-y-3.5 text-[11px] animate-fade-in text-left">
                        {entry.cvSummary && (
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-widest block">CV Summary Draft</span>
                            <p className="text-slate-600 font-light leading-relaxed p-2 bg-white border border-slate-150 rounded-lg">{entry.cvSummary}</p>
                          </div>
                        )}
                        
                        {entry.linkedInAchievement && (
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">LinkedIn Share Copy</span>
                            <p className="text-slate-600 font-mono text-[10px] whitespace-pre-wrap leading-relaxed p-2.5 bg-white border border-slate-150 rounded-lg">{entry.linkedInAchievement}</p>
                          </div>
                        )}

                        {entry.interviewStory && (
                          <div className="space-y-1">
                            <span className="font-mono text-[9px] font-bold text-amber-600 uppercase tracking-widest block">Behavioral STAR Story</span>
                            <div className="text-slate-600 font-light whitespace-pre-wrap leading-relaxed p-2.5 bg-white border border-slate-150 rounded-lg">
                              {entry.interviewStory}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI STAR Story & Resume Achievement Compiler */}
      <div className="lg:col-span-7 border border-slate-200 bg-white p-6 rounded-2xl space-y-6 shadow-sm">
        <div>
          <h4 className="font-display font-bold text-slate-900 text-base">Gemini STAR Story & Bullet Compiler</h4>
          <p className="text-slate-500 text-xs font-light">
            Convert custom deliverables, metrics, and project outcomes into elite STAR stories and optimized resume bullet points.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-slate-500 uppercase block">PROJECT NAME</label>
              <input 
                type="text" value={aiProjectName} onChange={(e) => setAiProjectName(e.target.value)}
                placeholder="e.g. Multi-module CRM Database migration" className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-slate-500 uppercase block">QUANTITATIVE RESULT OUTCOME (OPTIONAL)</label>
              <input 
                type="text" value={aiOutcomeResult} onChange={(e) => setAiOutcomeResult(e.target.value)}
                placeholder="e.g. Reduced lead dropoff by 43% and boosted bookings 2.5x" className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-slate-500 uppercase block">PROJECT DESCRIPTION</label>
            <textarea 
              rows={2} value={aiDescription} onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe what we engineered and why..." className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-slate-500 uppercase block">DELIVERABLES INCLUDED (One per line)</label>
            <textarea 
              rows={3} value={aiDeliverables} onChange={(e) => setAiDeliverables(e.target.value)}
              placeholder="Design secure Node Express schema&#10;Incorporate Google GenAI models server-side&#10;Implement responsive React/Tailwind frontend viewports" 
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              disabled={aiGenerating || !aiProjectName || !aiDescription}
              onClick={handleGenerateCareerEvidence}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Compiling Career Evidence...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Compile Evidence Bullets
                </>
              )}
            </button>
          </div>

          {/* compiled AI Outputs */}
          {aiOutput && (
            <div className="space-y-6 pt-6 border-t border-slate-100 animate-fade-in">
              {/* STAR STORY */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3 text-[11px] leading-relaxed">
                <span className="font-mono text-[9px] font-bold text-blue-600 uppercase tracking-widest block">
                  STAR INTERVIEW STORY STRUCTURE
                </span>
                <div className="space-y-2 font-light text-slate-700">
                  <p><strong>Situation:</strong> {aiOutput.starStory?.situation}</p>
                  <p><strong>Task:</strong> {aiOutput.starStory?.task}</p>
                  <p><strong>Action:</strong> {aiOutput.starStory?.action}</p>
                  <p><strong>Result:</strong> {aiOutput.starStory?.result}</p>
                </div>
              </div>

              {/* Bulletpoints */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">
                    COMPILATION: RESUME ACHIEVEMENT BULLETPOINTS
                  </span>
                  
                  <button
                    onClick={handleApplyAIEvidenceToCareer}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-mono font-bold cursor-pointer transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Apply to Timeline
                  </button>
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[11px] font-light text-slate-700 leading-relaxed">
                  {aiOutput.resumeBulletpoints?.map((bullet: string, i: number) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE RECORD MANUAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleAddEntry}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs text-left"
          >
            <h4 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Add Professional Timeline Entry
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Role Title *</label>
                <input 
                  type="text" required value={role} onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Software Architect" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Company / Organization *</label>
                <input 
                  type="text" required value={organization} onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Accessmart Solutions" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Role Duration *</label>
                <input 
                  type="text" required value={duration} onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. July 2024 - Present" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Key Achievements (One per line)</label>
                <textarea 
                  rows={4} required value={deliverables} onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="Designed conversion frameworks boosting client bookings by 40%&#10;Constructed type-safe CRUD state parameters for real-time dashboards"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 font-mono text-[11px]">
              <button
                type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Save Timeline Record
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
