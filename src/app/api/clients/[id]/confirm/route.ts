// Confirm Client API
// Path: /api/clients/[id]/confirm
// Called by admin to confirm a new client after quote signature

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getClientById, updateClient } from '@/lib/db/supabase';
import { generateProjectTasks } from '@/lib/tasks/generator';
import { createDepositInvoiceOnQuoteSign } from '@/lib/invoicing/zoho';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: clientId } = await params;

        // 1. Get client and verify status
        const client = await getClientById(clientId);

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (client.status !== 'pending_confirmation') {
            return NextResponse.json({
                error: 'Client already confirmed or not eligible for confirmation',
                currentStatus: client.status
            }, { status: 400 });
        }

        // 2. Find the confirmation task with quote metadata
        const { data: confirmTasks } = await supabaseAdmin.select<{
            id: string;
            metadata: string;
        }>('tasks', `client_id=eq.${clientId}&type=eq.confirm_client&status=eq.pending&order=created_at.desc&limit=1`);

        const confirmTask = confirmTasks?.[0];

        let planId = 'business'; // Default
        let quoteNumber = null;
        let totalTtc = 0;
        let hasRecurring = false;

        if (confirmTask?.metadata) {
            try {
                const meta = typeof confirmTask.metadata === 'string'
                    ? JSON.parse(confirmTask.metadata)
                    : confirmTask.metadata;
                planId = meta.plan_id || 'business';
                quoteNumber = meta.quote_number;
                totalTtc = meta.total_ttc || 0;
                hasRecurring = meta.has_recurring || false;
            } catch (e) {
                console.error('Failed to parse task metadata:', e);
            }
        }

        // 3. Update client status to active
        await updateClient(clientId, {
            status: 'active',
            client_type: 'new'
        });

        // 4. Create project
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: projectData, error: projectError } = await supabaseAdmin.insert<any>('projects', {
            client_id: clientId,
            name: `Site Web - ${client.company_name}`,
            description: `Plan ${planId}`,
            status: 'pending',
            total_amount: totalTtc,
            deposit_percent: 20,
            started_at: new Date().toISOString(),
        });

        if (projectError) {
            console.error('Project creation error:', projectError);
            throw new Error(projectError.message);
        }

        const projectId = projectData?.[0]?.id as string | undefined;

        // 5. Generate step-by-step tasks based on plan
        if (projectId) {
            await generateProjectTasks(projectId, clientId, planId);
        }

        // 6. Mark confirmation task as completed
        if (confirmTask) {
            await supabaseAdmin.update('tasks', `id=eq.${confirmTask.id}`, {
                status: 'completed',
                completed_at: new Date().toISOString()
            });
        }

        // 7. Try to create deposit invoice in Zoho (non-blocking)
        let depositInvoiceId = null;
        if (quoteNumber) {
            try {
                const invoiceResult = await createDepositInvoiceOnQuoteSign({
                    client: {
                        email: client.email,
                        company_name: client.company_name,
                        contact_name: client.contact_name,
                        address: client.address || undefined,
                    },
                    quote_number: quoteNumber,
                    quote_total: totalTtc,
                    deposit_percent: 20,
                    services_description: planId,
                });
                depositInvoiceId = invoiceResult?.zoho_invoice_id;
            } catch (zohoError) {
                console.log('Zoho invoice creation skipped (non-blocking):', zohoError);
            }
        }

        // 8. Create subscriptions if recurring services
        if (hasRecurring && projectId) {
            // Create a task to set them up manually
            await supabaseAdmin.insert('tasks', {
                client_id: clientId,
                project_id: projectId,
                type: 'setup_subscriptions',
                title: `Configurer abonnements mensuels: ${client.company_name}`,
                description: 'Créer les abonnements récurrents et configurer le prélèvement SEPA.',
                status: 'pending',
                priority: 'high',
                auto_generated: true,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Client confirmé avec succès. Projet et tâches créés.',
            clientId,
            projectId,
            depositInvoiceId,
        });

    } catch (error) {
        console.error('Client confirmation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
