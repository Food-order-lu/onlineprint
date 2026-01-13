import { NextRequest, NextResponse } from 'next/server';
import { zoho } from '@/lib/invoicing/zoho';
import { supabaseAdmin, createClient } from '@/lib/db/supabase';

// POST /api/zoho/import-contacts
// Import all contacts from Zoho and sync to local database
export async function POST(request: NextRequest) {
    try {
        const { deleteExisting } = await request.json().catch(() => ({ deleteExisting: false }));

        // 1. Fetch all contacts from Zoho (paginated)
        let allContacts: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await zoho.listContacts({ page, per_page: 200 });
            allContacts = [...allContacts, ...(response.contacts || [])];
            hasMore = response.page_context?.has_more_page || false;
            page++;

            // Safety limit
            if (page > 10) break;
        }

        console.log(`Fetched ${allContacts.length} contacts from Zoho`);

        // 2. Delete existing clients if requested
        if (deleteExisting) {
            console.log('Deleting existing clients...');

            // Manual delete (safer approach)
            const { data: existingClients } = await supabaseAdmin.select<any>('clients', 'id');
            for (const client of (existingClients || [])) {
                try {
                    // Delete related records first
                    await supabaseAdmin.delete('subscriptions', `client_id=eq.${client.id}`);
                    await supabaseAdmin.delete('one_time_charges', `client_id=eq.${client.id}`);
                    await supabaseAdmin.delete('invoices', `client_id=eq.${client.id}`);
                    await supabaseAdmin.delete('quotes', `client_id=eq.${client.id}`);
                    await supabaseAdmin.delete('contracts', `client_id=eq.${client.id}`);
                    await supabaseAdmin.delete('mandates', `client_id=eq.${client.id}`);
                    await supabaseAdmin.delete('gloriafood_reports', `client_id=eq.${client.id}`);
                    // Then delete client
                    await supabaseAdmin.delete('clients', `id=eq.${client.id}`);
                } catch (e) {
                    console.log(`Could not delete client ${client.id}:`, e);
                }
            }
            console.log('Deleted existing clients');
        }

        // 3. Import each Zoho contact as a client
        const imported: any[] = [];
        const errors: string[] = [];

        for (const contact of allContacts) {
            try {
                // Check if already exists by email or zoho_contact_id
                const { data: existing } = await supabaseAdmin.selectOne<any>(
                    'clients',
                    `or=(email.eq.${encodeURIComponent(contact.email || '')},zoho_contact_id.eq.${contact.contact_id})`
                );

                const clientData = {
                    company_name: contact.company_name || contact.contact_name || 'Sans nom',
                    contact_name: contact.contact_name || '',
                    email: contact.email || `no-email-${contact.contact_id}@placeholder.com`,
                    phone: contact.phone || null,
                    address: contact.billing_address?.address || null,
                    city: contact.billing_address?.city || null,
                    postal_code: contact.billing_address?.zip || null,
                    country: contact.billing_address?.country || 'Luxembourg',
                    vat_number: contact.vat_reg_no || null,
                    zoho_contact_id: contact.contact_id,
                    status: contact.status === 'active' ? 'active' : 'inactive',
                    client_type: 'new' as const,
                    payment_method: 'manual' as const,
                    updated_at: new Date().toISOString()
                };

                if (existing) {
                    // Update existing
                    await supabaseAdmin.update('clients', `id=eq.${existing.id}`, clientData);
                    imported.push({ ...clientData, id: existing.id, action: 'updated' });
                } else {
                    // Create new
                    const { data: newClient } = await supabaseAdmin.insert<any>('clients', {
                        ...clientData,
                        created_at: new Date().toISOString(),
                        commission_config: null,
                        notes: null
                    });
                    imported.push({ ...clientData, id: newClient?.[0]?.id, action: 'created' });
                }
            } catch (err: any) {
                errors.push(`${contact.contact_name || contact.email}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            zoho_total: allContacts.length,
            imported: imported.length,
            errors: errors.length > 0 ? errors : undefined,
            clients: imported
        });

    } catch (error: any) {
        console.error('Zoho import error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/zoho/import-contacts - Preview what would be imported
export async function GET() {
    try {
        const response = await zoho.listContacts({ page: 1, per_page: 200 });

        return NextResponse.json({
            success: true,
            total: response.contacts?.length || 0,
            contacts: response.contacts?.map(c => ({
                contact_id: c.contact_id,
                company_name: c.company_name || c.contact_name,
                email: c.email,
                status: c.status
            }))
        });
    } catch (error: any) {
        console.error('Zoho preview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
