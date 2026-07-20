import React, { useState, useEffect } from 'react';
import { Audit, Prospect } from '../../types';
import { api } from '../../lib/api';
import { 
  FileText, Sparkles, Plus, Trash2, Edit2, CheckCircle2, ChevronDown, ChevronUp, Printer, Loader2, Save, X 
} from 'lucide-react';

interface AuditManagerProps {
  prospects: Prospect[];
  selectedProspect: Prospect | null;
  onClearSelectedProspect: () => void;
}

export default function AuditManager({ prospects, selectedProspect, onClearSelectedProspect }: AuditManagerProps) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [targetProspectId, setTargetProspectId] = useState('');
  const [auditGenerating, setAuditGenerating] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [overallScore, setOverallScore] = useState(0);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [gaps, setGaps] = useState<string[]>([]);
  const [missedOpportunity, setMissedOpportunity] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');

  // Handle selected prospect trigger from table
  useEffect(() => {
    if (selectedProspect) {
      setTargetProspectId(selectedProspect.id);
      handleTriggerGenerate(selectedProspect.id);
    }
  }, [selectedProspect]);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const list = await api.getAudits();
      setAudits(list);
    } catch (err) {
      console.error('Failed to load audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleTriggerGenerate = async (pId: string) => {
    const prospect = prospects.find(p => p.id === pId);
    if (!prospect) return;

    setAuditGenerating(true);
    try {
      const res = await api.generateAudit({
        businessName: prospect.businessName,
        websiteUrl: prospect.websiteUrl,
        industry: prospect.industry,
        location: prospect.location,
        mainGoal: 'Improve conversion and establish high-performance systems',
        prospectId: prospect.id,
        isPublicLead: false,
      });

      if (res.success && res.audit) {
        setSelectedAudit(res.audit);
        setAudits(prev => [res.audit, ...prev]);
        onClearSelectedProspect();
      }
    } catch (err) {
      alert('Failed to generate diagnostic report. Ensure Gemini API key is configured.');
    } finally {
      setAuditGenerating(false);
    }
  };

  const handleOpenEdit = (audit: Audit) => {
    setSelectedAudit(audit);
    setOverallScore(audit.overallScore);
    setStrengths([...audit.strengths]);
    setGaps([...audit.gaps]);
    setMissedOpportunity(audit.missedOpportunity);
    setRecommendedSolution(audit.recommendedSolution);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAudit) return;

    const updated: Audit = {
      ...selectedAudit,
      overallScore: Number(overallScore),
      strengths,
      gaps,
      missedOpportunity,
      recommendedSolution
    };

    try {
      // Since saving edits is supported under general save/update routes, we'll proxy it:
      // Our API supports saving/updating through appropriate routes, but to edit audits:
      // We can create a direct save endpoint or make a mock update
      // Let's call the database save through audits proxy or just local update
      // Wait! We can post to our save route.
      // Let's update backend audits array
      await api.saveAudit(updated);
      
      setIsEditing(false);
      loadAudits();
      setSelectedAudit(updated);
      alert('Audit updated successfully!');
    } catch (err) {
      alert('Failed to save audit edits');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div id="audit-manager-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Audits Sidebar List */}
      <div className="lg:col-span-4 space-y-6">
        <div className="border border-slate-200 bg-white p-5 rounded-2xl space-y-4">
          <h4 className="font-display font-bold text-slate-900 text-base">Generate Visual Audit</h4>
          <p className="text-slate-500 text-xs font-light">
            Select an active prospect to run a real-time visual presence and conversion diagnostics report.
          </p>

          <div className="space-y-3 pt-2">
            <select
              value={targetProspectId}
              onChange={(e) => setTargetProspectId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none"
            >
              <option value="">-- Choose Prospect --</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>{p.businessName}</option>
              ))}
            </select>

            <button
              disabled={!targetProspectId || auditGenerating}
              onClick={() => handleTriggerGenerate(targetProspectId)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {auditGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Audit...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run Gemini Audit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audit List Container */}
        <div className="border border-slate-200 bg-white p-5 rounded-2xl space-y-4 flex flex-col max-h-[50vh] overflow-y-auto">
          <h4 className="font-display font-bold text-slate-900 text-sm">Compiled Diagnostic Reports</h4>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : audits.length === 0 ? (
            <p className="text-slate-400 text-xs font-mono py-4 text-center">No reports generated yet.</p>
          ) : (
            <div className="space-y-2">
              {audits.map(audit => (
                <button
                  key={audit.id}
                  onClick={() => {
                    setSelectedAudit(audit);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center transition-all cursor-pointer ${
                    selectedAudit?.id === audit.id 
                      ? 'border-blue-500 bg-blue-50/40 text-slate-900 font-medium' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 text-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-display font-bold">{audit.businessName}</p>
                    <p className="text-[10px] font-mono text-slate-400">{audit.createdAt}</p>
                  </div>
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    audit.overallScore >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                  }`}>
                    {audit.overallScore}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Detail Viewer Panel */}
      <div className="lg:col-span-8">
        {!selectedAudit ? (
          <div className="border border-slate-200 border-dashed rounded-3xl p-16 text-center space-y-4 bg-slate-50/50 h-full flex flex-col justify-center items-center">
            <FileText className="w-12 h-12 text-slate-300" />
            <div className="space-y-1">
              <h5 className="font-display font-bold text-slate-700">No Report Selected</h5>
              <p className="text-slate-400 text-xs font-light max-w-sm">
                Choose a compiled report from the left panel or run a new audit diagnostics to view the deep performance insights.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 bg-white rounded-3xl p-6 sm:p-8 space-y-8 shadow-sm">
            {/* Header toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded">
                    GEMINI FLASH AUDIT
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{selectedAudit.createdAt}</span>
                </div>
                <h4 className="font-display text-xl font-bold text-slate-900">{selectedAudit.businessName}</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                
                {isEditing ? (
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Edits
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenEdit(selectedAudit)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Modify Report
                  </button>
                )}
              </div>
            </div>

            {/* Audit details - EDITABLE OR VIEWABLE */}
            <div className="space-y-6">
              {/* Overall metric row */}
              <div className="flex items-center gap-4">
                <div className="space-y-1 text-left flex-grow">
                  <h5 className="font-display font-semibold text-slate-900">Digital Presence Wellness Score</h5>
                  <p className="text-slate-500 text-xs font-light">
                    Aggregated assessment score based on 10 performance dimensions (Credibility, mobile experience, CTA conversions, etc).
                  </p>
                </div>
                <div>
                  {isEditing ? (
                    <div className="space-y-1">
                      <label className="font-mono text-[9px] text-slate-400 block">Score</label>
                      <input 
                        type="number" min="0" max="100" value={overallScore}
                        onChange={(e) => setOverallScore(Number(e.target.value))}
                        className="w-16 p-1 border border-blue-300 text-center rounded font-bold text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 rounded-full border-2 font-display font-bold text-base flex items-center justify-center ${getScoreColor(selectedAudit.overallScore)}`}>
                      {selectedAudit.overallScore}%
                    </div>
                  )}
                </div>
              </div>

              {/* Missed opportunity and recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <span className="font-mono text-[10px] font-bold text-slate-500 block">Primary Conversion Leak:</span>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={missedOpportunity}
                      onChange={(e) => setMissedOpportunity(e.target.value)}
                      className="w-full text-xs p-2 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-700 text-xs font-light leading-relaxed">{selectedAudit.missedOpportunity}</p>
                  )}
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <span className="font-mono text-[10px] font-bold text-blue-600 block">Recommended Action Checklist:</span>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={recommendedSolution}
                      onChange={(e) => setRecommendedSolution(e.target.value)}
                      className="w-full text-xs p-2 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-700 text-xs font-light leading-relaxed">{selectedAudit.recommendedSolution}</p>
                  )}
                </div>
              </div>

              {/* Evidence Verification Gate Status Panel */}
              <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-4 sm:p-5 space-y-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] font-bold text-slate-500 block">EVIDENCE VERIFICATION GATE</span>
                    <p className="text-[11px] text-slate-400 font-light">Mandatory forensic claim checking prior to outreach dispatch.</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold ${
                      selectedAudit.evidenceStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedAudit.evidenceStatus === 'PARTIALLY_VERIFIED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        selectedAudit.evidenceStatus === 'VERIFIED'
                          ? 'bg-emerald-500'
                          : selectedAudit.evidenceStatus === 'PARTIALLY_VERIFIED'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`} />
                      {selectedAudit.evidenceStatus || 'NEEDS_VERIFICATION'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-light text-slate-600">
                  <div className="space-y-2">
                    <p><strong className="font-semibold text-slate-800">Verification Source:</strong> <span className="font-mono text-slate-600">{selectedAudit.verificationSource || 'N/A'}</span></p>
                    <p><strong className="font-semibold text-slate-800">Last Verified At:</strong> <span className="font-mono text-slate-600">{selectedAudit.lastVerifiedAt || 'N/A'}</span></p>
                    <div className="space-y-1">
                      <strong className="font-semibold text-slate-800 block">Evidence Notes:</strong>
                      <p className="text-[11px] leading-relaxed text-slate-500 italic bg-white p-2.5 border border-slate-100 rounded-lg">
                        {selectedAudit.evidenceNotes || 'No specific notes recorded yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 block">VERIFIED FINDINGS (FACTS / OBSERVATIONS)</span>
                      {selectedAudit.verifiedFindings && selectedAudit.verifiedFindings.length > 0 ? (
                        <ul className="space-y-1 list-disc pl-4 text-[11px] text-slate-500">
                          {selectedAudit.verifiedFindings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] italic text-slate-400 pl-1">No verified findings logged.</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-rose-500 block font-bold">UNVERIFIED CLAIMS (AI HYPOTHESES / NEEDS CHECKING)</span>
                      {selectedAudit.unverifiedFindings && selectedAudit.unverifiedFindings.length > 0 ? (
                        <ul className="space-y-1 list-disc pl-4 text-[11px] text-slate-500">
                          {selectedAudit.unverifiedFindings.map((f, i) => (
                            <li key={i} className="text-rose-600/80">{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] italic text-emerald-600/70 pl-1 font-medium">All critical audit findings verified 100%.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths and gaps list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <span className="font-mono text-[10px] font-bold text-emerald-600 uppercase block">Top 3 Strengths Detected</span>
                  <div className="space-y-1.5">
                    {strengths.map((str, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-light text-slate-600 leading-normal">
                        <span className="text-emerald-500 font-bold select-none">✔</span>
                        {isEditing ? (
                          <input 
                            type="text" value={str}
                            onChange={(e) => {
                              const list = [...strengths];
                              list[idx] = e.target.value;
                              setStrengths(list);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-xs"
                          />
                        ) : (
                          <span>{str}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-[10px] font-bold text-rose-600 uppercase block">Critical Vulnerability Points</span>
                  <div className="space-y-1.5">
                    {gaps.map((gap, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-light text-slate-600 leading-normal">
                        <span className="text-rose-500 font-bold select-none">✘</span>
                        {isEditing ? (
                          <input 
                            type="text" value={gap}
                            onChange={(e) => {
                              const list = [...gaps];
                              list[idx] = e.target.value;
                              setGaps(list);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-xs"
                          />
                        ) : (
                          <span>{gap}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Breakdown detail row */}
              <div className="pt-6 border-t border-slate-100">
                <h5 className="font-display font-semibold text-slate-900 mb-4 text-sm">Full Dimensional Diagnosis</h5>
                <div className="space-y-4">
                  {[
                    { name: 'Discoverability', key: 'discoverability', data: selectedAudit.discoverability },
                    { name: 'Credibility', key: 'credibility', data: selectedAudit.credibility },
                    { name: 'Digital Presence', key: 'digitalPresence', data: selectedAudit.digitalPresence },
                    { name: 'Conversion', key: 'conversion', data: selectedAudit.conversion },
                    { name: 'Contact Info', key: 'contact', data: selectedAudit.contact },
                    { name: 'Booking Workflows', key: 'booking', data: selectedAudit.booking },
                    { name: 'Google Local Visibility', key: 'googleVisibility', data: selectedAudit.googleVisibility },
                    { name: 'Mobile compliance', key: 'mobile', data: selectedAudit.mobile },
                    { name: 'Social Bridge', key: 'socialJourney', data: selectedAudit.socialJourney },
                    { name: 'Nurture & Follow-Up', key: 'followUp', data: selectedAudit.followUp },
                  ].map((dim, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-display font-bold text-xs text-slate-900">{dim.name}</span>
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          dim.data.score >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                        }`}>
                          {dim.data.score}/100
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-600 font-light">
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block">Observation & Evidence:</span>
                          <p className="mt-0.5 italic">{dim.data.observation}</p>
                          <p className="font-mono text-[10px] text-slate-500 mt-1">Source: {dim.data.evidence}</p>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-blue-500 block font-bold">Actionable Recommendation:</span>
                          <p className="mt-0.5 text-slate-800">{dim.data.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
