import dns from 'node:dns/promises';
import { db } from './db.ts';
import { 
  EvidenceRecord, 
  EvidenceSourceType, 
  VerificationStatus, 
  FreshnessStatus, 
  ClaimClassification, 
  VerificationConflict, 
  ProspectVerificationAudit,
  Prospect,
  Audit,
  Outreach
} from '../src/types';

export const FRESHNESS_WINDOWS = {
  CURRENT: 24 * 60 * 60 * 1000,      // 24 hours
  RECENT: 7 * 24 * 60 * 60 * 1000,    // 7 days
  STALE: 30 * 24 * 60 * 60 * 1000,    // 30 days
};

/**
 * Calculate evidence freshness classification based on observation timestamp
 */
export function calculateFreshness(observedAtIso: string): FreshnessStatus {
  const timestamp = new Date(observedAtIso).getTime();
  if (isNaN(timestamp)) return 'HISTORICAL';
  const ageMs = Date.now() - timestamp;

  if (ageMs <= FRESHNESS_WINDOWS.CURRENT) return 'CURRENT';
  if (ageMs <= FRESHNESS_WINDOWS.RECENT) return 'RECENT';
  if (ageMs <= FRESHNESS_WINDOWS.STALE) return 'STALE';
  return 'HISTORICAL';
}

/**
 * Clean and normalize domain name / website URL
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  return cleaned;
}

/**
 * Server-side website verification function
 * Tests DNS and HTTP accessibility without assuming business closure on failure.
 */
export async function verifyWebsite(
  urlOrDomain: string, 
  prospectId: string, 
  isDemo = false
): Promise<EvidenceRecord[]> {
  const now = new Date().toISOString();
  const domain = normalizeDomain(urlOrDomain);
  const records: EvidenceRecord[] = [];

  if (!domain) {
    records.push({
      evidenceId: `ev-dns-${prospectId}-${Date.now()}-1`,
      prospectId,
      claim: 'Website domain accessibility check',
      sourceType: 'DIRECT_ACCESS',
      verificationMethod: 'Domain Input Validation',
      observation: 'No website URL or domain provided for direct verification.',
      observedAt: now,
      status: 'UNVERIFIED',
      confidence: 0,
      freshness: 'CURRENT',
      isDemo,
      dataOrigin: isDemo ? 'demo' : 'production'
    });
    return records;
  }

  // Step 1: DNS Resolution Check
  let dnsResolved = false;
  let dnsError = '';
  let ipAddresses: string[] = [];

  try {
    const addresses = await dns.resolve(domain);
    if (addresses && addresses.length > 0) {
      dnsResolved = true;
      ipAddresses = addresses;
    }
  } catch (err: any) {
    dnsResolved = false;
    dnsError = err.code || err.message || 'DNS resolution failed';
  }

  records.push({
    evidenceId: `ev-dns-${prospectId}-${Date.now()}-2`,
    prospectId,
    claim: `DNS A-Record Resolution for ${domain}`,
    sourceType: 'DNS',
    sourceUrl: `https://${domain}`,
    verificationMethod: 'Node.js DNS A-Record Lookup',
    observation: dnsResolved 
      ? `Domain ${domain} resolved to IP(s): ${ipAddresses.join(', ')}.`
      : `Direct domain verification currently failed: Domain did not resolve during this verification attempt (${dnsError}).`,
    observedAt: now,
    status: dnsResolved ? 'VERIFIED' : 'FAILED',
    confidence: dnsResolved ? 95 : 90,
    freshness: 'CURRENT',
    errorInfo: dnsResolved ? undefined : `DNS Error: ${dnsError}`,
    details: { dnsResolved, ipAddresses, errorCode: dnsError, testedDomain: domain },
    isDemo,
    dataOrigin: isDemo ? 'demo' : 'production'
  });

  // Step 2: HTTP Direct Access Test
  const protocols = [`https://${domain}`, `http://${domain}`, `https://www.${domain}`, `http://www.${domain}`];
  let httpSuccess = false;
  let finalStatus: number | null = null;
  let finalUrl = '';
  let httpError = '';

  for (const targetUrl of protocols) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SamuelOS-VerificationEngine/1.0' 
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeoutId);

      finalStatus = response.status;
      finalUrl = response.url || targetUrl;

      if (response.ok || (response.status >= 200 && response.status < 400)) {
        httpSuccess = true;
        break;
      }
    } catch (err: any) {
      httpError = err.code || err.message || 'Connection failed';
    }
  }

  records.push({
    evidenceId: `ev-http-${prospectId}-${Date.now()}-3`,
    prospectId,
    claim: `HTTP Direct Accessibility for ${domain}`,
    sourceType: 'DIRECT_ACCESS',
    sourceUrl: finalUrl || `https://${domain}`,
    verificationMethod: 'HTTP GET Protocol Verification',
    observation: httpSuccess 
      ? `Website is directly accessible and returned HTTP status ${finalStatus} at ${finalUrl}.`
      : `Direct domain verification currently failed: Direct connection test returned error (${httpError || 'No HTTP response'}).`,
    observedAt: now,
    status: httpSuccess ? 'VERIFIED' : 'FAILED',
    confidence: httpSuccess ? 95 : 85,
    freshness: 'CURRENT',
    errorInfo: httpSuccess ? undefined : `HTTP Error: ${httpError}`,
    details: { httpSuccess, finalStatus, finalUrl, errorCode: httpError },
    isDemo,
    dataOrigin: isDemo ? 'demo' : 'production'
  });

  return records;
}

