// CRON Job: Generate Monthly Recurring Tasks
// Path: /api/cron/generate-recurring-tasks
// Run at the beginning of each month

import { NextRequest, NextResponse } from 'next/server';
import { generateMonthlyRecurringTasks } from '@/lib/tasks/recurring';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const stats = await generateMonthlyRecurringTasks();

        return NextResponse.json({
            success: true,
            processed_at: new Date().toISOString(),
            stats,
        });

    } catch (error) {
        console.error('CRON generate-recurring-tasks error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recurring tasks' },
            { status: 500 }
        );
    }
}
