// Client Cancellation API Route
// Path: /api/clients/[id]/cancel

import { NextRequest, NextResponse } from 'next/server';
import { getClientById, updateClient } from '@/lib/db/supabase';
import { supabaseAdmin } from '@/lib/db/supabase';
import crypto from 'crypto';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/clients/[id]/cancel - Initiate cancellation
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Get client
        const client = await getClientById(id);
        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Check if already in cancellation
        if (client.status === 'pending_cancellation') {
            return NextResponse.json(
                { error: 'Cancellation already in progress' },
                { status: 400 }
            );
        }

        if (client.status === 'inactive') {
            return NextResponse.json(
                { error: 'Client is already inactive' },
                { status: 400 }
            );
        }

        // Parse optional body
        let reason = null;
        let cancelType = 'full';
        try {
            const body = await request.json();
            reason = body.reason || null;
            if (body.type === 'service') cancelType = 'service';
        } catch {
            // No body provided, that's fine
        }

        // Generate cancellation token
        const token = crypto.randomBytes(32).toString('hex');

        // Create cancellation request
        const { error: insertError } = await supabaseAdmin.insert('cancellation_requests', {
            client_id: id,
            cancel_type: cancelType,
            reason,
            token,
            requested_at: new Date().toISOString(),
        });

        if (insertError) {
            throw new Error(insertError.message);
        }

        // Calculate effective date (2 months from now)
        const effectiveDate = new Date();
        effectiveDate.setMonth(effectiveDate.getMonth() + 2);

        // Update client status
        await updateClient(id, {
            status: 'pending_cancellation',
            cancellation_requested_at: new Date().toISOString(),
            cancellation_effective_at: effectiveDate.toISOString(),
            cancellation_reason: reason,
        });

        // Generate cancellation link
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const cancellationLink = `${baseUrl}/cancel/${token}`;

        // TODO: Send email to client with cancellation link
        // For now, just log it
        console.log(`Cancellation link for ${client.email}: ${cancellationLink}`);

        // In production, use nodemailer or similar:
        /*
        await sendEmail({
          to: client.email,
          subject: 'Confirmation de votre demande de résiliation',
          html: `
            <p>Bonjour ${client.contact_name},</p>
            <p>Nous avons bien reçu votre demande de résiliation.</p>
            <p>Pour confirmer cette demande, veuillez cliquer sur le lien ci-dessous et signer électroniquement :</p>
            <p><a href="${cancellationLink}">Confirmer ma résiliation</a></p>
            <p>Après signature, votre contrat sera effectif encore pendant 2 mois.</p>
            <p>Cordialement,<br>L'équipe Rivego</p>
          `,
        });
        */

        return NextResponse.json({
            success: true,
            message: 'Cancellation request initiated. Email sent to client.',
            cancellation_link: cancellationLink, // Remove in production
        });
    } catch (error) {
        console.error('Error initiating cancellation:', error);
        return NextResponse.json(
            { error: 'Failed to initiate cancellation' },
            { status: 500 }
        );
    }
}
