import { 
  verifyWebsite, 
  verifySearchDiscovery, 
  detectEvidenceConflicts, 
  classifyOutreachClaim, 
  calculateFreshness, 
  runLiveVerificationPipeline 
} from './verification_engine.ts';
import { EvidenceRecord } from '../src/types';

async function runTests() {
  console.log('====================================================');
  console.log('SAMUELOS PHASE 1 LIVE BUSINESS VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       -> ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       -> ${detail}`);
      failed++;
    }
  }

  // TEST A: Successful website check
  console.log('Running Test A: Successful Website Check...');
  try {
    const records = await verifyWebsite('google.com', 'test-p-1');
    const httpRecord = records.find(r => r.sourceType === 'DIRECT_ACCESS');
    const isSuccess = Boolean(httpRecord && httpRecord.status === 'VERIFIED');
    assert(isSuccess, 'Test A: Successful website check', `Status: ${httpRecord?.status}, Obs: ${httpRecord?.observation}`);
  } catch (err: any) {
    assert(false, 'Test A: Successful website check', err.message);
  }

  // TEST B: DNS Failure
  console.log('\nRunning Test B: DNS Failure...');
  try {
    const nonExistentDomain = 'nonexistent-domain-samuelos-test-99999.org';
    const records = await verifyWebsite(nonExistentDomain, 'test-p-2');
    const dnsRecord = records.find(r => r.sourceType === 'DNS' || r.sourceType === 'DIRECT_ACCESS');
    const isFailed = Boolean(dnsRecord && dnsRecord.status === 'FAILED');
    const noClosureClaim = Boolean(dnsRecord?.observation.includes('did not resolve during this verification attempt'));
    assert(isFailed && noClosureClaim, 'Test B: DNS Failure handles failure without asserting closure', `Obs: ${dnsRecord?.observation}`);
  } catch (err: any) {
    assert(false, 'Test B: DNS Failure', err.message);
  }

  // TEST C: Search result with failed website
  console.log('\nRunning Test C: Search discovery query...');
  try {
    const searchRecord = await verifySearchDiscovery('foodspace.ng', 'p-ng-2', 'Foodspace Lagos');
    const isSearchValid = Boolean(searchRecord.sourceType === 'SEARCH_INDEX' && searchRecord.observedAt);
    assert(isSearchValid, 'Test C: Search result with failed website', `Status: ${searchRecord.status}, Obs: ${searchRecord.observation}`);
  } catch (err: any) {
    assert(false, 'Test C: Search discovery query', err.message);
  }

  // TEST D: Conflict Detection
  console.log('\nRunning Test D: Conflict Detection...');
  try {
    const mockEvidence: EvidenceRecord[] = [
      {
        evidenceId: 'ev-1',
        prospectId: 'test-p-conflict',
        claim: 'Direct access',
        sourceType: 'DIRECT_ACCESS',
        verificationMethod: 'HTTP Test',
        observation: 'Direct domain verification currently failed: ENOTFOUND',
        observedAt: new Date().toISOString(),
        status: 'FAILED',
        confidence: 90,
        freshness: 'CURRENT'
      },
      {
        evidenceId: 'ev-2',
        prospectId: 'test-p-conflict',
        claim: 'Search index',
        sourceType: 'SEARCH_INDEX',
        verificationMethod: 'DuckDuckGo Index',
        observation: 'Search engine currently has indexed/discovered page for foodspace.ng',
        observedAt: new Date().toISOString(),
        status: 'VERIFIED',
        confidence: 85,
        freshness: 'CURRENT'
      }
    ];
    const conflicts = detectEvidenceConflicts(mockEvidence);
    const hasPresenceConflict = conflicts.some(c => c.conflictType === 'WEB_PRESENCE_CONFLICT');
    assert(hasPresenceConflict, 'Test D: Conflict Detection', `Conflict Summary: ${conflicts[0]?.summary}`);
  } catch (err: any) {
    assert(false, 'Test D: Conflict Detection', err.message);
  }

  // TEST E: Stale Evidence
  console.log('\nRunning Test E: Stale Evidence Freshness...');
  try {
    const oldTimestamp = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(); // 40 days old
    const freshness = calculateFreshness(oldTimestamp);
    assert(freshness === 'STALE' || freshness === 'HISTORICAL', 'Test E: Stale Evidence Freshness', `40-day old record classified as: ${freshness}`);
  } catch (err: any) {
    assert(false, 'Test E: Stale Evidence Freshness', err.message);
  }

  // TEST F: AI Inference Classification
  console.log('\nRunning Test F: AI Inference Classification...');
  try {
    const mockAiRecord: EvidenceRecord[] = [{
      evidenceId: 'ev-ai-1',
      prospectId: 'test-p-ai',
      claim: 'Active website exists',
      sourceType: 'AI_INFERENCE',
      verificationMethod: 'LLM Analysis',
      observation: 'Inferred possible website based on business category',
      observedAt: new Date().toISOString(),
      status: 'UNVERIFIED',
      confidence: 40,
      freshness: 'CURRENT'
    }];
    const classification = classifyOutreachClaim('Your business has an active website', mockAiRecord);
    assert(classification === 'INFERENCE' || classification === 'UNSUPPORTED', 'Test F: AI Inference Classification', `Classification: ${classification}`);
  } catch (err: any) {
    assert(false, 'Test F: AI Inference Classification', err.message);
  }

  // TEST G: Unsupported Claim
  console.log('\nRunning Test G: Unsupported Claim...');
  try {
    const classification = classifyOutreachClaim('Your practice uses Clio CRM intake forms', []);
    assert(classification === 'UNSUPPORTED', 'Test G: Unsupported Claim', `Classification: ${classification}`);
  } catch (err: any) {
    assert(false, 'Test G: Unsupported Claim', err.message);
  }

  // TEST H: Supported Claim
  console.log('\nRunning Test H: Supported Claim...');
  try {
    const mockVerifiedRecords: EvidenceRecord[] = [{
      evidenceId: 'ev-supp-1',
      prospectId: 'test-p-supp',
      claim: 'Website uses static booking redirect',
      sourceType: 'DIRECT_ACCESS',
      verificationMethod: 'HTTP Test',
      observation: 'Website uses static booking redirect form',
      observedAt: new Date().toISOString(),
      status: 'VERIFIED',
      confidence: 95,
      freshness: 'CURRENT'
    }];
    const classification = classifyOutreachClaim('Your website uses static booking redirect', mockVerifiedRecords);
    assert(classification === 'SUPPORTED', 'Test H: Supported Claim', `Classification: ${classification}`);
  } catch (err: any) {
    assert(false, 'Test H: Supported Claim', err.message);
  }

  // TEST I: Demo Isolation
  console.log('\nRunning Test I: Demo Isolation...');
  try {
    const demoRecords = await verifyWebsite('http://example.com', 'p-demo-123', true);
    const isIsolated = demoRecords.every(r => r.isDemo === true && r.dataOrigin === 'demo');
    assert(isIsolated, 'Test I: Demo Isolation', `Demo records flagged with isDemo: true`);
  } catch (err: any) {
    assert(false, 'Test I: Demo Isolation', err.message);
  }

  // TEST J: Foodspace p-ng-2 Live Verification
  console.log('\nRunning Test J: Foodspace p-ng-2 Live Verification...');
  try {
    const auditOutput = await runLiveVerificationPipeline('p-ng-2');
    console.log('\n--- FOODSPACE LIVE VERIFICATION AUDIT OUTPUT ---');
    console.log(`Prospect ID: ${auditOutput.prospectId}`);
    console.log(`Business Name: ${auditOutput.businessName}`);
    console.log(`Domain: ${auditOutput.domain}`);
    console.log(`Overall Status: ${auditOutput.overallStatus}`);
    console.log(`Confidence Score: ${auditOutput.confidenceScore}`);
    console.log(`Conflicts Count: ${auditOutput.conflicts.length}`);
    if (auditOutput.conflicts.length > 0) {
      console.log(`Conflict 1 Summary: ${auditOutput.conflicts[0].summary}`);
    }
    console.log(`Currently Verified Count: ${auditOutput.currentlyVerified.length}`);
    console.log(`Recommended Next Verification: ${auditOutput.recommendedNextVerification}`);
    console.log('---------------------------------------------------\n');

    const hasConflict = auditOutput.conflicts.some(c => c.conflictType === 'WEB_PRESENCE_CONFLICT');
    const conflictExactMsg = auditOutput.conflicts[0]?.summary.includes('Direct domain verification currently failed, while indexed pages remain discoverable');
    
    assert(hasConflict && conflictExactMsg, 'Test J: Foodspace p-ng-2 Live Verification', `Conflict detected: ${auditOutput.conflicts[0]?.summary}`);
  } catch (err: any) {
    assert(false, 'Test J: Foodspace p-ng-2 Live Verification', err.message);
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
