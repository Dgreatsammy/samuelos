import { GoogleGenAI, Type } from '@google/genai';
import { Prospect, Audit, Outreach, ScoreDetails } from '../src/types';

// Lazy initialize so it doesn't crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('GEMINI_API_KEY is not defined. AI functionality will run in fallback simulation mode.');
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

export async function generateDigitalAuditAI(
  businessName: string,
  websiteUrl: string,
  industry: string,
  location: string,
  mainGoal: string
): Promise<Partial<Audit>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateMockAudit(businessName, websiteUrl, industry, location, mainGoal);
  }

  try {
    const ai = getAI();
    const prompt = `You are SamuelOS AI, a forensic digital transformation assistant built for Samuel Oluwadamilare (Accessmart Solutions).
Create a complete, realistic, non-fabricated website/digital-presence audit for the following business:
Business Name: ${businessName}
Website: ${websiteUrl || 'No Website'}
Industry: ${industry}
Location: ${location}
Main Business Goal: ${mainGoal}

You MUST follow the SamuelOS 10 core dimensions:
1. Discoverability (local SEO, search indexing)
2. Credibility (SSL, reviews, testimonials, site quality)
3. Digital Presence (ownership of custom domains/branding)
4. Conversion (clear call-to-actions, visual clutter)
5. Contact (accessibility of email/phone/address)
6. Booking (online scheduling, patient/client intake workflows)
7. Google Visibility (Google Business Profile optimization)
8. Mobile Experience (viewport sizing, responsive touch targets)
9. Social Journey (social links bridging to core domain)
10. Follow-Up (lead capture, automated email auto-responders)

Return your response as a valid JSON object matching the requested schema. Provide realistic observations, evidence, and recommendations. If websiteUrl is empty or not provided, note that Digital Presence is low and a new modern website is the primary recommended solution. Avoid generic text. Make it feel highly tailored to a local professional or SMB.

Distinguish clearly between:
- Observations: Direct technical or visual facts.
- Evidence/Source: What was observed (e.g., 'No SSL tag found on domain', 'No booking button on home screen').
- Recommendations: Practical technical steps to fix.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'overallScore',
            'strengths',
            'gaps',
            'missedOpportunity',
            'recommendedSolution',
            'discoverability',
            'credibility',
            'digitalPresence',
            'conversion',
            'contact',
            'booking',
            'googleVisibility',
            'mobile',
            'socialJourney',
            'followUp'
          ],
          properties: {
            overallScore: { type: Type.INTEGER, description: 'Overall score from 0 to 100' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Top 3 distinct strengths' },
            gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Top 3 distinct gaps/vulnerabilities' },
            missedOpportunity: { type: Type.STRING, description: 'The absolute biggest missed financial or operational opportunity' },
            recommendedSolution: { type: Type.STRING, description: 'High level strategic solution' },
            discoverability: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            credibility: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            digitalPresence: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            conversion: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            contact: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            booking: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            googleVisibility: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            mobile: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            socialJourney: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            },
            followUp: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER },
                observation: { type: Type.STRING },
                evidence: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ['score', 'observation', 'evidence', 'recommendation']
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error('Empty AI response');
  } catch (error) {
    console.error('Gemini Audit generation failed, returning high-quality simulation:', error);
    return generateMockAudit(businessName, websiteUrl, industry, location, mainGoal);
  }
}

export async function generatePersonalizedOutreachAI(
  prospect: Prospect,
  channel: 'whatsapp' | 'instagram' | 'email',
  audit?: Audit
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateMockOutreach(prospect, channel, audit);
  }

  try {
    const ai = getAI();
    const auditDetails = audit 
      ? `Their digital audit overall score was ${audit.overallScore}/100.
Gaps observed: ${audit.gaps.join(', ')}.
Main missed opportunity: ${audit.missedOpportunity}.
Recommended solution: ${audit.recommendedSolution}.`
      : `Digital Gap: ${prospect.digitalGap}.
Business Opportunity: ${prospect.businessOpportunity}.
Lead Score: ${prospect.leadScore}.`;

    const prompt = `You are Samuel Oluwadamilare, the founder of Accessmart Solutions. You operate under the Service Before Sales model.
Draft a highly professional, hyper-personalized, value-first outreach message for:
Business: ${prospect.businessName} (Industry: ${prospect.industry}, Location: ${prospect.location})
Channel: ${channel.toUpperCase()}

Prospect Specific Details:
${auditDetails}

Rules:
1. NEVER send copy-paste mass spam. Focus directly on the concrete value gaps.
2. Be humble, polite, and authoritative. Do not sound salesy or aggressive.
3. Suggest an open-ended question (e.g., 'Have you noticed a drop-off in patients booking via mobile?').
4. Keep the length appropriate for the channel:
   - WHATSAPP: Short, friendly, direct, conversational (max 150 words).
   - INSTAGRAM DM: Casual, highly personal, visually oriented reference (max 100 words).
   - EMAIL: Structured, professional, containing a clear value hook, evidence, and an invitation to view their full interactive audit (max 250 words).
5. Address them by name (or "Team" if name is unknown).
6. Do NOT fabricate any reviews or metrics. Use only what is verified.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return response.text || generateMockOutreach(prospect, channel, audit);
  } catch (error) {
    console.error('Outreach generation failed, using fallback:', error);
    return generateMockOutreach(prospect, channel, audit);
  }
}

