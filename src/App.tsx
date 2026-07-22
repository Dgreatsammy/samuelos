import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public pages
import Hero from './components/public/Hero';
import Positioning from './components/public/Positioning';
import ServicesList from './components/public/ServicesList';
import SolutionsLadder from './components/public/SolutionsLadder';
import CaseStudiesGrid from './components/public/CaseStudiesGrid';
import AuditRequestForm from './components/public/AuditRequestForm';
import Contact from './components/public/Contact';

// Admin panel tabs
import ProspectsTable from './components/admin/ProspectsTable';
import CRMBoard from './components/admin/CRMBoard';
import CloserAgent from './components/admin/CloserAgent';
import AuditManager from './components/admin/AuditManager';
import OutreachEngine from './components/admin/OutreachEngine';
import ClientsProjects from './components/admin/ClientsProjects';
import CareerEngineView from './components/admin/CareerEngineView';
import KnowledgeBaseView from './components/admin/KnowledgeBaseView';

import { api } from './lib/api';
import { Prospect } from './types';
import { auth, googleProvider, signInWithEmailAndPassword, signInWithPopup, onIdTokenChanged, signOut } from './lib/firebase';
import { 
  Shield, User, Lock, Terminal, LayoutDashboard, Sparkles, Send, 
  Layers, Users, CheckSquare, BookOpen, Key, Loader2, AlertCircle, X, HelpCircle 
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  
  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin section state
  const [activeAdminTab, setActiveAdminTab] = useState<string>('overview');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loadingProspects, setLoadingProspects] = useState<boolean>(false);

  // Cross-trigger props
  const [selectedProspectForAudit, setSelectedProspectForAudit] = useState<Prospect | null>(null);
  const [selectedProspectForOutreach, setSelectedProspectForOutreach] = useState<Prospect | null>(null);
  const [selectedProspectForCloser, setSelectedProspectForCloser] = useState<Prospect | null>(null);

  const loadProspects = async () => {
    setLoadingProspects(true);
    try {
      const data = await api.getProspects();
      setProspects(data);
    } catch (err) {
      console.error('Failed to load prospects:', err);
    } finally {
      setLoadingProspects(false);
    }
  };

  useEffect(() => {
    // Monitor ID token changes (including auto-refresh from Firebase)
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          localStorage.setItem('samuel_os_token', idToken);
          setIsAdmin(true);
          loadProspects();
        } catch (err) {
          console.error('Failed to get fresh ID token:', err);
        }
      } else {
        // If there is no active Firebase session, check if we're using a fallback or mock session
        const token = localStorage.getItem('samuel_os_token');
        if (token) {
          // If the token is a mock token or shorter custom token, we preserve local status
          if (token.startsWith('samuelos-mock-session-token') || (!token.includes('.') && token.length < 50)) {
            setIsAdmin(true);
            loadProspects();
            return;
          }
        }
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthError('');
    setLoggingIn(true);
    try {
      // 1. Sign in via client-side Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Exchange with our Backend API to verify & provision admins record
      const res = await api.loginWithToken(idToken);
      if (res.success) {
        localStorage.setItem('samuel_os_token', idToken);
        setIsAdmin(true);
        setShowLoginModal(false);
        setCurrentView('admin');
        setActiveAdminTab('overview');
        loadProspects();
      }
    } catch (err: any) {
      console.warn("Firebase email/password login failed, attempting fallback login:", err);
      try {
        const res = await api.login(email, password);
        if (res.success) {
          localStorage.setItem('samuel_os_token', res.token);
          setIsAdmin(true);
          setShowLoginModal(false);
          setCurrentView('admin');
          setActiveAdminTab('overview');
          loadProspects();
        }
      } catch (proxyErr: any) {
        setAuthError(proxyErr.message || err.message || 'Authentication credentials rejected.');
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setLoggingIn(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const res = await api.loginWithToken(idToken);
      if (res.success) {
        localStorage.setItem('samuel_os_token', idToken);
        setIsAdmin(true);
        setShowLoginModal(false);
        setCurrentView('admin');
        setActiveAdminTab('overview');
        loadProspects();
      }
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      setAuthError(err.message || 'Google Sign-In failed. Please ensure your account is authorized.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('samuel_os_token');
    setIsAdmin(false);
    setCurrentView('home');
    signOut(auth).catch(err => console.error('Error signing out from Firebase:', err));
  };

  const handleTriggerAuditTab = (p: Prospect) => {
    setSelectedProspectForAudit(p);
    setActiveAdminTab('audits');
  };

  const handleTriggerOutreachTab = (p: Prospect) => {
    setSelectedProspectForOutreach(p);
    setActiveAdminTab('outreach');
  };

  const handleTriggerCloserTab = (p: Prospect) => {
    setSelectedProspectForCloser(p);
    setActiveAdminTab('closer_agent');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Shared Header Navigation */}
      <Navbar 
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {currentView === 'home' && (
          <div className="space-y-0">
            <Hero onNavigate={setCurrentView} />
            <Positioning onNavigate={setCurrentView} />
            <ServicesList />
            <SolutionsLadder onNavigate={setCurrentView} />
            <CaseStudiesGrid />
            <Contact />
          </div>
        )}

        {currentView === 'services' && <ServicesList />}
        {currentView === 'solutions' && <SolutionsLadder onNavigate={setCurrentView} />}
        {currentView === 'work' && <CaseStudiesGrid />}
        {currentView === 'audit' && <AuditRequestForm />}
        {currentView === 'contact' && <Contact />}

        {/* ADMIN CONTROL SYSTEM */}
        {currentView === 'admin' && isAdmin && (
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 space-y-8">
            {/* Admin Header Title */}
            <div className="border border-slate-200 bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-bold">Admin operating system console</span>
                </div>
                <h2 className="font-display text-2xl font-extrabold text-white">SamuelOS IP & Biz Intelligence</h2>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-emerald-400">Database Status: Secure Sync Active</span>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="flex flex-wrap border-b border-slate-200 text-xs font-mono tracking-wider uppercase font-semibold gap-1">
              {[
                { key: 'overview', label: 'Console Overview', icon: LayoutDashboard },
                { key: 'prospects', label: 'Prospect Intelligence', icon: Users },
                { key: 'closer_agent', label: 'Closer Agent AI', icon: Shield },
                { key: 'crm', label: 'Pipeline CRM', icon: Layers },
                { key: 'audits', label: 'Forensic Audits', icon: Sparkles },
                { key: 'outreach', label: 'Outreach Copier', icon: Send },
                { key: 'delivery', label: 'Clients & Delivery', icon: CheckSquare },
                { key: 'career', label: 'Career Engine', icon: BookOpen },
                { key: 'knowledge', label: 'SOPs & Frameworks', icon: Key },
              ].map(tab => {
                const Icon = tab.icon;
                const isTabActive = activeAdminTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveAdminTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold cursor-pointer transition-colors ${
                      isTabActive 
                        ? 'border-indigo-600 text-indigo-600 font-extrabold' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Admin Views */}
            <div className="min-h-[50vh] animate-fade-in">
              {activeAdminTab === 'overview' && (
                <div className="space-y-6 text-left">
                  {/* Summary row */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    {[
                      { title: 'Prospect Database', count: prospects.length, desc: 'Lead intelligence entries' },
                      { title: 'Pipeline Active Value', count: `$${(prospects.filter(p => p.status !== 'Won' && p.status !== 'Lost').reduce((acc, p) => acc + (p.leadScore * 20), 0)).toLocaleString()}`, desc: 'Projected weighted value' },
                      { title: 'Forensic Priority A', count: prospects.filter(p => p.priority === 'A').length, desc: 'Diagnostic score > 75%' },
                      { title: 'Service Categories', count: 4, desc: 'Digital Presence, AI, Growth, IT' },
                    ].map((metric, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">{metric.title}</span>
                        <p className="font-display font-black text-3xl text-slate-900">{metric.count}</p>
                        <p className="text-[10px] font-mono text-slate-500">{metric.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick walkthrough bento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="border border-slate-200 bg-white p-6 rounded-3xl space-y-4">
                      <h4 className="font-display font-bold text-slate-900 text-base">The Service Before Sales Loop</h4>
                      <p className="text-slate-600 text-xs font-light leading-relaxed">
                        To earn client trust, we never deploy blind pitches or pushy sales calls. Our operational timeline sequences structured value steps perfectly:
                      </p>
                      
                      <div className="space-y-3 font-mono text-[11px] text-slate-700">
                        {[
                          '1. RESEARCH: Add a prospect to the lead database and calculate diagnostic weighted score details.',
                          '2. VERIFY: Document the exact visual presence parameters and conversion bottlenecks.',
                          '3. DIAGNOSE: Run a real-time visual audit report using custom Gemini Flash model parameters.',
                          '4. OUTREACH: Compile surgical WhatsApp/Instagram personalized drafts highlighting real leaks.',
                          '5. DELIVER: Onboard the client and track milestone checklists transparently.',
                        ].map((step, idx) => (
                          <div key={idx} className="p-2 border border-slate-100 bg-slate-50/50 rounded-lg">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-indigo-100 bg-indigo-950 text-white p-6 sm:p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="space-y-4">
                        <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase tracking-wider">INTELLECTUAL FRAMEWORK</span>
                        <h4 className="font-display text-xl font-bold tracking-tight">SamuelOS Architecture</h4>
                        <p className="text-slate-300 text-xs font-light leading-relaxed">
                          This Professional and Business Operating System is engineered with data-driven modularity. It maintains perfect distinction between Samuel\'s personal brand, Accessmart Solutions delivery, and overall intellectual frameworks.
                        </p>
                        <p className="text-slate-400 text-xs font-light leading-relaxed">
                          All AI endpoints (Audits, Outreach, STAR Interviews) are routed server-side to secure process credentials. No API keys are leaked to browser DevTools.
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-800">
                        <button
                          onClick={() => setActiveAdminTab('prospects')}
                          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer"
                        >
                          ACCESS DATABASE PROSPECTS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAdminTab === 'prospects' && (
                <ProspectsTable 
                  prospects={prospects} 
                  onRefresh={loadProspects} 
                  onSelectProspectForAudit={handleTriggerAuditTab}
                  onSelectProspectForOutreach={handleTriggerOutreachTab}
                  onSelectProspectForCloser={handleTriggerCloserTab}
                />
              )}

              {activeAdminTab === 'crm' && (
                <CRMBoard 
                  prospects={prospects} 
                  onRefresh={loadProspects} 
                />
              )}

              {activeAdminTab === 'closer_agent' && (
                <CloserAgent 
                  prospects={prospects} 
                  onRefresh={loadProspects}
                  selectedProspect={selectedProspectForCloser}
                  onClearSelectedProspect={() => setSelectedProspectForCloser(null)}
                />
              )}

              {activeAdminTab === 'audits' && (
                <AuditManager 
                  prospects={prospects} 
                  selectedProspect={selectedProspectForAudit}
                  onClearSelectedProspect={() => setSelectedProspectForAudit(null)}
                />
              )}

              {activeAdminTab === 'outreach' && (
                <OutreachEngine 
                  prospects={prospects} 
                  selectedProspect={selectedProspectForOutreach}
                  onClearSelectedProspect={() => setSelectedProspectForOutreach(null)}
                />
              )}

              {activeAdminTab === 'delivery' && (
                <ClientsProjects 
                  prospects={prospects} 
                  onRefreshProspects={loadProspects}
                />
              )}

              {activeAdminTab === 'career' && (
                <CareerEngineView />
              )}

              {activeAdminTab === 'knowledge' && (
                <KnowledgeBaseView />
              )}
            </div>
          </div>
        )}

        {/* SIGN IN / AUTHENTICATION MODAL */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <form 
              onSubmit={handleLogin}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-sm w-full space-y-6 text-xs text-left shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="font-display text-lg font-bold text-slate-900">SamuelOS Console Access</h4>
                <p className="text-slate-400 text-[11px] font-light max-w-xs mx-auto">
                  Insert authorized credentials to access prospects, score metrics, and client projects.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">ADMIN EMAIL</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. admin@samuelos.co"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[10px] text-slate-500 uppercase block">PASSWORD</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {loggingIn && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Verify Credentials
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono">
                    <span className="bg-white px-2 text-slate-400">Or Continue With</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loggingIn}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 text-slate-700 font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.232 1.861 15.42 1 12.24 1 5.466 1 0 6.368 0 13s5.466 12 12.24 12c7.08 0 11.79-4.896 11.79-11.79 0-.795-.085-1.402-.19-1.925H12.24z"/>
                  </svg>
                  Google Sign-In
                </button>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg font-mono text-[9px] text-slate-400 text-center leading-normal">
                Demo Auth Creds: <br/> 
                Email: <strong>admin@samuelos.co</strong> <br/>
                Password: <strong>samuel_secure_os_pwd</strong>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Shared Footer block */}
      <Footer 
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLogin={() => setShowLoginModal(true)}
      />

    </div>
  );
}
