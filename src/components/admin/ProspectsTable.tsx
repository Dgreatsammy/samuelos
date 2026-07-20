import React, { useState, useRef, useEffect } from 'react';
import { Prospect, WebsiteStatus, PipelineStatus } from '../../types';
import { api } from '../../lib/api';
import { 
  Plus, Edit2, Trash2, Search, Filter, Upload, Download, Sparkles, FileText, Check, AlertCircle, X, CheckSquare, Loader2, RefreshCw, Send,
  ArrowUpDown, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface ProspectsTableProps {
  prospects: Prospect[];
  onRefresh: () => void;
  onSelectProspectForAudit: (p: Prospect) => void;
  onSelectProspectForOutreach: (p: Prospect) => void;
}

export default function ProspectsTable({ 
  prospects, onRefresh, onSelectProspectForAudit, onSelectProspectForOutreach 
}: ProspectsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Sorting & Pagination States
  const [sortBy, setSortBy] = useState<string>('leadScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter, sortBy, sortOrder, pageSize]);
  
  // Modal for add/edit
  const [showModal, setShowModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>('UNKNOWN');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Manual Search');
  const [status, setStatus] = useState<PipelineStatus>('Research');
  const [notes, setNotes] = useState('');
  const [digitalGap, setDigitalGap] = useState('');
  const [businessOpportunity, setBusinessOpportunity] = useState('');

  // Weighted score parameters
  const [digitalGapScore, setDigitalGapScore] = useState(15);
  const [businessPotentialScore, setBusinessPotentialScore] = useState(15);
  const [commercialPotentialScore, setCommercialPotentialScore] = useState(10);
  const [accessibilityScore, setAccessibilityScore] = useState(10);
  const [timingScore, setTimingScore] = useState(10);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const websiteStatuses: WebsiteStatus[] = [
    'NO_WEBSITE', 'WEBSITE_FOUND', 'WEBSITE_WEAK', 'WEBSITE_OUTDATED', 
    'WEBSITE_POOR_MOBILE', 'WEBSITE_LOW_CONVERSION', 'WEBSITE_STRONG', 
    'UNKNOWN', 'NEEDS_VERIFICATION'
  ];

  const pipelineStatuses: PipelineStatus[] = [
    'Research', 'Unverified', 'Verified', 'Qualified', 'Contacted', 
    'Responded', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Nurture'
  ];

  const openAddModal = () => {
    setEditingProspect(null);
    setBusinessName('');
    setIndustry('');
    setLocation('');
    setWebsiteUrl('');
    setWebsiteStatus('UNKNOWN');
    setEmail('');
    setPhone('');
    setSource('Manual Search');
    setStatus('Research');
    setNotes('');
    setDigitalGap('');
    setBusinessOpportunity('');
    
    setDigitalGapScore(15);
    setBusinessPotentialScore(15);
    setCommercialPotentialScore(10);
    setAccessibilityScore(10);
    setTimingScore(10);
    
    setShowModal(true);
  };

  const openEditModal = (p: Prospect) => {
    setEditingProspect(p);
    setBusinessName(p.businessName);
    setIndustry(p.industry);
    setLocation(p.location);
    setWebsiteUrl(p.websiteUrl || '');
    setWebsiteStatus(p.websiteStatus);
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setSource(p.source);
    setStatus(p.status);
    setNotes(p.notes);
    setDigitalGap(p.digitalGap);
    setBusinessOpportunity(p.businessOpportunity);
    
    setDigitalGapScore(p.scoreDetails?.digitalGap || 15);
    setBusinessPotentialScore(p.scoreDetails?.businessPotential || 15);
    setCommercialPotentialScore(p.scoreDetails?.commercialPotential || 10);
    setAccessibilityScore(p.scoreDetails?.accessibility || 10);
    setTimingScore(p.scoreDetails?.timingIntent || 10);
    
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prospect from the intelligence database?')) {
      try {
        await api.deleteProspect(id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete prospect');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !industry || !location) {
      alert('Business Name, Industry, and Location are required!');
      return;
    }

    const payload: Prospect = {
      id: editingProspect ? editingProspect.id : `p-${Date.now()}`,
      businessName,
      category: industry,
      industry,
      location,
      websiteUrl,
      websiteStatus,
      email,
      phone,
      whatsapp: phone,
      source,
      researchDate: editingProspect ? editingProspect.researchDate : new Date().toISOString().split('T')[0],
      digitalGap: digitalGap || 'Awaiting visual assessment',
      businessOpportunity: businessOpportunity || 'Reviewing potential conversion gaps',
      leadScore: 0, // Calculated on backend
      scoreDetails: {
        digitalGap: Number(digitalGapScore),
        businessPotential: Number(businessPotentialScore),
        commercialPotential: Number(commercialPotentialScore),
        accessibility: Number(accessibilityScore),
        timingIntent: Number(timingScore)
      },
      priority: 'C', // Calculated on backend
      status,
      notes
    };

    try {
      await api.saveProspect(payload);
      setShowModal(false);
      onRefresh();
    } catch (err) {
      alert('Failed to save prospect record');
    }
  };

  // CSV Export
  const handleExport = () => {
    if (prospects.length === 0) return;
    
    const headers = [
      'ID', 'Business Name', 'Industry', 'Location', 'Website', 'Website Status', 
      'Email', 'Phone', 'Source', 'Lead Score', 'Priority', 'Status', 'Notes', 'Digital Gap', 'Business Opportunity'
    ];
    
    const rows = prospects.map(p => [
      p.id, p.businessName, p.industry, p.location, p.websiteUrl || '', p.websiteStatus,
      p.email || '', p.phone || '', p.source, p.leadScore, p.priority, p.status, p.notes.replace(/\n/g, ' '), p.digitalGap, p.businessOpportunity
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `samuelos_prospect_database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parse & Column Mapping
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one data row.');
        }

        // Basic CSV parser that handles double quotes
        const parseRow = (row: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseRow(lines[0]);
        const data = lines.slice(1).map(line => {
          const vals = parseRow(line);
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            obj[h] = vals[idx] || '';
          });
          return obj;
        });

        setCsvHeaders(headers);
        setCsvData(data);

        // Pre-map default columns if headers match
        const initialMapping: Record<string, string> = {};
        const expectedFields = ['businessName', 'industry', 'location', 'websiteUrl', 'email', 'phone', 'notes'];
        expectedFields.forEach(field => {
          const match = headers.find(h => h.toLowerCase().replace(/[^a-z0-9]/g, '') === field.toLowerCase());
          if (match) initialMapping[field] = match;
        });
        setMapping(initialMapping);
        generatePreview(data, initialMapping);

      } catch (err: any) {
        setImportError(err.message || 'Failed to read CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field: string, csvHeader: string) => {
    const updated = { ...mapping, [field]: csvHeader };
    setMapping(updated);
    generatePreview(csvData, updated);
  };

  const generatePreview = (data: any[], currentMapping: Record<string, string>) => {
    const preview = data.slice(0, 5).map(row => ({
      businessName: row[currentMapping.businessName] || '',
      industry: row[currentMapping.industry] || 'Professional Services',
      location: row[currentMapping.location] || 'USA',
      websiteUrl: row[currentMapping.websiteUrl] || '',
      email: row[currentMapping.email] || '',
      phone: row[currentMapping.phone] || '',
      notes: row[currentMapping.notes] || 'Imported via bulk CSV mapping.'
    }));
    setImportPreview(preview);
  };

  const handleImportSubmit = async () => {
    if (!mapping.businessName) {
      setImportError('Mapping error: You must map a column to Business Name!');
      return;
    }

    setImporting(true);
    try {
      const payload: Prospect[] = csvData.map((row, idx) => ({
        id: `p-import-${Date.now()}-${idx}`,
        businessName: row[mapping.businessName] || '',
        category: row[mapping.industry] || 'Professional Services',
        industry: row[mapping.industry] || 'Professional Services',
        location: row[mapping.location] || 'USA',
        websiteUrl: row[mapping.websiteUrl] || '',
        websiteStatus: row[mapping.websiteUrl] ? 'NEEDS_VERIFICATION' : 'NO_WEBSITE',
        email: row[mapping.email] || '',
        phone: row[mapping.phone] || '',
        whatsapp: row[mapping.phone] || '',
        source: 'Bulk CSV Import',
        researchDate: new Date().toISOString().split('T')[0],
        digitalGap: 'CSV bulk mapping',
        businessOpportunity: 'Vulnerability assessment pending.',
        leadScore: 60,
        scoreDetails: { digitalGap: 15, businessPotential: 15, commercialPotential: 10, accessibility: 10, timingIntent: 10 },
        priority: 'B',
        status: 'Research',
        notes: row[mapping.notes] || 'Imported via bulk CSV upload.'
      }));

      const res = await api.importProspects(payload);
      if (res.success) {
        setShowImportModal(false);
        setCsvFile(null);
        setCsvData([]);
        setCsvHeaders([]);
        setMapping({});
        setImportPreview([]);
        onRefresh();
        alert(`Successfully imported ${res.count} unique prospects! Duplicates were filtered.`);
      } else {
        throw new Error('Import failed');
      }
    } catch (err: any) {
      setImportError('Server rejected import batch. Ensure schema matches.');
    } finally {
      setImporting(false);
    }
  };

  // Filter prospects
  const filtered = prospects.filter(p => {
    const matchesSearch = p.businessName.toLowerCase().includes(search.toLowerCase()) || 
                          p.industry.toLowerCase().includes(search.toLowerCase()) || 
                          p.location.toLowerCase().includes(search.toLowerCase());
                          
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort prospects
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a[sortBy as keyof Prospect];
    let valB: any = b[sortBy as keyof Prospect];

    if (sortBy === 'leadScore') {
      valA = Number(valA || 0);
      valB = Number(valB || 0);
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginated prospects
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleHeaderClick = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div id="prospects-table-container" className="space-y-6 text-left">
      
      {/* Header and Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">Prospect Intelligence Database</h3>
          <p className="text-slate-500 text-xs font-light">
            Forensic analysis, digital gap diagnosis, and lead score validation parameters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-medium text-slate-600 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            CSV Import
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-medium text-slate-600 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono tracking-wider uppercase font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Prospect
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-100/50 border border-slate-200/60 p-4 rounded-xl">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search business, industry, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 font-mono"
          >
            <option value="all">Pipeline: All Stages</option>
            {pipelineStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 font-mono"
          >
            <option value="all">Priority: All</option>
            <option value="A">Priority A (Score 75+)</option>
            <option value="B">Priority B (Score 50-74)</option>
            <option value="C">Priority C (Score 0-49)</option>
          </select>
        </div>
      </div>

      {/* Database Table */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-mono uppercase tracking-wider select-none">
                <th 
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => handleHeaderClick('businessName')}
                >
                  <div className="flex items-center gap-1">
                    Business / Details
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => handleHeaderClick('location')}
                >
                  <div className="flex items-center gap-1">
                    Location
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => handleHeaderClick('websiteUrl')}
                >
                  <div className="flex items-center gap-1">
                    Website
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => handleHeaderClick('leadScore')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Score
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => handleHeaderClick('status')}
                >
                  <div className="flex items-center gap-1">
                    Stage
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 font-mono text-slate-400">
                    No prospects matched the selected parameters.
                  </td>
                </tr>
              ) : (
                paginated.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 space-y-0.5 max-w-xs">
                      <p className="font-display font-bold text-slate-900 text-sm">{p.businessName}</p>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.industry}
                        </span>
                        {p.email && (
                          <span className="font-mono text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium font-bold">
                            {p.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-light text-slate-500">{p.location}</td>
                    <td className="py-3.5 px-4 max-w-[150px] truncate">
                      {p.websiteUrl ? (
                        <a 
                          href={p.websiteUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:underline flex items-center gap-1 font-medium font-bold"
                        >
                          {p.websiteUrl.replace(/https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">No website</span>
                      )}
                      <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">{p.websiteStatus}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                        p.priority === 'A' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' :
                        p.priority === 'B' ? 'text-amber-700 border-amber-200 bg-amber-50' :
                        'text-slate-600 border-slate-200 bg-slate-50'
                      }`}>
                        Score: {p.leadScore} (Prio: {p.priority})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onSelectProspectForAudit(p)}
                          className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 cursor-pointer"
                          title="Generate Digital Audit Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectProspectForOutreach(p)}
                          className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 cursor-pointer"
                          title="Generate Personalized Outreach"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
                          title="Edit Prospect Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 cursor-pointer"
                          title="Delete Prospect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span>
              Showing <strong className="text-slate-800">{sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, sorted.length)}
              </strong>{' '}
              of <strong className="text-slate-800">{sorted.length}</strong> entries
            </span>
            <div className="flex items-center gap-1.5">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-1 border border-slate-200 bg-white rounded text-xs text-slate-700"
              >
                {[5, 10, 25, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span>per page</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-200/50 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded border text-xs font-bold cursor-pointer transition-colors ${
                  currentPage === page
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-200/50 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h4 className="font-display text-lg font-bold text-slate-900">Bulk CSV Lead Mapping</h4>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{importError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-display font-semibold text-slate-800 text-sm">
                  {csvFile ? csvFile.name : 'Choose CSV File or drag here'}
                </p>
                <p className="text-slate-400 mt-1 font-mono text-[10px]">Supports .csv format only</p>
              </div>

              {csvHeaders.length > 0 && (
                <div className="space-y-4">
                  <h5 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Column Mapping Definition
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    {[
                      { key: 'businessName', label: 'Business Name *', req: true },
                      { key: 'industry', label: 'Industry / Category', req: false },
                      { key: 'location', label: 'Location (City, State)', req: false },
                      { key: 'websiteUrl', label: 'Website URL', req: false },
                      { key: 'email', label: 'Email Address', req: false },
                      { key: 'phone', label: 'Phone Number', req: false },
                      { key: 'notes', label: 'Internal Notes', req: false },
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="font-mono text-[10px] font-bold text-slate-500 block">{field.label}</label>
                        <select
                          value={mapping[field.key] || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-mono text-slate-700 focus:outline-none"
                        >
                          <option value="">-- Skip Field --</option>
                          {csvHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Previews */}
                  <h5 className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Record Preview Sample (First 5 Rows)
                  </h5>
                  <div className="border border-slate-100 rounded-xl overflow-hidden font-mono text-[10px] text-slate-600 bg-slate-50 max-h-[150px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-slate-200">Business</th>
                          <th className="p-2 border-b border-slate-200">Industry</th>
                          <th className="p-2 border-b border-slate-200">Location</th>
                          <th className="p-2 border-b border-slate-200">Website</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border-b border-slate-150 font-bold text-slate-900">{row.businessName || 'Empty'}</td>
                            <td className="p-2 border-b border-slate-150">{row.industry}</td>
                            <td className="p-2 border-b border-slate-150">{row.location}</td>
                            <td className="p-2 border-b border-slate-150 truncate max-w-[100px]">{row.websiteUrl || 'None'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 font-mono text-[11px]">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={importing || csvHeaders.length === 0}
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Batch Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PROSPECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form 
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-3xl w-full space-y-6 max-h-[90vh] overflow-y-auto text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h4 className="font-display text-lg font-bold text-slate-900">
                {editingProspect ? `Modify intelligence: ${editingProspect.businessName}` : 'Add New Lead Prospect'}
              </h4>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Business Name *</label>
                <input 
                  type="text" 
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Industry / Category *</label>
                <input 
                  type="text" 
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Location (City, State) *</label>
                <input 
                  type="text" 
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Website URL</label>
                <input 
                  type="url" 
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Website Verification Status</label>
                <select
                  value={websiteStatus}
                  onChange={(e) => setWebsiteStatus(e.target.value as WebsiteStatus)}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {websiteStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Phone / WhatsApp</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Source channel</label>
                <input 
                  type="text" 
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Pipeline CRM Stage</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PipelineStatus)}
                  className="w-full p-2.5 border border-slate-200 bg-white rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                >
                  {pipelineStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* WEIGHTED OPPORTUNITY SCORING SECTION */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <span className="font-mono text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Weighted Opportunity Score Matrix
              </span>
              <p className="text-slate-500 text-[11px] font-light">
                Assign diagnostic weight scores according to SamuelOS scoring constitution (Total score determines lead priority):
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 block">Digital Gap (Max 30)</label>
                  <input 
                    type="number" min="0" max="30" value={digitalGapScore} 
                    onChange={(e) => setDigitalGapScore(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 block">Biz Potential (Max 20)</label>
                  <input 
                    type="number" min="0" max="20" value={businessPotentialScore} 
                    onChange={(e) => setBusinessPotentialScore(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 block">Comm Potential (Max 20)</label>
                  <input 
                    type="number" min="0" max="20" value={commercialPotentialScore} 
                    onChange={(e) => setCommercialPotentialScore(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 block">Accessibility (Max 15)</label>
                  <input 
                    type="number" min="0" max="15" value={accessibilityScore} 
                    onChange={(e) => setAccessibilityScore(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-slate-500 block">Timing/Intent (Max 15)</label>
                  <input 
                    type="number" min="0" max="15" value={timingScore} 
                    onChange={(e) => setTimingScore(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-600 flex justify-between items-center">
                <span>Calculated Total Score:</span>
                <span className="font-bold text-slate-900">
                  {Number(digitalGapScore) + Number(businessPotentialScore) + Number(commercialPotentialScore) + Number(accessibilityScore) + Number(timingScore)}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Digital Presence Gap Summary</label>
                <input 
                  type="text" 
                  value={digitalGap}
                  onChange={(e) => setDigitalGap(e.target.value)}
                  placeholder="e.g. Website lacks mobile reservation, high page weight"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Business Opportunity</label>
                <input 
                  type="text" 
                  value={businessOpportunity}
                  onChange={(e) => setBusinessOpportunity(e.target.value)}
                  placeholder="e.g. Migrate to React + conversion optimized landing flows"
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold text-slate-500 uppercase block">Private Notes & Diagnostic Observations</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sizable dental operation. Front desk manually books slots."
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                {editingProspect ? 'Update Record' : 'Save Prospect Record'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
