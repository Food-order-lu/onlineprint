
export interface DocuSealSubmitter {
  email: string;
  role?: string;
  name?: string;
}

export interface DocuSealField {
  name: string;
  type: 'signature' | 'text' | 'date' | 'initials';
  page?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  required?: boolean;
}

export interface DocuSealDocument {
  name: string;
  file: string; // Base64 encoded content
  fields?: DocuSealField[];
}

export interface DocuSealSubmissionData {
  template_id?: string;
  documents?: DocuSealDocument[];
  send_email: boolean;
  submitters: DocuSealSubmitter[];
  completed_redirect_url?: string;
  field_overrides?: DocuSealOverrides;
}

export interface DocuSealFieldOverride {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface DocuSealOverrides {
  mention?: DocuSealFieldOverride;
  date?: DocuSealFieldOverride;
  signature?: DocuSealFieldOverride;
}

export class DocuSealClient {
  private apiKey: string;
  private baseUrl = 'https://api.docuseal.com'; // Try .com instead of .eu

  constructor() {
    this.apiKey = process.env.DOCUSEAL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('DOCUSEAL_API_KEY is not set');
    }
  }

  async createSubmission(data: DocuSealSubmissionData) {
    if (!this.apiKey) {
      throw new Error('DOCUSEAL_API_KEY is not configured');
    }

    try {
      console.log('DocuSeal Request:', JSON.stringify(data, null, 2));
      const response = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': this.apiKey, // DocuSeal uses X-Auth-Token header
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DocuSeal Error Response:', errorText);
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`DocuSeal API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        throw new Error(errorJson.message || errorJson.error || 'Failed to create submission');
      }

      return await response.json();
    } catch (error) {
      console.error('DocuSeal Submission Error:', error);
      throw error;
    }
  }

  /**
   * Get submission status by slug
   */
  async getSubmission(slug: string): Promise<any> {
    if (!this.apiKey) return null;
    try {
      const response = await fetch(`${this.baseUrl}/submissions?slug=${slug}&limit=1`, {
        method: 'GET',
        headers: { 'X-Auth-Token': this.apiKey }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.data && data.data.length > 0 ? data.data[0] : null;
    } catch (e) {
      console.error('Failed to get DocuSeal submission:', e);
      return null;
    }
  }

  /**
   * Create a template from a PDF file
   */
  async createTemplateFromPdf(pdfBase64: string, name: string, overrides?: DocuSealOverrides): Promise<{ id: number; slug: string }> {
    if (!this.apiKey) {
      throw new Error('DOCUSEAL_API_KEY is not configured');
    }

    try {
      console.log('Creating DocuSeal Template from PDF:', name);

      const mentionX = overrides?.mention?.x ?? parseFloat(process.env.DOCUSEAL_MENTION_X || '0.05');
      const mentionY = overrides?.mention?.y ?? parseFloat(process.env.DOCUSEAL_MENTION_Y || '0.78');
      const mentionW = overrides?.mention?.w ?? parseFloat(process.env.DOCUSEAL_MENTION_W || '0.40');
      const mentionH = overrides?.mention?.h ?? parseFloat(process.env.DOCUSEAL_MENTION_H || '0.03');

      const dateX = overrides?.date?.x ?? parseFloat(process.env.DOCUSEAL_DATE_X || '0.55');
      const dateY = overrides?.date?.y ?? parseFloat(process.env.DOCUSEAL_DATE_Y || '0.78');
      const dateW = overrides?.date?.w ?? parseFloat(process.env.DOCUSEAL_DATE_W || '0.25');
      const dateH = overrides?.date?.h ?? parseFloat(process.env.DOCUSEAL_DATE_H || '0.03');

      const sigX = overrides?.signature?.x ?? parseFloat(process.env.DOCUSEAL_SIGNATURE_X || '0.05');
      const sigY = overrides?.signature?.y ?? parseFloat(process.env.DOCUSEAL_SIGNATURE_Y || '0.84');
      const sigW = overrides?.signature?.w ?? parseFloat(process.env.DOCUSEAL_SIGNATURE_W || '0.45');
      const sigH = overrides?.signature?.h ?? parseFloat(process.env.DOCUSEAL_SIGNATURE_H || '0.06');

      const response = await fetch(`${this.baseUrl}/templates/pdf`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          documents: [{
            name: name,
            file: pdfBase64,
            fields: [
              {
                name: 'Mention (Bon pour accord)',
                role: 'First Party',
                type: 'signature',  // Handwritten mention as signature field
                areas: [{
                  page: parseInt(process.env.DOCUSEAL_MENTION_PAGE || '1'),
                  x: mentionX,
                  y: mentionY,
                  w: mentionW,
                  h: mentionH
                }]
              },
              {
                name: 'Date',
                role: 'First Party',
                type: 'date',
                areas: [{
                  page: parseInt(process.env.DOCUSEAL_DATE_PAGE || '1'),
                  x: dateX,
                  y: dateY,
                  w: dateW,
                  h: dateH
                }]
              },
              {
                name: 'Signature Client',
                role: 'First Party',
                type: 'signature',
                areas: [{
                  page: parseInt(process.env.DOCUSEAL_SIGNATURE_PAGE || '1'),
                  x: sigX,
                  y: sigY,
                  w: sigW,
                  h: sigH
                }]
              }
            ]
          }]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DocuSeal Template Creation Error:', errorText);
        throw new Error(`Failed to create template: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Template created:', result);
      return result;
    } catch (error) {
      console.error('DocuSeal Template Error:', error);
      throw error;
    }
  }

  /**
   * Helper to initialize a submission - optionally creates template from PDF first
   */
  async initSigningSession(data: { templateId?: string, documents?: DocuSealDocument[], email: string, name?: string, redirect_url?: string, field_overrides?: DocuSealOverrides }) {
    if (!data.templateId && !data.documents) {
      throw new Error("Must provide either templateId or documents");
    }

    let templateId = data.templateId;

    // If documents provided, create a template first
    if (data.documents && data.documents.length > 0 && !templateId) {
      const doc = data.documents[0];
      const template = await this.createTemplateFromPdf(doc.file, doc.name, data.field_overrides);
      templateId = template.id.toString();
      console.log('Using new template ID:', templateId);
    }

    // Now create submission with the template_id
    const payload: DocuSealSubmissionData = {
      template_id: templateId,
      send_email: false,
      submitters: [
        {
          email: data.email,
          name: data.name,
        },
      ],
      completed_redirect_url: data.redirect_url,
    };

    return this.createSubmission(payload);
  }
}

export const docuSeal = new DocuSealClient();