/**
 * Server-side Search Discovery Verification
 * Queries search engines to discover indexed pages for domain/business
 */
export async function verifySearchDiscovery(
  queryOrDomain: string,
  prospectId: string,
  businessName?: string,
  isDemo = false
): Promise<EvidenceRecord> {
  const now = new Date().toISOString();
  const targetQuery = businessName ? `"${businessName}" ${queryOrDomain}` : queryOrDomain;

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(targetQuery)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    const html = await response.text();
    const cleanDomain = normalizeDomain(queryOrDomain);
    const domainFound = cleanDomain ? html.toLowerCase().includes(cleanDomain) : false;
    const bizFound = businessName ? html.toLowerCase().includes(businessName.toLowerCase()) : false;

    if (domainFound || bizFound) {
      return {
        evidenceId: `ev-search-${prospectId}-${Date.now()}`,
        prospectId,
        claim: `Search engine indexed presence for ${queryOrDomain}`,
        sourceType: 'SEARCH_INDEX',
        sourceUrl: searchUrl,
        verificationMethod: 'Search Engine Index Discovery',
        observation: `Search engine currently has indexed/discovered pages for ${queryOrDomain} (${businessName || ''}).`,
        observedAt: now,
        status: 'VERIFIED',
        confidence: 85,
        freshness: 'CURRENT',
        details: { query: targetQuery, searchSource: 'DuckDuckGo Index', domainFound, bizFound },
        isDemo,
        dataOrigin: isDemo ? 'demo' : 'production'
      };
    } else {
      return {
        evidenceId: `ev-search-${prospectId}-${Date.now()}`,
        prospectId,
        claim: `Search engine indexed presence for ${queryOrDomain}`,
        sourceType: 'SEARCH_INDEX',
        sourceUrl: searchUrl,
        verificationMethod: 'Search Engine Index Discovery',
        observation: `Search engine query returned no active indexed results for "${targetQuery}".`,
        observedAt: now,
        status: 'UNVERIFIED',
        confidence: 60,
        freshness: 'CURRENT',
        details: { query: targetQuery, searchSource: 'DuckDuckGo Index', domainFound: false, bizFound: false },
        isDemo,
        dataOrigin: isDemo ? 'demo' : 'production'
      };
    }
  } catch (err: any) {
    return {
      evidenceId: `ev-search-${prospectId}-${Date.now()}`,
      prospectId,
      claim: `Search engine indexed presence for ${queryOrDomain}`,
      sourceType: 'SEARCH_INDEX',
      verificationMethod: 'Search Engine Index Discovery',
      observation: `Search engine discovery attempt incomplete due to network timeout or block (${err.message}).`,
      observedAt: now,
      status: 'UNVERIFIED',
      confidence: 40,
      freshness: 'CURRENT',
      errorInfo: err.message,
      isDemo,
      dataOrigin: isDemo ? 'demo' : 'production'
    };
  }
}

/**
 * Deterministic Conflict Detection
 * Detects discrepancies such as DIRECT_ACCESS FAILED + SEARCH_INDEX FOUND
 */
