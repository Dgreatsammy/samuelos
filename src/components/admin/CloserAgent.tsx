import React, { useState, useEffect } from 'react';
import { Prospect, Audit, PipelineStatus, ScoreDetails, Outreach, OutreachStatus, OutreachClaim, Client } from '../../types';
import { api } from '../../lib/api';
import { 
  Sparkles, CheckCircle2, AlertCircle, FileText, Send, Calendar, Check, Copy, Edit3, 
  HelpCircle, ChevronRight, UserCheck, Trash2, ArrowRight, Loader2, ArrowUpRight, CheckSquare, 
  MessageSquare, Mail, Instagram, ShieldCheck, RefreshCw, PlusCircle, AlertTriangle, UserPlus, Info, ArrowLeftRight
} from 'lucide-react';

interface CloserAgentProps {
  prospects: Prospect[];
  onRefresh: () => void;
  selectedProspect?: Prospect | null;
  onClearSelectedProspect?: () => void;
}

export default function CloserAgent({ 
  prospects, onRefresh, selectedProspect, onClearSelectedProspect 
}: CloserAgentProps) {
  const [activeProspectId, setActiveProspectId] = useState<string>('');
  const [currentProspect, setCurrentProspect] = useState<Prospect | null>(null);
  const [associatedAudit, setAssociatedAudit] = useState<Audit | null>(null);
  const [currentOutreach, setCurrentOutreach] = useState<Outreach | null>(null);
  
  // Evaluation States
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  
  // Edit & Override States
  const [editedReasoning, setEditedReasoning] = useState<string>('');
  const [editedWhatsapp, setEditedWhatsapp] = useState<string>('');
  const [editedEmail, setEditedEmail] = useState<string>('');
  const [editedInstagram, setEditedInstagram] = useState<string>('');
  const [isEditingDrafts, setIsEditingDrafts] = useState<boolean>(false);
  
  // Custom Booking Links & Campaign CTAs
  const [bookingLinkParamOverride, setBookingLinkParamOverride] = useState<string>('?src=wa');
  const [valueBoosterVideoLink, setValueBoosterVideoLink] = useState<string>('');
  const [valueBoosterDescription, setValueBoosterDescription] = useState<string>('');
  
  // Active tab inside the outreach preview
  const [activeOutreachTab, setActiveOutreachTab] = useState<'whatsapp' | 'email' | 'instagram'>('whatsapp');
  
  // Feedback status
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Follow-up Tracking State
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [showFollowUpForm, setShowFollowUpForm] = useState<boolean>(false);

  // Response Logging State
  const [prospectResponse, setProspectResponse] = useState<string>('');
  const [showResponseForm, setShowResponseForm] = useState<boolean>(false);

  // Client Conversion Modal State
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [convertClientName, setConvertClientName] = useState<string>('');
  const [convertEmail, setConvertEmail] = useState<string>('');
  const [convertPhone, setConvertPhone] = useState<string>('');
  const [convertNotes, setConvertNotes] = useState<string>('');
  const [isSubmittingConversion, setIsSubmittingConversion] = useState<boolean>(false);

  // Set active prospect when props change
  useEffect(() => {
    if (selectedProspect) {
      setActiveProspectId(selectedProspect.id);
    } else if (prospects.length > 0 && !activeProspectId) {
      setActiveProspectId(prospects[0].id);
    }
  }, [selectedProspect, prospects]);

  // Load prospect, audit details & existing outreach when active prospect changes
  useEffect(() => {
    if (!activeProspectId) return;
    
    const prospect = prospects.find(p => p.id === activeProspectId);
    if (prospect) {
      setCurrentProspect(prospect);
      setEvaluationResult(null); // Reset when changing prospects
      setIsEditingDrafts(false);
      setCurrentOutreach(null);
      setSuccessMsg('');
      setErrorMsg('');
      
      // Fetch associated audit
      api.getAudits().then(audits => {
        const found = audits.find(a => a.prospectId === activeProspectId);
        setAssociatedAudit(found || null);
      }).catch(err => {
        console.error('Failed to get audits:', err);
      });

      // Fetch existing outreach draft
      api.getOutreaches().then(list => {
        const found = list.find(o => o.prospectId === activeProspectId);
        if (found) {
          setCurrentOutreach(found);
          // Pre-populate evaluationResult states from database record
          setEvaluationResult({
            qualificationStatus: found.status === 'DRAFT' || found.status === 'AWAITING_EVIDENCE_VERIFICATION' ? 'AWAITING' : 'QUALIFIED',
            scores: {
              digitalGap: prospect.scoreDetails?.digitalGap || 25,
              businessPotential: prospect.scoreDetails?.businessPotential || 15,
              commercialPotential: prospect.scoreDetails?.commercialPotential || 15,
              accessibility: prospect.scoreDetails?.accessibility || 10,
              timingIntent: prospect.scoreDetails?.timingIntent || 10
            },
            reasoning: prospect.notes || 'Forensic outreach review',
            recommendedOffer: prospect.recommendedOfferId === 'o-website' ? 'Professional Business Website' : (prospect.recommendedOfferId === 'o-conversion' ? 'Conversion & Booking System' : 'AI & Workflow Automation'),
            recommendedOfferId: prospect.recommendedOfferId || 'o-website',
            outreachDrafts: {
              whatsapp: found.channel === 'whatsapp' ? found.message : '',
              email: found.channel === 'email' ? found.message : '',
              instagram: found.channel === 'instagram' ? found.message : ''
            },
            meetingBookingCTA: 'https://calendly.com/accessmart/discovery',
            claims: found.claims || []
          });
          setEditedReasoning(prospect.notes || '');
          setEditedWhatsapp(found.channel === 'whatsapp' ? found.message : '');
          setEditedEmail(found.channel === 'email' ? found.message : '');
          setEditedInstagram(found.channel === 'instagram' ? found.message : '');
          setActiveOutreachTab(found.channel || 'whatsapp');
        }
      }).catch(err => {
        console.error('Failed to get outreaches:', err);
      });
    }
  }, [activeProspectId, prospects]);

  const handleRunEvaluation = async () => {
    if (!currentProspect) return;
    setEvaluating(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.analyzeCloserAgent(currentProspect.id);
      if (res.success && res.analysis) {
        setEvaluationResult(res.analysis);
        setEditedReasoning(res.analysis.reasoning);
        setEditedWhatsapp(res.analysis.outreachDrafts.whatsapp);
        setEditedEmail(res.analysis.outreachDrafts.email);
        setEditedInstagram(res.analysis.outreachDrafts.instagram);
        setSuccessMsg('AI Closer Agent diagnosis and claim extraction complete!');
      } else {
        setErrorMsg('AI Closer Agent returned empty results.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live Persistence of Verification Actions (Verify, Needs Verification, Decline)
  const handleVerifyClaim = async (claimId: string, status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'UNVERIFIED') => {
    if (!currentOutreach) {
      setErrorMsg('Please run closer agent diagnosis and save outreach draft first.');
      return;
    }
    
    const updatedClaims = (currentOutreach.claims || []).map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          verification_status: status,
          claim_type: status === 'VERIFIED' ? 'VERIFIED_FACT' : (status === 'NEEDS_VERIFICATION' ? 'NEEDS_VERIFICATION' : 'AI_GENERATED_HYPOTHESIS')
        } as OutreachClaim;
      }
      return c;
    });

    const updatedOutreach: Outreach = {
      ...currentOutreach,
      claims: updatedClaims
    };

    try {
      const saved = await api.saveOutreach(updatedOutreach);
      setCurrentOutreach(saved);
      if (evaluationResult) {
        setEvaluationResult({
          ...evaluationResult,
          claims: updatedClaims
        });
      }
      setSuccessMsg(`Factual evidence claim state updated to ${status}!`);
    } catch (err: any) {
      setErrorMsg('Failed to update evidence verification status.');
    }
  };

  // Transition Outreach Status on the State Machine
  const handleTransitionStatus = async (newStatus: OutreachStatus, reason?: string) => {
    if (!currentOutreach) {
      setErrorMsg('No active outreach draft found to transition.');
      return;
    }

    setSuccessMsg('');
    setErrorMsg('');

    const updatedOutreach: any = {
      ...currentOutreach,
      status: newStatus,
      transitionReason: reason || `Human manual transition to ${newStatus}`
    };

    try {
      const saved = await api.saveOutreach(updatedOutreach);
      setCurrentOutreach(saved);
      setSuccessMsg(`Status successfully transitioned to ${newStatus}!`);

      // Sync prospect CRM stage when outreach moves to SENT or MEETING_BOOKED
      if (newStatus === 'SENT' && currentProspect) {
        const updatedProspect: Prospect = {
          ...currentProspect,
          status: 'Contacted',
          notes: `${currentProspect.notes || ''}\n\n[CRM Update - ${new Date().toISOString().split('T')[0]}] Outreach fired successfully via ${currentOutreach.channel}.`
        };
        await api.saveProspect(updatedProspect);
        onRefresh();
      } else if (newStatus === 'MEETING_BOOKED' && currentProspect) {
        const updatedProspect: Prospect = {
          ...currentProspect,
          status: 'Discovery',
          notes: `${currentProspect.notes || ''}\n\n[CRM Update - ${new Date().toISOString().split('T')[0]}] Discovery meeting logged.`
        };
        await api.saveProspect(updatedProspect);
        onRefresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Transition rejected by system guard.');
    }
  };

  // Progress sequence stages and schedule follow-ups
  const handleLogFollowUp = async () => {
    if (!currentOutreach) return;
    try {
      const currentSequence = currentOutreach.sequenceStage;
      let nextSequence: 'Initial' | 'Follow-up 1' | 'Follow-up 2' | 'Closed/Nurture' = 'Initial';
      if (currentSequence === 'Initial') nextSequence = 'Follow-up 1';
      else if (currentSequence === 'Follow-up 1') nextSequence = 'Follow-up 2';
      else nextSequence = 'Closed/Nurture';

      const updatedOutreach: Outreach = {
        ...currentOutreach,
        sequenceStage: nextSequence,
        status: 'FOLLOW_UP_DUE',
        followUpDate: nextFollowUpDate || new Date().toISOString().split('T')[0],
        message: currentOutreach.message + `\n\n[Manual Follow-up Log - ${new Date().toISOString().split('T')[0]}]: ${followUpNotes}`
      };

      const saved = await api.saveOutreach(updatedOutreach);
      setCurrentOutreach(saved);
      setShowFollowUpForm(false);
      setFollowUpNotes('');
      setSuccessMsg(`Successfully logged follow-up attempt! Sequence progressed to ${nextSequence}.`);
    } catch (err) {
      setErrorMsg('Failed to log follow-up touchpoint.');
    }
  };

  // Log response received from prospect
  const handleLogResponse = async () => {
    if (!currentOutreach) return;
    try {
      const updatedOutreach: Outreach = {
        ...currentOutreach,
        status: 'RESPONSE_RECEIVED',
        response: prospectResponse,
      };

      const saved = await api.saveOutreach(updatedOutreach);
      setCurrentOutreach(saved);
      setShowResponseForm(false);
      setProspectResponse('');
      setSuccessMsg('Successfully logged prospect response! Proceed with next steps.');
    } catch (err) {
      setErrorMsg('Failed to log prospect response.');
    }
  };

  // Initialize and save a clean Outreach Draft
  const handleApproveQualification = async () => {
    if (!currentProspect || !evaluationResult) return;
    
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const isQualified = evaluationResult.qualificationStatus === 'QUALIFIED';
      
      // Save updated scores and status directly to the prospect
      const updatedProspect: Prospect = {
        ...currentProspect,
        status: isQualified ? 'Qualified' : currentProspect.status,
        leadScore: (
          evaluationResult.scores.digitalGap +
          evaluationResult.scores.businessPotential +
          evaluationResult.scores.commercialPotential +
          evaluationResult.scores.accessibility +
          evaluationResult.scores.timingIntent
        ),
        scoreDetails: {
          digitalGap: evaluationResult.scores.digitalGap,
          businessPotential: evaluationResult.scores.businessPotential,
          commercialPotential: evaluationResult.scores.commercialPotential,
          accessibility: evaluationResult.scores.accessibility,
          timingIntent: evaluationResult.scores.timingIntent
        },
        priority: (evaluationResult.scores.digitalGap + evaluationResult.scores.businessPotential + evaluationResult.scores.commercialPotential + evaluationResult.scores.accessibility + evaluationResult.scores.timingIntent) >= 75 ? 'A' : 'B',
        recommendedOfferId: evaluationResult.recommendedOfferId || currentProspect.recommendedOfferId,
        notes: `${currentProspect.notes || ''}\n\n[Closer Agent Qualification - ${new Date().toISOString().split('T')[0]}]\nScore: ${evaluationResult.scores.digitalGap + evaluationResult.scores.businessPotential + evaluationResult.scores.commercialPotential + evaluationResult.scores.accessibility + evaluationResult.scores.timingIntent}/100\nReasoning: ${editedReasoning}`
      };
      
      await api.saveProspect(updatedProspect);
      
      // Build claims list from evaluation result
      const initialClaims = (evaluationResult.claims || []).map((c: any) => ({
        id: c.id || `claim-${Date.now()}-${Math.random()}`,
        claim_text: c.claim_text,
        claim_type: c.claim_type || 'OBSERVATION',
        evidence_source: c.evidence_source || 'AI Extraction',
        evidence_reference: c.evidence_reference || 'Awaiting check',
        verification_status: c.verification_status || 'NEEDS_VERIFICATION'
      }));

      const hasUnverified = initialClaims.some((c: any) => c.verification_status !== 'VERIFIED');
      const initialStatus = hasUnverified ? 'AWAITING_EVIDENCE_VERIFICATION' : 'DRAFT';

      // Save outreach draft
      const newOutreach: Outreach = {
        id: currentOutreach?.id || `outreach-${Date.now()}`,
        prospectId: currentProspect.id,
        channel: activeOutreachTab,
        message: activeOutreachTab === 'whatsapp' ? editedWhatsapp : (activeOutreachTab === 'email' ? editedEmail : editedInstagram),
        personalizationBasis: `Verified digital presence assessment of ${currentProspect.businessName}`,
        date: new Date().toISOString().split('T')[0],
        status: initialStatus,
        sequenceStage: 'Initial',
        claims: initialClaims,
        auditLogs: []
      };
      const saved = await api.saveOutreach(newOutreach);
      setCurrentOutreach(saved);

      setSuccessMsg('Outreach draft initialized with verification claims!');
      onRefresh();
    } catch (err: any) {
      setErrorMsg('Failed to initialize outreach draft.');
    }
  };

  // Convert Prospect to Client submit
  const handleConfirmConversion = async () => {
    if (!currentProspect) return;
    setIsSubmittingConversion(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.convertToClient(currentProspect.id, {
        clientName: convertClientName,
        contactEmail: convertEmail,
        contactPhone: convertPhone,
        notes: convertNotes
      });

      if (res.success) {
        setSuccessMsg(`🎉 Outstanding success! ${convertClientName || currentProspect.businessName} has been manual-authorized and converted to an Active Client. In alignment with our SamuelOS constitution, NO automated project deliverables, revenue numbers, or financial invoices were created, preserving production ledger safety.`);
        setShowConvertModal(false);
        onRefresh();
        // Transition outreach status to CLOSED_WON
        if (currentOutreach) {
          await handleTransitionStatus('CLOSED_WON', 'Prospect converted to active client');
        }
      } else {
        setErrorMsg('Conversion API failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to convert prospect to client.');
    } finally {
      setIsSubmittingConversion(false);
    }
  };

  const getEvidenceColor = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'PARTIALLY_VERIFIED':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  // Formatted booking link generator with source parameter tagging
  const generateBookingLink = () => {
    const baseLink = "https://calendly.com/accessmart/discovery";
    const cleanParam = bookingLinkParamOverride.trim();
    if (!cleanParam) return baseLink;
    return `${baseLink}${cleanParam.startsWith('?') ? '' : '?'}${cleanParam}&p_id=${currentProspect?.id || ''}`;
  };

  // Combine edited message with custom link and value boosters if added
  const getOutreachMessageBody = () => {
    let baseMsg = activeOutreachTab === 'whatsapp' ? editedWhatsapp : (activeOutreachTab === 'email' ? editedEmail : editedInstagram);
    
    // Replace default booking link with customized tagged parameter link
    baseMsg = baseMsg.replace("https://calendly.com/accessmart/discovery", generateBookingLink());

    // Append Value boosters if added
    if (valueBoosterVideoLink.trim()) {
      baseMsg += `\n\n[Value Booster Video Walkthrough]: ${valueBoosterVideoLink}`;
    }
    if (valueBoosterDescription.trim()) {
      baseMsg += `\n\n[Visual Audit Asset]: ${valueBoosterDescription}`;
    }

    return baseMsg;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* LEFT COLUMN: Prospect List */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-900 text-sm">Target Prospects</h3>
            <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
              {prospects.length} total
            </span>
          </div>

          <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
            {prospects.map(p => {
              const isActive = p.id === activeProspectId;
              const isVerified = p.evidenceStatus === 'VERIFIED';
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProspectId(p.id);
                    if (onClearSelectedProspect) onClearSelectedProspect();
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="space-y-0.5">
                      <p className={`font-display font-bold text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {p.businessName}
                      </p>
                      <p className={`text-[10px] font-mono ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        {p.industry || p.category}
                      </p>
                    </div>
                    {isVerified && (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-500 bg-emerald-50/10 px-1.5 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full pt-2 border-t border-slate-100/10 mt-1">
                    <span className={`text-[10px] font-mono uppercase ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      Stage: <strong>{p.status}</strong>
                    </span>
                    <span className={`font-display font-black text-xs ${isActive ? 'text-indigo-300' : 'text-indigo-600'}`}>
                      {p.leadScore || 0} pts
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Action Center */}
      <div className="lg:col-span-8 space-y-6">
        {currentProspect ? (
          <div className="space-y-6">
            
            {/* Prospect Status Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold font-semibold">REVENUE ENGINE: CLOSER AGENT</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <h2 className="font-display font-bold text-slate-900 text-lg">{currentProspect.businessName}</h2>
                  <p className="text-xs text-slate-500 font-light">{currentProspect.location} • {currentProspect.industry || currentProspect.category}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getEvidenceColor(currentProspect.evidenceStatus)}`}>
                    Evidence: {currentProspect.evidenceStatus || 'NEEDS_VERIFICATION'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Lead Score: {currentProspect.leadScore || 0}/100
                  </span>
                </div>
              </div>

              {/* Prospect Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 p-3 bg-slate-50/50 rounded-lg">
                  <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">VERIFIED EVIDENCE FINDINGS</span>
                  {currentProspect.verifiedFindings && currentProspect.verifiedFindings.length > 0 ? (
                    <ul className="space-y-1 font-mono text-[11px] text-emerald-700">
                      {currentProspect.verifiedFindings.map((f, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-light text-slate-500 italic">No verified findings logged yet. Run diagnostics and execute visual verifications.</p>
                  )}
                </div>

                <div className="space-y-1 p-3 bg-slate-50/50 rounded-lg">
                  <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">DEMAND OPPORTUNITY GAP</span>
                  <p className="text-slate-700 font-light text-[11px] leading-relaxed">
                    {currentProspect.digitalGap !== 'Awaiting visual assessment' ? currentProspect.digitalGap : 'Awaiting visual diagnostic run.'}
                  </p>
                  {associatedAudit && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-indigo-600">
                        <FileText className="w-3 h-3" /> Forensic Audit Available (Score: {associatedAudit.overallScore}/100)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Run Closer Agent Button */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleRunEvaluation}
                  disabled={evaluating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Prospect...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-400" /> {currentOutreach ? 'Refresh Closer Agent Diagnosis' : 'Execute Closer Agent Diagnosis'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error or Success Banner */}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Live Outreach Status Machine Tracker */}
            {currentOutreach && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <span className="font-mono text-[9px] uppercase text-slate-400 font-bold tracking-wider block">OUTREACH STATUS ENGINE STATE</span>
                
                {/* Horizontal flow line of status */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                  {[
                    { key: 'DRAFT', label: 'Draft' },
                    { key: 'AWAITING_EVIDENCE_VERIFICATION', label: 'Evidence Review' },
                    { key: 'READY_FOR_APPROVAL', label: 'Awaiting Approval' },
                    { key: 'APPROVED', label: 'Approved' },
                    { key: 'SENT', label: 'Sent / Fired' },
                    { key: 'RESPONSE_RECEIVED', label: 'Response Got' },
                    { key: 'FOLLOW_UP_DUE', label: 'Follow-Up Due' },
                    { key: 'MEETING_BOOKED', label: 'Meeting Booked' },
                    { key: 'CLOSED_WON', label: 'Closed Won' },
                    { key: 'CLOSED_LOST', label: 'Closed Lost' }
                  ].map((s) => {
                    const isCurrent = currentOutreach.status === s.key;
                    return (
                      <div 
                        key={s.key} 
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent 
                            ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 text-xs'
                        }`}
                      >
                        <p className="font-mono text-[9px] uppercase tracking-wider">{s.label}</p>
                        {isCurrent && <span className="text-[8px] font-mono block mt-1">● Active State</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Audit Logs expander */}
                {currentOutreach.auditLogs && currentOutreach.auditLogs.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Status Audit Ledger (History Logs)
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-[10px] font-mono text-slate-600">
                      {currentOutreach.auditLogs.map((log, idx) => (
                        <div key={idx} className="flex justify-between items-start border-b border-slate-200/50 pb-1">
                          <span className="font-bold text-slate-800">
                            [{log.previous_status} ➔ {log.new_status}]
                          </span>
                          <span className="text-right text-slate-400">
                            By {log.changed_by} • {new Date(log.timestamp).toLocaleTimeString()} ({log.reason || 'Manual update'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Transitions controller */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <span className="text-xs font-mono text-slate-400 self-center mr-2">Transition To:</span>
                  
                  {(currentOutreach.status === 'AWAITING_EVIDENCE_VERIFICATION' || currentOutreach.status === 'DRAFT') && (
                    <button
                      onClick={() => handleTransitionStatus('READY_FOR_APPROVAL', 'Factual claims reviewed and proposed')}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                    >
                      READY FOR APPROVAL
                    </button>
                  )}

                  {(currentOutreach.status === 'READY_FOR_APPROVAL' || currentOutreach.status === 'AWAITING_APPROVAL' || currentOutreach.status === 'DRAFT') && (
                    <button
                      onClick={() => handleTransitionStatus('APPROVED', 'Authorizing outreach copy sending')}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      APPROVE OUTREACH DRAFT
                    </button>
                  )}

                  {(currentOutreach.status === 'APPROVED' || currentOutreach.status === 'AWAITING_APPROVAL') && (
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Confirm Manual Send:\n\nHave you manually delivered this outreach message to ${currentProspect?.businessName || 'prospect'}?\n\nClick OK to update status to SENT and move lead stage to Contacted.`);
                        if (confirmed) {
                          handleTransitionStatus('SENT', 'Draft manually sent over outreach channels');
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-lg hover:bg-slate-800 cursor-pointer"
                    >
                      MARK AS MANUALLY SENT
                    </button>
                  )}

                  {currentOutreach.status === 'SENT' && (
                    <>
                      <button
                        onClick={() => setShowResponseForm(true)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                      >
                        LOG RESPONSE
                      </button>
                      <button
                        onClick={() => setShowFollowUpForm(true)}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 font-mono text-[10px] font-bold rounded-lg border border-amber-200 hover:bg-amber-100 cursor-pointer"
                      >
                        SCHEDULE FOLLOW-UP
                      </button>
                    </>
                  )}

                  {(currentOutreach.status === 'SENT' || currentOutreach.status === 'RESPONSE_RECEIVED' || currentOutreach.status === 'FOLLOW_UP_DUE') && (
                    <button
                      onClick={() => handleTransitionStatus('MEETING_BOOKED', 'Confirmed Calendly discovery slot booked')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> LOG MEETING BOOKED
                    </button>
                  )}

                  {currentOutreach.status === 'MEETING_BOOKED' && (
                    <>
                      <button
                        onClick={() => {
                          setConvertClientName(currentProspect.businessName);
                          setConvertEmail(currentProspect.email || '');
                          setConvertPhone(currentProspect.phone || '');
                          setConvertNotes(`Converted via Closer Agent. Lead Score was ${currentProspect.leadScore}`);
                          setShowConvertModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> CONVERT TO ACTIVE CLIENT
                      </button>
                      <button
                        onClick={() => handleTransitionStatus('CLOSED_LOST', 'Prospect declined offer or lead cold')}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 font-mono text-[10px] font-bold rounded-lg border border-rose-200 hover:bg-rose-100 cursor-pointer"
                      >
                        MARK CLOSED LOST
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Evaluation Results Card */}
            {evaluationResult && (
              <div className="space-y-6">
                
                {/* 1. Scores & Reasoning */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] uppercase text-slate-400 font-bold tracking-wider">SAMUELOS DIAGNOSTIC SCORE</span>
                      <h4 className="font-display font-bold text-slate-900 text-base">Qualification Status</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        evaluationResult.qualificationStatus === 'QUALIFIED' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {evaluationResult.qualificationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Weighted Scores Grid (Nigerian Naira NGN reference for local market context) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: 'Digital Gap', val: evaluationResult.scores.digitalGap, max: 30, color: 'bg-indigo-600' },
                      { label: 'Biz Potential', val: evaluationResult.scores.businessPotential, max: 20, color: 'bg-indigo-600' },
                      { label: 'Comm Potential', val: evaluationResult.scores.commercialPotential, max: 20, color: 'bg-indigo-600' },
                      { label: 'Accessibility', val: evaluationResult.scores.accessibility, max: 15, color: 'bg-indigo-600' },
                      { label: 'Timing/Intent', val: evaluationResult.scores.timingIntent, max: 15, color: 'bg-indigo-600' }
                    ].map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 text-center">
                        <span className="font-mono text-[9px] text-slate-400 uppercase block font-bold">{s.label}</span>
                        <div className="font-display font-extrabold text-base text-slate-900">
                          {s.val}<span className="text-[10px] text-slate-400 font-light">/{s.max}</span>
                        </div>
                        {/* Progress line */}
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className={`${s.color} h-full`} style={{ width: `${(s.val / s.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Offer Pitch with NGN default references */}
                  <div className="p-4 border border-indigo-100 bg-indigo-50/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-indigo-600 font-bold">RECOMMENDED ACCESSMART OFFER</span>
                      <p className="font-display font-bold text-slate-900 text-sm">{evaluationResult.recommendedOffer}</p>
                      <p className="text-[10px] font-mono text-indigo-600">ID Reference: {evaluationResult.recommendedOfferId} • Target Local Market: Nigeria (₦ NGN pricing context applies)</p>
                    </div>
                    <span className="px-3 py-1.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      Target Solution
                    </span>
                  </div>

                  {/* Reasoning Textbox */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] uppercase text-slate-400 font-bold tracking-wider block">CLOSER AGENT QUALIFICATION LOG</span>
                    <textarea
                      value={editedReasoning}
                      onChange={(e) => setEditedReasoning(e.target.value)}
                      rows={3}
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-light leading-relaxed focus:outline-none focus:border-slate-400"
                      placeholder="Reasoning behind Closer qualification..."
                    />
                  </div>
                </div>

                {/* Evidence Claims Verification Gate Table */}
                {evaluationResult.claims && evaluationResult.claims.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] uppercase text-slate-400 font-bold tracking-wider">CLAIM-LEVEL EVIDENCE VERIFICATION GATE</span>
                      <h4 className="font-display font-bold text-slate-900 text-base">Forensic Claim Control</h4>
                      <p className="text-xs text-slate-500 font-light">
                        Every factual claim in outreach must map back to verified visual/forensic evidence. If any claim is unverified, status is locked to <strong>AWAITING EVIDENCE VERIFICATION</strong>.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {evaluationResult.claims.map((claim: any) => {
                        const hasUnverifiedColor = claim.verification_status !== 'VERIFIED';
                        return (
                          <div key={claim.id} className={`p-4 border rounded-2xl ${hasUnverifiedColor ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-200'} space-y-2`}>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <span className="font-mono text-[10px] text-slate-400 font-bold">CLAIM #{claim.id}</span>
                              <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold ${
                                  claim.claim_type === 'VERIFIED_FACT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {claim.claim_type}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold ${
                                  claim.verification_status === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {claim.verification_status}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-800 font-light">{claim.claim_text}</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
                              <div>Source: <strong className="text-slate-700">{claim.evidence_source}</strong></div>
                              <div>Evidence Reference: <strong className="text-slate-700">{claim.evidence_reference}</strong></div>
                            </div>

                            {/* Human Interaction buttons to toggle verification */}
                            <div className="pt-2 border-t border-slate-100 flex gap-2">
                              <button
                                onClick={() => handleVerifyClaim(claim.id, 'VERIFIED')}
                                className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-700 font-mono text-[9px] font-bold rounded-md cursor-pointer transition-colors"
                              >
                                ✓ Verify Factual Claim
                              </button>
                              <button
                                onClick={() => handleVerifyClaim(claim.id, 'NEEDS_VERIFICATION')}
                                className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-amber-700 font-mono text-[9px] font-bold rounded-md cursor-pointer transition-colors"
                              >
                                ? Needs Proof
                              </button>
                              <button
                                onClick={() => handleVerifyClaim(claim.id, 'UNVERIFIED')}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-700 font-mono text-[9px] font-bold rounded-md cursor-pointer transition-colors"
                              >
                                ✗ Decline Claim
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Personalized Outreach Drafts */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] uppercase text-slate-400 font-bold tracking-wider">OUTREACH DRAFTS & PERSONALIZATION</span>
                      <h4 className="font-display font-bold text-slate-900 text-base">Service-Before-Sales Copy</h4>
                    </div>

                    {/* Outreach Channel Selectors */}
                    <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 p-1 rounded-xl">
                      {[
                        { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                        { key: 'email', label: 'Email', icon: Mail },
                        { key: 'instagram', label: 'Instagram', icon: Instagram }
                      ].map(chan => {
                        const Icon = chan.icon;
                        const isChanActive = activeOutreachTab === chan.key;
                        return (
                          <button
                            key={chan.key}
                            onClick={() => {
                              setActiveOutreachTab(chan.key as any);
                              setCopied(false);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                              isChanActive 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {chan.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campaign Customizer Controls (Booking Overrides & Value Boosters) */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                    <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Active Campaign Personalization Parameters
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">Booking Campaign Tracking</label>
                        <input
                          type="text"
                          value={bookingLinkParamOverride}
                          onChange={(e) => setBookingLinkParamOverride(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-[11px] font-mono bg-white"
                          placeholder="e.g. ?src=whatsapp"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">Value-Booster Loom/Video Link</label>
                        <input
                          type="text"
                          value={valueBoosterVideoLink}
                          onChange={(e) => setValueBoosterVideoLink(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-[11px] font-mono bg-white"
                          placeholder="Loom Walkthrough Link"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono uppercase text-slate-400 font-bold mb-1">Visual Checklist / Asset Name</label>
                        <input
                          type="text"
                          value={valueBoosterDescription}
                          onChange={(e) => setValueBoosterDescription(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-[11px] font-mono bg-white"
                          placeholder="Attached Visual Diagram"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Copy Draft Panel */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                        {activeOutreachTab} Personalized Message
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingDrafts(!isEditingDrafts)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> {isEditingDrafts ? 'Done Editing' : 'Edit Draft'}
                        </button>
                        <button
                          onClick={() => {
                            const activeText = getOutreachMessageBody();
                            handleCopy(activeText);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Message
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      {isEditingDrafts ? (
                        <textarea
                          value={activeOutreachTab === 'whatsapp' ? editedWhatsapp : (activeOutreachTab === 'email' ? editedEmail : editedInstagram)}
                          onChange={(e) => {
                            if (activeOutreachTab === 'whatsapp') setEditedWhatsapp(e.target.value);
                            else if (activeOutreachTab === 'email') setEditedEmail(e.target.value);
                            else if (activeOutreachTab === 'instagram') setEditedInstagram(e.target.value);
                          }}
                          rows={6}
                          className="w-full p-4 border border-slate-300 rounded-2xl text-xs font-mono font-light leading-relaxed focus:outline-none"
                        />
                      ) : (
                        <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-light leading-relaxed whitespace-pre-wrap select-all font-mono text-slate-700">
                          {getOutreachMessageBody()}
                        </div>
                      )}
                    </div>

                    {/* Booking indicator */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between text-[11px] font-mono text-indigo-700">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Dedicated Booking CTA: <strong>{generateBookingLink()}</strong>
                      </span>
                      <a href={generateBookingLink()} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 font-bold hover:underline">
                        Test Link <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Save draft action block */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <p className="text-[10px] text-slate-400 font-light font-mono leading-normal">
                      *Initializes outreach draft, stores verification claims ledger, and triggers status guards.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleApproveQualification}
                        className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-xl cursor-pointer shadow-xs transition-colors"
                      >
                        <UserCheck className="w-4 h-4" /> Initialize & Sync Draft
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs text-xs space-y-3">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="font-display font-bold text-slate-700">No Target Selected</h4>
            <p className="text-slate-400 max-w-sm mx-auto font-light leading-relaxed">
              Select an intelligence lead from the left pane to explore opportunity scores, forensic diagnostic evidence, and initiate Closer Agent qualification workflows.
            </p>
          </div>
        )}
      </div>

      {/* MODAL 1: Follow-Up Form */}
      {showFollowUpForm && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Schedule & Log Follow-up</h3>
            <p className="text-xs text-slate-500 font-light">Choose follow-up date and note customized touches.</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Follow-up Target Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Touchpoint Notes</label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. Sent friendly Whatsapp follow-up referencing Loom audit."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowFollowUpForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogFollowUp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono rounded-xl cursor-pointer"
              >
                Log Touchpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Response Form */}
      {showResponseForm && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm">Log Prospect Response</h3>
            <p className="text-xs text-slate-500 font-light">Record direct replies received over WhatsApp, email, or DMs.</p>
            
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Prospect Response Message</label>
              <textarea
                value={prospectResponse}
                onChange={(e) => setProspectResponse(e.target.value)}
                rows={4}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                placeholder="Paste the reply received from the prospect..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => setShowResponseForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogResponse}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono rounded-xl cursor-pointer"
              >
                Save Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Client Conversion Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl my-8 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-bold text-slate-900 text-base">Manual Client Conversion Hub</h3>
            </div>
            
            <p className="text-xs text-slate-500 font-light leading-relaxed">
              You are manually promoting this qualified prospect to an Active Client. In strict alignment with the <strong>SamuelOS Constitution</strong>, this does NOT automate project creations, invents zero revenues, and schedules no automated billing triggers. All deliverables remain strictly authorized by human operations.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Client Business Name</label>
                <input
                  type="text"
                  value={convertClientName}
                  onChange={(e) => setConvertClientName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono"
                  placeholder="e.g. Apex Dental Clinic"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Primary Email Contact</label>
                  <input
                    type="email"
                    value={convertEmail}
                    onChange={(e) => setConvertEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono"
                    placeholder="e.g. hello@business.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Primary Phone Contact</label>
                  <input
                    type="text"
                    value={convertPhone}
                    onChange={(e) => setConvertPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 font-mono"
                    placeholder="e.g. +234 812..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Conversion Authorization Notes</label>
                <textarea
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-xs font-light"
                  placeholder="Add manual conversion notes, meeting summary, contract codes, etc."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 text-xs">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
                disabled={isSubmittingConversion}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConversion}
                disabled={isSubmittingConversion}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono rounded-xl cursor-pointer flex items-center gap-1.5 font-bold"
              >
                {isSubmittingConversion ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing Conversion...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Manual Convert to Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
