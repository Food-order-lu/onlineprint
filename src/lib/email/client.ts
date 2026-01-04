
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not defined');
}

export const resend = new Resend(resendApiKey || 're_123456789'); // Fallback dev key

export type EmailTemplateParams = {
    to: string;
    subject: string;
    html: string;
    from?: string;
};

export async function sendEmail({ to, subject, html, from }: EmailTemplateParams) {
    // Default sender
    const fromEmail = from || 'Rivego <noreply@rivego.lu>';

    if (!resendApiKey) {
        console.log('--- EMAIL MOCK SEND ---');
        console.log(`From: ${fromEmail}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('--- END EMAIL MOCK ---');
        return { id: 'mock_email_id' };
    }

    try {
        const data = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html,
        });
        return data;
    } catch (error) {
        console.error('Resend Error:', error);
        throw error;
    }
}
