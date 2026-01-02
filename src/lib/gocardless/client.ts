// GoCardless API Client
// Direct Debit / SEPA integration

// Read env vars dynamically to ensure they're loaded
function getAccessToken() {
    return process.env.GOCARDLESS_ACCESS_TOKEN || '';
}

function getEnvironment() {
    return process.env.GOCARDLESS_ENVIRONMENT || 'sandbox';
}

function getBaseUrl() {
    return getEnvironment() === 'live'
        ? 'https://api.gocardless.com'
        : 'https://api-sandbox.gocardless.com';
}

// =============================================================================
// TYPES
// =============================================================================

export interface GoCardlessCustomer {
    id: string;
    email: string;
    given_name: string;
    family_name: string;
    company_name?: string;
    address_line1?: string;
    city?: string;
    postal_code?: string;
    country_code: string;
    created_at: string;
}

export interface GoCardlessMandate {
    id: string;
    status: 'pending_submission' | 'submitted' | 'active' | 'failed' | 'cancelled' | 'expired';
    scheme: 'sepa_core' | 'bacs' | 'autogiro' | 'becs';
    reference?: string;
    created_at: string;
    links: {
        customer: string;
        customer_bank_account: string;
        creditor: string;
    };
}

export interface GoCardlessPayment {
    id: string;
    amount: number;
    currency: string;
    status: 'pending_submission' | 'submitted' | 'confirmed' | 'paid_out' | 'cancelled' | 'failed' | 'charged_back';
    description?: string;
    reference?: string;
    charge_date: string;
    created_at: string;
    links: {
        mandate: string;
        creditor: string;
    };
}

export interface BillingRequest {
    id: string;
    status: 'pending' | 'ready_to_fulfil' | 'fulfilled' | 'cancelled';
    mandate_request?: {
        scheme: string;
        links?: {
            mandate?: string;
        };
    };
    links?: {
        customer?: string;
        mandate_request?: string;
    };
}

export interface BillingRequestFlow {
    id: string;
    authorisation_url: string;
    auto_fulfil: boolean;
    lock_customer_details: boolean;
    exit_uri?: string;
    redirect_uri?: string;
}

// =============================================================================
// API CLIENT
// =============================================================================

class GoCardlessClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        idempotencyKey?: string
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${getAccessToken()}`,
            'GoCardless-Version': '2015-07-06',
            'Content-Type': 'application/json',
            ...(options.headers as any || {}),
        };

        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
        }

        const response = await fetch(`${getBaseUrl()}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('GoCardless API Error:', JSON.stringify(error, null, 2));
            throw new Error(error.error?.message || `GoCardless API error: ${response.status}`);
        }

        return response.json();
    }

    // ==========================================================================
    // BILLING REQUEST FLOW (Recommended for new mandates)
    // ==========================================================================

    /**
     * Create a Billing Request to set up a new SEPA Direct Debit mandate
     * This is the modern, recommended flow
     */
    async createBillingRequest(params: {
        customer_email: string;
        customer_name: string;
        company_name?: string;
        description?: string;
        metadata?: Record<string, string>;
        idempotencyKey?: string;
    }): Promise<{ billing_requests: BillingRequest }> {
        // Split name for GoCardless
        const nameParts = params.customer_name.split(' ');
        const given_name = nameParts[0] || '';
        const family_name = nameParts.slice(1).join(' ') || nameParts[0];

        return this.request('/billing_requests', {
            method: 'POST',
            body: JSON.stringify({
                billing_requests: {
                    mandate_request: {
                        scheme: 'sepa_core',
                        currency: 'EUR',
                    },
                    fallback_enabled: true,
                    metadata: params.metadata,
                },
            }),
        }, params.idempotencyKey);
    }

    /**
     * Create a Billing Request Flow (hosted page for customer to complete mandate)
     */
    async createBillingRequestFlow(params: {
        billing_request_id: string;
        redirect_uri: string;
        exit_uri: string;
    }): Promise<{ billing_request_flows: BillingRequestFlow }> {
        return this.request('/billing_request_flows', {
            method: 'POST',
            body: JSON.stringify({
                billing_request_flows: {
                    redirect_uri: params.redirect_uri,
                    exit_uri: params.exit_uri,
                    links: {
                        billing_request: params.billing_request_id,
                    },
                },
            }),
        });
    }

    /**
     * Get a Billing Request by ID
     */
    async getBillingRequest(id: string): Promise<{ billing_requests: BillingRequest }> {
        return this.request(`/billing_requests/${id}`);
    }

    // ==========================================================================
    // CUSTOMERS
    // ==========================================================================

    async createCustomer(params: {
        email: string;
        given_name: string;
        family_name: string;
        company_name?: string;
        address_line1?: string;
        city?: string;
        postal_code?: string;
        country_code?: string;
        metadata?: Record<string, string>;
    }): Promise<{ customers: GoCardlessCustomer }> {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify({
                customers: {
                    ...params,
                    country_code: params.country_code || 'LU',
                },
            }),
        });
    }

    async getCustomer(id: string): Promise<{ customers: GoCardlessCustomer }> {
        return this.request(`/customers/${id}`);
    }

    // ==========================================================================
    // MANDATES
    // ==========================================================================

    async getMandate(id: string): Promise<{ mandates: GoCardlessMandate }> {
        return this.request(`/mandates/${id}`);
    }

    async cancelMandate(id: string, metadata?: Record<string, string>): Promise<{ mandates: GoCardlessMandate }> {
        return this.request(`/mandates/${id}/actions/cancel`, {
            method: 'POST',
            body: JSON.stringify({ data: { metadata } }),
        });
    }

    // ==========================================================================
    // PAYMENTS
    // ==========================================================================

    /**
     * Create a payment against an existing mandate
     */
    async createPayment(params: {
        mandate_id: string;
        amount: number; // in cents
        currency?: string;
        description?: string;
        reference?: string;
        charge_date?: string; // YYYY-MM-DD, defaults to earliest possible
        metadata?: Record<string, string>;
        idempotencyKey?: string;
    }): Promise<{ payments: GoCardlessPayment }> {
        return this.request('/payments', {
            method: 'POST',
            body: JSON.stringify({
                payments: {
                    amount: Math.round(params.amount), // ensure integer cents
                    currency: params.currency || 'EUR',
                    description: params.description,
                    reference: params.reference,
                    charge_date: params.charge_date,
                    metadata: params.metadata,
                    links: {
                        mandate: params.mandate_id,
                    },
                },
            }),
        }, params.idempotencyKey);
    }

    async getPayment(id: string): Promise<{ payments: GoCardlessPayment }> {
        return this.request(`/payments/${id}`);
    }

    async cancelPayment(id: string, metadata?: Record<string, string>): Promise<{ payments: GoCardlessPayment }> {
        return this.request(`/payments/${id}/actions/cancel`, {
            method: 'POST',
            body: JSON.stringify({ data: { metadata } }),
        });
    }

    async retryPayment(id: string, metadata?: Record<string, string>): Promise<{ payments: GoCardlessPayment }> {
        return this.request(`/payments/${id}/actions/retry`, {
            method: 'POST',
            body: JSON.stringify({ data: { metadata } }),
        });
    }

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    /**
     * Calculate the next possible charge date
     * SEPA payments need at least 3 business days notice
     */
    calculateChargeDate(targetDay: number = 5): string {
        const today = new Date();
        const chargeDate = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);

        // If target day this month hasn't passed and there's enough notice, use this month
        const thisMonthTarget = new Date(today.getFullYear(), today.getMonth(), targetDay);
        const daysUntilThisMonth = Math.floor((thisMonthTarget.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilThisMonth >= 5) {
            return thisMonthTarget.toISOString().split('T')[0];
        }

        return chargeDate.toISOString().split('T')[0];
    }

    /**
     * Convert euros to cents for GoCardless API
     */
    eurosToCents(euros: number): number {
        return Math.round(euros * 100);
    }

    /**
     * Convert cents to euros for display
     */
    centsToEuros(cents: number): number {
        return cents / 100;
    }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const gocardless = new GoCardlessClient();

// =============================================================================
// WEBHOOK EVENT TYPES
// =============================================================================

export type GoCardlessWebhookEvent = {
    id: string;
    created_at: string;
    action: string;
    resource_type: 'payments' | 'mandates' | 'payouts' | 'refunds' | 'subscriptions' | 'billing_requests';
    links: Record<string, string>;
    details?: {
        origin?: string;
        cause?: string;
        description?: string;
        scheme?: string;
        reason_code?: string;
    };
};

export type GoCardlessWebhookPayload = {
    events: GoCardlessWebhookEvent[];
};

/**
 * Verify GoCardless webhook signature
 */
export function verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
