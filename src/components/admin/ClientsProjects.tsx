import React, { useState, useEffect } from 'react';
import { Client, Project, Prospect, CaseStudy, CareerEntry, KnowledgeItem, KnowledgeType } from '../../types';
import { api } from '../../lib/api';
import { 
  Users, Layers, Plus, Calendar, CheckSquare, DollarSign, Activity, Loader2, ArrowRight, UserPlus, FilePlus,
  Sparkles, Save, FileText, BookOpen, Cpu, Check, Tags, Workflow, X, ExternalLink, Briefcase, Trash2
} from 'lucide-react';

interface ClientsProjectsProps {
  prospects: Prospect[];
  onRefreshProspects: () => void;
}

export default function ClientsProjects({ prospects, onRefreshProspects }: ClientsProjectsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeDemo, setIncludeDemo] = useState(false);

  const filteredClients = includeDemo ? clients : clients.filter(c => !c.isDemo);
  const filteredProjects = includeDemo ? projects : projects.filter(p => !p.isDemo);

  // Modals
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Client Form
  const [clientName, setClientName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProspectId, setSelectedProspectId] = useState('');

  // Project Form
  const [projectTitle, setProjectTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<'Planning' | 'Active' | 'Review' | 'Completed' | 'On Hold' | 'Cancelled'>('Planning');
  const [deliverables, setDeliverables] = useState<string>('');

  // Career & Authority Engine Workspace States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCareerWorkspace, setShowCareerWorkspace] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<'skills-tech' | 'career-evidence' | 'case-study' | 'knowledge-ip'>('skills-tech');

  // Tab 1: Skills & Technologies
  const [projectSkills, setProjectSkills] = useState<string[]>([]);
  const [projectTechs, setProjectTechs] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newTechInput, setNewTechInput] = useState('');

  // Tab 2: AI Career Evidence
  const [outcomeResult, setOutcomeResult] = useState('');
  const [isGeneratingEvidence, setIsGeneratingEvidence] = useState(false);
  const [evidenceOutput, setEvidenceOutput] = useState<any | null>(null);
  const [cvBullet, setCvBullet] = useState('');
  const [achievementStatement, setAchievementStatement] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [linkedinPost, setLinkedinPost] = useState('');
  const [interviewStarStory, setInterviewStarStory] = useState('');

  // Tab 3: Case Study Connection
  const [linkedCaseStudy, setLinkedCaseStudy] = useState<CaseStudy | null>(null);
  const [csTitle, setCsTitle] = useState('');
  const [csProblem, setCsProblem] = useState('');
  const [csApproach, setCsApproach] = useState('');
  const [csSolution, setCsSolution] = useState('');
  const [csResult, setCsResult] = useState('');
  const [csTestimonial, setCsTestimonial] = useState('');
  const [csPublishedStatus, setCsPublishedStatus] = useState<'Draft' | 'Published'>('Draft');
  const [isSavingCaseStudy, setIsSavingCaseStudy] = useState(false);

  // Tab 4: Knowledge / IP
  const [linkedKnowledgeItems, setLinkedKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [newIPTitle, setNewIPTitle] = useState('');
  const [newIPType, setNewIPType] = useState<KnowledgeType>('Framework');
  const [newIPContent, setNewIPContent] = useState('');
  const [newIPTags, setNewIPTags] = useState('');
  const [isSavingIP, setIsSavingIP] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, pList] = await Promise.all([
        api.getClients(),
        api.getProjects()
      ]);
      setClients(cList);
      setProjects(pList);
    } catch (err) {
      console.error('Failed to load clients and projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !businessName) {
      alert('Client name and business name are required!');
      return;
    }

    const payload: Client = {
      id: `c-${Date.now()}`,
      name: clientName,
      businessName,
      email,
      phone,
      address: 'Remote',
      source: 'SamuelOS Conversion Loop',
      services: ['DIGITAL_PRESENCE'],
      notes: 'Active client converted from forensic pipeline.',
      status: 'Active'
    };

    try {
      await api.saveClient(payload);
      
      // If conversion from prospect
      if (selectedProspectId) {
        const prospect = prospects.find(p => p.id === selectedProspectId);
        if (prospect) {
          // update status to Won
          await api.saveProspect({ ...prospect, status: 'Won' });
          onRefreshProspects();
        }
      }

      setShowClientModal(false);
      setClientName('');
      setBusinessName('');
      setEmail('');
      setPhone('');
      setSelectedProspectId('');
      loadData();
    } catch (err) {
      alert('Failed to save client');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !clientId) {
      alert('Project title and target client are required!');
      return;
    }

    const payload: Project = {
      id: `proj-${Date.now()}`,
      clientId,
      projectName: projectTitle,
      offerId: 'offer-1',
      description: 'Engineered conversion framework & secure automation pipeline.',
      startDate: startDate || new Date().toISOString().split('T')[0],
      dueDate: endDate || '',
      status,
      value: Number(budget) || 0,
      paymentStatus: 'Unpaid',
      deliverables: deliverables.split('\n').filter(d => d.trim().length > 0),
      notes: 'Monitored under secure workspace milestones.'
    };

    try {
      await api.saveProject(payload);
      setShowProjectModal(false);
      setProjectTitle('');
      setClientId('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setStatus('Planning');
      setDeliverables('');
      loadData();
    } catch (err) {
      alert('Failed to save project');
    }
  };

  const handleToggleDeliverable = async (project: Project, idxToToggle: number) => {
    // Since deliverables is an array of strings, we'll mark completion in notes or change string state
    const updatedDeliverables = project.deliverables.map((d, idx) => {
      if (idx === idxToToggle) {
        return d.startsWith('[COMPLETED] ') ? d.replace('[COMPLETED] ', '') : `[COMPLETED] ${d}`;
      }
      return d;
    });

    const updated: Project = { ...project, deliverables: updatedDeliverables };
    try {
      await api.saveProject(updated);
      loadData();
    } catch (err) {
      alert('Failed to update deliverable status');
    }
  };

  const loadProjectConnections = async (project: Project) => {
    setProjectSkills(project.skills || []);
    setProjectTechs(project.technologies || []);
    setNewSkillInput('');
    setNewTechInput('');

    setOutcomeResult('');
    setEvidenceOutput(null);
    setCvBullet('');
    setAchievementStatement('');
    setPortfolioDescription('');
    setLinkedinPost('');
    setInterviewStarStory('');

    try {
      const csList = await api.getCaseStudies();
      const matchedCS = csList.find(cs => cs.projectId === project.id) || null;
      setLinkedCaseStudy(matchedCS);

      if (matchedCS) {
        setCsTitle(matchedCS.title);
        setCsProblem(matchedCS.problem);
        setCsApproach(matchedCS.approach);
        setCsSolution(matchedCS.solution);
        setCsResult(matchedCS.result);
        setCsTestimonial(matchedCS.testimonial || '');
        setCsPublishedStatus(matchedCS.publishedStatus);
      } else {
        setCsTitle(`Transforming Digital Operations: ${project.projectName}`);
        setCsProblem(project.description || 'Outdated digital workflow structures causing leakages.');
        setCsApproach('Engineered integrated digital assets, optimized page delivery and localized SEO parameters.');
        setCsSolution(`Deployed verified system parameters: ${project.deliverables.map(d => d.replace('[COMPLETED] ', '')).join(', ')}.`);
        setCsResult('Achieved automated system stability and fully integrated lead scheduling capabilities.');
        setCsTestimonial('');
        setCsPublishedStatus('Draft');
      }

      const ipList = await api.getKnowledgeItems();
      const matchedIPs = ipList.filter(ip => ip.relatedProjectId === project.id);
      setLinkedKnowledgeItems(matchedIPs);

      setNewIPTitle('');
      setNewIPType('Framework');
      setNewIPContent('');
      setNewIPTags('');
    } catch (err) {
      console.error('Failed to load project connections:', err);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      loadProjectConnections(selectedProject);
    }
  }, [selectedProject]);

  const handleSaveSkillsTechs = async () => {
    if (!selectedProject) return;
    const updated: Project = {
      ...selectedProject,
      skills: projectSkills,
      technologies: projectTechs
    };
    try {
      await api.saveProject(updated);
      setSelectedProject(updated);
      const updatedList = await api.getProjects();
      setProjects(updatedList);
      alert('Project metadata successfully updated!');
    } catch (err) {
      alert('Failed to save project metadata.');
    }
  };

  const handleGenerateAIEvidence = async () => {
    if (!selectedProject) return;
    setIsGeneratingEvidence(true);
    setEvidenceOutput(null);
    try {
      const res = await api.generateCareerEvidence({
        projectName: selectedProject.projectName,
        description: selectedProject.description,
        deliverables: selectedProject.deliverables,
        outcomeResult: outcomeResult
      });
      if (res.success && res.evidence) {
        setEvidenceOutput(res.evidence);
        setCvBullet(res.evidence.cvBullet || res.evidence.cvSummary || '');
        setAchievementStatement(res.evidence.achievementStatement || (res.evidence.bullets && res.evidence.bullets[0]) || '');
        setPortfolioDescription(res.evidence.portfolioDescription || '');
        setLinkedinPost(res.evidence.linkedinPost || res.evidence.linkedInAchievement || '');
        setInterviewStarStory(res.evidence.interviewStarStory || res.evidence.interviewStory || '');
      } else {
        alert('Empty output returned from evidence generator.');
      }
    } catch (err) {
      alert('Failed to compile career achievements.');
    } finally {
      setIsGeneratingEvidence(false);
    }
  };

  const handleApplyEvidenceToCareer = async () => {
    if (!selectedProject) return;
    const payload: CareerEntry = {
      id: `car-proj-${Date.now()}`,
      title: `${selectedProject.projectName} Achievement`,
      role: 'Principal Systems Developer',
      organization: 'Accessmart Solutions / SamuelOS Projects',
      dateRange: `${selectedProject.startDate} to ${selectedProject.dueDate || 'Present'}`,
      problem: selectedProject.description,
      action: achievementStatement,
      result: outcomeResult || 'Completed high-impact system deliverables successfully.',
      skills: projectSkills,
      technologies: projectTechs,
      cvSummary: cvBullet,
      bullets: [cvBullet, achievementStatement],
      linkedInAchievement: linkedinPost,
      interviewStory: interviewStarStory,
      relatedProjectId: selectedProject.id
    };

    try {
      await api.saveCareerEntry(payload);
      alert('Successfully transferred compiled AI achievements to SamuelOS Career Engine!');
    } catch (err) {
      alert('Failed to append career timeline entry.');
    }
  };

  const handleSaveCaseStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSavingCaseStudy(true);

    const payload: CaseStudy = {
      id: linkedCaseStudy?.id || `cs-${Date.now()}`,
      projectId: selectedProject.id,
      title: csTitle,
      clientName: clients.find(c => c.id === selectedProject.clientId)?.businessName || 'Elite Partner',
      problem: csProblem,
      approach: csApproach,
      solution: csSolution,
      result: csResult,
      testimonial: csTestimonial || undefined,
      publishedStatus: csPublishedStatus,
      technologies: projectTechs,
      images: []
    };

    try {
      const saved = await api.saveCaseStudy(payload);
      setLinkedCaseStudy(saved);
      alert('Case study successfully linked and saved!');
    } catch (err) {
      alert('Failed to save Case Study.');
    } finally {
      setIsSavingCaseStudy(false);
    }
  };

  const handleSaveIPAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newIPTitle || !newIPContent) {
      alert('Title and content are required!');
      return;
    }
    setIsSavingIP(true);

    const payload: KnowledgeItem = {
      id: `know-proj-${Date.now()}`,
      title: newIPTitle,
      type: newIPType,
      content: newIPContent,
      tags: newIPTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      relatedProjectId: selectedProject.id,
      status: 'Published',
      publishedDate: new Date().toISOString().split('T')[0]
    };

    try {
      await api.saveKnowledgeItem(payload);
      const ipList = await api.getKnowledgeItems();
      const matchedIPs = ipList.filter(ip => ip.relatedProjectId === selectedProject.id);
      setLinkedKnowledgeItems(matchedIPs);

      setNewIPTitle('');
      setNewIPType('Framework');
      setNewIPContent('');
      setNewIPTags('');

      alert('Successfully published and linked IP Asset!');
    } catch (err) {
      alert('Failed to save Knowledge IP Asset.');
    } finally {
      setIsSavingIP(false);
    }
  };

  return (
    <div id="clients-projects-view" className="space-y-8 text-left">
      
      {/* Demo / Sandbox Mode Explicit Opt-In */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-150 bg-slate-50/50 rounded-2xl">
        <div className="space-y-0.5">
          <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Database Isolation & Safety
          </h4>
          <p className="text-slate-500 text-xs font-light">
            Toggle demo/sample sandbox data. Unchecked means production metrics and reporting reflect <strong>strictly genuine</strong> operational records only.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            <span className="ml-2 font-mono text-xs font-bold text-slate-700">
              {includeDemo ? "Sandbox On" : "Sandbox Off"}
            </span>
          </label>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { title: 'Total Clients', value: filteredClients.length, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { title: 'Active Projects', value: filteredProjects.filter(p => p.status !== 'Completed').length, icon: Layers, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { title: 'Billed Value', value: filteredProjects.length === 0 ? '₦0' : (includeDemo ? `$${filteredProjects.reduce((acc, p) => acc + p.value, 0).toLocaleString()}` : `₦${filteredProjects.reduce((acc, p) => acc + p.value, 0).toLocaleString()}`), icon: DollarSign, color: 'text-slate-600 bg-slate-100 border-slate-200' },
          { title: 'Active Contract Value', value: filteredProjects.length === 0 ? '₦0' : (includeDemo ? `$${filteredProjects.reduce((acc, p) => acc + p.value, 0).toLocaleString()}` : `₦${filteredProjects.reduce((acc, p) => acc + p.value, 0).toLocaleString()}`), icon: DollarSign, color: 'text-slate-600 bg-slate-100 border-slate-200' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="border border-slate-200 bg-white p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{item.title}</span>
                <p className="font-display font-bold text-2xl text-slate-900">{item.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Clients list column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-slate-200 bg-white p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-display font-bold text-slate-900 text-sm">Active Client Accounts</h4>
              <button
                onClick={() => setShowClientModal(true)}
                className="p-1 rounded hover:bg-slate-50 text-blue-600 border border-slate-200 cursor-pointer"
                title="Convert Lead to Client"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : filteredClients.length === 0 ? (
              <p className="text-slate-400 font-mono text-xs py-4 text-center">No active client records found.</p>
            ) : (
              <div className="space-y-2">
                {filteredClients.map(client => (
                  <div key={client.id} className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-display font-bold text-slate-900 flex items-center gap-1.5">
                          {client.name}
                          {client.isDemo && (
                            <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1 py-0.5 border border-blue-100 rounded">
                              DEMO
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">{client.businessName}</p>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                        {client.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-200/40 pt-1.5">
                      <span>Source: {client.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Projects Tracker */}
        <div className="lg:col-span-8 border border-slate-200 bg-white p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-display font-bold text-slate-900 text-base">Project Milestones & Delivery</h4>
              <p className="text-slate-500 text-xs font-light">Trace project deliverables, verify goals, and log successful milestones.</p>
            </div>
            <button
              onClick={() => setShowProjectModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono font-medium hover:bg-slate-800 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <p className="text-slate-400 font-mono text-xs py-10 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/40">
              No active projects compiled.
            </p>
          ) : (
            <div className="space-y-6">
              {filteredProjects.map(proj => (
                <div key={proj.id} className="border border-slate-150 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="font-display font-bold text-sm text-slate-950 flex items-center gap-1.5">
                        {proj.projectName}
                        {proj.isDemo && (
                          <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-1 py-0.5 border border-blue-100 rounded">
                            DEMO
                          </span>
                        )}
                      </h5>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                        Client ID: {proj.clientId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500">
                        Budget: {proj.isDemo ? `$${proj.value.toLocaleString()}` : `₦${proj.value.toLocaleString()}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 font-bold uppercase">
                        {proj.status}
                      </span>
                    </div>
                  </div>

                  {/* Milestones list checklist */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Deliverables Checklist (Click to Toggle)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {proj.deliverables.map((mile, mileIdx) => {
                        const isCompleted = mile.startsWith('[COMPLETED] ');
                        const label = isCompleted ? mile.replace('[COMPLETED] ', '') : mile;
                        return (
                          <button
                            key={mileIdx}
                            onClick={() => handleToggleDeliverable(proj, mileIdx)}
                            className="flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100/80 rounded-lg text-left transition-colors cursor-pointer border border-slate-100"
                          >
                            <input 
                              type="checkbox" 
                              checked={isCompleted} 
                              readOnly
                              className="rounded text-blue-600 focus:ring-0 focus:ring-offset-0 pointer-events-none"
                            />
                            <span className={`font-light leading-snug ${isCompleted ? 'line-through text-slate-400 font-mono text-[11px]' : 'text-slate-700'}`}>
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Career & Authority Metadata Summary / Connection button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
                        Linked Assets:
                      </span>
                      {proj.skills && proj.skills.length > 0 ? (
                        <span className="font-mono text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150">
                          {proj.skills.length} Skills
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          0 Skills
                        </span>
                      )}
                      {proj.technologies && proj.technologies.length > 0 ? (
                        <span className="font-mono text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-150">
                          {proj.technologies.length} Techs
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                          0 Techs
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => { setSelectedProject(proj); setShowCareerWorkspace(true); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Career & Authority Engine
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleCreateClient}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs text-left"
          >
            <h4 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Onboard Client Record
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Client Primary Contact Name *</label>
                <input 
                  type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Apex" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Business Brand Name *</label>
                <input 
                  type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Dental Group" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Email Address</label>
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Phone Number</label>
                  <input 
                    type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Onboard from Lead Pipeline</label>
                <select
                  value={selectedProspectId}
                  onChange={(e) => {
                    setSelectedProspectId(e.target.value);
                    const matched = prospects.find(p => p.id === e.target.value);
                    if (matched) {
                      setBusinessName(matched.businessName);
                      setClientName(matched.businessName);
                      setEmail(matched.email || '');
                      setPhone(matched.phone || '');
                    }
                  }}
                  className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-none"
                >
                  <option value="">-- None (Manual) --</option>
                  {prospects.filter(p => p.status !== 'Won').map(p => (
                    <option key={p.id} value={p.id}>{p.businessName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 font-mono text-[11px]">
              <button
                type="button" onClick={() => setShowClientModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Onboard Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleCreateProject}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full space-y-4 text-xs text-left"
          >
            <h4 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Establish Project Parameters
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Project Title *</label>
                <input 
                  type="text" required value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Conversion Landing Page Migration" className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Select Target Client Account *</label>
                <select
                  required value={clientId} onChange={(e) => setClientId(e.target.value)}
                  className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-sans"
                >
                  <option value="">-- Choose Client --</option>
                  {filteredClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.businessName}) {c.isDemo && '[DEMO]'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Start Date</label>
                  <input 
                    type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Delivery Target Date</label>
                  <input 
                    type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">Project Budget</label>
                  <input 
                    type="number" value={budget} onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 1500" className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Initial Project Stage</label>
                <select
                  value={status} onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-none font-mono"
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Review">In Review</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-500 uppercase block">Deliverables / Milestones (One per line)</label>
                <textarea 
                  rows={4} value={deliverables} onChange={(e) => setDeliverables(e.target.value)}
                  placeholder="e.g. Design Wireframes&#10;Develop Vite App&#10;Deploy Secure backend Express APIs"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 font-mono text-[11px]">
              <button
                type="button" onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CAREER & AUTHORITY WORKSPACE MODAL */}
      {showCareerWorkspace && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col my-8 max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <span className="font-mono text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  SamuelOS Career & Authority Engine
                </span>
                <h3 className="font-display font-black text-lg text-slate-900">
                  {selectedProject.projectName}
                </h3>
                <p className="text-xs text-slate-500 font-light">
                  Convert client project achievements into reusable career evidence, case studies, skills, and IP framework assets.
                </p>
              </div>
              <button
                onClick={() => { setSelectedProject(null); setShowCareerWorkspace(false); }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Bar Navigation */}
            <div className="flex border-b border-slate-150 bg-slate-50/20 px-6 font-mono text-xs">
              {[
                { id: 'skills-tech', label: 'Skills & Technologies', icon: Tags },
                { id: 'career-evidence', label: 'AI Career Evidence', icon: Sparkles },
                { id: 'case-study', label: 'Case Study', icon: FileText },
                { id: 'knowledge-ip', label: 'Knowledge & IP Assets', icon: BookOpen },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = workspaceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setWorkspaceTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-3.5 px-4 -mb-px font-medium border-b-2 cursor-pointer transition-all ${
                      isActive 
                        ? 'border-blue-600 text-blue-600 font-bold' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: SKILLS & TECH */}
              {workspaceTab === 'skills-tech' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900">Reusable Metadata Association</h4>
                    <p className="text-xs text-slate-500 font-light">Tag the professional core skills and deployment technologies demonstrated in this project.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skills section */}
                    <div className="space-y-3 p-4 border border-slate-100 bg-slate-50/30 rounded-2xl">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Skills Acquired / Refined</label>
                      
                      <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-white border border-slate-200 rounded-lg">
                        {projectSkills.length === 0 ? (
                          <span className="text-[11px] font-light text-slate-400 font-mono py-1">No skills tagged yet.</span>
                        ) : (
                          projectSkills.map(skill => (
                            <span key={skill} className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md">
                              {skill}
                              <button 
                                type="button" 
                                onClick={() => setProjectSkills(projectSkills.filter(s => s !== skill))}
                                className="hover:text-red-600 font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkillInput}
                          onChange={(e) => setNewSkillInput(e.target.value)}
                          placeholder="e.g. Systems Architecture"
                          className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newSkillInput.trim() && !projectSkills.includes(newSkillInput.trim())) {
                                setProjectSkills([...projectSkills, newSkillInput.trim()]);
                                setNewSkillInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newSkillInput.trim() && !projectSkills.includes(newSkillInput.trim())) {
                              setProjectSkills([...projectSkills, newSkillInput.trim()]);
                              setNewSkillInput('');
                            }
                          }}
                          className="px-3 bg-slate-900 text-white hover:bg-slate-800 text-xs rounded-lg font-mono font-medium cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Technologies section */}
                    <div className="space-y-3 p-4 border border-slate-100 bg-slate-50/30 rounded-2xl">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Technologies & Tools Employed</label>
                      
                      <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-white border border-slate-200 rounded-lg">
                        {projectTechs.length === 0 ? (
                          <span className="text-[11px] font-light text-slate-400 font-mono py-1">No technologies tagged yet.</span>
                        ) : (
                          projectTechs.map(tech => (
                            <span key={tech} className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-md">
                              {tech}
                              <button 
                                type="button" 
                                onClick={() => setProjectTechs(projectTechs.filter(t => t !== tech))}
                                className="hover:text-red-600 font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTechInput}
                          onChange={(e) => setNewTechInput(e.target.value)}
                          placeholder="e.g. React 18, Tailwind CSS, TypeScript"
                          className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newTechInput.trim() && !projectTechs.includes(newTechInput.trim())) {
                                setProjectTechs([...projectTechs, newTechInput.trim()]);
                                setNewTechInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newTechInput.trim() && !projectTechs.includes(newTechInput.trim())) {
                              setProjectTechs([...projectTechs, newTechInput.trim()]);
                              setNewTechInput('');
                            }
                          }}
                          className="px-3 bg-slate-900 text-white hover:bg-slate-800 text-xs rounded-lg font-mono font-medium cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSaveSkillsTechs}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Metadata Association
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: AI CAREER EVIDENCE */}
              {workspaceTab === 'career-evidence' && (
                <div className="space-y-6 text-left">
                  <div className="p-4 border border-amber-100 bg-amber-50/50 rounded-2xl flex gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] font-bold text-amber-700 uppercase tracking-widest block">Strict Project Truth Mandate</span>
                      <p className="text-[11px] text-amber-800 font-light leading-relaxed">
                        To maintain pristine career credibility, all AI-generated text is derived strictly from verified project facts (name, description, deliverables). You must supply a verified outcome/result below. <strong>Do not fabricate metrics, dates, or clients.</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Verified Outcome / Quantifiable Results</label>
                    <textarea
                      rows={2}
                      value={outcomeResult}
                      onChange={(e) => setOutcomeResult(e.target.value)}
                      placeholder="e.g. Achieved 100% test suite completion, reduced manual client onboarding from 5 hours to under 15 minutes, secured responsive page loading speed (<1.2s)."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleGenerateAIEvidence}
                      disabled={isGeneratingEvidence}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all"
                    >
                      {isGeneratingEvidence ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Compiling Evidence with Gemini AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                          Compile Project Evidence
                        </>
                      )}
                    </button>
                  </div>

                  {evidenceOutput && (
                    <div className="space-y-6 pt-4 border-t border-slate-150">
                      <div>
                        <h4 className="font-display font-black text-sm text-slate-900 uppercase tracking-tight">Compiled Professional Assets</h4>
                        <p className="text-xs text-slate-500 font-light">Fine-tune the generated drafts below before committing them to the career database.</p>
                      </div>

                      <div className="space-y-5">
                        {/* CV Bullet */}
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">1. Professional CV Bullet Point</label>
                          <textarea
                            rows={2}
                            value={cvBullet}
                            onChange={(e) => setCvBullet(e.target.value)}
                            className="w-full p-3 border border-slate-200 bg-slate-50/30 rounded-xl text-xs font-light text-slate-800"
                          />
                        </div>

                        {/* Achievement Statement */}
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">2. Prominent Achievement Statement</label>
                          <textarea
                            rows={2}
                            value={achievementStatement}
                            onChange={(e) => setAchievementStatement(e.target.value)}
                            className="w-full p-3 border border-slate-200 bg-slate-50/30 rounded-xl text-xs font-light text-slate-800"
                          />
                        </div>

                        {/* Portfolio Description */}
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">3. Portfolio Description Copy</label>
                          <textarea
                            rows={3}
                            value={portfolioDescription}
                            onChange={(e) => setPortfolioDescription(e.target.value)}
                            className="w-full p-3 border border-slate-200 bg-slate-50/30 rounded-xl text-xs font-light text-slate-800"
                          />
                        </div>

                        {/* LinkedIn Post */}
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">4. Linked-In Launch Post</label>
                          <textarea
                            rows={5}
                            value={linkedinPost}
                            onChange={(e) => setLinkedinPost(e.target.value)}
                            className="w-full p-3 border border-slate-200 bg-slate-50/30 rounded-xl text-xs font-mono font-light text-slate-800"
                          />
                        </div>

                        {/* Interview STAR Story */}
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">5. Behavioral Interview STAR Story</label>
                          <textarea
                            rows={6}
                            value={interviewStarStory}
                            onChange={(e) => setInterviewStarStory(e.target.value)}
                            className="w-full p-3 border border-slate-200 bg-slate-50/30 rounded-xl text-xs font-light text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleApplyEvidenceToCareer}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                        >
                          <Workflow className="w-3.5 h-3.5" />
                          Transfer to Career Engine Timeline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CASE STUDY CONNECTION */}
              {workspaceTab === 'case-study' && (
                <form onSubmit={handleSaveCaseStudy} className="space-y-6 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-900">Case Study Workspace</h4>
                      <p className="text-xs text-slate-500 font-light">Compile a structured case study detailing this project for potential client validation.</p>
                    </div>
                    {linkedCaseStudy ? (
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                        ✓ Linked Case Study Found ({linkedCaseStudy.publishedStatus})
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                        No Case Study Drafted
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Case Study Title</label>
                        <input
                          type="text"
                          value={csTitle}
                          onChange={(e) => setCsTitle(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Publish Status</label>
                        <select
                          value={csPublishedStatus}
                          onChange={(e) => setCsPublishedStatus(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-mono"
                        >
                          <option value="Draft">Draft (Internal Only)</option>
                          <option value="Published">Published (Public Portfolio)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Problem Statement (Problem)</label>
                      <textarea
                        rows={3}
                        value={csProblem}
                        onChange={(e) => setCsProblem(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Approach & Strategy (Approach)</label>
                      <textarea
                        rows={3}
                        value={csApproach}
                        onChange={(e) => setCsApproach(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Technical Implementation (Solution)</label>
                      <textarea
                        rows={3}
                        value={csSolution}
                        onChange={(e) => setCsSolution(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Proven Outcomes (Result)</label>
                      <textarea
                        rows={3}
                        value={csResult}
                        onChange={(e) => setCsResult(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Client Testimonial / Feedback (Optional)</label>
                      <textarea
                        rows={2}
                        value={csTestimonial}
                        onChange={(e) => setCsTestimonial(e.target.value)}
                        placeholder="e.g. 'Samuel delivereed beyond expectations, automating the workflow flawlessly.' - Business Director"
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isSavingCaseStudy}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                    >
                      {isSavingCaseStudy ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving Case Study...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Save Case Study
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: KNOWLEDGE & IP ASSETS */}
              {workspaceTab === 'knowledge-ip' && (
                <div className="space-y-6 text-left">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900">SamuelOS Intellectual Property Engine</h4>
                    <p className="text-xs text-slate-500 font-light">Codify repeatable blueprints, custom software architectures, or lessons-learned into permanent organizational IP assets.</p>
                  </div>

                  {/* Existing linked items */}
                  <div className="space-y-3">
                    <label className="font-mono text-[10px] text-slate-500 uppercase block font-bold">Current Linked Knowledge Assets</label>
                    {linkedKnowledgeItems.length === 0 ? (
                      <p className="font-mono text-[11px] text-slate-400 py-3 text-center border border-dashed border-slate-150 rounded-xl bg-slate-50/20">
                        No custom IP assets established for this project yet.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {linkedKnowledgeItems.map(item => (
                          <div key={item.id} className="p-3 border border-slate-100 bg-slate-50/40 rounded-xl flex items-start justify-between text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] text-blue-700 bg-blue-50 border border-blue-150 px-1.5 py-0.2 rounded font-bold uppercase">
                                  {item.type}
                                </span>
                                <span className="font-bold text-slate-900">{item.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 font-light leading-relaxed">{item.content}</p>
                            </div>
                            <span className="font-mono text-[9px] text-slate-400 shrink-0">
                              Published: {item.publishedDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Create new IP asset */}
                  <form onSubmit={handleSaveIPAsset} className="space-y-4 p-5 border border-slate-150 bg-slate-50/10 rounded-2xl">
                    <h5 className="font-display font-bold text-xs text-slate-900">Establish Repeatable IP/Framework Asset</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Asset Title</label>
                        <input
                          type="text"
                          value={newIPTitle}
                          onChange={(e) => setNewIPTitle(e.target.value)}
                          placeholder="e.g. Forensics Conversion Architecture"
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Asset Type</label>
                        <select
                          value={newIPType}
                          onChange={(e) => setNewIPType(e.target.value as any)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-mono"
                        >
                          <option value="Framework">Framework / Method</option>
                          <option value="SOP">SOP / Playbook</option>
                          <option value="Article">Case Narrative / Article</option>
                          <option value="Insight">Technical Blueprint</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Asset Content (Markdown Supported)</label>
                      <textarea
                        rows={4}
                        value={newIPContent}
                        onChange={(e) => setNewIPContent(e.target.value)}
                        placeholder="Detail the technical implementation, architectural guidelines, or logic flow."
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs font-sans"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[9px] text-slate-500 uppercase block font-bold">Tags (Comma separated)</label>
                      <input
                        type="text"
                        value={newIPTags}
                        onChange={(e) => setNewIPTags(e.target.value)}
                        placeholder="e.g. Server Architecture, Automation, Express"
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSavingIP}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                      >
                        {isSavingIP ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Establishing IP...
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-3.5 h-3.5" />
                            Establish IP Asset
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => { setSelectedProject(null); setShowCareerWorkspace(false); }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Close Workspace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
