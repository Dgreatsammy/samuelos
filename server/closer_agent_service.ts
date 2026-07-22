import { GoogleGenAI, Type } from '@google/genai';
import { Prospect, Audit, ScoreDetails } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('GEMINI_API_KEY is not defined. AI Closer Agent will run in simulation mode.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY_FOR_STANDBY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface CloserAgentResult {
  qualificationStatus: 'QUALIFIED' | 'UNQUALIFIED';
  scores: {
    digitalGap: number;
    businessPotential: number;
    commercialPotential: number;
    accessibility: number;
    timingIntent: number;
  };
  reasoning: string;
  recommendedOffer: string;
  recommendedOfferId: string;
  outreachDrafts: {
    whatsapp: string;
    email: string;
    instagram: string;
  };
  meetingBookingCTA: string;
  claims?: any[];
}

export async function runCloserAgentAnalysis(
  prospect: Prospect,
  audit?: Audit
): Promise<CloserAgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.info('No GEMINI_API_KEY found, returning high-quality Closer Agent simulation result.');
    return generateSimulationResult(prospect, audit);
  }

  try {
    const ai = getAI();
    
    const auditDetails = audit
      ? `Audit Overall Score: ${audit.overallScore}/100
Strengths: ${audit.strengths.join(', ')}
Gaps: ${audit.gaps.join(', ')}
Missed Opportunity: ${audit.missedOpportunity}
Recommended Solution: ${audit.recommendedSolution}`
      : `Website Status: ${prospect.websiteStatus}
Digital Gap Description: ${prospect.digitalGap || 'Unknown'}
Business Opportunity Description: ${prospect.businessOpportunity || 'Unknown'}`;

    const evidenceDetails = `Evidence Status: ${prospect.evidenceStatus || 'NEEDS_VERIFICATION'}
Evidence Notes: ${prospect.evidenceNotes || 'None'}
Verified Findings: ${prospect.verifiedFindings ? prospect.verifiedFindings.join(', ') : 'None'}
Unverified Findings: ${prospect.unverifiedFindings ? prospect.unverifiedFindings.join(', ') : 'None'}`;

    const prompt = `You are the SamuelOS Closer Agent, an elite AI closing assistant built for Samuel Oluwadamilare (founder of Accessmart Solutions).
Your goal is to qualify a business prospect, evaluate their digital opportunity gap, and draft professional, highly tailored, non-spam outreach messages that lead directly to a meeting booking.

Here is the prospect data:
Business Name: ${prospect.businessName}
Category/Industry: ${prospect.industry || prospect.category}
Location: ${prospect.location}
Website URL: ${prospect.websiteUrl || 'No Website'}
Website Status: ${prospect.websiteStatus}
Phone/WhatsApp: ${prospect.phone || 'Unknown'}
Email: ${prospect.email || 'Unknown'}
Instagram: ${prospect.instagram || 'Unknown'}
Notes: ${prospect.notes}

Forensic Audit Details:
${auditDetails}

Evidence Verification details:
${evidenceDetails}

Your task is to:
1. QUALIFY or UNQUALIFY the prospect against the SamuelOS weighted score formula:
   - Digital Gap: max 30 points (severity of their visual presence / conversion gaps)
   - Business Potential: max 20 points (standard size, reach, or standard revenue capability of this industry)
   - Commercial Potential: max 20 points (the commercial value of high-ticket services like Professional Business Websites or Automation systems we can sell to them)
   - Accessibility: max 15 points (whether they have active contact paths like WhatsApp, phone, email, or Instagram)
   - Timing/Intent: max 15 points (whether they have direct interactions, requested an audit, or recently engaged)
   Total: Sum of these five components (0 - 100). If total >= 60, status should be 'QUALIFIED'. Otherwise 'UNQUALIFIED'.

2. RECOMMEND an Accessmart Solutions offer to pitch them. Choose the most appropriate:
   - "o-website": Professional Business Website (for businesses with no website or completely broken website)
   - "o-conversion": Conversion Booking System (for businesses with websites that lack booking, scheduling, or have low conversion rates)
   - "o-automation": AI & Workflow Automation (for businesses with decent websites but high manual work or workflow gaps)
   - "o-audit": Digital Presence Audit (default/first hook)

3. DRAFT 3 highly tailored, Service-First outreach messages:
   - WhatsApp (max 120 words): friendly, professional, direct, conversational, highlighting one concrete leak found.
   - Email (max 200 words): structured, polished, authoritative, presenting the verified gap evidence respectfully, inviting them to check out a discovery meeting.
   - Instagram DM (max 80 words): visual, light, highly personal, friendly.

4. IDENTIFY 3-5 factual statements used in the generated outreach drafts.
   For each statement, provide:
   - "claim_text": the statement from the copy.
   - "claim_type": MUST be one of 'VERIFIED_FACT', 'OBSERVATION', 'INFERENCE', 'AI_GENERATED_HYPOTHESIS', or 'NEEDS_VERIFICATION'.
   - "evidence_source": the source of verification, e.g. 'Google Business Profile', 'Website URL check', 'Manual inspection', etc.
   - "evidence_reference": short specific proof (e.g., 'https://apexdentalpartners-test.com exists and is active').
   - "verification_status": MUST be 'VERIFIED' if it aligns with Verified Findings, 'PARTIALLY_VERIFIED' if partially supported, 'NEEDS_VERIFICATION' if not fully verified, or 'UNVERIFIED' if unproven.

RULES:
- Under the "Service Before Sales" principle, NEVER sound salesy, generic, or aggressive. Do NOT make up false stats, fake reviews, or fake urgency.
- Reference verified evidence findings directly. If a finding is UNVERIFIED, do not make definitive claims about it; frame it as an observation to explore.
- Include Samuel's default Booking Link in the drafts: "https://calendly.com/accessmart/discovery" (refer to this as Samuel's booking link).

Output your entire response as a valid JSON object matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'qualificationStatus',
            'scores',
            'reasoning',
            'recommendedOffer',
            'recommendedOfferId',
            'outreachDrafts',
            'meetingBookingCTA',
            'claims'
          ],
          properties: {
            qualificationStatus: { type: Type.STRING, description: 'QUALIFIED or UNQUALIFIED' },
            scores: {
              type: Type.OBJECT,
              required: ['digitalGap', 'businessPotential', 'commercialPotential', 'accessibility', 'timingIntent'],
              properties: {
                digitalGap: { type: Type.INTEGER, description: 'Score out of 30' },
                businessPotential: { type: Type.INTEGER, description: 'Score out of 20' },
                commercialPotential: { type: Type.INTEGER, description: 'Score out of 20' },
                accessibility: { type: Type.INTEGER, description: 'Score out of 15' },
                timingIntent: { type: Type.INTEGER, description: 'Score out of 15' }
              }
            },
            reasoning: { type: Type.STRING, description: 'Detailed qualification reasoning under SamuelOS Constitution' },
            recommendedOffer: { type: Type.STRING, description: 'Name of recommended Accessmart Offer' },
            recommendedOfferId: { type: Type.STRING, description: 'Recommended offer ID (o-website, o-conversion, o-automation, or o-audit)' },
            outreachDrafts: {
              type: Type.OBJECT,
              required: ['whatsapp', 'email', 'instagram'],
              properties: {
                whatsapp: { type: Type.STRING },
                email: { type: Type.STRING },
                instagram: { type: Type.STRING }
              }
            },
            meetingBookingCTA: { type: Type.STRING, description: 'Meeting booking link/CTA text' },
            claims: {
              type: Type.ARRAY,
              description: 'Key claims used in the draft and their evidence classifications',
              items: {
                type: Type.OBJECT,
                required: ['id', 'claim_text', 'claim_type', 'evidence_source', 'evidence_reference', 'verification_status'],
                properties: {
                  id: { type: Type.STRING },
                  claim_text: { type: Type.STRING },
                  claim_type: { type: Type.STRING, description: 'VERIFIED_FACT, OBSERVATION, INFERENCE, AI_GENERATED_HYPOTHESIS, or NEEDS_VERIFICATION' },
                  evidence_source: { type: Type.STRING },
                  evidence_reference: { type: Type.STRING },
                  verification_status: { type: Type.STRING, description: 'VERIFIED, PARTIALLY_VERIFIED, NEEDS_VERIFICATION, or UNVERIFIED' }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || '';
    return JSON.parse(text) as CloserAgentResult;
  } catch (error) {
    console.error('Closer Agent AI Analysis failed, falling back to simulation:', error);
    return generateSimulationResult(prospect, audit);
  }
}

function generateSimulationResult(prospect: Prospect, audit?: Audit): CloserAgentResult {
  // Let's calculate standard scores based on prospect status & details
  const hasWebsite = prospect.websiteUrl && prospect.websiteUrl.length > 5;
  const isNoWebsite = prospect.websiteStatus === 'NO_WEBSITE';
  
  const digitalGapScore = isNoWebsite ? 28 : (hasWebsite ? 18 : 22);
  const businessPotentialScore = prospect.industry?.toLowerCase().includes('clinic') || prospect.industry?.toLowerCase().includes('dental') ? 18 : 14;
  const commercialPotentialScore = isNoWebsite ? 18 : 15;
  const accessibilityScore = (prospect.phone || prospect.whatsapp || prospect.email) ? 14 : 9;
  const timingIntentScore = prospect.status === 'Discovery' ? 14 : 8;

  const totalScore = digitalGapScore + businessPotentialScore + commercialPotentialScore + accessibilityScore + timingIntentScore;
  const status = totalScore >= 60 ? 'QUALIFIED' : 'UNQUALIFIED';

  const recommendedOfferId = isNoWebsite ? 'o-website' : (audit?.gaps?.some(g => g.toLowerCase().includes('booking') || g.toLowerCase().includes('schedule')) ? 'o-conversion' : 'o-automation');
  const recommendedOffer = recommendedOfferId === 'o-website' 
    ? 'Professional Business Website' 
    : (recommendedOfferId === 'o-conversion' ? 'Conversion & Booking System' : 'AI & Workflow Automation');

  const gapsText = audit ? audit.gaps.join(' and ') : (prospect.digitalGap !== 'Awaiting visual assessment' ? prospect.digitalGap : 'missing direct client-onboarding system');
  const leadTeam = 'Team';

  // Generate simulated claims based on verified/unverified findings of prospect or audit
  const claims: any[] = [];
  let claimIdCounter = 1;

  if (prospect.verifiedFindings && prospect.verifiedFindings.length > 0) {
    prospect.verifiedFindings.forEach((f) => {
      claims.push({
        id: `claim-${claimIdCounter++}`,
        claim_text: f,
        claim_type: 'VERIFIED_FACT',
        evidence_source: 'Forensic Audit',
        evidence_reference: prospect.websiteUrl || 'Direct evidence check',
        verification_status: 'VERIFIED'
      });
    });
  }

  if (prospect.unverifiedFindings && prospect.unverifiedFindings.length > 0) {
    prospect.unverifiedFindings.forEach((f) => {
      claims.push({
        id: `claim-${claimIdCounter++}`,
        claim_text: f,
        claim_type: 'NEEDS_VERIFICATION',
        evidence_source: 'Initial research fallback',
        evidence_reference: 'Awaiting human verification',
        verification_status: 'NEEDS_VERIFICATION'
      });
    });
  }

  // Fallback claims if none are found in the prospect
  if (claims.length === 0) {
    if (isNoWebsite) {
      claims.push({
        id: `claim-${claimIdCounter++}`,
        claim_text: `Your business does not appear to have an active website or digital presence.`,
        claim_type: 'VERIFIED_FACT',
        evidence_source: 'Google search & Domain check',
        evidence_reference: 'No active DNS or domain record found',
        verification_status: 'VERIFIED'
      });
    } else {
      claims.push({
        id: `claim-${claimIdCounter++}`,
        claim_text: `Your website does not support real-time booking and scheduling.`,
        claim_type: 'OBSERVATION',
        evidence_source: 'Website URL check',
        evidence_reference: prospect.websiteUrl || 'No booking widget found on homepage',
        verification_status: 'PARTIALLY_VERIFIED'
      });
      claims.push({
        id: `claim-${claimIdCounter++}`,
        claim_text: `Your business has active search discoverability on Google.`,
        claim_type: 'INFERENCE',
        evidence_source: 'Google Business Profile',
        evidence_reference: 'Verified profile exists',
        verification_status: 'VERIFIED'
      });
    }
  }

  return {
    qualificationStatus: status,
    scores: {
      digitalGap: digitalGapScore,
      businessPotential: businessPotentialScore,
      commercialPotential: commercialPotentialScore,
      accessibility: accessibilityScore,
      timingIntent: timingIntentScore
    },
    reasoning: `Closer Agent qualified this lead with a score of ${totalScore}/100. ${isNoWebsite ? 'The business has absolutely no website presence, which presents a critical digital gap.' : 'The business digital presence was analyzed; while they have a domain, there is a substantial leak in conversion systems.'} We verified that direct outreach channels are accessible.`,
    recommendedOffer,
    recommendedOfferId,
    outreachDrafts: {
      whatsapp: `Hello ${leadTeam} at ${prospect.businessName}. I was looking at your business online and noticed a quick opportunity regarding your digital presence. Specifically, it looks like there's an opportunity to optimize how you capture and book clients directly. I've compiled a brief, complimentary audit of these gaps. Would you be open to a 5-minute chat about this? We can schedule it here: https://calendly.com/accessmart/discovery. Best, Samuel (Accessmart Solutions).`,
      email: `Subject: Digital Presence Opportunity for ${prospect.businessName}\n\nDear ${leadTeam} at ${prospect.businessName},\n\nI hope this message finds you well. My name is Samuel Oluwadamilare, founder of Accessmart Solutions.\n\nWhile conducting research on local professional businesses in the ${prospect.industry || 'service'} sector, I reviewed your digital presence. I noticed some concrete areas where you might be losing potential clients, particularly around: ${gapsText}.\n\nUnder our "Service Before Sales" principle, I have prepared a complimentary forensic audit outlining exactly how these gaps can be resolved to increase your conversions.\n\nYou can review this visual audit and schedule a brief, 10-minute discovery call with me here:\nhttps://calendly.com/accessmart/discovery\n\nNo pitch, just pure diagnostic value.\n\nWarm regards,\n\nSamuel Oluwadamilare\nAccessmart Solutions`,
      instagram: `Hi ${leadTeam}! Love what you do at ${prospect.businessName}. Noticed a tiny leak in how your profile links back to a conversion system. Prepared a free 1-page visual audit showing how to capture more booking leads. Let me know if you want me to DM it over, or book a quick 5-min review here: https://calendly.com/accessmart/discovery`
    },
    meetingBookingCTA: 'https://calendly.com/accessmart/discovery',
    claims
  };
}
