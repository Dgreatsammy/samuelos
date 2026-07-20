import { 
  Service, Offer, Prospect, Audit, Outreach, Client, Project, CaseStudy, CareerEntry, KnowledgeItem 
} from '../types';

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('samuel_os_token');
  const headers: any = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${res.status}`);
  }
  
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: any; token: string }> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async loginWithToken(token: string): Promise<{ success: boolean; user: any; token: string }> {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Services
  async getServices(): Promise<Service[]> {
    return fetchAPI<Service[]>('/services');
  },
  async saveService(service: Service): Promise<Service> {
    return fetchAPI<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  },
  async deleteService(id: string): Promise<void> {
    return fetchAPI(`/services/${id}`, { method: 'DELETE' });
  },

  // Offers
  async getOffers(): Promise<Offer[]> {
    return fetchAPI<Offer[]>('/offers');
  },
  async saveOffer(offer: Offer): Promise<Offer> {
    return fetchAPI<Offer>('/offers', {
      method: 'POST',
      body: JSON.stringify(offer),
    });
  },
  async deleteOffer(id: string): Promise<void> {
    return fetchAPI(`/offers/${id}`, { method: 'DELETE' });
  },

  // Prospects
  async getProspects(): Promise<Prospect[]> {
    return fetchAPI<Prospect[]>('/prospects');
  },
  async saveProspect(prospect: Prospect): Promise<Prospect> {
    return fetchAPI<Prospect>('/prospects', {
      method: 'POST',
      body: JSON.stringify(prospect),
    });
  },
  async deleteProspect(id: string): Promise<void> {
    return fetchAPI(`/prospects/${id}`, { method: 'DELETE' });
  },
  async importProspects(list: Prospect[]): Promise<{ success: boolean; count: number; imported: Prospect[] }> {
    return fetchAPI('/prospects/import', {
      method: 'POST',
      body: JSON.stringify(list),
    });
  },

  // Audits
  async getAudits(): Promise<Audit[]> {
    return fetchAPI<Audit[]>('/audits');
  },
  async saveAudit(audit: Audit): Promise<Audit> {
    return fetchAPI<Audit>('/audits', {
      method: 'POST',
      body: JSON.stringify(audit),
    });
  },
  async getAuditsForProspect(prospectId: string): Promise<Audit[]> {
    return fetchAPI<Audit[]>(`/audits/${prospectId}`);
  },
  async generateAudit(data: {
    businessName: string;
    websiteUrl?: string;
    industry: string;
    location: string;
    mainGoal: string;
    prospectId?: string;
    isPublicLead?: boolean;
    email?: string;
    phone?: string;
  }): Promise<{ success: boolean; audit: Audit; prospectId: string }> {
    return fetchAPI('/audits/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async requestConsultation(prospectId: string, data: { preferredContactChannel: string; additionalNotes: string }): Promise<{ success: boolean; message: string }> {
    return fetchAPI(`/audits/${prospectId}/request-consultation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Outreach
  async getOutreaches(): Promise<Outreach[]> {
    return fetchAPI<Outreach[]>('/outreaches');
  },
  async saveOutreach(outreach: Outreach): Promise<Outreach> {
    return fetchAPI<Outreach>('/outreaches', {
      method: 'POST',
      body: JSON.stringify(outreach),
    });
  },
  async generateOutreach(prospectId: string, channel: 'whatsapp' | 'instagram' | 'email'): Promise<{ success: boolean; message: string }> {
    return fetchAPI('/outreaches/generate', {
      method: 'POST',
      body: JSON.stringify({ prospectId, channel }),
    });
  },

  // Clients
  async getClients(): Promise<Client[]> {
    return fetchAPI<Client[]>('/clients');
  },
  async saveClient(client: Client): Promise<Client> {
    return fetchAPI<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return fetchAPI<Project[]>('/projects');
  },
  async saveProject(project: Project): Promise<Project> {
    return fetchAPI<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  // Case Studies
  async getCaseStudies(): Promise<CaseStudy[]> {
    return fetchAPI<CaseStudy[]>('/case-studies');
  },
  async saveCaseStudy(cs: CaseStudy): Promise<CaseStudy> {
    return fetchAPI<CaseStudy>('/case-studies', {
      method: 'POST',
      body: JSON.stringify(cs),
    });
  },

  // Career Engine
  async getCareerEntries(): Promise<CareerEntry[]> {
    return fetchAPI<CareerEntry[]>('/career-entries');
  },
  async saveCareerEntry(entry: CareerEntry): Promise<CareerEntry> {
    return fetchAPI<CareerEntry>('/career-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  async deleteCareerEntry(id: string): Promise<void> {
    return fetchAPI(`/career-entries/${id}`, {
      method: 'DELETE',
    });
  },
  async generateCareerEvidence(data: {
    projectName: string;
    description: string;
    deliverables: string[];
    outcomeResult?: string;
  }): Promise<{ success: boolean; evidence: any }> {
    return fetchAPI('/career-entries/generate-evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Knowledge base
  async getKnowledgeItems(): Promise<KnowledgeItem[]> {
    return fetchAPI<KnowledgeItem[]>('/knowledge-items');
  },
  async saveKnowledgeItem(item: KnowledgeItem): Promise<KnowledgeItem> {
    return fetchAPI<KnowledgeItem>('/knowledge-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },
  async deleteKnowledgeItem(id: string): Promise<void> {
    return fetchAPI(`/knowledge-items/${id}`, { method: 'DELETE' });
  },

  // Settings
  async getSettings(): Promise<any> {
    return fetchAPI('/settings');
  },
  async saveSettings(settings: any): Promise<any> {
    return fetchAPI('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }
};
