import React, { useState, useEffect } from 'react';
import { Outreach, Prospect } from '../../types';
import { api } from '../../lib/api';
import { Send, MessageSquare, Mail, Instagram, Copy, Loader2, Save, FileText, Check, ChevronDown } from 'lucide-react';

interface OutreachEngineProps {
  prospects: Prospect[];
  selectedProspect: Prospect | null;
  onClearSelectedProspect: () => void;
}

export default function OutreachEngine({ prospects, selectedProspect, onClearSelectedProspect }: OutreachEngineProps) {
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);

  // Draft generator states
  const [targetProspectId, setTargetProspectId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'instagram' | 'email'>('email');
  const [draftMessage, setDraftMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (selectedProspect) {
      setTargetProspectId(selectedProspect.id);
      onClearSelectedProspect();
    }
  }, [selectedProspect]);

  const loadOutreaches = async () => {
    setLoading(true);
    try {
      const list = await api.getOutreaches();
      setOutreaches(list);
    } catch (err) {
      console.error('Failed to load outreach database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutreaches();
  }, []);

  const handleGenerate = async () => {
    if (!targetProspectId) return;

    setDraftMessage('');
    setGenerating(true);
    try {
      const res = await api.generateOutreach(targetProspectId, selectedChannel);
      if (res.success && res.message) {
        setDraftMessage(res.message);
      } else {
        throw new Error('Outreach generation failed');
      }
    } catch (err: any) {
      alert('Outreach generation failed. Verify your server is alive and Gemini key is set.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draftMessage) return;
    navigator.clipboard.writeText(draftMessage);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleSaveOutreach = async () => {
    const prospect = prospects.find(p => p.id === targetProspectId);
    if (!prospect) return;

    const payload: Outreach = {
      id: `out-${Date.now()}`,
      prospectId: prospect.id,
      channel: selectedChannel,
      message: draftMessage,
      personalizationBasis: `Forensic audit highlight for ${prospect.businessName}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      sequenceStage: 'Initial'
    };

    try {
      await api.saveOutreach(payload);
      // NOTE: Saving an AI outreach draft does NOT mark prospect as Contacted or Sent.
      // Prospect remains in current stage until Samuel explicitly approves and marks as manually sent.
      loadOutreaches();
      alert('Outreach draft saved as "Draft". Prospect pipeline stage remains unchanged.');
    } catch (err) {
      alert('Failed to save outreach log');
    }
  };

  const handleApproveOutreach = async (item: Outreach) => {
    const statusUpper = (item.status || '').toUpperCase().replace(/_/g, ' ');
    if (statusUpper !== 'READY FOR APPROVAL' && statusUpper !== 'AWAITING APPROVAL') {
      alert('Outreach draft must be in "READY FOR APPROVAL" or "AWAITING APPROVAL" status before it can be approved.');
      return;
    }
    try {
      const updated: Outreach = { ...item, status: 'APPROVED' };
      await api.saveOutreach(updated);
      loadOutreaches();
      alert(`Outreach draft for ${prospects.find(p => p.id === item.prospectId)?.businessName || 'prospect'} approved!`);
    } catch (err: any) {
      alert(err.message || 'Failed to approve outreach draft.');
    }
  };

  const handleMarkAsManuallySent = async (item: Outreach) => {
    const statusUpper = (item.status || '').toUpperCase().replace(/_/g, ' ');
    if (statusUpper !== 'APPROVED') {
      alert('Outreach must be in "APPROVED" status before it can be marked as manually sent.');
      return;
    }
    const prospect = prospects.find(p => p.id === item.prospectId);
    const bizName = prospect ? prospect.businessName : 'Prospect';
    const confirmed = window.confirm(
      `Confirm Manual Delivery:\n\nHave you manually copied and sent this message to ${bizName} via ${item.channel.toUpperCase()}?\n\nClick OK to confirm that you manually delivered this outreach.`
    );
    if (!confirmed) return;

    try {
      const updatedOutreach: Outreach = { ...item, status: 'SENT' };
      await api.saveOutreach(updatedOutreach);

      if (prospect) {
        const updatedProspect: Prospect = {
          ...prospect,
          status: 'Contacted',
          notes: `${prospect.notes || ''}\n\n[Human Action - ${new Date().toISOString().split('T')[0]}] Manually sent outreach message via ${item.channel}.`
        };
        await api.saveProspect(updatedProspect);
      }

      loadOutreaches();
      alert(`Outreach marked as manually sent. Lead stage updated to "Contacted".`);
    } catch (err: any) {
      alert(err.message || 'Failed to mark outreach as manually sent.');
    }
  };

  return (
    <div id="outreach-engine-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Draft Generator Form */}
      <div className="lg:col-span-7 space-y-6">
        <div className="border border-slate-200 bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <h4 className="font-display font-bold text-slate-900 text-base">Gemini Personalized Copy Generator</h4>
            <p className="text-slate-500 text-xs font-light">
              Craft surgical, value-first messages referencing specific digital vulnerabilities to earn prospect interest.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">TARGET PROSPECT</label>
              <select
                value={targetProspectId}
                onChange={(e) => setTargetProspectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
              >
                <option value="">-- Choose Prospect --</option>
                {prospects.map(p => (
                  <option key={p.id} value={p.id}>{p.businessName} ({p.priority})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">OUTREACH CHANNEL</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'email', label: 'Email', icon: Mail },
                  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { key: 'instagram', label: 'Insta DM', icon: Instagram },
                ].map(ch => {
                  const Icon = ch.icon;
                  const isSelected = selectedChannel === ch.key;
                  return (
                    <button
                      key={ch.key}
                      onClick={() => setSelectedChannel(ch.key as any)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={!targetProspectId || generating}
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating copy...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Generate Outreach Copy
                </>
              )}
            </button>
          </div>

          {/* DRAFTED MESSAGE DOCK */}
          {draftMessage && (
            <div className="space-y-3 pt-6 border-t border-slate-100 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  AI-Generated Copy Draft (Fully Editable)
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded text-[10px] font-mono text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    {copying ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy text
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveOutreach}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-mono font-bold hover:bg-indigo-500 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Log Outreach
                  </button>
                </div>
              </div>

              <textarea
                rows={10}
                value={draftMessage}
                onChange={(e) => setDraftMessage(e.target.value)}
                className="w-full p-4 border border-indigo-200 focus:border-indigo-500 focus:outline-none bg-slate-50 font-sans text-xs leading-relaxed text-slate-800 rounded-xl"
              />
            </div>
          )}
        </div>
      </div>

      {/* Outreach Logs Sidebar */}
      <div className="lg:col-span-5 border border-slate-200 bg-white p-5 rounded-2xl space-y-4 flex flex-col max-h-[80vh] overflow-y-auto">
        <div>
          <h4 className="font-display font-bold text-slate-900 text-base">Outreach Activity Logs</h4>
          <p className="text-slate-500 text-xs font-light mt-0.5">
            History of strategic communications dispatched through our client channel architecture.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : outreaches.length === 0 ? (
          <p className="text-slate-400 text-xs font-mono py-4 text-center">No outreach logs recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {outreaches.map(item => {
              const prospect = prospects.find(p => p.id === item.prospectId);
              const bizName = prospect ? prospect.businessName : 'Unknown Prospect';
              return (
                <div 
                  key={item.id} 
                  className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                    <span className="font-display font-bold text-slate-900">{bizName}</span>
                    <span className="font-mono text-[9px] text-slate-400">{item.date}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-indigo-600 font-semibold uppercase tracking-wider">
                      Channel: {item.channel}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[8px] uppercase tracking-widest font-semibold ${
                      (() => {
                        const norm = item.status.toUpperCase().replace(/_/g, ' ');
                        if (norm === 'APPROVED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        if (norm === 'SENT') return 'bg-blue-50 text-blue-700 border-blue-200';
                        if (norm === 'READY FOR APPROVAL') return 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                        if (norm === 'AWAITING EVIDENCE VERIFICATION') return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                        return 'bg-slate-50 text-slate-500 border-slate-200';
                      })()
                    }`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] font-light text-slate-500 leading-relaxed line-clamp-3 bg-white p-2 border border-slate-100 rounded">
                    {item.message}
                  </p>

                  {/* Human Control Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {(() => {
                      const norm = (item.status || '').toUpperCase().replace(/_/g, ' ');
                      return (
                        <>
                          {(norm === 'READY FOR APPROVAL' || norm === 'AWAITING APPROVAL') && (
                            <button
                              onClick={() => handleApproveOutreach(item)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold rounded cursor-pointer"
                            >
                              Approve Draft
                            </button>
                          )}
                          {norm === 'APPROVED' && (
                            <button
                              onClick={() => handleMarkAsManuallySent(item)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-mono font-bold rounded cursor-pointer"
                            >
                              Mark as Manually Sent
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
