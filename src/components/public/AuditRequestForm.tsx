import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Audit } from '../../types';
import { 
  Shield, Sparkles, Send, Loader2, CheckCircle2, ArrowRight, RefreshCw, 
  AlertCircle, FileText, Check, Mail, MessageSquare, Phone, Globe, HelpCircle 
} from 'lucide-react';

export default function AuditRequestForm() {
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mainGoal, setMainGoal] = useState('Improve Conversion & Patient Booking');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [auditResult, setAuditResult] = useState<Audit | null>(null);
  const [error, setError] = useState('');

  // Lead-generation states for requesting consultation/deeper audit
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [preferredChannel, setPreferredChannel] = useState('Email');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submittingConsultation, setSubmittingConsultation] = useState(false);
  const [consultationSubmitted, setConsultationSubmitted] = useState(false);
  const [consultationError, setConsultationError] = useState('');

  const loadingSteps = [
    'Registering secure lead record on SamuelOS...',
    'Analyzing Google Maps citations and business registry data...',
    'Performing mobile-compliance & page speed diagnostics...',
    'Triggering Gemini LLM custom audit generation engine...',
    'Compiling strengths, vulnerability indexes, and priority recommendations...',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !email || !industry || !location) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    setError('');
    setLoading(true);
    setAuditResult(null);
    setProspectId(null);
    setConsultationSubmitted(false);
    setAdditionalNotes('');
    setConsultationError('');

    // Dynamic interval to update loading steps
    let step = 0;
    setLoadingStep(0);
    const interval = setInterval(() => {
      if (step < loadingSteps.length - 1) {
        step++;
        setLoadingStep(step);
      }
    }, 3000);

    try {
      const response = await api.generateAudit({
        businessName,
        websiteUrl,
        industry,
        location,
        email,
        phone,
        mainGoal,
        isPublicLead: true,
      });

      if (response.success && response.audit) {
        setAuditResult(response.audit);
        setProspectId(response.prospectId);
      } else {
        throw new Error('Audit compilation failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during the audit generation. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAuditResult(null);
    setProspectId(null);
    setBusinessName('');
    setWebsiteUrl('');
    setIndustry('');
    setLocation('');
    setEmail('');
    setPhone('');
    setMainGoal('Improve Conversion & Patient Booking');
    setPreferredChannel('Email');
    setAdditionalNotes('');
    setConsultationSubmitted(false);
    setConsultationError('');
  };

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectId) return;

    setSubmittingConsultation(true);
    setConsultationError('');
    try {
      const res = await api.requestConsultation(prospectId, {
        preferredContactChannel: preferredChannel,
        additionalNotes
      });
      if (res.success) {
        setConsultationSubmitted(true);
      } else {
        throw new Error(res.message || 'Failed to submit consultation request.');
      }
    } catch (err: any) {
      setConsultationError(err.message || 'An error occurred while submitting your request.');
    } finally {
      setSubmittingConsultation(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-500 border-amber-500 bg-amber-500/10';
    return 'text-rose-500 border-rose-500 bg-rose-500/10';
  };

  const getClassification = (score: number, hasUrl: boolean) => {
    if (!hasUrl) {
      return {
        code: 'NO_WEBSITE',
        label: 'NO WEBSITE DETECTED',
        desc: 'No dedicated domain matches this brand. The business is fully dependent on directories, risking discoverability leakage.',
        severity: 'Critical Opportunity Gap'
      };
    }
    if (score >= 85) {
      return {
        code: 'WEBSITE_STRONG',
        label: 'WEBSITE STRONG',
        desc: 'Custom domain is secure, fast, and structured properly. Core optimization involves micro-copy adjustments and automated CRM funnel bridges.',
        severity: 'Optimized Level'
      };
    }
    if (score < 50) {
      return {
        code: 'WEBSITE_WEAK',
        label: 'WEBSITE WEAK',
        desc: 'Active domain resolves but features multiple layout, asset speed, or structural validation failures that impair credibility.',
        severity: 'Urgent Redesign Recommended'
      };
    }
    if (score < 65) {
      return {
        code: 'WEBSITE_POOR_MOBILE',
        label: 'WEBSITE POOR MOBILE experience',
        desc: 'The page displays properly on large displays but breaks or exhibits severe scroll constraints on smaller viewport displays.',
        severity: 'High Mobile Drop-off Warning'
      };
    }
    return {
      code: 'WEBSITE_LOW_CONVERSION',
      label: 'WEBSITE LOW CONVERSION DESIGN',
      desc: 'Site is beautiful but lacks clear booking triggers, dynamic forms, or click-to-chat widgets, resulting in unmonetized traffic.',
      severity: 'Strategic Revenue Opportunity'
    };
  };

  return (
    <section id="audit-lead-section" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-left">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 border border-blue-100 text-xs font-mono font-bold text-blue-600">
            <Sparkles className="w-3 h-3 text-blue-500" />
            FREE DIAGNOSTIC ACCESS
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Request an Active Digital Presence Audit
          </h3>
          <p className="text-slate-500 font-light text-base leading-relaxed">
            Submit your core business particulars below. Our backend diagnostic process leverages Gemini AI models to analyze conversion leaks, discoverability parameters, and mobile performance.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-semibold font-display">System Error</p>
              <p className="font-light mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* LOADING STATE VIEW */}
        {loading && (
          <div className="max-w-2xl mx-auto border border-slate-200 bg-slate-50/50 backdrop-blur rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-sm">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
              <Shield className="w-6 h-6 text-blue-600 absolute animate-pulse-slow" />
            </div>

            <div className="space-y-3">
              <h4 className="font-display text-xl font-bold text-slate-900">Conducting Forensic Audit</h4>
              <p className="text-slate-500 text-sm font-light max-w-md mx-auto h-12 flex items-center justify-center leading-relaxed">
                {loadingSteps[loadingStep]}
              </p>
            </div>

            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000" 
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
            
            <p className="font-mono text-[10px] text-slate-400">
              PLEASE KEEP THIS TAB OPEN — PROCESS TAKES ROUGHLY 5-15 SECONDS.
            </p>
          </div>
        )}

        {/* INPUT FORM VIEW */}
        {!loading && !auditResult && (
          <form 
            onSubmit={handleSubmit} 
            className="max-w-2xl mx-auto border border-slate-200 bg-slate-50/20 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 animate-fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Business Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Apex Dental Partners"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Website URL (Optional)
                </label>
                <input 
                  type="url" 
                  placeholder="e.g. https://mybusiness.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Industry / Category *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Healthcare, Law, Construction"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Location (City, State) *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Houston, TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. owner@apexdental.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  WhatsApp / Phone (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. +1-555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Primary Business Goal / Bottleneck
              </label>
              <textarea 
                rows={3}
                placeholder="Describe your current biggest operational block or objective..."
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>100% Secure. SamuelOS RLS active. No spam.</span>
              </div>
              <button 
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Launch Forensic Diagnostic
                <Send className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>
          </form>
        )}        {/* COMPLETED AUDIT RESULT VIEW */}
        {!loading && auditResult && (() => {
          const classification = getClassification(auditResult.overallScore, !!websiteUrl);
          return (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
              
              {/* Visual Congratulations Banner */}
              <div className="border border-blue-100 bg-blue-50/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-blue-600 font-mono text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    PRELIMINARY DIAGNOSIS COMPLETED
                  </div>
                  <h4 className="font-display text-2xl font-bold text-slate-900">
                    {businessName} Assessment Report
                  </h4>
                  <p className="text-slate-500 text-sm font-light">
                    Compiled for {email} on {auditResult.createdAt}.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">DIAGNOSTIC SCORE</span>
                    <div className={`mt-1 inline-flex items-center justify-center w-16 h-16 rounded-full border-4 font-display font-bold text-xl ${getScoreColor(auditResult.overallScore)}`}>
                      {auditResult.overallScore}%
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                    title="Run Another Audit"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Business Classification Card */}
              <div className="border border-slate-200 bg-white rounded-2xl p-6 text-left grid grid-cols-1 sm:grid-cols-12 gap-6 items-center shadow-xs">
                <div className="sm:col-span-4 space-y-1">
                  <span className="font-mono text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest inline-block">
                    {classification.severity}
                  </span>
                  <p className="font-mono text-xs text-slate-400 uppercase tracking-wider block pt-2">V1 Classification Code</p>
                  <h5 className="font-display font-black text-lg text-slate-900">{classification.code}</h5>
                </div>
                <div className="sm:col-span-8 space-y-1.5 border-l border-slate-100 sm:pl-6">
                  <p className="font-display font-bold text-slate-800 text-sm">{classification.label}</p>
                  <p className="text-slate-600 text-xs font-light leading-relaxed">
                    {classification.desc}
                  </p>
                </div>
              </div>

              {/* Strengths & Vulnerabilities bento row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-6 space-y-4 text-left">
                  <span className="font-mono text-xs font-bold text-emerald-600 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Observed System Strengths
                  </span>
                  <ul className="space-y-2.5">
                    {auditResult.strengths.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-700 text-xs font-light leading-relaxed">
                        <span className="text-emerald-500 font-bold mt-0.5">✔</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-rose-100 bg-rose-50/20 rounded-2xl p-6 space-y-4 text-left">
                  <span className="font-mono text-xs font-bold text-rose-600 tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Critical Digital Gaps / Opportunities
                  </span>
                  <ul className="space-y-2.5">
                    {auditResult.gaps.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-700 text-xs font-light leading-relaxed">
                        <span className="text-rose-500 font-bold mt-0.5">✘</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strategic Conclusion Panel */}
              <div className="border border-slate-200 bg-slate-950 text-white rounded-3xl p-8 text-left space-y-6">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-blue-400 tracking-widest uppercase">PRIMARY LEAK ANALYSIS</span>
                  <h5 className="font-display text-xl font-bold">The Core Missed Opportunity</h5>
                  <p className="text-slate-400 text-sm font-light mt-1 leading-relaxed">
                    {auditResult.missedOpportunity}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 space-y-1">
                  <span className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase font-bold">RECOMMENDED PATHWAY</span>
                  <h5 className="font-display text-lg font-bold text-white">Strategic Resolution Recommendation</h5>
                  <p className="text-slate-300 text-xs font-light mt-1 leading-relaxed">
                    {auditResult.recommendedSolution}
                  </p>
                </div>
              </div>

              {/* INBOUND LEAD GENERATION CARD */}
              <div id="deeper-consultation-section" className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] text-indigo-600 font-bold uppercase tracking-widest block">EXPERT HUMAN STRATEGY RESOLUTION</span>
                    <h4 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Request a Deeper Manual Audit & 1-on-1 Consultation</h4>
                    <p className="text-slate-600 text-sm font-light leading-relaxed max-w-2xl">
                      Our automated diagnostic runs foundational scans. For a complete manual review of your systems, local competitive index, and custom design deployment, request a complimentary forensic analysis with <strong>Samuel Oluwadamilare</strong> (Founder of Accessmart Solutions).
                    </p>
                  </div>
                </div>

                {consultationSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center text-center space-y-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-5 h-5 stroke-[3px]" />
                    </div>
                    <h5 className="font-display font-bold text-slate-900 text-base">Resolution Session Requested!</h5>
                    <p className="text-slate-600 text-xs font-light max-w-md">
                      Thank you! Samuel Oluwadamilare has been notified of your request for <strong>{businessName}</strong>. Your pipeline ticket is active, and we will contact you via your preferred channel (<strong>{preferredChannel}</strong>) within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleConsultationSubmit} className="space-y-4 pt-2 border-t border-slate-200/60">
                    {consultationError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>{consultationError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2 col-span-1">
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                          Preferred Contact Method *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'Email', icon: Mail, label: 'Email' },
                            { key: 'WhatsApp', icon: MessageSquare, label: 'WhatsApp' },
                            { key: 'Phone Call', icon: Phone, label: 'Phone' },
                            { key: 'Google Meet', icon: Globe, label: 'Meet Session' }
                          ].map((item) => {
                            const Icon = item.icon;
                            const isSelected = preferredChannel === item.key;
                            return (
                              <button
                                type="button"
                                key={item.key}
                                onClick={() => setPreferredChannel(item.key)}
                                className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl font-mono text-[11px] transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 col-span-1">
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                          Primary Bottleneck / Specific Requirements (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g., We need to automate patient bookings directly from our Instagram bio link..."
                          value={additionalNotes}
                          onChange={(e) => setAdditionalNotes(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200/40">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Inbound routing active. This links to SamuelOS CRM.</span>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingConsultation}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md font-bold"
                      >
                        {submittingConsultation ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Scheduling Request...
                          </>
                        ) : (
                          <>
                            Request 1-on-1 Strategy Session
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Individual Dimensions Grid */}
              <div className="space-y-6 text-left">
                <h5 className="font-display text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">
                  Structural Dimension Diagnostics
                </h5>

                <div className="grid grid-cols-1 gap-6">
                  {[
                    { name: 'Discoverability', obj: auditResult.discoverability },
                    { name: 'Credibility', obj: auditResult.credibility },
                    { name: 'Digital Presence', obj: auditResult.digitalPresence },
                    { name: 'Conversion Design', obj: auditResult.conversion },
                    { name: 'Contact Accessibility', obj: auditResult.contact },
                    { name: 'Booking Workflows', obj: auditResult.booking },
                    { name: 'Google visibility', obj: auditResult.googleVisibility },
                    { name: 'Mobile compliance', obj: auditResult.mobile },
                    { name: 'Social Bridge', obj: auditResult.socialJourney },
                    { name: 'Nurture & Follow-Up', obj: auditResult.followUp },
                  ].map((dim, index) => (
                    <div key={index} className="border border-slate-200 rounded-xl p-5 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-3">
                        <p className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">DIMENSION 0{index + 1}</p>
                        <p className="font-display font-bold text-sm text-slate-900 mt-1">{dim.name}</p>
                        <div className={`mt-2 inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getScoreColor(dim.obj.score)}`}>
                          {dim.obj.score}/100
                        </div>
                      </div>
                      
                      <div className="sm:col-span-9 space-y-2 text-xs">
                        <div>
                          <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block">Observation:</span>
                          <p className="text-slate-700 font-light leading-relaxed mt-0.5">{dim.obj.observation}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block">Evidence/Source:</span>
                            <p className="text-slate-600 font-mono text-[10px] leading-relaxed mt-0.5">{dim.obj.evidence}</p>
                          </div>
                          <div>
                            <span className="font-mono text-[9px] text-blue-500 uppercase tracking-wider block font-bold">Recommendation:</span>
                            <p className="text-slate-700 font-light leading-relaxed mt-0.5">{dim.obj.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Concluding CTA reset / rerun */}
              <div className="border border-slate-200 bg-slate-50 rounded-3xl p-8 text-center space-y-4">
                <h5 className="font-display text-base font-bold text-slate-900">Need to run a diagnostic on another brand?</h5>
                <p className="text-slate-500 text-xs font-light max-w-md mx-auto leading-relaxed">
                  You can perform multiple preliminary audits for different domains under Accessmart Solutions parameters.
                </p>
                <div>
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Rerun Digital Diagnostic
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })()}

      </div>
    </section>
  );
}
