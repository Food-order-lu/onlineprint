
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin.select('clients', 'zoho_contact_id');

        if (error) {
            return NextResponse.json({
                exists: false,
                error: error.message,
                details: error
            });
        }

        return NextResponse.json({
            exists: true,
            message: 'Column zoho_contact_id exists',
            sample: data
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