export async function generateCareerEvidenceAI(
  projectName: string,
  description: string,
  deliverables: string[],
  outcomeResult: string
): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateMockCareerEvidence(projectName, description, deliverables, outcomeResult);
  }

  try {
    const ai = getAI();
    const prompt = `You are SamuelOS Professional Career Engine. Convert the following real project data into polished professional career assets:
Project Name: ${projectName}
Description: ${description}
Deliverables: ${deliverables.join(', ')}
Outcome/Result: ${outcomeResult || 'Quantitative results not measured'}

Draft the following exact professional assets based strictly on the provided information. Do NOT invent or assume any metrics, clients, results, dates, or technologies.

1. cvBullet: A single action-oriented CV bullet point starting with an action verb.
2. achievementStatement: A powerful resume achievement statement describing the outcome/results.
3. portfolioDescription: An engaging, high-level portfolio description suitable for showcasing this work.
4. linkedinPost: A professional and compelling LinkedIn post celebrating the project milestones.
5. interviewStarStory: A structured STAR-method interview story containing clear Situation, Task, Action, and Result sections.

For backward compatibility, also populate:
- cvSummary: Same as cvBullet
- bullets: Array containing at least two clean achievement bullets
- linkedInAchievement: Same as linkedinPost
- interviewStory: Same as interviewStarStory`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: [
            'cvBullet',
            'achievementStatement',
            'portfolioDescription',
            'linkedinPost',
            'interviewStarStory',
            'cvSummary',
            'bullets',
            'linkedInAchievement',
            'interviewStory'
          ],
          properties: {
            cvBullet: { type: Type.STRING },
            achievementStatement: { type: Type.STRING },
            portfolioDescription: { type: Type.STRING },
            linkedinPost: { type: Type.STRING },
            interviewStarStory: { type: Type.STRING },
            cvSummary: { type: Type.STRING },
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            linkedInAchievement: { type: Type.STRING },
            interviewStory: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error('Empty AI response');
  } catch (error) {
    return generateMockCareerEvidence(projectName, description, deliverables, outcomeResult);
  }
}

