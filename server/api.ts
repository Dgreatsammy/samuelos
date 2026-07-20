import { Router, Request, Response } from 'express';
import { db } from './db';
import { getAuth } from 'firebase-admin/auth';
import fsSync from 'fs';
import path from 'path';
import { 
  generateDigitalAuditAI, 
  generatePersonalizedOutreachAI, 
  generateCareerEvidenceAI 
} from './gemini';
import { Prospect, Audit, Outreach, Client, Project, CaseStudy, CareerEntry, KnowledgeItem, ScoreDetails } from '../src/types';

export const apiRouter = Router();

// Wrap async handlers automatically to handle errors gracefully and prevent crashes/hanging
const originalGet = apiRouter.get.bind(apiRouter);
const originalPost = apiRouter.post.bind(apiRouter);
const originalDelete = apiRouter.delete.bind(apiRouter);

apiRouter.get = function(path: any, ...handlers: any[]) {
  const wrapped = handlers.map(h => typeof h === 'function' ? (req: any, res: any, next: any) => Promise.resolve(h(req, res, next)).catch(next) : h);
  return originalGet(path, ...wrapped);
} as any;

apiRouter.post = function(path: any, ...handlers: any[]) {
  const wrapped = handlers.map(h => typeof h === 'function' ? (req: any, res: any, next: any) => Promise.resolve(h(req, res, next)).catch(next) : h);
  return originalPost(path, ...wrapped);
} as any;

apiRouter.delete = function(path: any, ...handlers: any[]) {
  const wrapped = handlers.map(h => typeof h === 'function' ? (req: any, res: any, next: any) => Promise.resolve(h(req, res, next)).catch(next) : h);
  return originalDelete(path, ...wrapped);
} as any;


// Helper to calculate score and priority
function calculateLeadScore(details: ScoreDetails): { score: number; priority: 'A' | 'B' | 'C' } {
  const score = (details.digitalGap || 0) + 
                (details.businessPotential || 0) + 
                (details.commercialPotential || 0) + 
                (details.accessibility || 0) + 
                (details.timingIntent || 0);
  
  let priority: 'A' | 'B' | 'C' = 'C';
  if (score >= 75) priority = 'A';
  else if (score >= 50) priority = 'B';

  return { score, priority };
}

// Load config synchronously at module load time for API Key
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let webApiKey = '';
try {
  if (fsSync.existsSync(configPath)) {
    const configData = JSON.parse(fsSync.readFileSync(configPath, 'utf-8'));
    webApiKey = configData.apiKey;
  }
} catch (e) {
  console.error("Failed to load webApiKey in api.ts", e);
}

// requireAdmin middleware verifying Firebase ID token
export async function requireAdmin(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please sign in.' });
  }

  const token = authHeader.split('Bearer ')[1];

  // Support transitional mock token
  if (token === 'samuelos-mock-session-token-2026') {
    return next();
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Check if admin document exists in `/admins/{uid}`
    const adminDoc = await db.getAdmin(uid);

    if (adminDoc && adminDoc.role === 'admin') {
      (req as any).user = { uid, email, role: 'admin' };
      return next();
    }

    // Auto-provision if designated admin email
    const settings = await db.getSettings();
    const adminEmail = settings?.adminEmail || 'oluwaseunsdr@gmail.com';

    const isDesignatedAdmin = 
      email === 'oluwaseunsdr@gmail.com' || 
      email === 'admin@samuelos.co' || 
      email === adminEmail;

    if (isDesignatedAdmin) {
      await db.saveAdmin(uid, {
        email,
        role: 'admin',
        createdAt: new Date().toISOString()
      });

      (req as any).user = { uid, email, role: 'admin' };
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden. You are not an authorized admin.' });
  } catch (error: any) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.', error: error.message });
  }
}

