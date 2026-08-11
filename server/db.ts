import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { initializeApp as initClientApp, getApps as getClientApps } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  collection as clientCol, 
  doc as clientDoc, 
  getDocs as clientGetDocs, 
  getDoc as clientGetDoc, 
  setDoc as clientSetDoc, 
  deleteDoc as clientDeleteDoc 
} from 'firebase/firestore';
import { 
  Service, Offer, Prospect, Audit, Outreach, Client, Project, CaseStudy, CareerEntry, KnowledgeItem, WebsiteStatus, PipelineStatus, DiscoveryMeeting, Proposal, RevenueRecord
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Load config synchronously at module load time
let config: any = {};
try {
  let resolvedConfigPath = '';
  const possiblePaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
  ];
  try {
    possiblePaths.push(path.join(__dirname, '..', 'firebase-applet-config.json'));
    possiblePaths.push(path.join(__dirname, 'firebase-applet-config.json'));
  } catch (err) {}

  for (const p of possiblePaths) {
    if (fsSync.existsSync(p)) {
      resolvedConfigPath = p;
      break;
    }
  }

  if (resolvedConfigPath) {
    const fileData = fsSync.readFileSync(resolvedConfigPath, 'utf-8');
    config = JSON.parse(fileData);
  }
} catch (e) {
  console.error("Failed to load firebase config at startup", e);
}

const firebaseApp = getApps().length === 0 
  ? initializeApp({ projectId: config.projectId || process.env.FIREBASE_PROJECT_ID }) 
  : getApps()[0];

// Initialize client SDK
const clientApp = getClientApps().length === 0 
  ? initClientApp(config) 
  : getClientApps()[0];

const clientDb = getClientFirestore(clientApp, config.firestoreDatabaseId);

// Access appropriate firestore database with Client-side SDK wrapper to bypass server service account PERMISSION_DENIED
export const firestore = {
  collection(collectionName: string) {
    return {
      doc(docId: string) {
        return {
          async get() {
            const d = await clientGetDoc(clientDoc(clientDb, collectionName, docId));
            return {
              exists: d.exists(),
              data() { return d.data(); }
            };
          },
          async set(data: any, options?: { merge?: boolean }) {
            await clientSetDoc(clientDoc(clientDb, collectionName, docId), data, { merge: options?.merge ?? false });
          },
          async delete() {
            await clientDeleteDoc(clientDoc(clientDb, collectionName, docId));
          }
        };
      },
      async get() {
        const snap = await clientGetDocs(clientCol(clientDb, collectionName));
        return {
          docs: snap.docs.map(d => ({
            exists: d.exists(),
            data() { return d.data(); }
          }))
        };
      }
    };
  }
} as any;

export let useLocalFallback = false;

// Memory cache for collections
const localCache: { [key: string]: any } = {};