export function detectEvidenceConflicts(records: EvidenceRecord[]): VerificationConflict[] {
  const conflicts: VerificationConflict[] = [];
  if (!records || records.length === 0) return conflicts;

  const prospectId = records[0].prospectId;

  // Rule 1: DIRECT_ACCESS FAILED + SEARCH_INDEX VERIFIED = WEB_PRESENCE_CONFLICT
  const directFailed = records.find(r => 
    (r.sourceType === 'DIRECT_ACCESS' || r.sourceType === 'DNS') && r.status === 'FAILED'
  );
  const searchIndexed = records.find(r => 
    r.sourceType === 'SEARCH_INDEX' && r.status === 'VERIFIED'
  );

  if (directFailed && searchIndexed) {
    conflicts.push({
      id: `conflict-web-${prospectId}-${Date.now()}`,
      prospectId,
      conflictType: 'WEB_PRESENCE_CONFLICT',
      summary: 'Direct domain verification currently failed, while indexed pages remain discoverable. Evidence conflict exists and website operational status is unconfirmed.',
      evidenceIds: [directFailed.evidenceId, searchIndexed.evidenceId],
      observedAt: new Date().toISOString(),
      status: 'OPEN'
    });
  }

  // Rule 2: AI_INFERENCE claims vs DIRECT_ACCESS factual findings
  const aiInference = records.find(r => r.sourceType === 'AI_INFERENCE');
  const directVerified = records.find(r => r.sourceType === 'DIRECT_ACCESS' && r.status === 'VERIFIED');

  if (aiInference && directFailed && aiInference.claim.toLowerCase().includes('website active')) {
    conflicts.push({
      id: `conflict-mismatch-${prospectId}-${Date.now()}`,
      prospectId,
      conflictType: 'DATA_MISMATCH',
      summary: 'AI inference claimed active website, but direct technical verification currently failed.',
      evidenceIds: [aiInference.evidenceId, directFailed.evidenceId],
      observedAt: new Date().toISOString(),
      status: 'OPEN'
    });
  }

  return conflicts;
}

/**
 * Outreach Claim Safety Classification
 * Classifies whether an outreach claim is SUPPORTED, UNSUPPORTED, STALE, CONTRADICTED, INFERENCE, or RECOMMENDATION.
 */
export function classifyOutreachClaim(
  claimText: string, 
  records: EvidenceRecord[]
): ClaimClassification {
  if (!claimText) return 'UNSUPPORTED';
  const lowerClaim = claimText.toLowerCase();

  // Subjective / recommendation check
  if (
    lowerClaim.includes('recommend') || 
    lowerClaim.includes('suggest') || 
    lowerClaim.includes('could improve') || 
    lowerClaim.includes('would benefit') ||
    lowerClaim.includes('opportunity')
  ) {
    return 'RECOMMENDATION';
  }

  // Check for contradiction with web presence conflict
  const directFailed = records.find(r => (r.sourceType === 'DIRECT_ACCESS' || r.sourceType === 'DNS') && r.status === 'FAILED');
  const searchFound = records.find(r => r.sourceType === 'SEARCH_INDEX' && r.status === 'VERIFIED');

  if (directFailed && searchFound) {
    if (lowerClaim.includes('no website') || lowerClaim.includes('does not have a website') || lowerClaim.includes('permanently closed')) {
      return 'CONTRADICTED';
    }
  }

  // Match verified evidence
  const matchingRecords = records.filter(r => {
    const obs = r.observation.toLowerCase();
    const clm = r.claim.toLowerCase();
    return lowerClaim.split(' ').some(word => word.length > 4 && (obs.includes(word) || clm.includes(word)));
  });

  if (matchingRecords.length === 0) {
    return 'UNSUPPORTED';
  }

  const bestRecord = matchingRecords[0];

  if (bestRecord.sourceType === 'AI_INFERENCE') {
    return 'INFERENCE';
  }

  const freshness = calculateFreshness(bestRecord.observedAt);
  if (freshness === 'STALE' || freshness === 'HISTORICAL') {
    return 'STALE';
  }

  if (bestRecord.status === 'VERIFIED') {
    return 'SUPPORTED';
  }

  if (bestRecord.status === 'FAILED' || bestRecord.status === 'CONTRADICTED') {
    return 'CONTRADICTED';
  }

  return 'UNSUPPORTED';
}

/**
 * Full Prospect Live Verification Engine
 * Runs DNS, HTTP, Search checks and computes complete audit & conflict state.
 */
