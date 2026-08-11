import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { 
  Prospect, 
  ProspectVerificationAudit, 
  EvidenceRecord, 
  VerificationConflict, 
  ClaimClassification 
} from '../../types';
import { 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Sparkles, 
  Search, 
  Globe, 
  ExternalLink,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';

interface VerificationEngineViewProps {
  prospects: Prospect[];
  selectedProspect?: Prospect | null;
  onRefreshProspects?: () => void;
}

export default function VerificationEngineView({
  prospects,
  selectedProspect: initialSelected,
  onRefreshProspects
}: VerificationEngineViewProps) {
  const [selectedProspectId, setSelectedProspectId] = useState<string>(
    initialSelected?.id || (prospects.find(p => p.id === 'p-ng-2')?.id || prospects[0]?.id || '')
  );

  const [audit, setAudit] = useState<ProspectVerificationAudit | null>(null);
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [conflicts, setConflicts] = useState<VerificationConflict[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Claim Checker State
  const [testClaim, setTestClaim] = useState<string>('');
  const [claimClassification, setClaimClassification] = useState<ClaimClassification | null>(null);
  const [checkingClaim, setCheckingClaim] = useState<boolean>(false);

  useEffect(() => {
    if (initialSelected) {
      setSelectedProspectId(initialSelected.id);
    }
  }, [initialSelected]);

  useEffect(() => {
    if (selectedProspectId) {
      loadVerificationAudit(selectedProspectId);
    }
  }, [selectedProspectId]);

  const loadVerificationAudit = async (prospectId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getVerificationAudit(prospectId);
      if (res.success) {
        setAudit(res.audit);
        setRecords(res.records || []);
        setConflicts(res.conflicts || []);
      }
    } catch (err: any) {
      console.error('Failed to load verification audit:', err);
      setError(err.message || 'Failed to load verification data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunLiveVerification = async () => {
    if (!selectedProspectId) return;
    setVerifying(true);
    setError('');
    try {
      const res = await api.runLiveVerification(selectedProspectId);
      if (res.success) {
        setAudit(res.audit);
        await loadVerificationAudit(selectedProspectId);
        if (onRefreshProspects) onRefreshProspects();
      }
    } catch (err: any) {
      console.error('Failed to run live verification:', err);
      setError(err.message || 'Live verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleClassifyClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testClaim.trim()) return;
    setCheckingClaim(true);
    try {
      const res = await api.classifyClaim(testClaim, selectedProspectId);
      if (res.success) {
        setClaimClassification(res.classification);
      }
    } catch (err: any) {
      console.error('Failed to classify claim:', err);
    } finally {
      setCheckingClaim(false);
    }
  };

  const currentProspect = prospects.find(p => p.id === selectedProspectId);

  return (
    <div className="space-y-6 text-left">
      {/* HEADER BAR */}
      <div className="border border-slate-200 bg-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="font-display text-lg font-bold text-slate-900">Live Business Verification Engine</h3>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">
              Phase 1 Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Distinguish live technical observations from search index presence, AI inference, and historical records with deterministic conflict resolution.
          </p>
        </div>

        {/* PROSPECT SELECTOR & LIVE VERIFY BUTTON */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedProspectId}
            onChange={(e) => setSelectedProspectId(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {prospects.map(p => (
              <option key={p.id} value={p.id}>
                {p.businessName} ({p.location || 'N/A'})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunLiveVerification}
            disabled={verifying || !selectedProspectId}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying Live Domain...' : 'Run Live Verification'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-200 rounded-3xl">
          Loading verification state...
        </div>
      ) : audit ? (
        <div className="space-y-6">
          {/* TOP METRICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-slate-200 bg-white p-4 rounded-2xl">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Prospect Target</span>
              <h4 className="font-display font-bold text-slate-900 text-sm mt-1">{audit.businessName}</h4>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {audit.domain || 'No website domain listed'}
              </p>
            </div>

            <div className="border border-slate-200 bg-white p-4 rounded-2xl">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Verification Status</span>
              <div className="mt-1 flex items-center gap-2">
                {audit.overallStatus === 'VERIFIED' && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED
                  </span>
                )}
                {audit.overallStatus === 'PARTIALLY_VERIFIED' && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> PARTIALLY VERIFIED
                  </span>
                )}
                {audit.overallStatus === 'UNVERIFIED' && (
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> UNVERIFIED
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Last checked: {new Date(audit.lastVerifiedAt || '').toLocaleString()}
              </p>
            </div>

            <div className="border border-slate-200 bg-white p-4 rounded-2xl">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Data Confidence Score</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-slate-900">{audit.confidenceScore}%</span>
                <span className="text-[10px] text-slate-400">weighted truth score</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    audit.confidenceScore >= 75 ? 'bg-emerald-500' :
                    audit.confidenceScore >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${audit.confidenceScore}%` }}
                />
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-4 rounded-2xl">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Active Conflicts</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`font-display text-xl font-bold ${audit.conflicts.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {audit.conflicts.length}
                </span>
                <span className="text-[10px] text-slate-400">unresolved discrepancies</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                {audit.conflicts.length > 0 ? 'Discrepancy flagged for reviewer' : 'No conflicts detected'}
              </p>
            </div>
          </div>

          {/* CONFLICTS ALERT BOX */}
          {conflicts.length > 0 && (
            <div className="border-2 border-amber-300 bg-amber-50/70 p-5 rounded-2xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <h4 className="font-display font-bold text-sm text-amber-950 uppercase tracking-wide">
                  EVIDENCE CONFLICT DISCOVERED (HUMAN REVIEW REQUIRED)
                </h4>
              </div>
              {conflicts.map((c, i) => (
                <div key={i} className="bg-white/80 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                  <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    {c.conflictType}
                  </span>
                  <p className="font-mono text-xs font-semibold text-amber-950 leading-relaxed mt-1">
                    {c.summary}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Observation Timestamp: {new Date(c.observedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* RECOMMENDED NEXT VERIFICATION CALLOUT */}
          <div className="border border-indigo-100 bg-indigo-50/60 p-4 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-indigo-700 block">Recommended Verification Action</span>
              <p className="font-medium mt-0.5">{audit.recommendedNextVerification}</p>
            </div>
          </div>

          {/* EVIDENCE RECORDS LEDGER TABLE */}
          <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs space-y-0">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Evidence Records Ledger
              </h4>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                {records.length} TOTAL RECORDS
              </span>
            </div>

            {records.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No evidence records found. Click &quot;Run Live Verification&quot; above to execute live domain &amp; search checks.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <div key={rec.evidenceId} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          rec.sourceType === 'DIRECT_ACCESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          rec.sourceType === 'DNS' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          rec.sourceType === 'SEARCH_INDEX' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          rec.sourceType === 'AI_INFERENCE' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.sourceType}
                        </span>

                        <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          rec.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                          rec.status === 'FAILED' ? 'bg-rose-100 text-rose-800' :
                          rec.status === 'PARTIALLY_VERIFIED' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.status}
                        </span>

                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          FRESHNESS: {rec.freshness}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 mt-1">
                        {rec.claim}
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {rec.observation}
                      </p>
                    </div>

                    <div className="text-right font-mono text-[10px] text-slate-400 space-y-1 flex-shrink-0">
                      <div>Confidence: <strong className="text-slate-700">{rec.confidence}%</strong></div>
                      <div>Observed: {new Date(rec.observedAt).toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400">{rec.verificationMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CLAIM SAFETY INSPECTOR */}
          <div className="border border-slate-200 bg-white p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h4 className="font-display font-bold text-sm text-slate-900">Claim Safety Inspector</h4>
            </div>
            <p className="text-xs text-slate-500">
              Evaluate an outreach claim statement against recorded evidence to check whether it is SUPPORTED, CONTRADICTED, STALE, INFERENCE, RECOMMENDATION, or UNSUPPORTED.
            </p>

            <form onSubmit={handleClassifyClaim} className="flex gap-2">
              <input
                type="text"
                value={testClaim}
                onChange={(e) => setTestClaim(e.target.value)}
                placeholder="e.g. Your business website is currently inaccessible or lacks quote forms"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={checkingClaim || !testClaim.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {checkingClaim ? 'Checking...' : 'Classify Claim'}
              </button>
            </form>

            {claimClassification && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-mono text-[10px] block">CLAIM CLASSIFICATION RESULT</span>
                  <span className="font-mono text-xs font-bold text-slate-900">&quot;{testClaim}&quot;</span>
                </div>
                <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                  claimClassification === 'SUPPORTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  claimClassification === 'CONTRADICTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                  claimClassification === 'STALE' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  claimClassification === 'INFERENCE' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                  claimClassification === 'RECOMMENDATION' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {claimClassification}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