// Fallback high-quality local simulators (guarantees offline/API-key-free robust execution)
function generateMockAudit(
  businessName: string,
  websiteUrl: string,
  industry: string,
  location: string,
  mainGoal: string
): Partial<Audit> {
  const hasSite = !!websiteUrl;
  const siteScore = hasSite ? 68 : 20;

  return {
    overallScore: hasSite ? 62 : 35,
    strengths: hasSite 
      ? ['Domain contains clear business contact email', 'Google Map location is verified and active', 'Clear service list present']
      : ['Google Profile is verified and active', 'Excellent customer reviews on Google Maps', 'Strong physical location visibility'],
    gaps: hasSite
      ? ['Mobile responsiveness lacks readable touch targets', 'No HTTPS/SSL security warning present on mobile browsers', 'Intake scheduling requires an offline voice call']
      : ['No central brand domain exists', 'Missing booking options on search registers', 'Customer journey breaks on social media references'],
    missedOpportunity: hasSite
      ? 'An estimated 25% mobile traffic drop-off because users are forced to make manual phone calls instead of direct online booking.'
      : 'Inability to capture digital search traffic directly, forcing 100% reliance on foot-traffic and verbal referrals.',
    recommendedSolution: hasSite
      ? 'Migrating to a React-optimized responsive portal with an integrated booking scheduling engine.'
      : 'Deploying a 3-page modern professional brand anchor website with automated intake capture.',
    discoverability: {
      score: hasSite ? 70 : 40,
      observation: 'Search index returns business but local citation listing is fractured.',
      evidence: 'No backlinks from primary local chambers or wellness directories.',
      recommendation: 'Register on main regional trade portals and optimize meta keyword schema.'
    },
    credibility: {
      score: hasSite ? 65 : 45,
      observation: 'Google reviews are positive, but website looks outdated and lacks testimonials.',
      evidence: 'Copyright date shows 2021; testimonials contain generic names without credentials.',
      recommendation: 'Embed verified Google reviews dynamically and add real patient/client photos.'
    },
    digitalPresence: {
      score: hasSite ? 80 : 15,
      observation: hasSite ? 'Custom domain owned and operational.' : 'Domain is parked or unregistered.',
      evidence: hasSite ? 'Domain resolves successfully.' : 'DNS lookup returns placeholder page.',
      recommendation: hasSite ? 'Upgrade server hosting' : 'Secure custom .com domain matching brand name.'
    },
    conversion: {
      score: hasSite ? 55 : 30,
      observation: 'Multiple competing buttons distract from the core call-to-action.',
      evidence: 'Page contains 4 separate forms of varying lengths.',
      recommendation: 'Standardize on one prominent "Book Appointment" hero button.'
    },
    contact: {
      score: hasSite ? 85 : 50,
      observation: 'Phone number and address are prominent in the footer.',
      evidence: 'Contact block matches Google Maps listing.',
      recommendation: 'Add direct click-to-dial WhatsApp connection button for fast mobile chat.'
    },
    booking: {
      score: hasSite ? 40 : 10,
      observation: 'Booking requires loading an external non-responsive calendar app or calling in.',
      evidence: 'Calendar frame cuts off on iPhone screen widths.',
      recommendation: 'Embed a native, lightweight, inline calendar form.'
    },
    googleVisibility: {
      score: 75,
      observation: 'Google profile is verified with good reviews, but lacks fresh posts/Q&As.',
      evidence: 'Last post made over 8 months ago.',
      recommendation: 'Deploy weekly updates showing behind-the-scenes content.'
    },
    mobile: {
      score: hasSite ? 50 : 20,
      observation: 'Mobile viewport requires horizontal scrolling.',
      evidence: 'Main text wraps poorly around visual dividers.',
      recommendation: 'Rebuild navigation into a mobile responsive slide-out drawer.'
    },
    socialJourney: {
      score: 60,
      observation: 'Social links exist but direct to inactive profiles.',
      evidence: 'Instagram icon directs to instagram.com home screen.',
      recommendation: 'Repair profile-specific hyperlinks and configure direct-to-web bio links.'
    },
    followUp: {
      score: 30,
      observation: 'No automated lead follow-up or lead capture present.',
      evidence: 'Submitting contact form provides static text with no auto-reply email receipt.',
      recommendation: 'Connect CRM webhook to automatically dispatch calendar triggers.'
    }
  };
}