export async function runLiveVerificationPipeline(
  prospectId: string
): Promise<ProspectVerificationAudit> {
  const prospects = await db.getProspects();
  const prospect = prospects.find(p => p.id === prospectId);

  if (!prospect) {
    throw new Error(`Prospect with ID ${prospectId} not found.`);
  }

  const isDemo = Boolean(prospect.isDemo || prospect.id.startsWith('p-demo') || (prospect as any).dataOrigin === 'demo');

  // Step 1: Run direct website verification
  const websiteRecords = await verifyWebsite(prospect.websiteUrl || '', prospect.id, isDemo);

  // Step 2: Run search discovery verification
  const searchRecord = await verifySearchDiscovery(prospect.websiteUrl || prospect.businessName, prospect.id, prospect.businessName, isDemo);

  // Step 3: Load existing evidence records from DB
  const existingRecords = await db.getEvidenceRecords(prospect.id);

  // Combine and update freshness
  const allRecordsMap = new Map<string, EvidenceRecord>();

  // Add existing
  for (const r of existingRecords) {
    r.freshness = calculateFreshness(r.observedAt);
    allRecordsMap.set(r.evidenceId, r);
  }

  // Add newly generated
  for (const r of websiteRecords) {
    r.freshness = calculateFreshness(r.observedAt);
    allRecordsMap.set(r.evidenceId, r);
  }

  searchRecord.freshness = calculateFreshness(searchRecord.observedAt);
  allRecordsMap.set(searchRecord.evidenceId, searchRecord);

  const combinedRecords = Array.from(allRecordsMap.values());

  // Save updated records to DB
  await db.saveEvidenceRecords(combinedRecords);

  // Step 4: Conflict Detection
  const conflicts = detectEvidenceConflicts(combinedRecords);
  for (const conflict of conflicts) {
    await db.saveVerificationConflict(conflict);
  }

  // Step 5: Categorize Evidence into Audit Buckets
  const currentlyVerified = combinedRecords.filter(r => r.status === 'VERIFIED' && (r.freshness === 'CURRENT' || r.freshness === 'RECENT'));
  const recentEvidence = combinedRecords.filter(r => r.freshness === 'RECENT');
  const staleEvidence = combinedRecords.filter(r => r.freshness === 'STALE' || r.freshness === 'HISTORICAL');

  // Confidence Score Calculation
  let confidenceScore = 50;
  if (currentlyVerified.length > 0) confidenceScore += 30;
  if (conflicts.length > 0) confidenceScore -= 25;
  if (staleEvidence.length > 0) confidenceScore -= 10;
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  const overallStatus: VerificationStatus = 
    conflicts.length > 0 ? 'PARTIALLY_VERIFIED' :
    currentlyVerified.length > 0 ? 'VERIFIED' : 
    'UNVERIFIED';

  // Determine Next Recommended Verification Step
  let recommendedNextVerification = 'Verification checks up to date.';
  if (conflicts.some(c => c.conflictType === 'WEB_PRESENCE_CONFLICT')) {
    recommendedNextVerification = 'Direct domain verification currently failed, while indexed pages remain discoverable. Run manual registry check or domain WHOIS lookup.';
  } else if (overallStatus === 'UNVERIFIED') {
    recommendedNextVerification = 'Perform direct manual audit of corporate registry and active social channels.';
  } else if (staleEvidence.length > 0) {
    recommendedNextVerification = 'Re-run live verification pipeline to refresh stale evidence records.';
  }

  const auditOutput: ProspectVerificationAudit = {
    prospectId: prospect.id,
    businessName: prospect.businessName,
    domain: normalizeDomain(prospect.websiteUrl || ''),
    lastVerifiedAt: new Date().toISOString(),
    overallStatus,
    confidenceScore,
    currentlyVerified,
    recentEvidence,
    staleEvidence,
    conflicts,
    unverifiedClaims: combinedRecords.filter(r => r.status === 'UNVERIFIED').map(r => r.claim),
    recommendedNextVerification
  };

  // Sync summary back onto Prospect & Audit objects in DB
  prospect.evidenceStatus = overallStatus as any;
  prospect.lastVerifiedAt = auditOutput.lastVerifiedAt;
  prospect.verificationSource = 'Live Verification Engine (Phase 1)';
  prospect.evidenceNotes = conflicts.length > 0 
    ? conflicts[0].summary 
    : currentlyVerified.map(c => c.observation).join(' ');
  prospect.verifiedFindings = currentlyVerified.map(c => c.observation);
  prospect.unverifiedFindings = auditOutput.unverifiedClaims;
  prospect.dataConfidenceScore = confidenceScore;

  await db.saveProspect(prospect);

  // Sync onto Audit object if present
  const audits = await db.getAudits();
  const matchedAudit = audits.find(a => a.prospectId === prospect.id);
  if (matchedAudit) {
    matchedAudit.evidenceStatus = overallStatus as any;
    matchedAudit.lastVerifiedAt = auditOutput.lastVerifiedAt;
    matchedAudit.verificationSource = 'Live Verification Engine (Phase 1)';
    matchedAudit.evidenceNotes = prospect.evidenceNotes;
    matchedAudit.verifiedFindings = prospect.verifiedFindings;
    matchedAudit.unverifiedFindings = prospect.unverifiedFindings;
    matchedAudit.dataConfidenceScore = confidenceScore;
    await db.saveAudit(matchedAudit);
  }

  return auditOutput;
}
