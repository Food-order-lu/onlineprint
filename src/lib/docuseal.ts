
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
}

export class DocuSealClient {
  private apiKey: string;
  private baseUrl = 'https://api.docuseal.eu'; // EU cloud endpoint

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
   * Create a template from a PDF file
   */
  async createTemplateFromPdf(pdfBase64: string, name: string): Promise<{ id: number; slug: string }> {
    if (!this.apiKey) {
      throw new Error('DOCUSEAL_API_KEY is not configured');
    }

    try {
      console.log('Creating DocuSeal Template from PDF:', name);
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
                name: 'Bon pour accord',
                role: 'First Party',
                type: 'signature',  // Changed to signature for handwriting
                areas: [{
                  page: 1,
                  x: 0.05,   // Left side
                  y: 0.92,   // Very bottom of page - 92% from top
                  w: 0.40,   // 40% width
                  h: 0.025   // 2.5% height - smaller for text
                }]
              },
              {
                name: 'Date',
                role: 'First Party',
                type: 'date',
                areas: [{
                  page: 1,
                  x: 0.55,   // Right side
                  y: 0.92,   // Same row as Bon pour accord
                  w: 0.25,   // 25% width
                  h: 0.02    // 2% height
                }]
              },
              {
                name: 'Signature Client',
                role: 'First Party',
                type: 'signature',
                areas: [{
                  page: 1,
                  x: 0.05,   // Left aligned
                  y: 0.95,   // Below date row - 95% from top
                  w: 0.50,   // 50% width
                  h: 0.035   // 3.5% height for signature
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
  async initSigningSession(data: { templateId?: string, documents?: DocuSealDocument[], email: string, name?: string }) {
    if (!data.templateId && !data.documents) {
      throw new Error("Must provide either templateId or documents");
    }

    let templateId = data.templateId;

    // If documents provided, create a template first
    if (data.documents && data.documents.length > 0 && !templateId) {
      const doc = data.documents[0];
      const template = await this.createTemplateFromPdf(doc.file, doc.name);
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
    };

    return this.createSubmission(payload);
  }
}

export const docuSeal = new DocuSealClient();
