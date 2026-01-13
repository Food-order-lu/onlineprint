// Zoho Books API Client
// Facturation automatique avec support acompte

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '';
const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID || '';
const ZOHO_REGION = process.env.ZOHO_REGION || 'eu'; // 'eu', 'com', 'in', etc.

const AUTH_URL = `https://accounts.zoho.${ZOHO_REGION}/oauth/v2/token`;
const API_URL = `https://www.zohoapis.${ZOHO_REGION}/books/v3`;

// =============================================================================
// TYPES
// =============================================================================

export interface ZohoContact {
    contact_id: string;
    contact_name: string;
    company_name?: string;
    email: string;
    phone?: string;
    contact_type: 'customer' | 'vendor';
    status: 'active' | 'inactive';
    billing_address?: {
        address: string;
        city: string;
        zip: string;
        country: string;
    };
    vat_reg_no?: string;
}

export interface ZohoInvoiceLineItem {
    item_id?: string;
    name: string;
    description?: string;
    rate: number;
    quantity: number;
    tax_id?: string;
    tax_percentage?: number;
}

export interface ZohoInvoice {
    invoice_id: string;
    invoice_number: string;
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'void' | 'partially_paid';
    customer_id: string;
    customer_name: string;
    date: string;
    due_date: string;
    line_items: ZohoInvoiceLineItem[];
    sub_total: number;
    tax_total: number;
    total: number;
    balance: number;
    currency_code: string;
    notes?: string;
    terms?: string;
    reference_number?: string;
}

export interface CreateInvoiceInput {
    customer_id: string;
    date?: string;
    due_date?: string;
    line_items: ZohoInvoiceLineItem[];
    notes?: string;
    terms?: string;
    reference_number?: string;
    is_draft?: boolean;
}

// =============================================================================
// TOKEN MANAGEMENT
// =============================================================================

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (accessToken && Date.now() < tokenExpiry - 60000) {
        return accessToken;
    }

    // Refresh the token
    const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            refresh_token: ZOHO_REFRESH_TOKEN,
            client_id: ZOHO_CLIENT_ID,
            client_secret: ZOHO_CLIENT_SECRET,
            grant_type: 'refresh_token',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Zoho OAuth error: ${error}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    return accessToken!;
}

// =============================================================================
// API CLIENT
// =============================================================================

class ZohoClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = await getAccessToken();

        const url = new URL(`${API_URL}${endpoint}`);
        url.searchParams.set('organization_id', ZOHO_ORGANIZATION_ID);

        const response = await fetch(url.toString(), {
            ...options,
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(data.message || `Zoho API error: ${data.code}`);
        }

        return data;
    }

    // ==========================================================================
    // CONTACTS
    // ==========================================================================

    async createContact(params: {
        contact_name: string;
        company_name?: string;
        email: string;
        phone?: string;
        billing_address?: {
            address?: string;
            city?: string;
            zip?: string;
            country?: string;
        };
        vat_reg_no?: string;
    }): Promise<{ contact: ZohoContact }> {
        const payload: any = {
            contact_name: params.contact_name,
            company_name: params.company_name,
            contact_type: 'customer',
            billing_address: params.billing_address,
            contact_persons: [{
                email: params.email,
                phone: params.phone,
                is_primary_contact: true,
            }],
        };

        if (params.vat_reg_no && params.vat_reg_no.trim().length > 0) {
            payload.vat_reg_no = params.vat_reg_no;
        }

        try {
            console.log('Creating Zoho Contact with payload:', JSON.stringify(payload, null, 2));
            return await this.request('/contacts', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch (error: any) {
            console.error('Zoho Contact Create Failed:', error);

            // Retry without VAT number if that was the issue
            if (payload.vat_reg_no && (error.message?.includes('vat_reg_no') || error.message?.includes('Invalid Element'))) {
                console.warn('Retrying Zoho Contact creation without VAT number...');
                delete payload.vat_reg_no;
                return this.request('/contacts', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
            throw error;
        }
    }

    async getContact(id: string): Promise<{ contact: ZohoContact }> {
        return this.request(`/contacts/${id}`);
    }

    async findContactByEmail(email: string): Promise<{ contacts: ZohoContact[] }> {
        return this.request(`/contacts?email=${encodeURIComponent(email)}`);
    }

    async listContacts(params?: { page?: number; per_page?: number }): Promise<{ contacts: ZohoContact[]; page_context: any }> {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.per_page) searchParams.append('per_page', params.per_page.toString());

        const queryString = searchParams.toString();
        return this.request(queryString ? `/contacts?${queryString}` : '/contacts');
    }

    async updateContact(id: string, params: Partial<{
        contact_name: string;
        company_name: string;
        billing_address: {
            address?: string;
            city?: string;
            zip?: string;
            country?: string;
        };
        vat_reg_no: string;
    }>): Promise<{ contact: ZohoContact }> {
        return this.request(`/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(params),
        });
    }

    // ==========================================================================
    // INVOICES
    // ==========================================================================

    /**
     * Create a new invoice (optionally as draft for acompte)
     */
    async createInvoice(input: CreateInvoiceInput): Promise<{ invoice: ZohoInvoice }> {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = input.due_date || (() => {
            const due = new Date();
            due.setDate(due.getDate() + 30);
            return due.toISOString().split('T')[0];
        })();

        // Create invoice
        const result = await this.request<{ invoice: ZohoInvoice }>('/invoices', {
            method: 'POST',
            body: JSON.stringify({
                customer_id: input.customer_id,
                date: input.date || today,
                due_date: dueDate,
                line_items: input.line_items,
                notes: input.notes,
                terms: input.terms,
                reference_number: input.reference_number,
            }),
        });

        // If should be draft, it's already created as draft by default in Zoho
        // No action needed

        return result;
    }

    /**
     * Create a deposit invoice (acompte)
     * Creates invoice as DRAFT - will be reviewed before sending
     */
    async createDepositInvoice(params: {
        customer_id: string;
        original_total: number;
        deposit_percent: number;
        description: string;
        reference?: string;
    }): Promise<{ invoice: ZohoInvoice }> {
        const depositAmount = (params.original_total * params.deposit_percent) / 100;

        return this.createInvoice({
            customer_id: params.customer_id,
            line_items: [{
                name: `Acompte ${params.deposit_percent}%`,
                description: params.description,
                rate: depositAmount,
                quantity: 1,
            }],
            notes: `Facture d'acompte (${params.deposit_percent}%) pour: ${params.description}`,
            reference_number: params.reference,
            is_draft: true, // Kept as draft for review
        });
    }

    /**
     * Create the final invoice (solde) after deposit
     */
    async createBalanceInvoice(params: {
        customer_id: string;
        original_total: number;
        deposit_paid: number;
        line_items: ZohoInvoiceLineItem[];
        deposit_invoice_number: string;
        reference?: string;
    }): Promise<{ invoice: ZohoInvoice }> {
        const balanceAmount = params.original_total - params.deposit_paid;

        // Add original line items
        const items = [...params.line_items];

        // Add deposit deduction line
        items.push({
            name: `Déduction acompte (Facture ${params.deposit_invoice_number})`,
            description: 'Acompte déjà versé',
            rate: -params.deposit_paid,
            quantity: 1,
        });

        return this.createInvoice({
            customer_id: params.customer_id,
            line_items: items,
            notes: `Facture de solde. Acompte de ${params.deposit_paid}€ déjà versé (Facture ${params.deposit_invoice_number}).`,
            reference_number: params.reference,
        });
    }

    async getInvoice(id: string): Promise<{ invoice: ZohoInvoice }> {
        return this.request(`/invoices/${id}`);
    }

    async sendInvoice(id: string, params?: {
        to_email?: string;
        cc_emails?: string[];
        subject?: string;
        body?: string;
    }): Promise<{ message: string }> {
        return this.request(`/invoices/${id}/email`, {
            method: 'POST',
            body: JSON.stringify({
                to_mail_ids: params?.to_email ? [params.to_email] : undefined,
                cc_mail_ids: params?.cc_emails,
                subject: params?.subject,
                body: params?.body,
            }),
        });
    }

    async markInvoiceAsSent(id: string): Promise<{ message: string }> {
        return this.request(`/invoices/${id}/status/sent`, {
            method: 'POST',
        });
    }

    async markInvoiceAsPaid(id: string, params: {
        amount: number;
        date: string;
        payment_mode?: string;
        reference?: string;
    }): Promise<{ message: string }> {
        // First create a payment
        await this.request('/customerpayments', {
            method: 'POST',
            body: JSON.stringify({
                customer_id: '', // Will be inferred from invoice
                payment_mode: params.payment_mode || 'Bank Transfer',
                amount: params.amount,
                date: params.date,
                reference_number: params.reference,
                invoices: [{
                    invoice_id: id,
                    amount_applied: params.amount,
                }],
            }),
        });

        return { message: 'Payment recorded' };
    }

    async voidInvoice(id: string): Promise<{ message: string }> {
        return this.request(`/invoices/${id}/status/void`, {
            method: 'POST',
        });
    }

    // ==========================================================================
    // ESTIMATES (QUOTES)
    // ==========================================================================

    async createEstimate(input: {
        customer_id: string;
        date?: string;
        expiry_date?: string;
        line_items: ZohoInvoiceLineItem[];
        notes?: string;
        terms?: string;
        reference_number?: string;
        discount?: number; // percent or amount? Zoho uses discount on line item usually, or total discount
        is_discount_before_tax?: boolean;
        discount_type?: 'entity_level' | 'item_level';
    }): Promise<{ estimate: { estimate_id: string; estimate_number: string; total: number } }> {
        const today = new Date().toISOString().split('T')[0];
        const expiryDate = input.expiry_date || (() => {
            const exp = new Date();
            exp.setDate(exp.getDate() + 30);
            return exp.toISOString().split('T')[0];
        })();

        return this.request('/estimates', {
            method: 'POST',
            body: JSON.stringify({
                customer_id: input.customer_id,
                date: input.date || today,
                expiry_date: expiryDate,
                line_items: input.line_items,
                notes: input.notes,
                terms: input.terms,
                reference_number: input.reference_number,
                discount: input.discount,
                is_discount_before_tax: input.is_discount_before_tax || true,
                discount_type: input.discount_type || 'entity_level',
            }),
        });
    }

    async findEstimateByNumber(estimateNumber: string): Promise<{ estimates: any[] }> {
        return this.request(`/estimates?estimate_number=${estimateNumber}`);
    }

    // ==========================================================================
    // RECURRING INVOICES
    // ==========================================================================

    async createRecurringInvoice(params: {
        customer_id: string;
        recurrence_name: string;
        recurrence_frequency: 'monthly' | 'yearly' | 'weekly';
        start_date: string;
        end_date?: string;
        line_items: ZohoInvoiceLineItem[];
        notes?: string;
    }): Promise<{ recurring_invoice: { recurring_invoice_id: string } }> {
        return this.request('/recurringinvoices', {
            method: 'POST',
            body: JSON.stringify({
                customer_id: params.customer_id,
                recurrence_name: params.recurrence_name,
                recurrence_frequency: params.recurrence_frequency,
                repeat_every: 1,
                start_date: params.start_date,
                end_date: params.end_date,
                line_items: params.line_items,
                notes: params.notes,
            }),
        });
    }

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    /**
     * Get or create a Zoho contact for a client
     */
    async getOrCreateContact(client: {
        email: string;
        company_name: string;
        contact_name: string;
        phone?: string;
        address?: string;
        city?: string;
        postal_code?: string;
        country?: string;
        vat_number?: string;
    }): Promise<ZohoContact> {
        // Try to find existing contact
        const { contacts } = await this.findContactByEmail(client.email);

        if (contacts && contacts.length > 0) {
            return contacts[0];
        }

        // Create new contact
        const { contact } = await this.createContact({
            contact_name: client.company_name,
            company_name: client.company_name,
            email: client.email,
            phone: client.phone,
            billing_address: {
                address: client.address,
                city: client.city,
                zip: client.postal_code,
                country: client.country || 'Luxembourg',
            },
            vat_reg_no: client.vat_number,
        });

        return contact;
    }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const zoho = new ZohoClient();

// =============================================================================
// DEPOSIT INVOICE HELPER
// =============================================================================

/**
 * Create a deposit invoice when a quote is signed
 * Used right after quote signature if it contains recurring items
 */
export async function createDepositInvoiceOnQuoteSign(params: {
    client: {
        email: string;
        company_name: string;
        contact_name: string;
        phone?: string;
        address?: string;
        city?: string;
        postal_code?: string;
        vat_number?: string;
    };
    quote_number: string;
    quote_total: number;
    deposit_percent?: number; // Default 20%
    services_description: string;
}): Promise<{ zoho_contact_id: string; zoho_invoice_id: string; deposit_amount: number }> {
    const depositPercent = params.deposit_percent || 20;

    // Get or create Zoho contact
    const contact = await zoho.getOrCreateContact(params.client);

    // Create deposit invoice as draft
    const { invoice } = await zoho.createDepositInvoice({
        customer_id: contact.contact_id,
        original_total: params.quote_total,
        deposit_percent: depositPercent,
        description: `Services: ${params.services_description}`,
        reference: `Devis ${params.quote_number}`,
    });

    console.log(`Created deposit invoice ${invoice.invoice_number} for ${params.client.email} (Draft - ${depositPercent}% of ${params.quote_total}€)`);

    return {
        zoho_contact_id: contact.contact_id,
        zoho_invoice_id: invoice.invoice_id,
        deposit_amount: (params.quote_total * depositPercent) / 100,
    };
}
