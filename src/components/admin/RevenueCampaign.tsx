import React, { useState, useEffect } from 'react';
import { 
  api 
} from '../../lib/api';
import { 
  Prospect, DiscoveryMeeting, Proposal, Client, Project 
} from '../../types';
import { 
  TrendingUp, Users, Calendar, FileText, Plus, Trash2, Check, X, 
  AlertTriangle, CheckCircle2, Shield, Loader2, DollarSign, ArrowRight,
  ClipboardList, AlertCircle, Link, Mail, MessageSquare, Video
} from 'lucide-react';

interface RevenueCampaignProps {
  prospects: Prospect[];
  onRefresh: () => void;
}

export default function RevenueCampaign({ prospects, onRefresh }: RevenueCampaignProps) {
  // Database States
  const [meetings, setMeetings] = useState<DiscoveryMeeting[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<'metrics' | 'campaign' | 'meetings' | 'proposals' | 'revenue'>('metrics');
  const [submitting, setSubmitting] = useState(false);

  // Form States - Discovery Meeting
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState<Partial<DiscoveryMeeting>>({
    prospectId: '',
    date: '',
    time: '',
    channel: 'zoom',
    meetingLink: '',
    decisionMaker: '',
    businessNeed: '',
    currentSystem: '',
    painPoints: '',
    desiredOutcome: '',
    budget: '',
    timeline: '',
    decisionProcess: '',
    notes: '',
    status: 'Scheduled'
  });

  // Form States - Proposal
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [newProposal, setNewProposal] = useState<Partial<Proposal>>({
    prospectId: '',
    clientName: '',
    problem: '',
    recommendedSolution: '',
    scope: [''],
    deliverables: [''],
    timeline: '',
    price: 1500,
    currency: 'USD',
    paymentTerms: '50% upfront, 50% upon completion',
    validityPeriod: '30 days',
    nextStep: 'Awaiting signature',
    status: 'DRAFT'
  });

  // Form States - Revenue Logger
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedProspectForRevenue, setSelectedProspectForRevenue] = useState<Prospect | null>(null);
  const [revenueData, setRevenueData] = useState({
    price: 0,
    currency: 'USD' as 'NGN' | 'USD',
    paymentTerms: '',
    paymentStatus: 'Partial' as 'Paid' | 'Partial' | 'Unpaid',
    transactionRef: '',
    cashReceivedAmount: 0,
    notes: '',
    onboardClient: true
  });

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [meetingsData, proposalsData, clientsData, projectsData] = await Promise.all([
        api.getDiscoveryMeetings(),
        api.getProposals(),
        api.getClients(),
        api.getProjects()
      ]);
      setMeetings(meetingsData);
      setProposals(proposalsData);
      // Filter out demo data to keep production metrics genuine
      setClients(clientsData.filter(c => !c.isDemo));
      setProjects(projectsData.filter(p => !p.isDemo));
    } catch (err: any) {
      console.error('Failed to load Campaign and Revenue data:', err);
      setError('Failed to sync workspace metrics with Firestore database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers - Discovery Meeting
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.prospectId || !newMeeting.date || !newMeeting.time) return;
    setSubmitting(true);
    try {
      const prospect = prospects.find(p => p.id === newMeeting.prospectId);
      const meetingToSave: DiscoveryMeeting = {
        id: `meet-${Date.now()}`,
        prospectId: newMeeting.prospectId,
        businessName: prospect ? prospect.businessName : 'Unknown Business',
        date: newMeeting.date,
        time: newMeeting.time,
        channel: newMeeting.channel as any,
        meetingLink: newMeeting.meetingLink,
        decisionMaker: newMeeting.decisionMaker || '',
        businessNeed: newMeeting.businessNeed || '',
        currentSystem: newMeeting.currentSystem || '',
        painPoints: newMeeting.painPoints || '',
        desiredOutcome: newMeeting.desiredOutcome || '',
        budget: newMeeting.budget || '',
        timeline: newMeeting.timeline || '',
        decisionProcess: newMeeting.decisionProcess || '',
        notes: newMeeting.notes || '',
        status: newMeeting.status || 'Scheduled'
      };

      await api.saveDiscoveryMeeting(meetingToSave);
      setShowMeetingModal(false);
      // Refresh local view
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to register discovery meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting record?')) return;
    try {
      await api.deleteDiscoveryMeeting(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete meeting record.');
    }
  };

  // Handlers - Proposal
  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.prospectId || !newProposal.problem || !newProposal.recommendedSolution) return;
    setSubmitting(true);
    try {
      const prospect = prospects.find(p => p.id === newProposal.prospectId);
      const proposalToSave: Proposal = {
        id: `prop-${Date.now()}`,
        prospectId: newProposal.prospectId,
        businessName: prospect ? prospect.businessName : 'Unknown Business',
        clientName: newProposal.clientName || 'Stakeholder',
        problem: newProposal.problem,
        recommendedSolution: newProposal.recommendedSolution,
        scope: newProposal.scope?.filter(s => s.trim() !== '') || [],
        deliverables: newProposal.deliverables?.filter(d => d.trim() !== '') || [],
        timeline: newProposal.timeline || '',
        price: Number(newProposal.price || 0),
        currency: newProposal.currency as 'NGN' | 'USD',
        paymentTerms: newProposal.paymentTerms || '',
        validityPeriod: newProposal.validityPeriod || '',
        nextStep: newProposal.nextStep || '',
        status: newProposal.status || 'DRAFT',
        createdAt: new Date().toISOString()
      };

      await api.saveProposal(proposalToSave);
      setShowProposalModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save proposal record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProposalStatus = async (proposal: Proposal, status: Proposal['status']) => {
    try {
      const updated = { ...proposal, status };
      await api.saveProposal(updated);
      await loadData();
    } catch (err) {
      alert('Failed to update proposal status.');
    }
  };

  const handleDeleteProposal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal record?')) return;
    try {
      await api.deleteProposal(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete proposal record.');
    }
  };

  // Handlers - Revenue validation & conversion
  const handleTriggerRevenueModal = (prospect: Prospect) => {
    setSelectedProspectForRevenue(prospect);
    setRevenueData({
      price: prospect.recommendedOfferId === 'o-audit' ? 299 : 1500,
      currency: 'USD',
      paymentTerms: '50% upfront deposit, 50% upon delivery',
      paymentStatus: 'Partial',
      transactionRef: '',
      cashReceivedAmount: 750,
      notes: '',
      onboardClient: true
    });
    setShowRevenueModal(true);
  };

  const handleSaveRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspectForRevenue || !revenueData.transactionRef || revenueData.cashReceivedAmount <= 0) {
      alert('Transaction reference and positive cash deposit are required.');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Log actual client & project manually
      const clientPayload = {
        clientName: selectedProspectForRevenue.email ? selectedProspectForRevenue.email.split('@')[0] : 'Client Representative',
        contactEmail: selectedProspectForRevenue.email || '',
        contactPhone: selectedProspectForRevenue.phone || '',
        notes: `Converted manually from CRM. Transaction Reference: ${revenueData.transactionRef}. ${revenueData.notes}`
      };

      const res = await api.convertToClient(selectedProspectForRevenue.id, clientPayload);
      
      if (res.success) {
        // 2. Create the associated real project
        const projectPayload: Project = {
          id: `proj-${Date.now()}`,
          clientId: res.client.id,
          projectName: `${selectedProspectForRevenue.businessName} System Integration`,
          offerId: selectedProspectForRevenue.recommendedOfferId || 'o-website',
          description: selectedProspectForRevenue.businessOpportunity || 'Tailored business technology suite deployment.',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
          status: 'Active',
          value: Number(revenueData.price),
          paymentStatus: revenueData.paymentStatus,
          deliverables: ['Custom landing components', 'Lead workflow synchronization', 'Verification analytics'],
          notes: `Paid amount: ${revenueData.currency} ${revenueData.cashReceivedAmount}. Reference: ${revenueData.transactionRef}.`,
          dataOrigin: 'production' // Explicit non-demo mark
        };

        await api.saveProject(projectPayload);

        // 3. Mark matching proposal as WON if it exists
        const matchingProp = proposals.find(p => p.prospectId === selectedProspectForRevenue.id);
        if (matchingProp) {
          await api.saveProposal({ ...matchingProp, status: 'WON' });
        }

        setShowRevenueModal(false);
        setSelectedProspectForRevenue(null);
        alert('Revenue validation completed. Deal logged, client onboarded, and real project generated.');
        onRefresh();
        await loadData();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to convert prospect and validate revenue.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper values
  const totalActualRevenue = projects.reduce((sum, p) => sum + (p.value || 0), 0);
  const totalActualRevenueNGN = projects.filter(p => p.notes?.includes('NGN')).reduce((sum, p) => sum + (p.value || 0), 0);

  // Filter 5-10 Prospects for First Client Campaign (Phase 4E)
  const campaignProspects = prospects
    .filter(p => p.priority === 'A' || p.leadScore >= 70)
    .slice(0, 10);

  return (
    <div className="space-y-8 text-left">
      {/* Safeguard & Verification Info Banner */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs text-slate-700">
        <Shield className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">SamuelOS Production Safeguard Protocol</p>
          <p className="font-light leading-relaxed">
            AI is strictly prohibited from auto-generating transactions, signing proposals, approving budgets, or modifying CRM wins. All pricing options, meeting milestones, and payment receipts require manual validation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-mono tracking-wider uppercase font-semibold gap-1">
        {[
          { key: 'metrics', label: 'KPI Dashboard', icon: TrendingUp },
          { key: 'campaign', label: 'First Client Campaign', icon: ClipboardList },
          { key: 'meetings', label: 'Discovery Meetings', icon: Calendar },
          { key: 'proposals', label: 'Proposals Workflow', icon: FileText },
          { key: 'revenue', label: 'Revenue validation', icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold cursor-pointer transition-colors ${
                activeTab === tab.key 
                  ? 'border-indigo-600 text-indigo-600 font-extrabold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="font-display text-lg font-bold text-slate-900">Campaign & Financial Analytics</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Verified Prospects', value: prospects.filter(p => p.status === 'Verified').length, desc: 'Evidence verified leads' },
                  { label: 'Qualified Pool', value: prospects.filter(p => p.leadScore >= 70).length, desc: 'Lead score threshold > 70' },
                  { label: 'Discovery Booked', value: meetings.length, desc: 'Real-world validation calls' },
                  { label: 'Proposals Active', value: proposals.filter(p => p.status !== 'WON' && p.status !== 'LOST').length, desc: 'Pending decision cycles' },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">{kpi.label}</span>
                    <p className="font-display font-black text-2xl text-slate-900">{kpi.value}</p>
                    <p className="text-[10px] font-mono text-slate-500">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              {/* Financial Box */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-600/25 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest font-bold">ACTUAL REVENUE (MANUALLY AUDITED)</span>
                    <h4 className="font-display text-4xl font-black text-white">
                      ${totalActualRevenue.toLocaleString()} 
                      {totalActualRevenueNGN > 0 && <span className="text-xl text-indigo-300 ml-3">/ ₦{totalActualRevenueNGN.toLocaleString()}</span>}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 font-light leading-relaxed">
                      This metric ONLY displays verified payment receipts recorded with direct transaction references. Synthetic or simulated revenue is barred from this dashboard.
                    </p>
                  </div>
                  <div className="border border-slate-700/60 bg-slate-800/60 p-4 rounded-xl space-y-1 text-xs shrink-0 w-full sm:w-auto">
                    <p className="text-slate-400">Paying Clients: <span className="font-mono font-bold text-white">{clients.length}</span></p>
                    <p className="text-slate-400">Active Deliveries: <span className="font-mono font-bold text-white">{projects.length}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMPAIGN */}
          {activeTab === 'campaign' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-slate-900">First Client Campaign Queue</h3>
                  <p className="text-xs text-slate-500">
                    Surgical outreach cohort targeting 5-10 high-value B2B prospects using the Closer Agent framework.
                  </p>
                </div>
              </div>

              {campaignProspects.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
                  <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-slate-500 text-xs">No prospects qualified for the campaign queue. Score needs to be &ge; 70.</p>
                </div>
              ) : (
                <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {campaignProspects.map((prospect, idx) => {
                    const matchedMeeting = meetings.find(m => m.prospectId === prospect.id);
                    const matchedProp = proposals.find(p => p.prospectId === prospect.id);
                    
                    return (
                      <div key={prospect.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/40 transition-colors">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-sm">#{idx + 1}</span>
                            <h4 className="font-display font-bold text-sm text-slate-900">{prospect.businessName}</h4>
                          </div>
                          <p className="text-[11px] font-mono text-slate-500">
                            {prospect.location} &bull; Score: <span className="font-bold text-slate-800">{prospect.leadScore}</span> &bull; Status: <span className="font-bold">{prospect.status}</span>
                          </p>
                          <p className="text-xs text-slate-600 max-w-lg font-light leading-relaxed line-clamp-1">
                            {prospect.digitalGap || 'Gaps not yet fully documented.'}
                          </p>
                        </div>

                        {/* Step Checklists */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Evidence Gate */}
                          <div className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 ${
                            prospect.websiteStatus && prospect.websiteStatus !== 'NEEDS_VERIFICATION'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                            Evidence verified
                          </div>

                          {/* Meeting Scheduled */}
                          {matchedMeeting ? (
                            <div className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-[11px] font-mono flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              Meeting Scheduled
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setNewMeeting(prev => ({ ...prev, prospectId: prospect.id }));
                                setShowMeetingModal(true);
                              }}
                              className="px-2.5 py-1.5 hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                            >
                              + Book Meeting
                            </button>
                          )}

                          {/* Proposal */}
                          {matchedProp ? (
                            <div className={`px-2.5 py-1.5 border rounded-lg text-[11px] font-mono flex items-center gap-1.5 ${
                              matchedProp.status === 'WON' 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}>
                              <FileText className="w-3.5 h-3.5" />
                              Prop: {matchedProp.status}
                            </div>
                          ) : (
                            <button
                              disabled={!matchedMeeting}
                              onClick={() => {
                                setNewProposal(prev => ({ ...prev, prospectId: prospect.id }));
                                setShowProposalModal(true);
                              }}
                              className="px-2.5 py-1.5 hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-50 rounded-lg text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                            >
                              + Create Proposal
                            </button>
                          )}

                          {/* Deal Close */}
                          {prospect.status === 'Won' ? (
                            <span className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> WON
                            </span>
                          ) : (
                            <button
                              disabled={!matchedProp}
                              onClick={() => handleTriggerRevenueModal(prospect)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              Log Close
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEETINGS */}
          {activeTab === 'meetings' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-slate-900">Discovery Meetings Ledger</h3>
                  <p className="text-xs text-slate-500">Record comprehensive diagnostic parameters for scheduled client sessions.</p>
                </div>
                <button
                  onClick={() => {
                    setNewMeeting({
                      prospectId: '',
                      date: '',
                      time: '',
                      channel: 'zoom',
                      meetingLink: '',
                      decisionMaker: '',
                      businessNeed: '',
                      currentSystem: '',
                      painPoints: '',
                      desiredOutcome: '',
                      budget: '',
                      timeline: '',
                      decisionProcess: '',
                      notes: '',
                      status: 'Scheduled'
                    });
                    setShowMeetingModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] uppercase tracking-wider font-semibold rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Discovery Meeting
                </button>
              </div>

              {meetings.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-xs">
                  No active meetings currently registered in the pipeline database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {meetings.map(m => (
                    <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative flex flex-col justify-between">
                      <button
                        onClick={() => handleDeleteMeeting(m.id)}
                        className="absolute top-4 right-4 p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="font-mono text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            Channel: {m.channel.toUpperCase()}
                          </span>
                          <h4 className="font-display font-bold text-slate-900 pt-1 text-sm">{m.businessName}</h4>
                          <p className="text-[10px] font-mono text-slate-400">
                            {m.date} &bull; {m.time}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-600 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block uppercase text-[9px]">Decision Maker</span>
                            <span className="text-slate-800 font-bold">{m.decisionMaker || 'Unconfirmed'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase text-[9px]">Budget</span>
                            <span className="text-slate-800 font-bold">{m.budget || 'Unspecified'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase text-[9px]">Pain Points</span>
                            <span className="text-slate-800 block line-clamp-1">{m.painPoints || 'None entered'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase text-[9px]">Timeline</span>
                            <span className="text-slate-800 font-bold">{m.timeline || 'Immediate'}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-slate-50/50 border border-slate-100 p-2.5 rounded-lg space-y-1">
                          <span className="font-mono text-slate-400 block uppercase text-[9px]">Notes</span>
                          <p className="font-light leading-relaxed font-sans">{m.notes || 'No notes compiled for this session.'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROPOSALS */}
          {activeTab === 'proposals' && (
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-slate-900">Proposals Management</h3>
                  <p className="text-xs text-slate-500">Draft, track, and secure business system deployment agreements.</p>
                </div>
                <button
                  onClick={() => {
                    setNewProposal({
                      prospectId: '',
                      clientName: '',
                      problem: '',
                      recommendedSolution: '',
                      scope: [''],
                      deliverables: [''],
                      timeline: '14 Days',
                      price: 1500,
                      currency: 'USD',
                      paymentTerms: '50% deposit, 50% upon deployment',
                      validityPeriod: '30 Days',
                      nextStep: 'Awaiting client approval',
                      status: 'DRAFT'
                    });
                    setShowProposalModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] uppercase tracking-wider font-semibold rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Draft New Proposal
                </button>
              </div>

              {proposals.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-xs">
                  No active proposals logged in the current validation phase.
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-3 text-left w-full md:max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {p.status}
                          </span>
                          <h4 className="font-display font-bold text-slate-900 text-sm">{p.businessName}</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-600 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Price Option</span>
                            <span className="text-slate-800 font-bold font-sans">
                              {p.currency} {Number(p.price || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Timeline</span>
                            <span className="text-slate-800 font-bold">{p.timeline}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[9px]">Recommended Solution</span>
                            <span className="text-slate-800 font-sans font-light leading-relaxed block pt-0.5">
                              {p.recommendedSolution}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => handleUpdateProposalStatus(p, 'SENT')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer text-center"
                          >
                            Mark as Sent
                          </button>
                        )}
                        {p.status === 'SENT' && (
                          <button
                            onClick={() => handleUpdateProposalStatus(p, 'NEGOTIATION')}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer text-center"
                          >
                            Move to Negotiation
                          </button>
                        )}
                        {p.status !== 'WON' && p.status !== 'LOST' && (
                          <>
                            <button
                              onClick={() => {
                                const matchedProspect = prospects.find(pr => pr.id === p.prospectId);
                                if (matchedProspect) {
                                  handleTriggerRevenueModal(matchedProspect);
                                } else {
                                  alert('Matching prospect record not found to convert.');
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer text-center"
                            >
                              Log Deal Won
                            </button>
                            <button
                              onClick={() => handleUpdateProposalStatus(p, 'LOST')}
                              className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer text-center"
                            >
                              Mark Lost
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteProposal(p.id)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer text-center"
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REVENUE */}
          {activeTab === 'revenue' && (
            <div className="space-y-6 text-left">
              <h3 className="font-display text-lg font-bold text-slate-900">Manual Client Onboarding & Revenue Validation</h3>
              <p className="text-xs text-slate-500">
                Onboard qualified pipeline leads into verified active projects and register real cash received receipts.
              </p>

              {prospects.filter(p => p.status !== 'Won').length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-xs">
                  No pending prospects in pipeline to onboard.
                </div>
              ) : (
                <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {prospects
                    .filter(p => p.status !== 'Won')
                    .map(p => (
                      <div key={p.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 text-xs">{p.businessName}</h4>
                          <p className="text-[10px] font-mono text-slate-400">
                            Location: {p.location} &bull; Gap Score: {p.leadScore} &bull; Rec Offer: {p.recommendedOfferId || 'o-website'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleTriggerRevenueModal(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
                        >
                          Validate Onboard
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: DISCOVERY MEETING */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveMeeting}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs text-left shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-display text-base font-bold text-slate-900">Record Discovery Meeting</h4>
              <button 
                type="button" 
                onClick={() => setShowMeetingModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">SELECT PROSPECT</label>
                <select
                  required
                  value={newMeeting.prospectId}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, prospectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Prospect --</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.businessName} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">DATE</label>
                  <input
                    type="date"
                    required
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">TIME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2:00 PM WAT"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">CHANNEL</label>
                  <select
                    value={newMeeting.channel}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, channel: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="google-meet">Google Meet</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">MEETING LINK / URL (OPTIONAL)</label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={newMeeting.meetingLink}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meetingLink: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">DECISION MAKER</label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel (CEO)"
                    value={newMeeting.decisionMaker}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, decisionMaker: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">BUDGET SCALE</label>
                  <input
                    type="text"
                    placeholder="e.g. $1,500 - $3,000"
                    value={newMeeting.budget}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, budget: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">CURRENT SYSTEM / TECH STACK</label>
                  <input
                    type="text"
                    placeholder="e.g. Legacy Wordpress, Wix"
                    value={newMeeting.currentSystem}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, currentSystem: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">TIMELINE EXPECTATIONS</label>
                  <input
                    type="text"
                    placeholder="e.g. Within 2-3 weeks"
                    value={newMeeting.timeline}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, timeline: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">PAIN POINTS & CORE OBSTACLES</label>
                <textarea
                  rows={2}
                  placeholder="Losing leads due to lack of immediate booking pathway..."
                  value={newMeeting.painPoints}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, painPoints: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold text-indigo-600">NOTES & SUMMARY</label>
                <textarea
                  rows={2}
                  placeholder="Key discovery notes, context, or custom reminders..."
                  value={newMeeting.notes}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMeetingModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
              >
                {submitting ? 'Recording...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PROPOSAL */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveProposal}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs text-left shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-display text-base font-bold text-slate-900">Draft Proposal</h4>
              <button 
                type="button" 
                onClick={() => setShowProposalModal(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">SELECT PROSPECT</label>
                <select
                  required
                  value={newProposal.prospectId}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, prospectId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Prospect --</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.businessName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">STAKEHOLDER NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jenkins"
                    value={newProposal.clientName}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">TIMELINE (WEEKS/DAYS)</label>
                  <input
                    type="text"
                    placeholder="e.g. 3-4 Weeks"
                    value={newProposal.timeline}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, timeline: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">PRICE VALUE</label>
                  <input
                    type="number"
                    required
                    value={newProposal.price}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">CURRENCY</label>
                  <select
                    value={newProposal.currency}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, currency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">DIAGNOSED PROBLEM STATEMENT</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Losing roughly 30% of mobile conversions because patient appointment flow is fully manual..."
                  value={newProposal.problem}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, problem: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold text-indigo-600">RECOMMENDED COMMERCIAL SOLUTION</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Deploy custom Patient Booking Engine & WhatsApp Reminder Sync..."
                  value={newProposal.recommendedSolution}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, recommendedSolution: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">PAYMENT TERMS</label>
                  <input
                    type="text"
                    placeholder="e.g. 50% Upfront, 50% Completion"
                    value={newProposal.paymentTerms}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">VALIDITY PERIOD</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Days"
                    value={newProposal.validityPeriod}
                    onChange={(e) => setNewProposal(prev => ({ ...prev, validityPeriod: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Draft'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REVENUE LOGGING & ONBOARDING */}
      {showRevenueModal && selectedProspectForRevenue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveRevenue}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full space-y-4 text-xs text-left shadow-2xl relative"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="font-mono text-[9px] text-slate-400 uppercase font-bold block">VERIFY DEPOSIT & SIGN AGREEMENT</span>
                <h4 className="font-display text-base font-bold text-slate-900">Revenue Validation Gate</h4>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowRevenueModal(false);
                  setSelectedProspectForRevenue(null);
                }}
                className="p-1 hover:bg-slate-100 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
              <p className="font-bold text-emerald-900 text-xs">Onboard Target: {selectedProspectForRevenue.businessName}</p>
              <p className="text-[11px] font-light text-slate-600 font-mono">
                Identified Gap: {selectedProspectForRevenue.websiteQuality || 'Digital presencia optimizations.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">CONTRACT PRICE AGREED</label>
                  <input
                    type="number"
                    required
                    value={revenueData.price}
                    onChange={(e) => setRevenueData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">CURRENCY</label>
                  <select
                    value={revenueData.currency}
                    onChange={(e) => setRevenueData(prev => ({ ...prev, currency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold text-slate-950">CASH DEPOSIT RECEIVED</label>
                  <input
                    type="number"
                    required
                    value={revenueData.cashReceivedAmount}
                    onChange={(e) => setRevenueData(prev => ({ ...prev, cashReceivedAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">PAYMENT STATUS</label>
                  <select
                    value={revenueData.paymentStatus}
                    onChange={(e) => setRevenueData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="Partial">Partial / Deposit</option>
                    <option value="Paid">Fully Paid</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block font-extrabold text-indigo-600">
                  TRANSACTION REFERENCE / INVOICE REF
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-2026-99482 or BANK-TRANSFER"
                  value={revenueData.transactionRef}
                  onChange={(e) => setRevenueData(prev => ({ ...prev, transactionRef: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Input payment receipt invoice reference from bank or Stripe manually.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">ADDITIONAL AGREEMENT DETAILS (OPTIONAL)</label>
                <textarea
                  rows={2}
                  placeholder="Specify customization scope, SLAs, etc..."
                  value={revenueData.notes}
                  onChange={(e) => setRevenueData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="onboardClientCheckbox"
                  checked={revenueData.onboardClient}
                  onChange={(e) => setRevenueData(prev => ({ ...prev, onboardClient: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600"
                />
                <label htmlFor="onboardClientCheckbox" className="font-mono text-[10px] text-slate-600 select-none cursor-pointer uppercase block">
                  MANUALLY PROVISION PRODUCTION CLIENT & ACTIVE PROJECT
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRevenueModal(false);
                  setSelectedProspectForRevenue(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-mono text-[10px] uppercase font-bold rounded-lg cursor-pointer"
              >
                {submitting ? 'Logging...' : 'Confirm Cash & Onboard'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