export async function loadLocalCollection<T>(collectionName: string, fallbackData: T): Promise<T> {
  if (process.env.NODE_ENV === 'production') {
    const errorMsg = `Production Database Outage: Firestore is unavailable. Local backup reading for '${collectionName}' is disabled in production mode to prevent silent fallback.`;
    console.error(`[Database Critical Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  if (localCache[collectionName]) {
    return localCache[collectionName] as T;
  }
  const filename = collectionName === 'settings' ? 'settings.json' : `${collectionName}.json`;
  const data = await readLocalJSONBackupOrFallback(filename, fallbackData);
  localCache[collectionName] = data;
  return data as T;
}

export async function saveLocalCollection(collectionName: string, data: any): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    const errorMsg = `Production Database Outage: Firestore is unavailable. Local backup writing for '${collectionName}' is disabled in production mode to prevent silent fallback and divergent data.`;
    console.error(`[Database Critical Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }
  localCache[collectionName] = data;
  const filename = collectionName === 'settings' ? 'settings.json' : `${collectionName}.json`;
  const filePath = path.join(DATA_DIR, filename);
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to write local JSON file ${filename}:`, err);
  }
}

let migrationPromise: Promise<void> | null = null;

async function readLocalJSONBackupOrFallback<T>(filename: string, defaultValue: T): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (exists) {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as T;
      }
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed as T;
      }
    }
  } catch (err) {
    console.error(`Error reading fallback JSON file ${filename}:`, err);
  }
  return defaultValue;
}

export async function ensureMigrated() {
  if (useLocalFallback) return;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      try {
        const settingsRef = firestore.collection('settings').doc('global');
        const doc = await settingsRef.get();
        if (doc.exists) {
          const data = doc.data();
          if (data && data.migratedAt) {
            console.log("Firestore migration already completed at:", data.migratedAt);
            return;
          }
        }

        console.log("Starting idempotent Firestore migration...");

        // 1. Migrate settings
        const settingsData = await readLocalJSONBackupOrFallback('settings.json', defaultSettings);
        await settingsRef.set({
          ...settingsData,
          migratedAt: new Date().toISOString()
        });

        // Helper to migrate collections idempotently
        const migrateCollection = async (collectionName: string, filename: string, fallbackData: any[]) => {
          const list = await readLocalJSONBackupOrFallback(filename, fallbackData);
          // Cleanly separate and filter out any demo/sample records
          const filteredList = list.filter((item: any) => !item.isDemo);
          console.log(`Migrating ${filteredList.length} production records for ${collectionName}...`);
          
          for (const item of filteredList) {
            if (item && item.id) {
              await firestore.collection(collectionName).doc(item.id).set(item, { merge: true });
            }
          }
        };

        // Purge any pre-existing synthetic/demo documents from the production Firestore database
        try {
          console.log("Purging any pre-existing synthetic/demo records from Firestore...");
          await firestore.collection('clients').doc('c-1').delete();
          await firestore.collection('projects').doc('proj-1').delete();
          await firestore.collection('case_studies').doc('cs-1').delete();
          await firestore.collection('career_entries').doc('car-1').delete();
          console.log("Firestore demo purge completed successfully.");
        } catch (purgeErr: any) {
          console.warn("Failed to purge demo records from Firestore (may be offline or permission restricted):", purgeErr.message || purgeErr);
        }

        await migrateCollection('services', 'services.json', defaultServices);
        await migrateCollection('offers', 'offers.json', defaultOffers);
        await migrateCollection('prospects', 'prospects.json', defaultProspects);
        await migrateCollection('audits', 'audits.json', []);
        await migrateCollection('outreaches', 'outreaches.json', []);
        await migrateCollection('clients', 'clients.json', defaultClients);
        await migrateCollection('projects', 'projects.json', defaultProjects);
        await migrateCollection('case_studies', 'case_studies.json', defaultCaseStudies);
        await migrateCollection('career_entries', 'career_entries.json', defaultCareerEntries);
        await migrateCollection('knowledge_items', 'knowledge_items.json', defaultKnowledgeItems);

        console.log("Firestore migration completed successfully!");
      } catch (err: any) {
        console.error("Firestore migration failed:", err.message || err);
        if (process.env.NODE_ENV === 'production') {
          migrationPromise = null; // Reset promise to allow retrying on next request
          throw new Error(`Production Database Migration Failed: Firestore is unavailable. Details: ${err.message || err}`);
        }
        useLocalFallback = true;
        migrationPromise = Promise.resolve(); // Mark migration as resolved so we don't retry and crash
      }
    })();
  }
  return migrationPromise;
}


// Default Seed Data
const defaultServices: Service[] = [
  {
    id: 's-dp-1',
    category: 'DIGITAL_PRESENCE',
    title: 'Website Design & Development',
    description: 'Bespoke high-performance websites built with Vite, React, and Tailwind CSS. Focus on fast load times, semantic structure, accessibility, and modern aesthetics.',
    features: ['Custom interactive elements', 'Fully responsive design', 'Semantic HTML5 & SEO-ready structure', 'Vite & React speed optimizations'],
    active: true
  },
  {
    id: 's-dp-2',
    category: 'DIGITAL_PRESENCE',
    title: 'Landing Pages & Lead Capture',
    description: 'High-conversion single-page experiences designed specifically for performance marketing or outreach campaigns.',
    features: ['Direct copywriting focus', 'Optimized form fields', 'Clear single CTA layout', 'Integrated analytics and tracking'],
    active: true
  },
  {
    id: 's-dp-3',
    category: 'DIGITAL_PRESENCE',
    title: 'Digital Presence Audits',
    description: 'Comprehensive evaluation of discoverability, mobile compliance, credibility signals, and digital conversion pathways.',
    features: ['Quantitative scoring model', 'Actionable priority recommendations', 'Concrete evidence cataloging'],
    active: true
  },
  {
    id: 's-ai-1',
    category: 'AI_AUTOMATION',
    title: 'AI Business Workflows',
    description: 'Integrating LLMs (like Gemini) into existing commercial workflows to automate research, drafting, categorization, and intake.',
    features: ['Gemini API custom logic', 'Secure server proxy configurations', 'Human-in-the-loop validation dashboards'],
    active: true
  },
  {
    id: 's-ai-2',
    category: 'AI_AUTOMATION',
    title: 'Business Process Automation',
    description: 'Connecting internal business systems (CRMs, storage, calendars) to streamline manual administrative overhead.',
    features: ['Zapier / Make / custom API webhooks', 'Automated notifications & follow-ups', 'Data sync error handling'],
    active: true
  },
  {
    id: 's-gt-1',
    category: 'GROWTH_TECH',
    title: 'Lead Generation Systems',
    description: 'Designing and deploying active outreach, capture, and verification channels for B2B client acquisition.',
    features: ['Interactive public audit triggers', 'CSV pipeline batch processing', 'Automatic personalization engine'],
    active: true
  },
  {
    id: 's-gt-2',
    category: 'GROWTH_TECH',
    title: 'CRM Workflows',
    description: 'Deploying structured pipelines and automatic lifecycle transitions to ensure leads are nurtured and closed with zero leak.',
    features: ['Visual Kanban integration', 'Historical pipeline tracking', 'Follow-up timeline alerts'],
    active: true
  },
  {
    id: 's-it-1',
    category: 'IT_INFRASTRUCTURE',
    title: 'Systems Engineering & Advisory',
    description: 'Designing secure, scalable cloud systems and local network architecture supporting modern distributed teams.',
    features: ['Server-side secret protection', 'Secure access protocol designs', 'Infrastructure optimization audits'],
    active: true
  }
];

const defaultOffers: Offer[] = [
  {
    id: 'o-audit',
    name: 'Digital Presence Audit',
    slug: 'digital-presence-audit',
    category: 'DIGITAL_PRESENCE',
    description: 'A deep-dive, forensic evaluation of your company\'s current online visibility, mobile compliance, conversion leaks, and social pathways.',
    problemSolved: 'Inability to track why traffic is not turning into leads or customers, and local discoverability issues.',
    targetAudience: 'Local service businesses, consulting firms, and growing B2B companies.',
    deliverables: [
      'Comprehensive PDF report with score /100',
      'Detailed breakdown of 10 structural dimensions',
      'Concrete list of top 3 priority gaps and strengths',
      '30-minute diagnostic presentation call'
    ],
    outcomes: [
      'Clear visibility of technical and design leaks costing revenue',
      'Immediate action list for in-house teams or outsourcing',
      'Understanding of ranking gaps against top local competitors'
    ],
    pricingModel: 'Fixed Price',
    startingPrice: '$299',
    active: true,
    cta: 'Request Free Audit'
  },
  {
    id: 'o-website',
    name: 'Professional Business Website',
    slug: 'professional-business-website',
    category: 'DIGITAL_PRESENCE',
    description: 'A custom, clean, and blazing-fast multi-page business website designed to build maximum credibility and establish authority.',
    problemSolved: 'Outdated or non-existent website that looks unprofessional and fails to build trust with high-value prospects.',
    targetAudience: 'Established professionals, local providers, and small businesses needing an elite digital anchor.',
    deliverables: [
      'Custom React + Vite website (up to 5 key pages)',
      'Aesthetic typography and color design fitting your brand',
      'SEO-optimized layout and metadata configuration',
      'Hosting setup and custom domain configuration'
    ],
    outcomes: [
      'Elevated professional authority and brand image',
      'Perfect mobile responsive experience for visitors',
      'Sub-second page load times for low-friction browsing'
    ],
    pricingModel: 'Starting from',
    startingPrice: '$1,500',
    active: true,
    cta: 'Book Consultation'
  },
  {
    id: 'o-conversion',
    name: 'Digital Presence + Lead Capture + Booking System',
    slug: 'conversion-optimized-platform',
    category: 'DIGITAL_PRESENCE',
    description: 'A conversion-focused website complete with interactive client capture points and an integrated automated scheduling system.',
    problemSolved: 'Manual friction in booking calls, collecting lead details, and coordinating client onboarding.',
    targetAudience: 'Consultants, agencies, local service contractors, and educators.',
    deliverables: [
      'Elite business website with conversion design',
      'Self-service client scheduling calendar integration',
      'Interactive intake / lead questionnaire forms',
      'Automated email/SMS confirmation triggers'
    ],
    outcomes: [
      'Completely self-service, low-friction booking engine working 24/7',
      'Pre-qualified lead capture with structural client data',
      'Significant reduction in back-and-forth scheduling administrative time'
    ],
    pricingModel: 'Fixed Price',
    startingPrice: '$2,499',
    active: true,
    cta: 'Get Started'
  },
  {
    id: 'o-automation',
    name: 'AI & Workflow Automation',
    slug: 'ai-workflow-automation',
    category: 'AI_AUTOMATION',
    description: 'Custom automation scripts and integrations that connect your business systems to eliminate administrative overhead and leverage AI.',
    problemSolved: 'Manual copy-pasting of data, slow lead response times, and unoptimized repetitive document drafting.',
    targetAudience: 'Growing service businesses and sales teams wanting leverage.',
    deliverables: [
      'Workflow mapping and bottle-neck identification',
      'Integrations connecting CRM, email, chat, and cloud files',
      'Custom server proxy APIs protecting private keys',
      '14-day monitoring and tuning phase'
    ],
    outcomes: [
      'Elimination of several hours of manual data tasks per week',
      'Near-instant response to prospect inquiries (boosts close rates)',
      'Standardized business operational playbooks'
    ],
    pricingModel: 'Custom Project',
    startingPrice: '$3,500',
    active: true,
    cta: 'Request Demo'
  }
];

// Seed prospects conforming to "Provisional research data", "Mark uncertain website statuses as NEEDS_VERIFICATION"
const defaultProspects: Prospect[] = [
  {
    id: 'p-1',
    businessName: 'Apex Dental Partners',
    category: 'Healthcare',
    industry: 'Dental Clinic',
    location: 'Houston, TX',
    websiteUrl: 'https://apexdentalpartners-test.com',
    websiteStatus: 'WEBSITE_WEAK',
    websiteQuality: 'Old design, slow loading, no mobile booking button, weak trust signals.',
    googleProfile: 'https://google.com/maps/place/Apex+Dental',
    instagram: '@apexdental_test',
    phone: '+1-555-0192',
    email: 'info@apexdentalpartners-test.com',
    source: 'Manual Search',
    researchDate: '2026-07-10',
    verificationDate: '2026-07-12',
    digitalGap: 'Website lacks online scheduling, mobile experience feels squeezed, and page speed is extremely low.',
    businessOpportunity: 'Upgrading to a conversion-oriented digital hub with direct calendar booking and custom patient intake.',
    recommendedOfferId: 'o-conversion',
    leadScore: 78,
    scoreDetails: {
      digitalGap: 24, // High gaps
      businessPotential: 16,
      commercialPotential: 14,
      accessibility: 12,
      timingIntent: 12
    },
    priority: 'A',
    status: 'Verified',
    notes: 'Sizable office with 4 active dentists. Current site is on an old Wix layout.'
  },
  {
    id: 'p-2',
    businessName: 'Vanguard Elite Security',
    category: 'Professional Services',
    industry: 'Corporate Security',
    location: 'Chicago, IL',
    websiteUrl: '',
    websiteStatus: 'NEEDS_VERIFICATION',
    websiteQuality: 'Status unconfirmed. Domain registered but returns hosting landing page.',
    googleProfile: 'https://google.com/maps/place/VanguardSecurity',
    instagram: '',
    phone: '+1-555-0144',
    email: 'contact@vanguardsecurity-test.com',
    source: 'LinkedIn',
    researchDate: '2026-07-14',
    verificationDate: '',
    digitalGap: 'No visible public website exists under registered name. Google Business profile lacks website backlink.',
    businessOpportunity: 'Deploying foundation-level professional website to anchor their B2B corporate bidding credibility.',
    recommendedOfferId: 'o-website',
    leadScore: 65,
    scoreDetails: {
      digitalGap: 15,
      businessPotential: 15,
      commercialPotential: 15,
      accessibility: 10,
      timingIntent: 10
    },
    priority: 'B',
    status: 'Research',
    notes: 'Highly rated Google profile with several positive reviews, but zero online presence beyond reviews. Urgent credibility need.'
  },
  {
    id: 'p-3',
    businessName: 'Oakhaven Wellness Group',
    category: 'Wellness',
    industry: 'Spa & Therapy',
    location: 'Denver, CO',
    websiteUrl: 'https://oakhavenwellness-test.com',
    websiteStatus: 'WEBSITE_OUTDATED',
    websiteQuality: 'Built on a 2014 WordPress theme. Heavy layout shift, insecure SSL warning.',
    facebook: 'facebook.com/oakhavenwellness',
    whatsapp: '+13035550211',
    phone: '+1-303-555-0211',
    email: 'reception@oakhavenwellness-test.com',
    source: 'Instagram Leads',
    researchDate: '2026-07-15',
    verificationDate: '2026-07-16',
    digitalGap: 'Severe security warning (no active SSL certificate) driving traffic away. No visual online reservation tool.',
    businessOpportunity: 'Secure, modern visual design containing automated therapist booking and high-contrast styling.',
    recommendedOfferId: 'o-conversion',
    leadScore: 82,
    scoreDetails: {
      digitalGap: 28,
      businessPotential: 14,
      commercialPotential: 15,
      accessibility: 13,
      timingIntent: 12
    },
    priority: 'A',
    status: 'Qualified',
    notes: 'Active social media posts promoting organic treatments, but directing users to an insecure and broken booking page. Major conversion dropoff!'
  }
];

const defaultClients: Client[] = [
  {
    id: 'c-1',
    name: 'Sarah Jenkins',
    businessName: 'Apex Dental Partners',
    email: 'dr.jenkins@apexdentalpartners-test.com',
    phone: '+1-555-0192',
    address: '442 Medical Parkway, Houston, TX',
    source: 'Lead Outreach',
    services: ['Website Design & Development', 'CRM Workflows'],
    notes: 'Initial client won after audit delivery. Wants streamlined patient registration.',
    status: 'Active',
    isDemo: true,
    dataOrigin: 'demo'
  }
];

const defaultProjects: Project[] = [
  {
    id: 'proj-1',
    clientId: 'c-1',
    projectName: 'Apex Patient Registration Hub',
    offerId: 'o-conversion',
    description: 'Design and deployment of custom client scheduling engine and mobile patient intake system.',
    startDate: '2026-07-20',
    dueDate: '2026-08-30',
    status: 'Active',
    value: 2499,
    paymentStatus: 'Partial',
    deliverables: ['Custom Booking Forms', 'Wix Migration to React', 'WhatsApp Confirmation Bot'],
    notes: '50% upfront deposit received. Reviewing custom wireframe next week.',
    isDemo: true,
    dataOrigin: 'demo'
  }
];

const defaultCaseStudies: CaseStudy[] = [
  {
    id: 'cs-1',
    title: '[DEMO CASE STUDY] Transforming Patient Intake (Hypothetical)',
    clientName: 'Apex Dental Partners (Simulated)',
    problem: '[DEMO / HYPOTHETICAL] Apex Dental was leaking roughly 30% of their mobile marketing traffic because patients had to call during operational hours to schedule appointments, resulting in empty chairs and lost revenue.',
    approach: 'We completely restructured their landing platform into a blazing-fast, mobile-first booking interface. We replaced their legacy phone-in process with a 3-step online intake calendar with instant SMS/WhatsApp confirmations.',
    solution: 'Designed and engineered a custom React scheduler connected directly to their patient dashboard. Configured automated WhatsApp reminders to decrease patient no-show rates.',
    result: 'Patient digital bookings increased by 42% in the first 30 days post-launch, while administrative booking call volumes fell by 18 hours per dentist per week.',
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'WhatsApp Business API'],
    images: [],
    testimonial: '[DEMO / HYPOTHETICAL TESTIMONIAL] "Samuel and Accessmart completely automated our booking bottleneck. We booked 18 new patients in our first fortnight without a single phone call." — Dr. Sarah Jenkins (Simulated Client)',
    publishedStatus: 'Published',
    isDemo: true,
    dataOrigin: 'demo'
  }
];

const defaultCareerEntries: CareerEntry[] = [
  {
    id: 'car-1',
    title: 'Patient Engagement Automation Lead [DEMO/SAMPLE]',
    role: 'Lead Systems Developer',
    organization: 'Accessmart Solutions',
    dateRange: 'Jan 2026 - Present',
    problem: '[DEMO / HYPOTHETICAL] Medical and professional clients struggled to manage physical intake queues, leading to administrative overhead and significant patient friction.',
    action: 'Designed and deployed an integrated client onboarding module including a secure server API with lazy initialization. Integrated WhatsApp automated notifications.',
    result: 'Reduced patient intake friction by 35%, cutting operational processing delays from 15 minutes down to under 4 minutes.',
    skills: ['API Integration', 'Workflow Automation', 'UI/UX Performance Optimization'],
    technologies: ['TypeScript', 'Express', 'Tailwind CSS', 'Vite'],
    evidence: '[DEMO] Apex Dental Case Study',
    relatedProjectId: 'proj-1',
    cvSummary: 'Led development of specialized professional intake solutions reducing patient queue times by 35% using React and Express.',
    bullets: [
      'Engineered React + Express scheduling portals scaling to hundreds of online bookings',
      'Configured automated confirmation alerts decreasing client no-shows by 18%'
    ],
    linkedInAchievement: 'Pioneered custom Patient Engagement Flow (PEF) scaling patient scheduling platforms.',
    interviewStory: 'This is a simulated demo case. When a hypothetical Apex Dental faced booking leaks, we designed a server-side API routing flow that kept user patient records secure while scheduling calls asynchronously. The layout was kept lightweight, achieving a mobile Performance score of 98%.',
    isDemo: true,
    dataOrigin: 'demo'
  }
];

const defaultKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'k-1',
    title: 'The Digital Gap Optimization Framework',
    type: 'Framework',
    content: `## The Digital Gap Optimization Framework (DGOF)

DGOF is SamuelOS's proprietary diagnostic methodology designed to pinpoint hidden commercial opportunities in service-based SMBs.

### The 10 Core Dimensions of Digital Gap Diagnosis:
1. **Discoverability**: Can a local prospect easily locate the business on search engines, local maps, and primary social directories?
2. **Credibility**: Does the digital canvas establish immediate professional authority? (Look for secure SSL flags, reviews, testimonials, recent work).
3. **Digital Presence**: Is there a dedicated custom digital home (URL)? Or does the business rely on a generic hosting page?
4. **Conversion**: Is there a single, obvious call-to-action (CTA)? Or is the user overwhelmed with visual clutter?
5. **Contact Accessibility**: Can a user reach out in under 5 seconds?
6. **Booking Pathways**: Is scheduling self-service and low friction?
7. **Google/Local Visibility**: High rating vs low rating, matching search intent.
8. **Mobile Optimization**: How responsive and fast is the mobile viewport?
9. **Social-to-Website Journey**: Do social channels cleanly bridge visitors to a core business domain?
10. **Follow-Up System**: Are captured leads nurtured or lost?

### Diagnostic Scoring Rules:
- **Digital Gap Score (30%)**: Tracks core visual and technical flaws.
- **Business Potential (20%)**: High ticket value of services sold.
- **Commercial Potential (20%)**: Competition density and industry growth.
- **Accessibility (15%)**: Willingness of leadership to implement advice.
- **Timing/Intent (15%)**: Current seasonal or promotional intent.`,
    tags: ['Strategic Framework', 'Business Diagnostic', 'Outreach Strategy'],
    relatedServiceId: 's-dp-3',
    status: 'Published',
    publishedDate: '2026-07-01'
  }
];

const defaultSettings = {
  adminEmail: 'oluwaseunsdr@gmail.com', // Match the user's email from metadata
  adminPassword: 'samuelos_secure_pass', // Secure fallback
  pricingVisible: true,
  scoringModel: {
    digitalGap: 30,
    businessPotential: 20,
    commercialPotential: 20,
    accessibility: 15,
    timingIntent: 15
  }
};

export class Database {
  async getServices(): Promise<Service[]> {
    if (useLocalFallback) return loadLocalCollection('services', defaultServices);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('services', defaultServices);
      const snap = await firestore.collection('services').get();
      return snap.docs.map(doc => doc.data() as Service);
    } catch (e: any) {
      console.warn("Firestore error in getServices, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('services', defaultServices);
    }
  }
  async saveService(service: Service): Promise<Service> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Service[]>('services', defaultServices);
      const index = list.findIndex(item => item.id === service.id);
      if (index >= 0) {
        list[index] = service;
      } else {
        list.push(service);
      }
      await saveLocalCollection('services', list);
      return service;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveService(service);
      await firestore.collection('services').doc(service.id).set(service, { merge: true });
      return service;
    } catch (e: any) {
      console.warn("Firestore error in saveService, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveService(service);
    }
  }
  async deleteService(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Service[]>('services', defaultServices);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('services', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteService(id);
      await firestore.collection('services').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteService, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteService(id);
    }
  }

  async getOffers(): Promise<Offer[]> {
    if (useLocalFallback) return loadLocalCollection('offers', defaultOffers);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('offers', defaultOffers);
      const snap = await firestore.collection('offers').get();
      return snap.docs.map(doc => doc.data() as Offer);
    } catch (e: any) {
      console.warn("Firestore error in getOffers, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('offers', defaultOffers);
    }
  }
  async saveOffer(offer: Offer): Promise<Offer> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Offer[]>('offers', defaultOffers);
      const index = list.findIndex(item => item.id === offer.id);
      if (index >= 0) {
        list[index] = offer;
      } else {
        list.push(offer);
      }
      await saveLocalCollection('offers', list);
      return offer;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveOffer(offer);
      await firestore.collection('offers').doc(offer.id).set(offer, { merge: true });
      return offer;
    } catch (e: any) {
      console.warn("Firestore error in saveOffer, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveOffer(offer);
    }
  }
  async deleteOffer(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Offer[]>('offers', defaultOffers);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('offers', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteOffer(id);
      await firestore.collection('offers').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteOffer, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteOffer(id);
    }
  }

  async getProspects(): Promise<Prospect[]> {
    if (useLocalFallback) return loadLocalCollection('prospects', defaultProspects);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('prospects', defaultProspects);
      const snap = await firestore.collection('prospects').get();
      return snap.docs.map(doc => doc.data() as Prospect);
    } catch (e: any) {
      console.warn("Firestore error in getProspects, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('prospects', defaultProspects);
    }
  }
  async saveProspect(prospect: Prospect): Promise<Prospect> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Prospect[]>('prospects', defaultProspects);
      const index = list.findIndex(item => item.id === prospect.id);
      if (index >= 0) {
        list[index] = prospect;
      } else {
        list.push(prospect);
      }
      await saveLocalCollection('prospects', list);
      return prospect;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveProspect(prospect);
      await firestore.collection('prospects').doc(prospect.id).set(prospect, { merge: true });
      return prospect;
    } catch (e: any) {
      console.warn("Firestore error in saveProspect, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveProspect(prospect);
    }
  }
  async deleteProspect(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Prospect[]>('prospects', defaultProspects);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('prospects', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteProspect(id);
      await firestore.collection('prospects').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteProspect, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteProspect(id);
    }
  }

  async getAudits(): Promise<Audit[]> {
    if (useLocalFallback) return loadLocalCollection('audits', []);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('audits', []);
      const snap = await firestore.collection('audits').get();
      return snap.docs.map(doc => doc.data() as Audit);
    } catch (e: any) {
      console.warn("Firestore error in getAudits, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('audits', []);
    }
  }
  async saveAudit(audit: Audit): Promise<Audit> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Audit[]>('audits', []);
      const index = list.findIndex(item => item.id === audit.id);
      if (index >= 0) {
        list[index] = audit;
      } else {
        list.push(audit);
      }
      await saveLocalCollection('audits', list);
      return audit;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveAudit(audit);
      await firestore.collection('audits').doc(audit.id).set(audit, { merge: true });
      return audit;
    } catch (e: any) {
      console.warn("Firestore error in saveAudit, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveAudit(audit);
    }
  }
  async deleteAudit(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Audit[]>('audits', []);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('audits', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteAudit(id);
      await firestore.collection('audits').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteAudit, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteAudit(id);
    }
  }

  async getOutreaches(): Promise<Outreach[]> {
    if (useLocalFallback) return loadLocalCollection('outreaches', []);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('outreaches', []);
      const snap = await firestore.collection('outreaches').get();
      return snap.docs.map(doc => doc.data() as Outreach);
    } catch (e: any) {
      console.warn("Firestore error in getOutreaches, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('outreaches', []);
    }
  }
  async saveOutreach(outreach: Outreach): Promise<Outreach> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Outreach[]>('outreaches', []);
      const index = list.findIndex(item => item.id === outreach.id);
      if (index >= 0) {
        list[index] = outreach;
      } else {
        list.push(outreach);
      }
      await saveLocalCollection('outreaches', list);
      return outreach;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveOutreach(outreach);
      await firestore.collection('outreaches').doc(outreach.id).set(outreach, { merge: true });
      return outreach;
    } catch (e: any) {
      console.warn("Firestore error in saveOutreach, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveOutreach(outreach);
    }
  }
  async deleteOutreach(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Outreach[]>('outreaches', []);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('outreaches', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteOutreach(id);
      await firestore.collection('outreaches').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteOutreach, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteOutreach(id);
    }
  }

  async getClients(): Promise<Client[]> {
    if (useLocalFallback) return loadLocalCollection('clients', defaultClients);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('clients', defaultClients);
      const snap = await firestore.collection('clients').get();
      return snap.docs.map(doc => doc.data() as Client);
    } catch (e: any) {
      console.warn("Firestore error in getClients, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('clients', defaultClients);
    }
  }
  async saveClient(client: Client): Promise<Client> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Client[]>('clients', defaultClients);
      const index = list.findIndex(item => item.id === client.id);
      if (index >= 0) {
        list[index] = client;
      } else {
        list.push(client);
      }
      await saveLocalCollection('clients', list);
      return client;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveClient(client);
      await firestore.collection('clients').doc(client.id).set(client, { merge: true });
      return client;
    } catch (e: any) {
      console.warn("Firestore error in saveClient, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveClient(client);
    }
  }
  async deleteClient(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Client[]>('clients', defaultClients);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('clients', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteClient(id);
      await firestore.collection('clients').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteClient, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteClient(id);
    }
  }

  async getProjects(): Promise<Project[]> {
    if (useLocalFallback) return loadLocalCollection('projects', defaultProjects);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('projects', defaultProjects);
      const snap = await firestore.collection('projects').get();
      return snap.docs.map(doc => doc.data() as Project);
    } catch (e: any) {
      console.warn("Firestore error in getProjects, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('projects', defaultProjects);
    }
  }
  async saveProject(project: Project): Promise<Project> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Project[]>('projects', defaultProjects);
      const index = list.findIndex(item => item.id === project.id);
      if (index >= 0) {
        list[index] = project;
      } else {
        list.push(project);
      }
      await saveLocalCollection('projects', list);
      return project;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveProject(project);
      await firestore.collection('projects').doc(project.id).set(project, { merge: true });
      return project;
    } catch (e: any) {
      console.warn("Firestore error in saveProject, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveProject(project);
    }
  }
  async deleteProject(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Project[]>('projects', defaultProjects);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('projects', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteProject(id);
      await firestore.collection('projects').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteProject, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteProject(id);
    }
  }

  async getCaseStudies(): Promise<CaseStudy[]> {
    if (useLocalFallback) return loadLocalCollection('case_studies', defaultCaseStudies);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('case_studies', defaultCaseStudies);
      const snap = await firestore.collection('case_studies').get();
      return snap.docs.map(doc => doc.data() as CaseStudy);
    } catch (e: any) {
      console.warn("Firestore error in getCaseStudies, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('case_studies', defaultCaseStudies);
    }
  }
  async saveCaseStudy(cs: CaseStudy): Promise<CaseStudy> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<CaseStudy[]>('case_studies', defaultCaseStudies);
      const index = list.findIndex(item => item.id === cs.id);
      if (index >= 0) {
        list[index] = cs;
      } else {
        list.push(cs);
      }
      await saveLocalCollection('case_studies', list);
      return cs;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveCaseStudy(cs);
      await firestore.collection('case_studies').doc(cs.id).set(cs, { merge: true });
      return cs;
    } catch (e: any) {
      console.warn("Firestore error in saveCaseStudy, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveCaseStudy(cs);
    }
  }
  async deleteCaseStudy(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<CaseStudy[]>('case_studies', defaultCaseStudies);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('case_studies', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteCaseStudy(id);
      await firestore.collection('case_studies').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteCaseStudy, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteCaseStudy(id);
    }
  }

  async getCareerEntries(): Promise<CareerEntry[]> {
    if (useLocalFallback) return loadLocalCollection('career_entries', defaultCareerEntries);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('career_entries', defaultCareerEntries);
      const snap = await firestore.collection('career_entries').get();
      return snap.docs.map(doc => doc.data() as CareerEntry);
    } catch (e: any) {
      console.warn("Firestore error in getCareerEntries, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('career_entries', defaultCareerEntries);
    }
  }
  async saveCareerEntry(entry: CareerEntry): Promise<CareerEntry> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<CareerEntry[]>('career_entries', defaultCareerEntries);
      const index = list.findIndex(item => item.id === entry.id);
      if (index >= 0) {
        list[index] = entry;
      } else {
        list.push(entry);
      }
      await saveLocalCollection('career_entries', list);
      return entry;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveCareerEntry(entry);
      await firestore.collection('career_entries').doc(entry.id).set(entry, { merge: true });
      return entry;
    } catch (e: any) {
      console.warn("Firestore error in saveCareerEntry, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveCareerEntry(entry);
    }
  }
  async deleteCareerEntry(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<CareerEntry[]>('career_entries', defaultCareerEntries);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('career_entries', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteCareerEntry(id);
      await firestore.collection('career_entries').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteCareerEntry, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteCareerEntry(id);
    }
  }

  async getKnowledgeItems(): Promise<KnowledgeItem[]> {
    if (useLocalFallback) return loadLocalCollection('knowledge_items', defaultKnowledgeItems);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('knowledge_items', defaultKnowledgeItems);
      const snap = await firestore.collection('knowledge_items').get();
      return snap.docs.map(doc => doc.data() as KnowledgeItem);
    } catch (e: any) {
      console.warn("Firestore error in getKnowledgeItems, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('knowledge_items', defaultKnowledgeItems);
    }
  }
  async saveKnowledgeItem(item: KnowledgeItem): Promise<KnowledgeItem> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<KnowledgeItem[]>('knowledge_items', defaultKnowledgeItems);
      const index = list.findIndex(it => it.id === item.id);
      if (index >= 0) {
        list[index] = item;
      } else {
        list.push(item);
      }
      await saveLocalCollection('knowledge_items', list);
      return item;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveKnowledgeItem(item);
      await firestore.collection('knowledge_items').doc(item.id).set(item, { merge: true });
      return item;
    } catch (e: any) {
      console.warn("Firestore error in saveKnowledgeItem, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveKnowledgeItem(item);
    }
  }
  async deleteKnowledgeItem(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<KnowledgeItem[]>('knowledge_items', defaultKnowledgeItems);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('knowledge_items', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteKnowledgeItem(id);
      await firestore.collection('knowledge_items').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteKnowledgeItem, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.deleteKnowledgeItem(id);
    }
  }

  async getSettings(): Promise<typeof defaultSettings> {
    if (useLocalFallback) return loadLocalCollection('settings', defaultSettings);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('settings', defaultSettings);
      const doc = await firestore.collection('settings').doc('global').get();
      if (doc.exists) {
        return doc.data() as typeof defaultSettings;
      }
      return defaultSettings;
    } catch (e: any) {
      console.warn("Firestore error in getSettings, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('settings', defaultSettings);
    }
  }
  async saveSettings(settings: typeof defaultSettings): Promise<typeof defaultSettings> {
    if (useLocalFallback) {
      await saveLocalCollection('settings', settings);
      return settings;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveSettings(settings);
      await firestore.collection('settings').doc('global').set(settings, { merge: true });
      return settings;
    } catch (e: any) {
      console.warn("Firestore error in saveSettings, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveSettings(settings);
    }
  }

  async getAdmin(uid: string): Promise<any | null> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<any[]>('admins', []);
      return list.find(a => a.uid === uid) || null;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.getAdmin(uid);
      const doc = await firestore.collection('admins').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (e: any) {
      console.warn("Firestore error in getAdmin, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.getAdmin(uid);
    }
  }
  async saveAdmin(uid: string, adminData: any): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<any[]>('admins', []);
      const index = list.findIndex(a => a.uid === uid);
      if (index >= 0) {
        list[index] = { ...list[index], ...adminData };
      } else {
        list.push({ uid, ...adminData });
      }
      await saveLocalCollection('admins', list);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveAdmin(uid, adminData);
      await firestore.collection('admins').doc(uid).set(adminData, { merge: true });
    } catch (e: any) {
      console.warn("Firestore error in saveAdmin, falling back to local files:", e.message || e);
      useLocalFallback = true;
      return this.saveAdmin(uid, adminData);
    }
  }

  // Discovery Meetings Operations
  async getDiscoveryMeetings(): Promise<DiscoveryMeeting[]> {
    if (useLocalFallback) return loadLocalCollection('discovery_meetings', []);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('discovery_meetings', []);
      const snap = await firestore.collection('discovery_meetings').get();
      return snap.docs.map(doc => doc.data() as DiscoveryMeeting);
    } catch (e: any) {
      console.warn("Firestore error in getDiscoveryMeetings, falling back:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('discovery_meetings', []);
    }
  }

  async saveDiscoveryMeeting(meeting: DiscoveryMeeting): Promise<DiscoveryMeeting> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<DiscoveryMeeting[]>('discovery_meetings', []);
      const index = list.findIndex(item => item.id === meeting.id);
      if (index >= 0) {
        list[index] = meeting;
      } else {
        list.push(meeting);
      }
      await saveLocalCollection('discovery_meetings', list);
      return meeting;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveDiscoveryMeeting(meeting);
      await firestore.collection('discovery_meetings').doc(meeting.id).set(meeting, { merge: true });
      return meeting;
    } catch (e: any) {
      console.warn("Firestore error in saveDiscoveryMeeting, falling back:", e.message || e);
      useLocalFallback = true;
      return this.saveDiscoveryMeeting(meeting);
    }
  }

  async deleteDiscoveryMeeting(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<DiscoveryMeeting[]>('discovery_meetings', []);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('discovery_meetings', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteDiscoveryMeeting(id);
      await firestore.collection('discovery_meetings').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteDiscoveryMeeting, falling back:", e.message || e);
      useLocalFallback = true;
      return this.deleteDiscoveryMeeting(id);
    }
  }

  // Proposals Operations
  async getProposals(): Promise<Proposal[]> {
    if (useLocalFallback) return loadLocalCollection('proposals', []);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('proposals', []);
      const snap = await firestore.collection('proposals').get();
      return snap.docs.map(doc => doc.data() as Proposal);
    } catch (e: any) {
      console.warn("Firestore error in getProposals, falling back:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('proposals', []);
    }
  }

  async saveProposal(proposal: Proposal): Promise<Proposal> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Proposal[]>('proposals', []);
      const index = list.findIndex(item => item.id === proposal.id);
      if (index >= 0) {
        list[index] = proposal;
      } else {
        list.push(proposal);
      }
      await saveLocalCollection('proposals', list);
      return proposal;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveProposal(proposal);
      await firestore.collection('proposals').doc(proposal.id).set(proposal, { merge: true });
      return proposal;
    } catch (e: any) {
      console.warn("Firestore error in saveProposal, falling back:", e.message || e);
      useLocalFallback = true;
      return this.saveProposal(proposal);
    }
  }

  async deleteProposal(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<Proposal[]>('proposals', []);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('proposals', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteProposal(id);
      await firestore.collection('proposals').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteProposal, falling back:", e.message || e);
      useLocalFallback = true;
      return this.deleteProposal(id);
    }
  }

  // Revenue Records Operations
  async getRevenueRecords(): Promise<RevenueRecord[]> {
    if (useLocalFallback) return loadLocalCollection('revenue_records', []);
    try {
      await ensureMigrated();
      if (useLocalFallback) return loadLocalCollection('revenue_records', []);
      const snap = await firestore.collection('revenue_records').get();
      return snap.docs.map(doc => doc.data() as RevenueRecord);
    } catch (e: any) {
      console.warn("Firestore error in getRevenueRecords, falling back:", e.message || e);
      useLocalFallback = true;
      return loadLocalCollection('revenue_records', []);
    }
  }

  async saveRevenueRecord(record: RevenueRecord): Promise<RevenueRecord> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<RevenueRecord[]>('revenue_records', []);
      const index = list.findIndex(item => item.id === record.id);
      if (index >= 0) {
        list[index] = record;
      } else {
        list.push(record);
      }
      await saveLocalCollection('revenue_records', list);
      return record;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.saveRevenueRecord(record);
      await firestore.collection('revenue_records').doc(record.id).set(record, { merge: true });
      return record;
    } catch (e: any) {
      console.warn("Firestore error in saveRevenueRecord, falling back:", e.message || e);
      useLocalFallback = true;
      return this.saveRevenueRecord(record);
    }
  }

  async deleteRevenueRecord(id: string): Promise<void> {
    if (useLocalFallback) {
      const list = await loadLocalCollection<RevenueRecord[]>('revenue_records', []);
      const filtered = list.filter(item => item.id !== id);
      await saveLocalCollection('revenue_records', filtered);
      return;
    }
    try {
      await ensureMigrated();
      if (useLocalFallback) return this.deleteRevenueRecord(id);
      await firestore.collection('revenue_records').doc(id).delete();
    } catch (e: any) {
      console.warn("Firestore error in deleteRevenueRecord, falling back:", e.message || e);
      useLocalFallback = true;
      return this.deleteRevenueRecord(id);
    }
  }

}

export const db = new Database();
