// Rivego Automation System - Database Types
// Auto-generated from schema.sql

// =============================================================================
// ENUMS
// =============================================================================

export type ClientStatus = 'active' | 'inactive' | 'pending_cancellation' | 'pending_confirmation' | 'prospect';
export type ClientType = 'legacy' | 'new';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type ServiceType = 'hosting' | 'online_ordering' | 'table_reservation' | 'website' | 'maintenance' | 'other';
export type MandateStatus = 'pending' | 'active' | 'cancelled' | 'failed';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'declined';

export interface CommissionConfig {
  type: 'legacy_percent' | 'legacy_fixed' | 'hybrid';
  base_fee?: number;
  percent?: number;
  threshold?: number;
  fixed_amount?: number;
}

// =============================================================================
// DATABASE MODELS
// =============================================================================

export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  vat_number: string | null;
  commission_config: CommissionConfig | null;

  zoho_contact_id: string | null;
  payment_method: 'sepa' | 'manual' | 'card' | 'transfer';

  status: ClientStatus;
  client_type: ClientType;

  cancellation_requested_at: string | null;
  cancellation_effective_at: string | null;
  cancellation_reason: string | null;
  cancellation_signed_at: string | null;

  sepa_exception: boolean;
  sepa_exception_reason: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  client_id: string;

  service_type: ServiceType;
  service_name: string | null;
  description: string | null;

  monthly_amount: number;
  commission_percent: number;

  status: SubscriptionStatus;

  started_at: string;
  cancelled_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface OneTimeCharge {
  id: string;
  client_id: string;

  description: string;
  amount: number;

  invoiced: boolean;
  invoice_id: string | null;

  created_at: string;
}

export interface GoCardlessMandate {
  id: string;
  client_id: string;

  mandate_id: string | null;
  customer_id: string | null;
  billing_request_id: string | null;

  status: MandateStatus;

  iban_last4: string | null;
  bank_name: string | null;

  created_at: string;
  activated_at: string | null;
  cancelled_at: string | null;
}

export interface Invoice {
  id: string;
  client_id: string;

  invoice_number: string;

  period_start: string | null;
  period_end: string | null;

  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;

  status: InvoiceStatus;

  external_id: string | null;
  external_provider: 'zoho' | 'odoo' | null;
  gocardless_payment_id: string | null;

  issued_at: string;
  due_at: string | null;
  paid_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;

  description: string;
  quantity: number;
  unit_price: number;
  total: number;

  subscription_id: string | null;
  one_time_charge_id: string | null;

  created_at: string;
}

export interface GloriaFoodReport {
  id: string;
  client_id: string;

  report_month: string;
  total_ttc: number;
  average_order_value: number;
  commission_percent: number;
  commission_amount: number;

  email_subject: string | null;
  email_received_at: string | null;
  processed: boolean;
  processed_at: string | null;
  invoice_id: string | null;

  raw_email_content: string | null;

  created_at: string;
}

export interface Quote {
  id: string;
  client_id: string | null;

  quote_number: string;

  client_name: string | null;
  client_email: string | null;
  client_company: string | null;

  items: QuoteItem[];

  has_recurring: boolean;

  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;

  // Hidden from client view
  discount_percent: number;
  discount_amount: number;
  internal_margin_notes: string | null;

  status: QuoteStatus;

  valid_until: string | null;
  signed_at: string | null;

  signature_data: string | null;
  signer_ip: string | null;

  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  is_recurring: boolean;
  service_type?: ServiceType;
}

export interface Contract {
  id: string;
  client_id: string;
  quote_id: string | null;

  document_url: string;
  status: ContractStatus;

  signed_at: string | null;
  valid_from: string | null;
  valid_until: string | null;

  created_at: string;
  updated_at: string;
}



export interface CancellationRequest {
  id: string;
  client_id: string;

  cancel_type: 'full' | 'service';
  subscription_id: string | null;

  reason: string | null;
  requested_at: string;

  token: string;
  signed_at: string | null;
  signature_data: string | null;
  signer_ip: string | null;

  effective_at: string | null;

  processed: boolean;
  processed_at: string | null;
}

export interface AuditLog {
  id: string;

  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete';

  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;

  performed_by: string;
  performed_at: string;
}

// =============================================================================
// CLIENT VIEW TYPES (Hiding sensitive fields)
// =============================================================================

export type ClientPublicView = Omit<Client,
  | 'notes'
  | 'sepa_exception'
  | 'sepa_exception_reason'
>;

export type QuotePublicView = Omit<Quote,
  | 'discount_percent'
  | 'discount_amount'
  | 'internal_margin_notes'
>;

// =============================================================================
// INPUT TYPES (for creating/updating)
// =============================================================================

export type CreateClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>;
export type UpdateClientInput = Partial<CreateClientInput>;

export type CreateSubscriptionInput = Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

export type CreateQuoteInput = Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'signed_at' | 'signature_data' | 'signer_ip'>;

export type CreateInvoiceInput = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;

// =============================================================================
// AGGREGATED TYPES (for dashboard views)
// =============================================================================

export interface ClientWithSubscriptions extends Client {
  subscriptions: Subscription[];
  mandate: GoCardlessMandate | null;
  total_monthly: number;
}

export interface ClientDashboard extends Client {
  subscriptions: Subscription[];
  invoices: Invoice[];
  mandate: GoCardlessMandate | null;
  pending_charges: OneTimeCharge[];
}

export interface AdminDashboardStats {
  total_clients: number;
  active_clients: number;
  legacy_clients: number;
  new_clients: number;
  pending_cancellations: number;
  monthly_recurring_revenue: number;
  pending_invoices: number;
  overdue_invoices: number;
}
