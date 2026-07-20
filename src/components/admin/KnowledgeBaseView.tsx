import React, { useState, useEffect } from 'react';
import { KnowledgeItem, KnowledgeType } from '../../types';
import { api } from '../../lib/api';
import { 
  BookOpen, Plus, Trash2, Search, Filter, Cpu, ShieldCheck, HelpCircle, Loader2, Save, X, ExternalLink 
} from 'lucide-react';

export default function KnowledgeBaseView() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<KnowledgeType>('Framework');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  // Project/Service linkage states
  const [projects, setProjects] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [relatedProjectId, setRelatedProjectId] = useState('');
  const [relatedServiceId, setRelatedServiceId] = useState('');

  const loadItems = async () => {
    setLoading(true);
    try {
      const [list, projs, servs] = await Promise.all([
        api.getKnowledgeItems(),
        api.getProjects().catch(() => []),
        api.getServices().catch(() => [])
      ]);
      setItems(list);
      setProjects(projs);
      setServices(servs);
    } catch (err) {
      console.error('Failed to load knowledge items or references:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Title and content are required!');
      return;
    }

    const payload: KnowledgeItem = {
      id: `know-${Date.now()}`,
      title,
      type,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      content,
      publishedDate: new Date().toISOString().split('T')[0],
      status: 'Published',
      relatedProjectId: relatedProjectId || undefined,
      relatedServiceId: relatedServiceId || undefined
    };

    try {
      await api.saveKnowledgeItem(payload);
      setShowModal(false);
      setTitle('');
      setType('Framework');
      setTags('');
      setContent('');
      setRelatedProjectId('');
      setRelatedServiceId('');
      loadItems();
    } catch (err) {
      alert('Failed to save knowledge item');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge item?')) {
      try {
        await api.deleteKnowledgeItem(id);
        loadItems();
      } catch (err) {
        alert('Failed to delete item');
      }
    }
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.type.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="knowledge-base-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      {/* Knowledge Base Toolbar/Filters */}
      <div className="lg:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">SamuelOS Intellectual Property</h3>
          <p className="text-slate-500 text-xs font-light">
            Frameworks, playbook specifications, SOPs, and compiled technical guides.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono tracking-wider uppercase font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create IP Entry
        </button>
      </div>

      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-100/50 border border-slate-200/60 p-4 rounded-xl">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search intellectual property, guidelines, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 font-mono"
          >
            <option value="all">Category: All</option>
            <option value="Framework">Frameworks</option>
            <option value="Playbook">Playbooks</option>
            <option value="SOP">Standard SOPs</option>
            <option value="Article">Articles</option>
          </select>
        </div>
      </div>

      {/* Main Grid List */}
      <div className="lg:col-span-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="font-mono text-xs text-slate-400">Loading intellectual property catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <p className="text-slate-400 font-mono text-sm">No IP assets listed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => (
              <div 
                key={item.id} 
                className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-350 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                      {item.type}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-slate-900 leading-snug">{item.title}</h4>
                    <p className="font-mono text-[9px] text-slate-400">Published • {item.publishedDate}</p>
                  </div>

                  <p className="text-slate-600 text-xs font-light leading-relaxed line-clamp-4">
                    {item.content}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100 mt-4">
                  {item.tags.map(t => (
                    <span key={t} className="font-mono text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                  {item.relatedProjectId && (
                    <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Proj: {projects.find(p => p.id === item.relatedProjectId)?.projectName || 'Linked Project'}
                    </span>
                  )}
                  {item.relatedServiceId && (
                    <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Svc: {services.find(s => s.id === item.relatedServiceId)?.title || 'Linked Service'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE IP MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl w-full space-y-4 text-xs text-left"
          >
            <h4 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Establish Intellectual Property Asset
            </h4>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Asset Title *</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Service Before Sales conversion flow" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Category</label>
                  <select
                    value={type} onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-mono"
                  >
                    <option value="Framework">Framework</option>
                    <option value="Playbook">Playbook</option>
                    <option value="SOP">SOP</option>
                    <option value="Article">Article</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Link to Project (Optional)</label>
                  <select
                    value={relatedProjectId} onChange={(e) => setRelatedProjectId(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-sans"
                  >
                    <option value="">-- None --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.projectName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Link to Service (Optional)</label>
                  <select
                    value={relatedServiceId} onChange={(e) => setRelatedServiceId(e.target.value)}
                    className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-sans"
                  >
                    <option value="">-- None --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Tags (Comma-separated)</label>
                <input 
                  type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. conversion, local-business, growth" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Intellectual Content / Playbook Rules *</label>
                <textarea 
                  rows={8} required value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Insert detailed SOP, steps, guidelines, or framework text..."
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
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
                Publish IP Asset
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
