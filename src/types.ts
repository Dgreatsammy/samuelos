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

export type OutreachStatus =
  | 'DRAFT'
  | 'AWAITING_EVIDENCE_VERIFICATION'
  | 'READY_FOR_APPROVAL'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'RESPONSE_RECEIVED'
  | 'FOLLOW_UP_DUE'
  | 'MEETING_BOOKED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'Draft'
  | 'Awaiting_Evidence_Verification'
  | 'Ready_For_Approval'
  | 'Awaiting_Approval'
  | 'Approved'
  | 'Sent'
  | 'Responded'
  | 'Opened';

export interface OutreachAuditLog {
  previous_status: string;
  new_status: string;
  changed_by: string;
  timestamp: string;
  reason?: string;
}

export interface OutreachClaim {
  id: string;
  claim_text: string;
  claim_type: 'VERIFIED_FACT' | 'OBSERVATION' | 'INFERENCE' | 'AI_GENERATED_HYPOTHESIS' | 'NEEDS_VERIFICATION';
  evidence_source: string;
  evidence_reference: string;
  verification_status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_VERIFICATION' | 'UNVERIFIED';
}

export interface Outreach {
  id: string;
  prospectId: string;
  channel: 'whatsapp' | 'instagram' | 'email';
  message: string;
  personalizationBasis: string;
  date: string;
  status: OutreachStatus;
  response?: string;
  followUpDate?: string;
  sequenceStage: 'Initial' | 'Follow-up 1' | 'Follow-up 2' | 'Closed/Nurture';
  claims?: OutreachClaim[];
  auditLogs?: OutreachAuditLog[];
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
  isDemo?: boolean;
  dataOrigin?: string;
  originatingProspectId?: string;
  convertedAt?: string;
  convertedBy?: string;
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
  isDemo?: boolean;
  dataOrigin?: string;
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
  isDemo?: boolean;
  dataOrigin?: string;
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
  isDemo?: boolean;
  dataOrigin?: string;
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

export interface DiscoveryMeeting {
  id: string;
  prospectId: string;
  businessName: string;
  date: string;
  time: string;
  channel: 'whatsapp' | 'instagram' | 'email' | 'zoom' | 'google-meet';
  meetingLink?: string;
  decisionMaker: string;
  businessNeed: string;
  currentSystem: string;
  painPoints: string;
  desiredOutcome: string;
  budget: string;
  timeline: string;
  decisionProcess: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  isDemo?: boolean;
}

export interface Proposal {
  id: string;
  prospectId: string;
  businessName: string;
  clientName: string;
  problem: string;
  recommendedSolution: string;
  scope: string[];
  deliverables: string[];
  timeline: string;
  price: number;
  currency: 'NGN' | 'USD';
  paymentTerms: string;
  validityPeriod: string;
  nextStep: string;
  status: 'DRAFT' | 'SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
  createdAt: string;
  isDemo?: boolean;
}

export interface RevenueRecord {
  id: string;
  prospectId: string;
  proposalId?: string;
  amountReceived: number;
  currency: 'NGN' | 'USD';
  paymentMethod: string;
  transactionRef: string;
  paymentDate: string;
  recordedTimestamp: string;
  humanVerificationConfirmed: boolean;
  dataOrigin: 'production' | 'demo';
  recordedBy: string;
  notes?: string;
}

