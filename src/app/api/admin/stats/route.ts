
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Get counts using correct select() method
        const { data: activeClients } = await supabaseAdmin.select<any>('clients', 'status=eq.active&select=id');
        const { data: inactiveClients } = await supabaseAdmin.select<any>('clients', 'status=eq.inactive&select=id');
        const { data: prospects } = await supabaseAdmin.select<any>('clients', 'status=in.(prospect,pending_confirmation)&select=id');

        // 2. Calculate MRR
        const { data: subscriptions } = await supabaseAdmin.select<any>('subscriptions', 'status=eq.active&select=monthly_amount');
        const mrr = subscriptions?.reduce((sum: number, sub: any) => sum + (Number(sub.monthly_amount) || 0), 0) || 0;

        // 3. Pending tasks
        const { data: pendingTasksList } = await supabaseAdmin.select<any>('tasks', 'status=eq.pending&select=id');

        // 4. Recent activity (Quotes signed)
        const { data: recentQuotes } = await supabaseAdmin.select<any>('quotes', 'status=eq.signed&order=signed_at.desc&limit=5&select=quote_number,client_company,signed_at');

        const recentActivity = recentQuotes?.map((quote: any) => ({
            id: quote.quote_number,
            type: 'sign',
            text: `Devis signé : ${quote.client_company}`,
            time: quote.signed_at ? new Date(quote.signed_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'
        })) || [];

        // 5. Signed quotes this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: signedThisMonth } = await supabaseAdmin.select<any>(
            'quotes',
            `status=eq.signed&signed_at=gte.${startOfMonth.toISOString()}&select=id`
        );

        // 6. Calculate Fixed Revenue (One Time Charges created this month)
        const { data: fixedCharges } = await supabaseAdmin.select<any>(
            'one_time_charges',
            `created_at=gte.${startOfMonth.toISOString()}&select=amount`
        );
        const fixedRevenue = fixedCharges?.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) || 0;

        // 7. New Clients This Month
        const { data: newClients } = await supabaseAdmin.select<any>(
            'clients',
            `created_at=gte.${startOfMonth.toISOString()}&select=id`
        );

        // 8. New MRR This Month
        const { data: newSubs } = await supabaseAdmin.select<any>(
            'subscriptions',
            `started_at=gte.${startOfMonth.toISOString()}&select=monthly_amount`
        );
        const newMRR = newSubs?.reduce((sum: number, sub: any) => sum + (Number(sub.monthly_amount) || 0), 0) || 0;

        return NextResponse.json({
            activeClients: activeClients?.length || 0,
            inactiveClients: inactiveClients?.length || 0,
            prospects: prospects?.length || 0,
            mrr,
            pendingTasks: pendingTasksList?.length || 0,
            recentActivity,
            signedQuotesThisMonth: signedThisMonth?.length || 0,
            fixedRevenue,
            newClientsThisMonth: newClients?.length || 0,
            newMRRThisMonth: newMRR
        });

    } catch (error: any) {
        console.error('Admin Stats API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
