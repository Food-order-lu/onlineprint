import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

// GET /api/gloriafood/reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const clientId = searchParams.get('client_id');

        let query = 'order=report_month.desc,created_at.desc';

        if (month) {
            // DB has DATE column, so we must query YYYY-MM-01
            const queryDate = month.length === 7 ? `${month}-01` : month;
            query = `report_month=eq.${queryDate}&${query}`;
        }

        if (clientId) {
            query = `client_id=eq.${clientId}&${query}`;
        }

        const { data: reports, error } = await supabaseAdmin.select<any>('gloriafood_reports', query);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Enrich with client data if needed
        const enrichedReports = await Promise.all((reports || []).map(async (report: any) => {
            try {
                if (report.client_id) {
                    const { data: client, error } = await supabaseAdmin.selectOne<any>('clients', `id=eq.${report.client_id}`);
                    if (error) {
                        console.error(`Error fetching client ${report.client_id} for report ${report.id}:`, error);
                        return { ...report, client: null };
                    }
                    return {
                        ...report,
                        client: client || null
                    };
                }
                return { ...report, client: null };
            } catch (e) {
                console.error('Error enriching report:', e);
                return { ...report, client: null };
            }
        }));

        return NextResponse.json({ reports: enrichedReports });

    } catch (error: any) {
        console.error('Get reports error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