// Auth API with Firebase REST API and token sign-in support
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, token } = req.body;

    // Case 1: ID Token sent directly (Google Sign-In)
    if (token) {
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;
        const emailVerified = decodedToken.email;

        const adminDoc = await db.getAdmin(uid);
        const settings = await db.getSettings();

        const isDesignatedAdmin = 
          emailVerified === 'oluwaseunsdr@gmail.com' || 
          emailVerified === 'admin@samuelos.co' || 
          emailVerified === settings.adminEmail;

        if (adminDoc && adminDoc.role === 'admin') {
          return res.json({ success: true, user: { email: emailVerified, role: 'admin' }, token });
        } else if (isDesignatedAdmin) {
          await db.saveAdmin(uid, {
            email: emailVerified,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          return res.json({ success: true, user: { email: emailVerified, role: 'admin' }, token });
        } else {
          return res.status(403).json({ success: false, message: 'Forbidden. Not an authorized admin.' });
        }
      } catch (err: any) {
        return res.status(401).json({ success: false, message: 'Invalid token.', error: err.message });
      }
    }

    // Case 2: Email and password sign-in (use REST API)
    if (email && password) {
      const settings = await db.getSettings();

      // Support fallback mock if api key is missing
      if (!webApiKey) {
        const isValidMock = 
          (email === 'admin@samuelos.co' && password === 'samuel_secure_os_pwd') ||
          (email === settings.adminEmail && password === settings.adminPassword) ||
          (email === 'oluwaseunsdr@gmail.com' && password === 'samuelos_secure_pass');

        if (isValidMock) {
          return res.json({ success: true, user: { email, role: 'admin' }, token: 'samuelos-mock-session-token-2026' });
        }
      }

      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${webApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return res.status(401).json({ 
          success: false, 
          message: errData.error?.message || 'Invalid credentials. Please try again.' 
        });
      }

      const resData = (await response.json()) as any;
      const idToken = resData.idToken;
      const uid = resData.localId;

      // Ensure /admins/{uid} record exists
      const adminDoc = await db.getAdmin(uid);
      if (!adminDoc) {
        await db.saveAdmin(uid, {
          email,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }

      return res.json({ 
        success: true, 
        user: { email, role: 'admin' }, 
        token: idToken 
      });
    }

    return res.status(400).json({ success: false, message: 'Missing credentials.' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Services API
apiRouter.get('/services', async (req: Request, res: Response) => {
  const list = await db.getServices();
  res.json(list);
});

apiRouter.post('/services', requireAdmin, async (req: Request, res: Response) => {
  const service = req.body;
  const saved = await db.saveService(service);
  res.json(saved);
});

apiRouter.delete('/services/:id', requireAdmin, async (req: Request, res: Response) => {
  await db.deleteService(req.params.id);
  res.json({ success: true });
});

// Offers API
apiRouter.get('/offers', async (req: Request, res: Response) => {
  const list = await db.getOffers();
  res.json(list);
});

apiRouter.post('/offers', requireAdmin, async (req: Request, res: Response) => {
  const offer = req.body;
  const saved = await db.saveOffer(offer);
  res.json(saved);
});

apiRouter.delete('/offers/:id', requireAdmin, async (req: Request, res: Response) => {
  await db.deleteOffer(req.params.id);
  res.json({ success: true });
});

// Prospects API
apiRouter.get('/prospects', requireAdmin, async (req: Request, res: Response) => {
  const list = await db.getProspects();
  res.json(list);
});

apiRouter.post('/prospects', requireAdmin, async (req: Request, res: Response) => {
  const prospect = req.body as Prospect;
  
  // Re-calculate score and priority before saving
  if (prospect.scoreDetails) {
    const calculated = calculateLeadScore(prospect.scoreDetails);
    prospect.leadScore = calculated.score;
    prospect.priority = calculated.priority;
  }

  const saved = await db.saveProspect(prospect);
  res.json(saved);
});

apiRouter.delete('/prospects/:id', requireAdmin, async (req: Request, res: Response) => {
  await db.deleteProspect(req.params.id);
  res.json({ success: true });
});

// Bulk Import Prospects API
apiRouter.post('/prospects/import', requireAdmin, async (req: Request, res: Response) => {
  try {
    const list = req.body as Prospect[];
    const existing = await db.getProspects();
    const imported: Prospect[] = [];

    for (const item of list) {
      // Basic duplicate detection: match by business name
      const isDup = existing.some(p => p.businessName.toLowerCase().trim() === item.businessName.toLowerCase().trim());
      if (!isDup) {
        // Ensure valid score and priority
        if (!item.scoreDetails) {
          item.scoreDetails = { digitalGap: 15, businessPotential: 15, commercialPotential: 10, accessibility: 10, timingIntent: 10 };
        }
        const calculated = calculateLeadScore(item.scoreDetails);
        item.leadScore = calculated.score;
        item.priority = calculated.priority;
        item.id = item.id || `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        item.researchDate = item.researchDate || new Date().toISOString().split('T')[0];
        
        await db.saveProspect(item);
        imported.push(item);
      }
    }

    res.json({ success: true, count: imported.length, imported });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to import CSV' });
  }
});

// Digital Audit API
apiRouter.get('/audits', requireAdmin, async (req: Request, res: Response) => {
  const list = await db.getAudits();
  const prospects = await db.getProspects();
  const enriched = list.map(audit => {
    const p = prospects.find(p => p.id === audit.prospectId);
    return {
      ...audit,
      businessName: p ? p.businessName : (audit.businessName || 'Unknown')
    };
  });
  res.json(enriched);
});

apiRouter.get('/audits/:prospectId', requireAdmin, async (req: Request, res: Response) => {
  const list = await db.getAudits();
  const prospects = await db.getProspects();
  const filtered = list.filter(a => a.prospectId === req.params.prospectId).map(audit => {
    const p = prospects.find(p => p.id === audit.prospectId);
    return {
      ...audit,
      businessName: p ? p.businessName : (audit.businessName || 'Unknown')
    };
  });
  res.json(filtered);
});

apiRouter.post('/audits', requireAdmin, async (req: Request, res: Response) => {
  const audit = req.body as Audit;
  const saved = await db.saveAudit(audit);
  res.json(saved);
});

// Generate and save Audit (covers both internal admin audit and public lead requests)
apiRouter.post('/audits/generate', async (req: Request, res: Response) => {
  try {
    const { businessName, websiteUrl, industry, location, mainGoal, prospectId, isPublicLead, email, phone } = req.body;

    let targetProspectId = prospectId;

    // If it's a public lead or a new prospect is being audited directly
    if (isPublicLead || !targetProspectId) {
      // 1. Create a lead prospect record first
      const newProspect: Prospect = {
        id: `p-${Date.now()}`,
        businessName: businessName || 'Public Request Lead',
        category: industry || 'SMB',
        industry: industry || 'Professional Services',
        location: location || 'Online',
        websiteUrl: websiteUrl || '',
        websiteStatus: websiteUrl ? 'NEEDS_VERIFICATION' : 'NO_WEBSITE',
        email: email || '',
        phone: phone || '',
        whatsapp: phone || '',
        source: isPublicLead ? 'Public Website Audit Form' : 'Direct Diagnostic',
        researchDate: new Date().toISOString().split('T')[0],
        digitalGap: 'Awaiting visual assessment',
        businessOpportunity: 'Requested digital audit for conversion and growth analysis',
        leadScore: 60,
        scoreDetails: {
          digitalGap: websiteUrl ? 15 : 25,
          businessPotential: 15,
          commercialPotential: 10,
          accessibility: 10,
          timingIntent: 10
        },
        priority: 'B',
        status: 'Research',
        notes: `Main Goal: ${mainGoal || 'None stated'}. Request submitted via digital presence pathway.`
      };

      await db.saveProspect(newProspect);
      targetProspectId = newProspect.id;
    }

    // 2. Run Gemini Audit generation
    const auditData = await generateDigitalAuditAI(
      businessName,
      websiteUrl,
      industry,
      location,
      mainGoal || 'Growth & Conversion'
    );

    const fullAudit: Audit = {
      id: `audit-${Date.now()}`,
      prospectId: targetProspectId,
      createdAt: new Date().toISOString().split('T')[0],
      overallScore: auditData.overallScore || 60,
      strengths: auditData.strengths || [],
      gaps: auditData.gaps || [],
      missedOpportunity: auditData.missedOpportunity || '',
      recommendedSolution: auditData.recommendedSolution || '',
      recommendedOfferId: isPublicLead ? 'o-audit' : (auditData.recommendedSolution?.toLowerCase().includes('booking') ? 'o-conversion' : 'o-website'),
      
      discoverability: auditData.discoverability || { score: 50, observation: '', evidence: '', recommendation: '' },
      credibility: auditData.credibility || { score: 50, observation: '', evidence: '', recommendation: '' },
      digitalPresence: auditData.digitalPresence || { score: 50, observation: '', evidence: '', recommendation: '' },
      conversion: auditData.conversion || { score: 50, observation: '', evidence: '', recommendation: '' },
      contact: auditData.contact || { score: 50, observation: '', evidence: '', recommendation: '' },
      booking: auditData.booking || { score: 50, observation: '', evidence: '', recommendation: '' },
      googleVisibility: auditData.googleVisibility || { score: 50, observation: '', evidence: '', recommendation: '' },
      mobile: auditData.mobile || { score: 50, observation: '', evidence: '', recommendation: '' },
      socialJourney: auditData.socialJourney || { score: 50, observation: '', evidence: '', recommendation: '' },
      followUp: auditData.followUp || { score: 50, observation: '', evidence: '', recommendation: '' },
    };

    const savedAudit = await db.saveAudit(fullAudit);

    // 3. Update the prospect with recommended offer and new lead score derived from audit
    const prospects = await db.getProspects();
    const prospect = prospects.find(p => p.id === targetProspectId);
    if (prospect) {
      prospect.leadScore = Math.round((100 - fullAudit.overallScore) * 0.7 + 30); // Higher gap score = higher lead quality
      prospect.priority = prospect.leadScore >= 75 ? 'A' : (prospect.leadScore >= 50 ? 'B' : 'C');
      prospect.recommendedOfferId = fullAudit.recommendedOfferId;
      prospect.digitalGap = fullAudit.gaps.join(', ');
      prospect.businessOpportunity = fullAudit.missedOpportunity;
      if (prospect.websiteUrl && !prospect.websiteUrl.startsWith('http')) {
        prospect.websiteUrl = websiteUrl;
      }
      await db.saveProspect(prospect);
    }

    res.json({ success: true, audit: savedAudit, prospectId: targetProspectId });
  } catch (error) {
    console.error('Audit generation API route failed:', error);
    res.status(500).json({ success: false, message: 'Failed to generate audit' });
  }
});

apiRouter.post('/audits/:prospectId/request-consultation', async (req: Request, res: Response) => {
  try {
    const { prospectId } = req.params;
    const { preferredContactChannel, additionalNotes } = req.body;

    const prospects = await db.getProspects();
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found' });
    }

    // Update prospect status to Discovery, meaning they have requested deeper audit/consultation
    prospect.status = 'Discovery';
    prospect.notes = `${prospect.notes || ''}\n\n[INBOUND CONVERSION - 2026] User requested Deeper Audit / Consultation!\nPreferred Channel: ${preferredContactChannel || 'Any'}\nUser Message: ${additionalNotes || 'None'}`;

    // Recalculate leadScore if possible, boosting timingIntent to show direct intent
    if (prospect.scoreDetails) {
      prospect.scoreDetails.timingIntent = 15; // Set timing intent to maximum since they literally requested a call!
      const calculated = calculateLeadScore(prospect.scoreDetails);
      prospect.leadScore = calculated.score;
      prospect.priority = calculated.priority;
    }

    await db.saveProspect(prospect);
    res.json({ success: true, message: 'Consultation requested successfully!' });
  } catch (error) {
    console.error('Request consultation API route failed:', error);
    res.status(500).json({ success: false, message: 'Failed to request consultation' });
  }
});

// Outreach API
apiRouter.get('/outreaches', requireAdmin, async (req: Request, res: Response) => {
  const list = await db.getOutreaches();
  res.json(list);
});

apiRouter.post('/outreaches', requireAdmin, async (req: Request, res: Response) => {
  const outreach = req.body;
  const saved = await db.saveOutreach(outreach);
  res.json(saved);
});

apiRouter.post('/outreaches/generate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { prospectId, channel } = req.body;
    
    const prospects = await db.getProspects();
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found' });
    }

    const audits = await db.getAudits();
    const audit = audits.find(a => a.prospectId === prospectId);

    const message = await generatePersonalizedOutreachAI(prospect, channel, audit);
    
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate outreach message' });
  }
});

// Clients API
apiRouter.get('/clients', requireAdmin, async (req: Request, res: Response) => {
  const list = await db.getClients();
  res.json(list);
});

apiRouter.post('/clients', requireAdmin, async (req: Request, res: Response) => {
  const client = req.body;
  const saved = await db.saveClient(client);
  res.json(saved);
});

// Projects API
apiRouter.get('/projects', requireAdmin, async (req: Request, res: Response) => {
  const list = await db.getProjects();
  res.json(list);
});

apiRouter.post('/projects', requireAdmin, async (req: Request, res: Response) => {
  const project = req.body as Project;
  const saved = await db.saveProject(project);

  // If marked completed, automatically check if we should create a Case Study or Career entry skeleton
  if (project.status === 'Completed') {
    const caseStudies = await db.getCaseStudies();
    const hasCS = caseStudies.some(cs => cs.projectId === project.id);
    if (!hasCS) {
      // Draft a case study skeleton
      const clients = await db.getClients();
      const client = clients.find(c => c.id === project.clientId);
      const newCS: CaseStudy = {
        id: `cs-${Date.now()}`,
        projectId: project.id,
        title: `Transforming Digital Workflow: ${project.projectName}`,
        clientName: client ? client.businessName : 'Client',
        problem: project.description || 'Outdated business workflow structures.',
        approach: 'Identified core delivery blockages and engineered tailored modules.',
        solution: `Implemented custom automation systems and elite digital components: ${project.deliverables.join(', ')}.`,
        result: 'Achieved streamlined processing and eliminated manual delivery overhead.',
        technologies: ['React', 'TypeScript', 'Node.js'],
        images: [],
        publishedStatus: 'Draft'
      };
      await db.saveCaseStudy(newCS);
    }
  }

  res.json(saved);
});

// Case Studies API
apiRouter.get('/case-studies', async (req: Request, res: Response) => {
  const list = await db.getCaseStudies();
  res.json(list);
});

apiRouter.post('/case-studies', requireAdmin, async (req: Request, res: Response) => {
  const cs = req.body;
  const saved = await db.saveCaseStudy(cs);
  res.json(saved);
});

// Career Engine API
apiRouter.get('/career-entries', async (req: Request, res: Response) => {
  const list = await db.getCareerEntries();
  res.json(list);
});

apiRouter.post('/career-entries', requireAdmin, async (req: Request, res: Response) => {
  const entry = req.body;
  const saved = await db.saveCareerEntry(entry);
  res.json(saved);
});

apiRouter.delete('/career-entries/:id', requireAdmin, async (req: Request, res: Response) => {
  await db.deleteCareerEntry(req.params.id);
  res.json({ success: true });
});

apiRouter.post('/career-entries/generate-evidence', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { projectName, description, deliverables, outcomeResult } = req.body;
    const evidence = await generateCareerEvidenceAI(projectName, description, deliverables || [], outcomeResult || '');
    res.json({ success: true, evidence });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate career evidence' });
  }
});

// Knowledge Base API
apiRouter.get('/knowledge-items', async (req: Request, res: Response) => {
  const list = await db.getKnowledgeItems();
  res.json(list);
});

apiRouter.post('/knowledge-items', requireAdmin, async (req: Request, res: Response) => {
  const item = req.body;
  const saved = await db.saveKnowledgeItem(item);
  res.json(saved);
});

apiRouter.delete('/knowledge-items/:id', requireAdmin, async (req: Request, res: Response) => {
  await db.deleteKnowledgeItem(req.params.id);
  res.json({ success: true });
});

// Settings API
apiRouter.get('/settings', requireAdmin, async (req: Request, res: Response) => {
  const config = await db.getSettings();
  res.json(config);
});

apiRouter.post('/settings', requireAdmin, async (req: Request, res: Response) => {
  const config = req.body;
  const saved = await db.saveSettings(config);
  res.json(saved);
});

// Global API error handler
apiRouter.use((err: any, req: Request, res: Response, next: any) => {
  console.error(`[API Global Error Handler] Failure on ${req.method} ${req.path}:`, err);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'An unexpected server or database error occurred.' 
  });
});

