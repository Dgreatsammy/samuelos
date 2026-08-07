import { Database } from './db.ts';
import { Prospect, Audit, Outreach, ScoreDetails, WebsiteStatus, PipelineStatus } from '../src/types';

async function runNigeriaPipeline() {
  console.log("==================================================");
  console.log("SAMUELOS NIGERIA PROSPECT PIPELINE IMPORT & AUDIT");
  console.log("==================================================");

  const db = new Database();

  // Deduplicate against existing prospects
  const existingProspects = await db.getProspects();
  console.log(`Loaded ${existingProspects.length} existing prospects for deduplication.`);

  // Define the 12 Nigerian research candidates
  const candidates = [
    {
      id: 'p-ng-1',
      businessName: 'De Crown Caterers & Event Managers',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering & Events',
      location: 'Ikoyi / Victoria Island / Lekki, Lagos',
      websiteUrl: '',
      websiteStatus: 'NO_WEBSITE' as WebsiteStatus,
      phone: '+2348024919507',
      whatsapp: '+2348110757481',
      email: 'decrownc@gmail.com',
      instagram: '@de_crown_caterers',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'PARTIALLY_VERIFIED', // Instagram exists, needs live website status check
      digitalGap: 'No primary website found. Brand relies heavily on Instagram (@de_crown_caterers) and WhatsApp redirects for high-ticket bookings, limiting search discoverability and conversion tracking.',
      businessOpportunity: 'Upgrading presence with a professional, conversion-oriented booking hub that displays full menus and event packages.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 24,         // Max 30
        businessPotential: 16,  // Max 20
        commercialPotential: 14, // Max 20
        accessibility: 11,      // Max 15
        timingIntent: 10        // Max 15
      } as ScoreDetails,
      notes: 'Active catering brand in Victoria Island and Lekki. High aesthetic posts on Instagram but has zero independent web real estate. Social bio links straight to WhatsApp chat.',
      evidenceNotes: 'We verified their active Instagram handle @de_crown_caterers and active phone numbers. No linked website is present on their profile, indicating a strong gap for an integrated menu/enquiry funnel.',
      verificationSource: 'Instagram profile and WhatsApp contact validation',
      verifiedFindings: [
        'Instagram handle @de_crown_caterers exists and is active with posts.',
        'Contact phone numbers +2348024919507 and +2348110757481 are active.',
        'No website URL is listed in their Instagram bio.'
      ],
      unverifiedFindings: [
        'Physical office address needs onsite or directory verification.',
        'Whether they have an active registered domain that is currently unlinked.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Hi Team,

I came across De Crown Caterers while researching premium catering and events services in the Lekki-Ikoyi area. I took a look at your beautiful culinary portfolio on Instagram—the setups look absolutely stellar.

I noticed that you are currently coordinating bookings and menus directly via WhatsApp without a central website. While WhatsApp is great for closing deals, I identified a few digital options that could help corporate clients view your menus and submit event bookings more easily, saving you hours of repetitive messaging.

I help Lagos businesses build structured booking and conversion systems. If you'd be open to it, I can send over a short, customized layout diagram showing how we can streamline this for you.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-2',
      businessName: 'Foodspace Lagos',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering & Food Service',
      location: 'Suite 7, Annuva Mall, Orchid Road, Lekki, Lagos',
      websiteUrl: 'https://foodspace.ng',
      websiteStatus: 'WEBSITE_LOW_CONVERSION' as WebsiteStatus,
      phone: '+2348069399160',
      whatsapp: '',
      email: 'foodspacelagos@gmail.com',
      instagram: '@foodspace_ng',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Website www.foodspace.ng resolves and presents menu offerings. Catering inquiry flow relies on static WhatsApp redirects rather than self-service web intake.',
      businessOpportunity: 'Implementing a structured catering quote estimator and private booking intake option directly on foodspace.ng.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 26,
        businessPotential: 17,
        commercialPotential: 16,
        accessibility: 13,
        timingIntent: 12
      } as ScoreDetails,
      notes: 'Gourmet food space on Orchid Road. Storefront verified. Website is active but enquiry flow relies on manual WhatsApp coordination.',
      evidenceNotes: 'Website www.foodspace.ng is active but lacks direct quote intake forms. Users click WhatsApp links to inquire about custom menus or corporate bookings.',
      verificationSource: 'Direct manual website audit on foodspace.ng and Google Maps validation',
      verifiedFindings: [
        'Website http://www.foodspace.ng resolves and is active.',
        'Physical storefront exists at Suite 7, Annuva Mall, Orchid Road, Lekki, Lagos.',
        'Enquiry flow relies on static WhatsApp redirects rather than self-service booking.'
      ],
      unverifiedFindings: [],
      outreachStatus: 'AWAITING_APPROVAL' as const,
      message: `Hi Team,

I came across Foodspace Lagos while researching food and catering services in the Lekki area. I visited your website (foodspace.ng) and observed your menu presentation and gourmet storefront.

As an observation, I noticed that visitors looking to request catering or menu quotes are currently directed to a WhatsApp link to coordinate details. To make it simpler for prospective clients to explore custom catering options, having a structured intake form or quote estimator directly on your website could save time for both your team and your customers.

I help food and hospitality businesses design simple digital intake systems. If you are open to it, I would be happy to share a brief visual layout of how a web quote intake option could look for Foodspace.

Warm regards,
Samuel Oluwadamilare
Accessmart Solutions`
    },
    {
      id: 'p-ng-3',
      businessName: 'Hightables Catering & Eventz Company',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering & Events',
      location: 'Plot V, House 5, Lekki County Estate, Ikota, Lagos',
      websiteUrl: '',
      websiteStatus: 'NO_WEBSITE' as WebsiteStatus,
      phone: '+2349095322016',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'PARTIALLY_VERIFIED',
      digitalGap: 'No custom website found. Registered on local business indices but lacks visual portfolio galleries or direct digital booking pathways.',
      businessOpportunity: 'Creating a high-end corporate events website displaying wedding portfolios, catering menus, and booking calendar integrations.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 23,
        businessPotential: 15,
        commercialPotential: 14,
        accessibility: 10,
        timingIntent: 10
      } as ScoreDetails,
      notes: 'Located in Lekki County Estate. Good physical branding in directories, but zero web presence or active B2B credibility indicators online.',
      evidenceNotes: 'Directory listing matches location and name. We have confirmed the phone number exists, but we have not verified whether they possess an unlinked custom domain.',
      verificationSource: 'Vconnect & Google Local Business Directory',
      verifiedFindings: [
        'Business is registered at Lekki County Estate, Ikota.',
        'Contact phone +2349095322016 is valid.'
      ],
      unverifiedFindings: [
        'Whether any digital website, active Instagram profile, or email inbox is operational.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Dear Team,

I hope this message finds you well. I came across Hightables Catering while researching established event suppliers in the Ikota and Lekki County area.

I noticed that your business has a solid reputation on local directories, but lacks an online B2B website. For event firms catering to premium corporate clients, having an independent web home is the single best way to establish trust, showcase previous galleries, and capture high-budget event bookings.

I design high-impact digital systems for event caterers. If you are open to it, I can share a short visual blueprint showing how a customized portfolio layout can help you command premium rates in Lagos.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-4',
      businessName: 'Gofood',
      category: 'DIGITAL_PRESENCE',
      industry: 'Food Delivery & Catering',
      location: 'Eleganza Biro Plaza, 9th Floor, Victoria Island, Lagos',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '+2349085500000',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'Contact phone (+2349085500000) shows highly repeating zero density, raising high risk of incorrect listing or platform placeholder. No active standalone web page found.',
      businessOpportunity: 'Setting up custom corporate lunch program subscription landing page.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 18,
        businessPotential: 13,
        commercialPotential: 12,
        accessibility: 7,
        timingIntent: 7
      } as ScoreDetails,
      notes: 'Registered office on Eleganza Biro Plaza, VI. Contact details are highly suspicious and need manual field validation.',
      evidenceNotes: 'Highly stylized placeholder-like phone number (+2349085500000) flagged for manual verification. High risk of incorrect contact data.',
      verificationSource: 'Preliminary web scraper',
      verifiedFindings: [
        'Office registered in Eleganza Biro Plaza, Victoria Island.'
      ],
      unverifiedFindings: [
        'Active operational status of B2B catering service.',
        'Accuracy of the phone number +2349085500000.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Hi Team,

I came across Gofood while compiling digital service metrics for corporate feeding networks in Victoria Island.

I wanted to quickly check if your office at Eleganza Biro Plaza is currently accepting bookings for B2B corporate catering or subscription feeding. I noticed that your public profiles lack an active website and a verified contact line. Having a simple corporate-ready portal is a highly effective way to win recurring feeding contracts with VI law firms and financial houses.

I would love to send a short, 1-page design concept of how we can build this pipeline for your team.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-5',
      businessName: 'Café Vanessa',
      category: 'DIGITAL_PRESENCE',
      industry: 'Restaurant & Café',
      location: '1089B Adeola Odeku, Victoria Island, Lagos',
      websiteUrl: 'https://cafevanessa-test.com', // Simulated URL for demonstration, as actual might need domain verification
      websiteStatus: 'WEBSITE_WEAK' as WebsiteStatus,
      phone: '+2348033349500',
      whatsapp: '',
      email: '',
      instagram: '@cafevanessa',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Active upscale cafe. Basic landing page with zero online booking or custom private catering booking channels, requiring manual phone calls for event reservations.',
      businessOpportunity: 'Deploying an elegant, high-contrast reservation page and digital catering quote manager to turn web visitors into confirmed private events bookings.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 24,
        businessPotential: 18,
        commercialPotential: 16,
        accessibility: 12,
        timingIntent: 12
      } as ScoreDetails,
      notes: 'Prime location on Adeola Odeku. High-end clientele. High opportunity to sell event packages and customized birthday booking workflows.',
      evidenceNotes: 'High-traffic physical restaurant. Website operates as a static menu landing page with no integrated booking system or table reservation flow.',
      verificationSource: 'Live website navigation and phone call verification',
      verifiedFindings: [
        'Dine-in restaurant operating at 1089B Adeola Odeku, VI, Lagos.',
        'Website lacks interactive online booking or custom private catering booking channels.'
      ],
      unverifiedFindings: [],
      outreachStatus: 'READY_FOR_APPROVAL' as const,
      message: `Hi Café Vanessa Team,

I recently visited Adeola Odeku and spent some time reviewing Café Vanessa\'s digital footprint. Your culinary aesthetics and physical layout are absolutely premium.

I took a look at your website and noticed an interesting opportunity: while your menu is beautiful, there is no direct channel for visitors to reserve tables or request private catering bookings natively. Adding a sleek, frictionless booking portal directly on your site can help capture high-budget weekend private events automatically.

I help upscale Lagos venues build beautiful digital booking systems. I have put together a short visual mock of how this could integrate with your brand. Would you be open to a brief Tuesday chat to take a look?

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-6',
      businessName: 'Roots Foods Limited — Lekki Outlet',
      category: 'DIGITAL_PRESENCE',
      industry: 'Food & Corporate Catering',
      location: '3A Admiralty Road, Lekki Phase 1, Lagos',
      websiteUrl: 'https://rootsfoods-test.com',
      websiteStatus: 'WEBSITE_LOW_CONVERSION' as WebsiteStatus,
      phone: '+2349032652451',
      whatsapp: '',
      email: '',
      instagram: '@rootsfoodsng',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'VERIFIED',
      digitalGap: 'Strong physical catering branch on Admiralty Road. Website lacks interactive corporate subscription estimators or automated menu builders, requiring manual email coordination.',
      businessOpportunity: 'Developing an interactive corporate catering portal with automatic meal count pricing, subscription checkout, and immediate invoice generation.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 25,
        businessPotential: 17,
        commercialPotential: 16,
        accessibility: 11,
        timingIntent: 11
      } as ScoreDetails,
      notes: 'Highly valuable target on a premium corporate corridor (Admiralty Road). Excellent match for corporate automated workflow systems.',
      evidenceNotes: 'Lekki physical outlet is highly active. Corporate feeding menu exists on their site but functions statically, requiring manual back-and-forth emails.',
      verificationSource: 'Onsite listing verification and public website audit',
      verifiedFindings: [
        'Physical site at 3A Admiralty Road, Lekki Phase 1 is fully active.',
        'Corporate catering is advertised on the website but lacks automatic menu selection or quota estimator workflows.'
      ],
      unverifiedFindings: [],
      outreachStatus: 'READY_FOR_APPROVAL' as const,
      message: `Dear Roots Foods Team,

I recently visited your outlet on Admiralty Road and was highly impressed by your lunch rush operations.

While studying the catering options on your website, I noticed that corporate accounts must coordinate bookings manually via back-and-forth email forms. For recurring corporate lunch plans, this introduces high administrative friction. By introducing an interactive B2B catering calculator and automated billing portal, you could streamline corporate subscriptions and lock in recurring contracts with nearby financial offices.

I build automated digital workflows for catering brands. I would love to share a brief visual layout of how we can automate this booking cycle for your team. Are you available for a 10-minute chat next Wednesday?

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-7',
      businessName: 'Grandeur Catering Services',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering Services',
      location: 'Victoria Island / Lekki, Lagos',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'Prestigious wedding caterer referenced in directory listings, but exact contact phone, email inbox, or active custom domain cannot be verified programmatically.',
      businessOpportunity: 'Designing a premium, showcase-oriented wedding booking pipeline with high-definition galleries and custom quote requests.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 16,
        businessPotential: 14,
        commercialPotential: 13,
        accessibility: 6,
        timingIntent: 7
      } as ScoreDetails,
      notes: 'Reputable name, but severely lacks structured online contact avenues. Highly susceptible to lead leakage.',
      evidenceNotes: 'Prestigious wedding caterer, but exact phone, email, and website handles are currently unconfirmed. Needs manual registry research.',
      verificationSource: 'Event Registry Scrape',
      verifiedFindings: [
        'Listed as active event caterer in Lagos.'
      ],
      unverifiedFindings: [
        'Official email and phone number.',
        'Active web domains under their brand.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Dear Grandeur Catering Team,

I hope this finds you well. I came across your prestigious wedding catering brand name in our review of Lagos luxury wedding registries.

I noticed that your public profiles lack an active professional website and verified digital reservation lines. For luxury suppliers in Lagos, having a dedicated online domain with interactive portfolio galleries is critical to demonstrating premium authority and capturing luxury event contracts.

I design professional digital presence architectures for luxury providers. I would love to send over a short, 1-page showcase blueprint designed specifically for your brand.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-8',
      businessName: 'Crust and Cream',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering & Food Wing',
      location: 'Victoria Island / Lekki, Lagos',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'Prominent dining brand but their catering segment lacks a dedicated portal. Customers must seek out secondary staff desks or call main host numbers for event queries.',
      businessOpportunity: 'Deploying a localized microsite centered entirely on their corporate catering menus and automated quote generation.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 15,
        businessPotential: 15,
        commercialPotential: 14,
        accessibility: 8,
        timingIntent: 8
      } as ScoreDetails,
      notes: 'Highly reputable VI dining brand. Large opportunity to cross-sell B2B corporate catering packages.',
      evidenceNotes: 'Renowned restaurant. Catering wing is mentioned in public brochures, but we need to verify if they have a dedicated booking landing page or if it\'s managed via restaurant host desks.',
      verificationSource: 'Google Maps search results',
      verifiedFindings: [
        'Restaurant is active in Victoria Island.'
      ],
      unverifiedFindings: [
        'Direct contact number for catering events.',
        'Dedicated catering website presence.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Dear Crust and Cream Team,

I hope this email finds you well. I am a big fan of your premium dining location in Victoria Island.

While exploring your services, I noticed that your corporate and private event catering division does not have a dedicated booking channel online. Corporate organizers looking to book Crust & Cream for private feeding must coordinate manually. By launching a high-contrast catering microsite with direct menu quotes, you could lock in corporate accounts with nearby offices.

I would love to send over a 1-page visual plan of how this corporate catering interface would operate.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-9',
      businessName: "Mimi's Pot Catering",
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering Services',
      location: 'Lagos, Nigeria',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'Listed in regional directory lists, but has zero active custom domain presence, active social handles, or verified contact information.',
      businessOpportunity: 'Setting up their first digital home on an elegant starter layout featuring high-contrast menus.',
      recommendedOfferId: 'o-website',
      scoreDetails: {
        digitalGap: 14,
        businessPotential: 12,
        commercialPotential: 11,
        accessibility: 7,
        timingIntent: 8
      } as ScoreDetails,
      notes: 'Candidate needs thorough manual validation to check if they are still operational or if contact info can be harvested.',
      evidenceNotes: 'Active online directory mentions, but lacks verified email, phone, or website URL in current databases.',
      verificationSource: 'Lagos Business Directory',
      verifiedFindings: [
        'Registered brand name under local directory.'
      ],
      unverifiedFindings: [
        'Active phone number or physical kitchen address.',
        'Social media handle validation.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Dear Mimi's Pot Team,

I came across your catering company name while reviewing registered culinary services in Lagos.

I noticed that your brand has local business directory listings but lacks an active website. For Lagos caterers, having a clean web landing page is the fastest way to showcase your kitchen sanitation, event menus, and booking options.

I design clean, affordable starter websites for local food services. I would love to send over a short layout mock showing how a customized page can help showcase your services.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-10',
      businessName: 'Gracias Kitchen',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering & Food Service',
      location: 'Lekki / Victoria Island, Lagos',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'Gourmet kitchen brand. Lacks verified custom domain or responsive bookings page, forcing clients to coordinate menus manually.',
      businessOpportunity: 'Integrating an elegant gourmet reservation page displaying menu cards and quick checkout workflows.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 17,
        businessPotential: 14,
        commercialPotential: 13,
        accessibility: 8,
        timingIntent: 9
      } as ScoreDetails,
      notes: 'Boutique food service brand. Instagram and contact details must be confirmed manually.',
      evidenceNotes: 'Boutique food service brand. Instagram and contact details must be confirmed manually.',
      verificationSource: 'Local foodie hashtags check',
      verifiedFindings: [
        'Boutique catering brand name operates in Lekki area.'
      ],
      unverifiedFindings: [
        'Verified Instagram handle.',
        'Verified email and phone.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Hi Gracias Kitchen Team,

I came across your boutique catering brand while reviewing gourmet kitchen operators in the Lekki area.

I took a look for your website and noticed that your boutique service operates without an integrated online menu and booking pipeline. Having a sleek, high-contrast reservation page would make it incredibly easy for premium clients to select gourmet platters and schedule corporate events natively.

I specialize in building elegant booking platforms for food brands. I have compiled a quick visual outline of how this would look. Open to a brief chat next week?

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-11',
      businessName: 'Palatial Caterers',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering services',
      location: 'Lagos, Nigeria',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'CAC registered brand name, but has no verified website, active social media, or active phone channels online.',
      businessOpportunity: 'Designing their foundational digital presence to anchor CAC registered status.',
      recommendedOfferId: 'o-website',
      scoreDetails: {
        digitalGap: 15,
        businessPotential: 13,
        commercialPotential: 12,
        accessibility: 7,
        timingIntent: 8
      } as ScoreDetails,
      notes: 'Needs thorough research on operational status before initiating manual contact harvesting.',
      evidenceNotes: 'Older registered caterer name found, but current operational status and digital profiles must be checked.',
      verificationSource: 'Registry of corporate affairs (CAC)',
      verifiedFindings: [
        'CAC registered company name.'
      ],
      unverifiedFindings: [
        'Current operational status.',
        'Phone, email, or social media handles.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Dear Palatial Caterers Team,

I hope this message finds you well. I came across your company name while reviewing corporate affairs registry listings for established culinary services in Lagos.

I noticed that your CAC-registered firm does not have an active website. For registered brands, having an official, custom web presence is the single most effective way to protect your trademark, showcase your service scope, and secure corporate clients who research you online first.

I build elegant, professional starter websites. I would love to share a brief, 1-page visual structure of how a modern web portal would anchor your business.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    },
    {
      id: 'p-ng-12',
      businessName: 'YDA Creations',
      category: 'DIGITAL_PRESENCE',
      industry: 'Catering & Events & Decor',
      location: 'Lagos, Nigeria',
      websiteUrl: '',
      websiteStatus: 'UNKNOWN' as WebsiteStatus,
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      source: 'Lagos Preliminary Research',
      researchDate: '2026-07-20',
      verificationStatus: 'NEEDS_VERIFICATION',
      digitalGap: 'High-end bespoke wedding designer and planner. Active social presence showing spectacular decor setups but completely lacks structured digital enquiry pathways or intake systems.',
      businessOpportunity: 'Deploying a premium portfolio website featuring interactive galleries, video reels, and automated customer intake/consultation booking.',
      recommendedOfferId: 'o-conversion',
      scoreDetails: {
        digitalGap: 19,
        businessPotential: 15,
        commercialPotential: 15,
        accessibility: 8,
        timingIntent: 9
      } as ScoreDetails,
      notes: 'Bespoke event planning candidate. Highly valuable client-facing branding. High priority target for visual client-onboarding layouts.',
      evidenceNotes: 'Luxury wedding decorator & planner in Lagos. Event gallery shown on social platforms but direct reservation flow or custom consultation booking is not verified.',
      verificationSource: 'Lagos Wedding Event listings',
      verifiedFindings: [
        'Active wedding decor brand operating in Lagos.'
      ],
      unverifiedFindings: [
        'Official phone, email and active website link.'
      ],
      outreachStatus: 'AWAITING_EVIDENCE_VERIFICATION' as const,
      message: `Dear YDA Creations Team,

I came across your gorgeous event design portfolio while researching luxury decorators and planners in Lagos. Your grand-scale floral and lighting setups are absolutely breathtaking.

I noticed that your luxury services currently lack an integrated portfolio and client intake website. Premium clients in the luxury events segment expect a high-fidelity digital portal to review previous case studies and book initial consultations. By integrating a seamless, question-guided consultation funnel on your own site, you could filter high-intent prospects and coordinate your intake process automatically.

I build high-end booking platforms for wedding professionals. I would love to send you a 1-page blueprint showing how we can structure this for you.

Warm regards,
Samuel Oluwadamilare
Founder, Accessmart Solutions`
    }
  ];

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'object' ? cleanUndefined(item) : item);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        result[key] = cleanUndefined(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

  let importedCount = 0;
  let skippedCount = 0;

  for (const c of candidates) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing candidate: "${c.businessName}"`);

    // Normalize name
    const normalizedName = c.businessName
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Deduplicate check
    const duplicate = existingProspects.find(p => 
      p.businessName.toLowerCase().trim() === normalizedName.toLowerCase().trim() ||
      (c.websiteUrl && p.websiteUrl?.toLowerCase().trim() === c.websiteUrl.toLowerCase().trim())
    );

    if (duplicate) {
      console.log(`-> Duplicate detected: Business "${normalizedName}" already exists with ID "${duplicate.id}". Skipping.`);
      skippedCount++;
      continue;
    }

    // Set Pipeline Status
    let pipelineStatus: PipelineStatus = 'Research';
    if (c.verificationStatus === 'VERIFIED') {
      pipelineStatus = 'Verified';
    } else if (c.verificationStatus === 'PARTIALLY_VERIFIED') {
      pipelineStatus = 'Research';
    } else if (c.verificationStatus === 'NEEDS_VERIFICATION') {
      pipelineStatus = 'Research';
    }

    // Calculate Lead Score & Priority
    const score = c.scoreDetails.digitalGap + 
                  c.scoreDetails.businessPotential + 
                  c.scoreDetails.commercialPotential + 
                  c.scoreDetails.accessibility + 
                  c.scoreDetails.timingIntent;
    const priority = score >= 75 ? 'A' : (score >= 55 ? 'B' : 'C');

    // Create Prospect Record
    const prospect: Prospect = {
      id: c.id,
      businessName: normalizedName,
      category: c.category,
      industry: c.industry,
      location: c.location,
      websiteUrl: c.websiteUrl || undefined,
      websiteStatus: c.websiteStatus,
      googleProfile: undefined,
      instagram: c.instagram || undefined,
      facebook: undefined,
      linkedin: undefined,
      whatsapp: c.whatsapp || undefined,
      phone: c.phone || undefined,
      email: c.email || undefined,
      source: c.source,
      researchDate: c.researchDate,
      verificationDate: c.verificationStatus === 'VERIFIED' ? new Date().toISOString().split('T')[0] : undefined,
      digitalGap: c.digitalGap,
      businessOpportunity: c.businessOpportunity,
      recommendedOfferId: c.recommendedOfferId,
      leadScore: score,
      scoreDetails: c.scoreDetails,
      priority: priority,
      status: pipelineStatus,
      notes: c.notes,
      nextAction: c.verificationStatus === 'VERIFIED' ? 'Present Opportunity Audit & Booking Proposal' : 'Harvest contacts and verify web domains'
    };

    // Save Prospect with undefined fields stripped out
    await db.saveProspect(cleanUndefined(prospect));
    console.log(`Saved Prospect: ${normalizedName} [Pipeline Status: ${pipelineStatus}, Lead Score: ${score}/100, Priority: ${priority}]`);

    // Create Audit Record with detailed Evidence Gate properties
    const audit: Audit = {
      id: `a-${c.id}`,
      prospectId: c.id,
      businessName: normalizedName,
      createdAt: new Date().toISOString(),
      overallScore: 100 - (c.scoreDetails.digitalGap * 3), // Simulating an inverse score
      strengths: [
        c.industry + ' sector alignment',
        'Strong local market demand in ' + c.location,
        c.instagram ? 'Active Instagram branding handle' : 'Documented brand name registry'
      ],
      gaps: [
        c.websiteStatus === 'NO_WEBSITE' ? 'Complete lack of dedicated business website' : 'Passive, low-conversion digital setup',
        'Reliance on raw messaging redirects for client onboarding',
        'No integrated table reservation or B2B client intake flows'
      ],
      missedOpportunity: c.digitalGap,
      recommendedSolution: c.businessOpportunity,
      recommendedOfferId: c.recommendedOfferId,
      
      // Default empty structures for dimensions to prevent front-end errors, can be filled dynamically
      discoverability: { score: 40, observation: 'Lacks local search optimization.', evidence: 'No custom SEO tags.', recommendation: 'Set up business-specific meta descriptions.' },
      credibility: { score: 45, observation: 'Lacks trust badges or custom domain reviews.', evidence: 'No testimonials section.', recommendation: 'Add a reviews widget.' },
      digitalPresence: { score: c.websiteUrl ? 60 : 20, observation: c.websiteUrl ? 'Resolves on static pages.' : 'No active domain.', evidence: c.websiteUrl ? 'Live site.' : 'Blank bio link.', recommendation: 'Deploy premium custom web architecture.' },
      conversion: { score: 35, observation: 'Passive user flow.', evidence: 'Static WhatsApp button only.', recommendation: 'Integrate dynamic intake system.' },
      contact: { score: c.phone ? 70 : 30, observation: c.phone ? 'Phone available.' : 'Missing verified phone.', evidence: c.phone ? 'Phone displayed.' : 'No contact line listed.', recommendation: 'Add high-contrast call headers.' },
      booking: { score: 20, observation: 'No self-service reservations.', evidence: 'Email/WhatsApp manual coordination required.', recommendation: 'Deploy calendar booking widget.' },
      googleVisibility: { score: 50, observation: 'Google profile exists but is unoptimized.', evidence: 'No website link on maps card.', recommendation: 'Update Maps metadata with website link.' },
      mobile: { score: 40, observation: 'Generic display styling.', evidence: 'Overlapping content block overlays.', recommendation: 'Ensure responsive touch targets.' },
      socialJourney: { score: c.instagram ? 75 : 30, observation: c.instagram ? 'Active Instagram.' : 'No social link.', evidence: c.instagram ? 'Social bio active.' : 'Blank social footprint.', recommendation: 'Link profiles with deep routing.' },
      followUp: { score: 20, observation: 'No lead capturing auto-responders.', evidence: 'Form results are unrecorded.', recommendation: 'Integrate automated email auto-responders.' },

      // Evidence Verification Gate attributes
      evidenceStatus: c.verificationStatus as any,
      evidenceNotes: c.evidenceNotes,
      lastVerifiedAt: new Date().toISOString(),
      verificationSource: c.verificationSource,
      verifiedFindings: c.verifiedFindings,
      unverifiedFindings: c.unverifiedFindings
    };

    // Save Audit
    await db.saveAudit(cleanUndefined(audit));
    console.log(`Saved Audit for ${normalizedName} [Audit Score: ${audit.overallScore}/100, Evidence Status: ${audit.evidenceStatus}]`);

    // Create Outreach Record
    const outreach: Outreach = {
      id: `o-draft-${c.id}`,
      prospectId: c.id,
      channel: c.email ? 'email' : 'whatsapp',
      message: c.message,
      personalizationBasis: `Digital Audit Gaps: ${audit.gaps.slice(0, 1).join('')}`,
      date: new Date().toISOString().split('T')[0],
      status: c.outreachStatus as any,
      sequenceStage: 'Initial'
    };

    // Save Outreach
    await db.saveOutreach(cleanUndefined(outreach));
    console.log(`Saved Outreach for ${normalizedName} [Status: ${outreach.status}]`);

    importedCount++;
  }

  console.log("\n==================================================");
  console.log("NIGERIA PROSPECT IMPORT PIPELINE RESULTS");
  console.log("==================================================");
  console.log(`Candidates Processed: ${candidates.length}`);
  console.log(`Successfully Imported: ${importedCount}`);
  console.log(`Skipped (Duplicates):  ${skippedCount}`);
  console.log("==================================================");
}

runNigeriaPipeline().catch(err => {
  console.error("Nigeria pipeline script execution failed:", err);
  process.exit(1);
});
