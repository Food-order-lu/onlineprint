
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

// GET /api/admin/stats
export async function GET() {
    try {
        // 1. Total Clients
        const { data: allClients, error: err1 } = await supabaseAdmin.select<any>('clients', 'select=id');
        const totalClients = allClients?.length || 0;

        // 2. Active Clients
        const { data: activeClientsData, error: err2 } = await supabaseAdmin.select<any>('clients', 'status=eq.active');
        const activeClients = activeClientsData?.length || 0;

        // 3. Pending Cancellations
        const { data: pendingCancellationsData, error: err3 } = await supabaseAdmin.select<any>('clients', 'status=eq.pending_cancellation');
        const pendingCancellations = pendingCancellationsData?.length || 0;

        // 4. Monthly Recurring Revenue (MRR)
        // Get all active subscriptions
        const { data: subscriptions, error: err4 } = await supabaseAdmin.select<any>('subscriptions', 'status=eq.active');

        const mrr = subscriptions?.reduce((sum: number, sub: any) => sum + (sub.monthly_amount || 0), 0) || 0;

        // 5. Tasks Stats (Open Tasks)
        const { data: openTasksData, error: err5 } = await supabaseAdmin.select<any>('tasks', 'status=eq.todo'); // Assuming 'todo' is the status
        const openTasks = openTasksData?.length || 0;

        if (err1 || err2 || err3 || err4 || err5) {
            console.error('Stats fetch error', err1, err2, err3, err4, err5);
        }

        return NextResponse.json({
            total_clients: totalClients,
            active_clients: activeClients,
            pending_cancellations: pendingCancellations,
            monthly_recurring_revenue: mrr,
            open_tasks: openTasks
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Stats failed' }, { status: 500 });
    }
}
