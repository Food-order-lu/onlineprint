// Rivego Automation System - Supabase Client
// Database connection and helper functions

import {
    Client,
    Subscription,
    Invoice,
    Quote,
    Contract,
    GoCardlessMandate,
    ClientWithSubscriptions,
    ClientStatus,
    ClientType,
    CreateClientInput,
    UpdateClientInput,
    AdminDashboardStats
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Use service key if available, otherwise fallback to anon key
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

// =============================================================================
// SUPABASE CLIENT (using fetch for simplicity, no extra deps)
// =============================================================================

type SupabaseResponse<T> = {
    data: T | null;
    error: { message: string; code: string } | null;
};

class SupabaseClient {
    private url: string;
    private key: string;

    constructor(url: string, key: string) {
        this.url = url;
        this.key = key;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<SupabaseResponse<T>> {
        try {
            const response = await fetch(`${this.url}/rest/v1/${endpoint}`, {
                ...options,
                headers: {
                    'apikey': this.key,
                    'Authorization': `Bearer ${this.key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { message: error.message || 'Request failed', code: error.code || 'UNKNOWN' } };
            }

            const data = await response.json();
            return { data, error: null };
        } catch (err) {
            return {
                data: null,
                error: { message: err instanceof Error ? err.message : 'Unknown error', code: 'FETCH_ERROR' }
            };
        }
    }

    // SELECT
    async select<T>(table: string, query: string = ''): Promise<SupabaseResponse<T[]>> {
        return this.request<T[]>(`${table}?${query}`);
    }

    // SELECT single
    async selectOne<T>(table: string, query: string): Promise<SupabaseResponse<T>> {
        const result = await this.request<T[]>(`${table}?${query}&limit=1`);
        if (result.error) return { data: null, error: result.error };
        return { data: result.data?.[0] || null, error: null };
    }

    // INSERT
    async insert<T>(table: string, data: Partial<T> | Partial<T>[]): Promise<SupabaseResponse<T[]>> {
        return this.request<T[]>(table, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // UPDATE
    async update<T>(table: string, query: string, data: Partial<T>): Promise<SupabaseResponse<T[]>> {
        return this.request<T[]>(`${table}?${query}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // DELETE
    async delete(table: string, query: string): Promise<SupabaseResponse<null>> {
        return this.request<null>(`${table}?${query}`, {
            method: 'DELETE',
        });
    }

    // RPC (stored procedures)
    async rpc<T>(functionName: string, params: Record<string, unknown> = {}): Promise<SupabaseResponse<T>> {
        try {
            const response = await fetch(`${this.url}/rest/v1/rpc/${functionName}`, {
                method: 'POST',
                headers: {
                    'apikey': this.key,
                    'Authorization': `Bearer ${this.key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                return { data: null, error: { message: error.message, code: error.code } };
            }

            const data = await response.json();
            return { data, error: null };
        } catch (err) {
            return {
                data: null,
                error: { message: err instanceof Error ? err.message : 'Unknown error', code: 'RPC_ERROR' }
            };
        }
    }
}

// =============================================================================
// CLIENT INSTANCES
// =============================================================================

// Public client (for client-side, limited access)
export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin client (for server-side, full access)
export const supabaseAdmin = new SupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =============================================================================
// HELPER FUNCTIONS - CLIENTS
// =============================================================================

export async function getClients(
    status?: ClientStatus,
    type?: ClientType
): Promise<Client[]> {
    let query = 'select=*&order=created_at.desc';
    if (status) query += `&status=eq.${status}`;
    if (type) query += `&client_type=eq.${type}`;

    const { data, error } = await supabaseAdmin.select<Client>('clients', query);
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabaseAdmin.selectOne<Client>('clients', `id=eq.${id}`);
    if (error) throw new Error(error.message);
    return data;
}

export async function getClientByEmail(email: string): Promise<Client | null> {
    const { data, error } = await supabaseAdmin.selectOne<Client>('clients', `email=eq.${email}`);
    if (error) throw new Error(error.message);
    return data;
}

export async function getClientWithSubscriptions(id: string): Promise<ClientWithSubscriptions | null> {
    const client = await getClientById(id);
    if (!client) return null;

    const subscriptions = await getSubscriptionsByClient(id);
    const mandate = await getMandateByClient(id);

    const total_monthly = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.monthly_amount, 0);

    return {
        ...client,
        subscriptions,
        mandate,
        total_monthly,
    };
}

export async function createClient(input: CreateClientInput): Promise<Client> {
    const { data, error } = await supabaseAdmin.insert<Client>('clients', input);
    if (error) {
        console.error('SUPABASE CREATE ERROR:', error);
        throw new Error(`SUPABASE ERROR: ${error.message} (${error.code})`);
    }
    console.log('SUPABASE CREATE DATA:', data);
    if (!data || data.length === 0) throw new Error('SUPABASE ERROR: No data returned after insert (Row Level Security?)');
    return data[0];
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const { data, error } = await supabaseAdmin.update<Client>('clients', `id=eq.${id}`, input);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Failed to update client');
    return data[0];
}

export async function deleteClient(id: string): Promise<void> {
    const { error } = await supabaseAdmin.delete('clients', `id=eq.${id}`);
    if (error) throw new Error(error.message);
}

// =============================================================================
// HELPER FUNCTIONS - SUBSCRIPTIONS
// =============================================================================

export async function getSubscriptionsByClient(clientId: string): Promise<Subscription[]> {
    const { data, error } = await supabaseAdmin.select<Subscription>(
        'subscriptions',
        `client_id=eq.${clientId}&order=created_at.desc`
    );
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createSubscription(input: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const { data, error } = await supabaseAdmin.insert<Subscription>('subscriptions', input);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Failed to create subscription');
    return data[0];
}

export async function getSubscriptionById(id: string): Promise<Subscription | null> {
    const { data, error } = await supabaseAdmin.selectOne<Subscription>(
        'subscriptions',
        `id=eq.${id}`
    );
    if (error) throw new Error(error.message);
    return data || null;
}


export async function cancelSubscription(id: string): Promise<Subscription> {
    const { data, error } = await supabaseAdmin.update<Subscription>(
        'subscriptions',
        `id=eq.${id}`,
        { status: 'cancelled', cancelled_at: new Date().toISOString().split('T')[0] }
    );
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Failed to cancel subscription');
    return data[0];
}

// =============================================================================
// HELPER FUNCTIONS - GOCARDLESS MANDATES
// =============================================================================

export async function getMandateByClient(clientId: string): Promise<GoCardlessMandate | null> {
    const { data, error } = await supabaseAdmin.selectOne<GoCardlessMandate>(
        'gocardless_mandates',
        `client_id=eq.${clientId}&status=eq.active`
    );
    if (error) throw new Error(error.message);
    return data;
}

export async function createMandate(input: Omit<GoCardlessMandate, 'id' | 'created_at'>): Promise<GoCardlessMandate> {
    const { data, error } = await supabaseAdmin.insert<GoCardlessMandate>('gocardless_mandates', input);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Failed to create mandate');
    return data[0];
}

export async function updateMandateStatus(mandateId: string, status: GoCardlessMandate['status']): Promise<void> {
    const updates: Partial<GoCardlessMandate> = { status };
    if (status === 'active') updates.activated_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

    const { error } = await supabaseAdmin.update<GoCardlessMandate>(
        'gocardless_mandates',
        `mandate_id=eq.${mandateId}`,
        updates
    );
    if (error) throw new Error(error.message);
}

// =============================================================================
// HELPER FUNCTIONS - INVOICES
// =============================================================================

export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    const { data, error } = await supabaseAdmin.select<Invoice>(
        'invoices',
        `client_id=eq.${clientId}&order=created_at.desc`
    );
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createInvoice(input: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const { data, error } = await supabaseAdmin.insert<Invoice>('invoices', input);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Failed to create invoice');
    return data[0];
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabaseAdmin.selectOne<Invoice>('invoices', `id=eq.${id}`);
    if (error) throw new Error(error.message);
    return data;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabaseAdmin.update<Invoice>('invoices', `id=eq.${id}`, updates);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Failed to update invoice');
    return data[0];
}

export async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get count of invoices this month
    const { data } = await supabaseAdmin.select<Invoice>(
        'invoices',
        `invoice_number=like.RIV-${year}${month}*`
    );

    const count = (data?.length || 0) + 1;
    return `RIV-${year}${month}-${String(count).padStart(4, '0')}`;
}

// =============================================================================
// HELPER FUNCTIONS - QUOTES
// =============================================================================

export async function getQuoteById(id: string): Promise<Quote | null> {
    const { data, error } = await supabaseAdmin.selectOne<Quote>('quotes', `id=eq.${id}`);
    if (error) throw new Error(error.message);
    return data;
}

export async function getQuoteByNumber(quoteNumber: string): Promise<Quote | null> {
    const { data, error } = await supabaseAdmin.selectOne<Quote>('quotes', `quote_number=eq.${quoteNumber}`);
    if (error) throw new Error(error.message);
    return data;
}

export async function generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const { data } = await supabaseAdmin.select<Quote>(
        'quotes',
        `quote_number=like.DEV-${year}${month}*`
    );

    const count = (data?.length || 0) + 1;
    return `DEV-${year}${month}-${String(count).padStart(3, '0')}`;
}

// =============================================================================
// HELPER FUNCTIONS - CONTRACTS
// =============================================================================

export async function getContractsByClient(clientId: string): Promise<Contract[]> {
    const { data, error } = await supabaseAdmin.select<Contract>(
        'contracts',
        `client_id=eq.${clientId}&order=created_at.desc`
    );
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getQuotesByClient(clientId: string): Promise<Quote[]> {
    // Quotes are linked by client_id if set, otherwise try to match by email
    const client = await getClientById(clientId);
    if (!client) return [];

    // Try client_id lookup first
    let { data, error } = await supabaseAdmin.select<Quote>(
        'quotes',
        `client_id=eq.${clientId}&order=created_at.desc`
    );
    if (error) throw new Error(error.message);

    // If no quotes with client_id, try matching by email
    if (!data || data.length === 0) {
        const emailResult = await supabaseAdmin.select<Quote>(
            'quotes',
            `client_email=eq.${client.email}&order=created_at.desc`
        );
        if (emailResult.error) throw new Error(emailResult.error.message);
        data = emailResult.data;
    }

    return data || [];
}

// =============================================================================
// HELPER FUNCTIONS - DASHBOARD STATS
// =============================================================================

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const clients = await getClients();
    const activeClients = clients.filter(c => c.status === 'active');
    const legacyClients = clients.filter(c => c.client_type === 'legacy');
    const newClients = clients.filter(c => c.client_type === 'new');
    const pendingCancellations = clients.filter(c => c.status === 'pending_cancellation');

    // Get all active subscriptions
    let totalMRR = 0;
    for (const client of activeClients) {
        const subs = await getSubscriptionsByClient(client.id);
        totalMRR += subs
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + s.monthly_amount, 0);
    }

    // Get invoice stats
    const { data: pendingInvoices } = await supabaseAdmin.select<Invoice>('invoices', 'status=eq.sent');
    const { data: overdueInvoices } = await supabaseAdmin.select<Invoice>('invoices', 'status=eq.overdue');

    return {
        total_clients: clients.length,
        active_clients: activeClients.length,
        legacy_clients: legacyClients.length,
        new_clients: newClients.length,
        pending_cancellations: pendingCancellations.length,
        monthly_recurring_revenue: totalMRR,
        pending_invoices: pendingInvoices?.length || 0,
        overdue_invoices: overdueInvoices?.length || 0,
    };
}