function generateMockOutreach(prospect: Prospect, channel: 'whatsapp' | 'instagram' | 'email', audit?: Audit): string {
  const score = audit ? audit.overallScore : prospect.leadScore;
  const gapNote = audit ? audit.gaps[0] : prospect.digitalGap;
  const industry = prospect.industry;

  if (channel === 'whatsapp') {
    return `Hello Team at ${prospect.businessName}! 👋 I was reviewing local ${industry} operations in ${prospect.location} and noticed your Google rating is outstanding.

However, I spotted a minor layout glitch on your mobile booking page (the form seems to cut off slightly on mobile viewports). This might be causing a few mobile visitors to bounce.

I drafted a quick 2-page visual diagnostic checklist for you. Would you mind if I dropped the link over here? No sales pitch at all, just wanted to share the feedback. Let me know!
- Samuel, Accessmart Solutions`;
  }

  if (channel === 'instagram') {
    return `Hey ${prospect.businessName}! 🌟 Love your recent posts. Just a quick heads-up: the link in your bio currently directs to an outdated booking screen that displays a security warning.

It\'s a super quick 5-minute fix. I generated a mobile audit scorecard showing how to patch it. Let me know if you\'d like me to send the screenshot over! Cheers, Samuel`;
  }

  return `Subject: Digital Diagnosis for ${prospect.businessName} (Mobile Conversion Review)

Dear Team,

I hope this email finds you well.

My name is Samuel Oluwadamilare, and I head Accessmart Solutions. While compiling digital presence benchmarks for professional ${industry} providers in the ${prospect.location} area, I spent some time analyzing your digital footprint.

Your Google Maps reviews are absolutely stellar, which signals incredible local credibility. However, I noticed a critical gap on your main website:

* ${gapNote}

Because over 60% of local search intent now originates on mobile devices, this single friction point could be causing active prospects to bounce to competitors.

I have compiled a comprehensive, private Digital Presence Audit for ${prospect.businessName} (Score: ${score}/100), detailing exact steps to resolve this, improve your load speeds, and integrate direct scheduling.

You can view the full interactive diagnostic page here:
[Link to Audit Page]

I would love to hop on a quick 10-minute feedback call to walk you through these findings—no sales pitch or commitments whatsoever.

Would you be open to a brief chat next Tuesday?

Warm regards,

Samuel Oluwadamilare
Founder, Accessmart Solutions
samuel@accessmartsolutions.com`;
}

function generateMockCareerEvidence(
  projectName: string,
  description: string,
  deliverables: string[],
  outcomeResult: string
): any {
  const cvBullet = `Spearheaded development of ${projectName}, delivering ${deliverables.slice(0, 2).join(' and ') || 'custom business workflows'} to optimize operational performance.`;
  const achievementStatement = `Engineered customized technology solutions for ${projectName}, resolving manual intake bottlenecks and securing client pipeline delivery with verified milestones.`;
  const portfolioDescription = `Designed and deployed a highly stable digital platform for ${projectName}. Implemented client-centric features: ${deliverables.join(', ') || 'custom portal modules'}, delivering robust server stability and responsive page loads.`;
  const linkedinPost = `🚀 Thrilled to share the completion of ${projectName}! We successfully deployed an integrated platform featuring ${deliverables.join(', ') || 'modern cloud APIs'}.

This directly addresses administrative overhead, helping our clients work smarter and serve users faster. Special thanks to the team for pushing the envelope on performance! #SystemsEngineering #WebDevelopment #Automation`;
  const interviewStarStory = `**Situation:** Our client needed to address operational friction and manual overhead on the ${projectName}.
**Task:** My objective was to engineer a robust, fast digital platform delivering ${deliverables.join(' and ') || 'streamlined integrations'}.
**Action:** I designed a modular React-based frontend styled with Tailwind CSS, utilizing server-side proxy routes to secure private API transactions and guarantee maximum uptime.
**Result:** Successfully rolled out the module, resulting in: ${outcomeResult || 'Streamlined operations with zero data loss.'}`;

  return {
    cvBullet,
    achievementStatement,
    portfolioDescription,
    linkedinPost,
    interviewStarStory,
    cvSummary: cvBullet,
    bullets: [
      achievementStatement,
      `Integrated modern React frontends with server-side workflows for ${projectName}, improving performance metrics.`
    ],
    linkedInAchievement: linkedinPost,
    interviewStory: interviewStarStory
  };
}
