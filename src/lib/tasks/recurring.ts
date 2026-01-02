// Recurring Task Generator Utility
// Path: /lib/tasks/recurring.ts

import { supabaseAdmin } from '@/lib/db/supabase';

interface Subscription {
    id: string;
    client_id: string;
    service_type: string;
    service_name: string;
    monthly_amount: number;
}

export async function generateMonthlyRecurringTasks() {
    console.log('Starting monthly recurring task generation...');

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const monthYearStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

    const stats = {
        clients_processed: 0,
        billing_tasks_created: 0,
        gloriafood_tasks_created: 0,
        errors: [] as string[],
    };

    try {
        // 1. Fetch all active clients
        const { data: activeClients, error: clientsError } = await supabaseAdmin.select<{ id: string, company_name: string }>(
            'clients',
            'status=eq.active&select=id,company_name'
        );

        if (clientsError) throw new Error(`Failed to fetch active clients: ${clientsError.message}`);
        if (!activeClients || activeClients.length === 0) {
            console.log('No active clients found.');
            return stats;
        }

        for (const client of activeClients) {
            try {
                // 2. Fetch active subscriptions for this client
                const { data: subs, error: subsError } = await supabaseAdmin.select<Subscription>(
                    'subscriptions',
                    `client_id=eq.${client.id}&status=eq.active`
                );

                if (subsError) {
                    stats.errors.push(`Error fetching subs for ${client.company_name}: ${subsError.message}`);
                    continue;
                }

                if (!subs || subs.length === 0) continue;

                stats.clients_processed++;

                // 3. Check if billing task already exists for this month
                const { data: existingBillingTasks } = await supabaseAdmin.select(
                    'tasks',
                    `client_id=eq.${client.id}&type=eq.generate_monthly_invoice&due_at=like.${monthYearStr}%`
                );

                if (!existingBillingTasks || existingBillingTasks.length === 0) {
                    // Create billing task
                    const totalMonthly = subs.reduce((sum, s) => sum + Number(s.monthly_amount), 0);

                    await supabaseAdmin.insert('tasks', {
                        client_id: client.id,
                        type: 'generate_monthly_invoice',
                        title: `Facture mensuelle ${monthYearStr} - ${client.company_name}`,
                        description: `Générer la facture mensuelle pour ${subs.length} services actifs (${totalMonthly}€ HT).`,
                        status: 'pending',
                        priority: 'high',
                        auto_generated: true,
                        auto_data: {
                            month: monthYearStr,
                            subscriptions: subs.map(s => ({ id: s.id, name: s.service_name, amount: s.monthly_amount })),
                            total_amount: totalMonthly
                        },
                        due_at: now.toISOString().split('T')[0]
                    });

                    stats.billing_tasks_created++;
                }

                // 4. Check if GloriaFood report task is needed
                const hasOnlineOrdering = subs.some(s => s.service_type === 'online_ordering');
                if (hasOnlineOrdering) {
                    const { data: existingGFTasks } = await supabaseAdmin.select(
                        'tasks',
                        `client_id=eq.${client.id}&type=eq.process_gloriafood_report&due_at=like.${monthYearStr}%`
                    );

                    if (!existingGFTasks || existingGFTasks.length === 0) {
                        await supabaseAdmin.insert('tasks', {
                            client_id: client.id,
                            type: 'process_gloriafood_report',
                            title: `Rapport GloriaFood ${monthYearStr} - ${client.company_name}`,
                            description: `Vérifier la réception du rapport GloriaFood et calculer la commission pour ${client.company_name}.`,
                            status: 'pending',
                            priority: 'medium',
                            auto_generated: true,
                            auto_data: {
                                month: monthYearStr
                            },
                            due_at: now.toISOString().split('T')[0]
                        });

                        stats.gloriafood_tasks_created++;
                    }
                }

            } catch (err) {
                stats.errors.push(`Failed to process ${client.company_name}: ${err}`);
            }
        }

        console.log(`Task generation complete. Generated ${stats.billing_tasks_created} billing tasks and ${stats.gloriafood_tasks_created} GloriaFood tasks.`);
        return stats;

    } catch (error) {
        console.error('Error in generateMonthlyRecurringTasks:', error);
        throw error;
    }
}
