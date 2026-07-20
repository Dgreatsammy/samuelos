export type ServiceCategory = 'DIGITAL_PRESENCE' | 'AI_AUTOMATION' | 'GROWTH_TECH' | 'IT_INFRASTRUCTURE';

export interface Service {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  features: string[];
  active: boolean;
}

export interface Offer {
  id: string;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  problemSolved: string;
  targetAudience: string;
  deliverables: string[];
  outcomes: string[];
  pricingModel: string;
  startingPrice?: string;
  active: boolean;
  cta: string;
}

export type WebsiteStatus =
  | 'NO_WEBSITE'
  | 'WEBSITE_FOUND'
  | 'WEBSITE_WEAK'
  | 'WEBSITE_OUTDATED'
  | 'WEBSITE_POOR_MOBILE'
  | 'WEBSITE_LOW_CONVERSION'
  | 'WEBSITE_STRONG'
  | 'UNKNOWN'
  | 'NEEDS_VERIFICATION';

export type PipelineStatus =
  | 'Research'
  | 'Unverified'
  | 'Verified'
  | 'Qualified'
  | 'Contacted'
  | 'Responded'
  | 'Discovery'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Nurture';

export interface ScoreDetails {
  digitalGap: number;        // Max 30
  businessPotential: number; // Max 20
  commercialPotential: number; // Max 20
  accessibility: number;     // Max 15
  timingIntent: number;      // Max 15
}

export interface Prospect {
  id: string;
  businessName: string;
  category: string;
  industry: string;
  location: string;
  websiteUrl?: string;
  websiteStatus: WebsiteStatus;
  websiteQuality?: string;
  googleProfile?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  source: string;
  researchDate: string;
  verificationDate?: string;
  digitalGap: string;
  businessOpportunity: string;
  recommendedOfferId?: string;
  leadScore: number; // 0 - 100
  scoreDetails: ScoreDetails;
  priority: 'A' | 'B' | 'C';
  status: PipelineStatus;
  notes: string;
  nextAction?: string;
  evidenceStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_VERIFICATION' | 'UNVERIFIED';
  evidenceNotes?: string;
  lastVerifiedAt?: string;
  verificationSource?: string;
  verifiedFindings?: string[];
  unverifiedFindings?: string[];
  dataConfidenceScore?: number;
}

export interface AuditDimension {
  score: number;
  observation: string;
  evidence: string;
  recommendation: string;
}

export interface Audit {
  id: string;
  prospectId: string;
  businessName?: string;
  createdAt: string;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  missedOpportunity: string;
  recommendedSolution: string;
  recommendedOfferId?: string;
  
  discoverability: AuditDimension;
  credibility: AuditDimension;
  digitalPresence: AuditDimension;
  conversion: AuditDimension;
  contact: AuditDimension;
  booking: AuditDimension;
  googleVisibility: AuditDimension;
  mobile: AuditDimension;
  socialJourney: AuditDimension;
  followUp: AuditDimension;

  // Evidence Verification Gate attributes
  evidenceStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_VERIFICATION';
  evidenceNotes?: string;
  lastVerifiedAt?: string;
  verificationSource?: string;
  verifiedFindings?: string[];
  unverifiedFindings?: string[];
  dataConfidenceScore?: number;
}

export interface Outreach {
  id: string;
  prospectId: string;
  channel: 'whatsapp' | 'instagram' | 'email';
  message: string;
  personalizationBasis: string;
  date: string;
  status: 'Draft' | 'Sent' | 'Opened' | 'Responded' | 'Awaiting_Evidence_Verification' | 'Ready_For_Approval' | 'Approved' | 'AWAITING_EVIDENCE_VERIFICATION' | 'READY_FOR_APPROVAL' | 'APPROVED' | 'SENT';
  response?: string;
  followUpDate?: string;
  sequenceStage: 'Initial' | 'Follow-up 1' | 'Follow-up 2' | 'Closed/Nurture';
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  address?: string;
  source: string;
  services: string[];
  notes: string;
  status: 'Active' | 'Inactive';
}

export interface Project {
  id: string;
  clientId: string;
  projectName: string;
  offerId?: string;
  description: string;
  startDate: string;
  dueDate: string;
  status: 'Planning' | 'Active' | 'Review' | 'Completed' | 'On Hold' | 'Cancelled';
  value: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  deliverables: string[];
  notes: string;
  skills?: string[];
  technologies?: string[];
  knowledgeItemIds?: string[];
}

export interface CaseStudy {
  id: string;
  projectId?: string;
  title: string;
  clientName: string;
  problem: string;
  approach: string;
  solution: string;
  result: string;
  technologies: string[];
  images: string[];
  testimonial?: string;
  publishedStatus: 'Draft' | 'Published';
}

export interface CareerEntry {
  id: string;
  title: string;
  role: string;
  organization: string;
  dateRange: string;
  problem: string;
  action: string;
  result: string;
  skills: string[];
  technologies: string[];
  evidence?: string;
  relatedProjectId?: string;
  cvSummary: string;
  bullets: string[];
  linkedInAchievement?: string;
  interviewStory?: string;
}

export type KnowledgeType = 'Framework' | 'Research' | 'Article' | 'Insight' | 'Lesson' | 'Playbook' | 'Case Study' | 'SOP';

export interface KnowledgeItem {
  id: string;
  title: string;
  type: KnowledgeType;
  content: string;
  tags: string[];
  relatedServiceId?: string;
  relatedProjectId?: string;
  status: 'Draft' | 'Published';
  publishedDate?: string;
}
