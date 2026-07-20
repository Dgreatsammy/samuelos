import { Database } from './db.ts';
import { generateDigitalAuditAI, generatePersonalizedOutreachAI } from './gemini.ts';
import { Prospect, Audit, Outreach, ScoreDetails, WebsiteStatus, PipelineStatus } from '../src/types';

async function runPipeline() {
  console.log("==================================================");
  console.log("SAMUELOS PROSPECT DATA PIPELINE & AUDIT GENERATOR");
  console.log("==================================================");

  const db = new Database();

  // 1. Raw External Research Dataset
  const rawDataset = [
    {
      id: 'p-1',
      businessName: '  Apex Dental Partners  ',
      category: 'Healthcare',
      industry: 'Dental Clinic',
      location: 'Houston, TX',
      websiteUrl: 'https://apexdentalpartners-test.com',
      websiteStatus: 'WEBSITE_WEAK' as WebsiteStatus,
      phone: '+1-555-0192',
      email: 'info@apexdentalpartners-test.com',
      source: 'Manual Search',
      researchDate: '2026-07-10',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Website lacks online scheduling, mobile experience feels squeezed, and page speed is extremely low.',
      businessOpportunity: 'Upgrading to a conversion-oriented digital hub with direct calendar booking and custom patient intake.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: { digitalGap: 24, businessPotential: 16, commercialPotential: 14, accessibility: 12, timingIntent: 12 } as ScoreDetails,
      notes: 'Sizable office with 4 active dentists. Current site is on an old Wix layout.'
    },
    {
      id: 'p-2',
      businessName: 'vanguard elite security',
      category: 'Professional Services',
      industry: 'Corporate Security',
      location: 'Chicago, IL',
      websiteUrl: '',
      websiteStatus: 'NO_WEBSITE' as WebsiteStatus,
      phone: '  +1-555-0144  ',
      email: 'contact@vanguardsecurity-test.com',
      source: 'LinkedIn',
      researchDate: '2026-07-14',
      verificationStatus: 'PARTIALLY_VERIFIED',
      digitalGap: 'No visible public website exists under registered name. Google Business profile lacks website backlink.',
      businessOpportunity: 'Deploying foundation-level professional website to anchor their B2B corporate bidding credibility.',
      recommendedOfferId: 'o-website',
      scoreDetails: { digitalGap: 15, businessPotential: 15, commercialPotential: 15, accessibility: 10, timingIntent: 10 } as ScoreDetails,
      notes: 'Highly rated Google profile with several positive reviews, but zero online presence beyond reviews.'
    },
    {
      id: 'p-3',
      businessName: 'Oakhaven Wellness Group ',
      category: 'Wellness',
      industry: 'Spa & Therapy',
      location: 'Denver, CO',
      websiteUrl: 'http://oakhavenwellness-test.com', // Needs protocol normalization (https)
      websiteStatus: 'WEBSITE_OUTDATED' as WebsiteStatus,
      phone: '+13035550211',
      email: 'RECEPTION@oakhavenwellness-test.com', // Needs email casing normalization
      source: 'Instagram Leads',
      researchDate: '2026-07-15',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Severe security warning (no active SSL certificate) driving traffic away. No visual online reservation tool.',
      businessOpportunity: 'Secure, modern visual design containing automated therapist booking and high-contrast styling.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: { digitalGap: 28, businessPotential: 14, commercialPotential: 15, accessibility: 13, timingIntent: 12 } as ScoreDetails,
      notes: 'Active social media posts promoting organic treatments, but directing users to an insecure and broken booking page.'
    },
    {
      id: 'p-4',
      businessName: 'metro hvac solutions',
      category: 'Trade Services',
      industry: 'AC & Heating',
      location: 'Houston, TX',
      websiteUrl: 'https://metrohvacsolutions-test.com',
      websiteStatus: 'WEBSITE_POOR_MOBILE' as WebsiteStatus,
      phone: '+1-713-555-0188',
      email: 'service@metrohvacsolutions-test.com',
      source: 'Google Maps',
      researchDate: '2026-07-18',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Mobile viewport requires horizontal scroll, broken contact forms, no email address on mobile page.',
      businessOpportunity: 'Deploying conversion-optimized responsive mobile platform with integrated booking flow.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: { digitalGap: 22, businessPotential: 15, commercialPotential: 15, accessibility: 11, timingIntent: 11 } as ScoreDetails,
      notes: 'High volume HVAC contractor. Stellar reviews, but mobile conversion is leaking traffic.'
    },
    {
      id: 'p-5',
      businessName: '  Oakwood Legal Chambers',
      category: 'Professional Services',
      industry: 'Law Firm',
      location: 'Atlanta, GA',
      websiteUrl: 'https://oakwoodlegal-test.com/', // Needs trailing slash normalization
      websiteStatus: 'WEAK_LEAD_CAPTURE' as WebsiteStatus,
      phone: '+1-404-555-0155',
      email: 'intake@oakwoodlegal-test.com',
      source: 'Manual Search',
      researchDate: '2026-07-19',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Static website template, missing social bio links, no self-service scheduling or interactive intake.',
      businessOpportunity: 'Deploying secure client onboarding system with interactive question-led intake funnel.',
      recommendedOfferId: 'o-automation',
      scoreDetails: { digitalGap: 20, businessPotential: 18, commercialPotential: 16, accessibility: 12, timingIntent: 12 } as ScoreDetails,
      notes: 'Boutique law firm. Excellent partners, but high administrative client intake overhead.'
    }
  ];

  let totalRecords = rawDataset.length;
  let newRecords = 0;
  let updatedRecords = 0;
  let duplicates = 0;
  let needsVerificationCount = 0;
  let auditsGeneratedCount = 0;
  let outreachDraftsCount = 0;

  // Retrieve existing prospects from database to ensure idempotency and duplicate safety
  const existingProspects = await db.getProspects();

  for (const raw of rawDataset) {
    console.log(`\nProcessing: "${raw.businessName.trim()}"`);

    // 1. Normalize and Clean Business Name (Title Case & Trimmed)
    const normalizedName = raw.businessName
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // 2. Normalize and Clean Website URL
    let normalizedUrl = raw.websiteUrl.trim().toLowerCase();
    if (normalizedUrl) {
      if (normalizedUrl.startsWith('http://')) {
        normalizedUrl = 'https://' + normalizedUrl.slice(7);
      }
      if (normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }
    }

    // 3. Normalize Contact Information
    const normalizedEmail = raw.email.trim().toLowerCase();
    const normalizedPhone = raw.phone.trim();

    // 4. Verification Mapping to PipelineStatus
    let mappedStatus: PipelineStatus = 'Research';
    if (raw.verificationStatus === 'VERIFIED') {
      mappedStatus = 'Verified';
    } else if (raw.verificationStatus === 'PARTIALLY_VERIFIED') {
      mappedStatus = 'Research';
    } else if (raw.verificationStatus === 'NEEDS_VERIFICATION' || raw.verificationStatus === 'UNVERIFIED') {
      mappedStatus = 'Unverified';
      needsVerificationCount++;
    }

    // 5. Deduplication check (Match by exact business name or website URL)
    const existingMatch = existingProspects.find(p => 
      p.businessName.toLowerCase().trim() === normalizedName.toLowerCase().trim() ||
      (normalizedUrl && p.websiteUrl?.toLowerCase().trim() === normalizedUrl)
    );

    let prospectToSave: Prospect;

    // Calculate Lead Score & Priority
    const score = raw.scoreDetails.digitalGap + 
                  raw.scoreDetails.businessPotential + 
                  raw.scoreDetails.commercialPotential + 
                  raw.scoreDetails.accessibility + 
                  raw.scoreDetails.timingIntent;
    
    const priority = score >= 75 ? 'A' : (score >= 50 ? 'B' : 'C');

    if (existingMatch) {
      console.log(`-> Duplicate/Existing Match Found: Updating ID "${existingMatch.id}"`);
      prospectToSave = {
        ...existingMatch,
        businessName: normalizedName,
        websiteUrl: normalizedUrl,
        email: normalizedEmail,
        phone: normalizedPhone,
        status: mappedStatus,
        leadScore: score,
        scoreDetails: raw.scoreDetails,
        priority: priority,
        notes: raw.notes + ` (Source: ${raw.source}, Research Date: ${raw.researchDate})`
      };
      updatedRecords++;
      duplicates++;
    } else {
      console.log(`-> New Record: Creating ID "${raw.id}"`);
      prospectToSave = {
        id: raw.id,
        businessName: normalizedName,
        category: raw.category,
        industry: raw.industry,
        location: raw.location,
        websiteUrl: normalizedUrl,
        websiteStatus: raw.websiteStatus,
        email: normalizedEmail,
        phone: normalizedPhone,
        source: raw.source,
        researchDate: raw.researchDate,
        status: mappedStatus,
        digitalGap: raw.digitalGap,
        businessOpportunity: raw.businessOpportunity,
        recommendedOfferId: raw.recommendedOfferId,
        leadScore: score,
        scoreDetails: raw.scoreDetails,
        priority: priority,
        notes: raw.notes
      };
      newRecords++;
    }

    // Save prospect record to Firestore
    await db.saveProspect(prospectToSave);
    console.log(`Saved Prospect: ${normalizedName} [Score: ${score}/100, Priority: ${priority}]`);

    // 6. Generate Digital Opportunity Audit for this verified prospect
    console.log(`Generating digital audit for ${normalizedName}...`);
    const auditData = await generateDigitalAuditAI(
      prospectToSave.businessName,
      prospectToSave.websiteUrl || '',
      prospectToSave.industry,
      prospectToSave.location,
      prospectToSave.businessOpportunity
    );

    const fullAudit: Audit = {
      id: `a-${prospectToSave.id}`,
      prospectId: prospectToSave.id,
      createdAt: new Date().toISOString(),
      overallScore: auditData.overallScore || 50,
      strengths: auditData.strengths || [],
      gaps: auditData.gaps || [],
      missedOpportunity: auditData.missedOpportunity || '',
      recommendedSolution: auditData.recommendedSolution || '',
      recommendedOfferId: prospectToSave.recommendedOfferId,
      discoverability: auditData.discoverability || { score: 50, observation: '', evidence: '', recommendation: '' },
      credibility: auditData.credibility || { score: 50, observation: '', evidence: '', recommendation: '' },
      digitalPresence: auditData.digitalPresence || { score: 50, observation: '', evidence: '', recommendation: '' },
      conversion: auditData.conversion || { score: 50, observation: '', evidence: '', recommendation: '' },
      contact: auditData.contact || { score: 50, observation: '', evidence: '', recommendation: '' },
      booking: auditData.booking || { score: 50, observation: '', evidence: '', recommendation: '' },
      googleVisibility: auditData.googleVisibility || { score: 50, observation: '', evidence: '', recommendation: '' },
      mobile: auditData.mobile || { score: 50, observation: '', evidence: '', recommendation: '' },
      socialJourney: auditData.socialJourney || { score: 50, observation: '', evidence: '', recommendation: '' },
      followUp: auditData.followUp || { score: 50, observation: '', evidence: '', recommendation: '' }
    };

    await db.saveAudit(fullAudit);
    auditsGeneratedCount++;
    console.log(`Saved Audit for ${normalizedName} [Audit Score: ${fullAudit.overallScore}/100]`);

    // 7. Generate Personalized Outreach Draft
    console.log(`Generating outreach draft for ${normalizedName}...`);
    const channel = prospectToSave.email ? 'email' : 'whatsapp';
    const message = await generatePersonalizedOutreachAI(prospectToSave, channel, fullAudit);

    const outreach: Outreach = {
      id: `o-draft-${prospectToSave.id}`,
      prospectId: prospectToSave.id,
      channel: channel as any,
      message: message,
      personalizationBasis: `Digital Audit Gaps: ${fullAudit.gaps.slice(0, 2).join(', ')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      sequenceStage: 'Initial'
    };

    await db.saveOutreach(outreach);
    outreachDraftsCount++;
    console.log(`Saved Outreach Draft under AWAITING APPROVAL state.`);
  }

  console.log("\n==================================================");
  console.log("PIPELINE RUN COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
  console.log(`TOTAL RECORDS PROCESSED: ${totalRecords}`);
  console.log(`NEW RECORDS IMPORTED:    ${newRecords}`);
  console.log(`UPDATED RECORDS:         ${updatedRecords}`);
  console.log(`DUPLICATES IDENTIFIED:   ${duplicates}`);
  console.log(`NEEDS VERIFICATION:      ${needsVerificationCount}`);
  console.log(`AUDITS GENERATED:        ${auditsGeneratedCount}`);
  console.log(`OUTREACH DRAFTS CREATED: ${outreachDraftsCount}`);
  console.log("==================================================");
  
  process.exit(0);
}

runPipeline().catch(err => {
  console.error("Pipeline run failed:", err);
  process.exit(1);
});
