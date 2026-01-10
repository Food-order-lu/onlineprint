import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

// Initialize Resend client if key is present
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendEmail = async ({
    to,
    subject,
    html,
    text
}: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
}) => {
    if (!resend) {
        console.warn('Resend API Key is missing. Email was not sent.');
        return { success: false, error: 'Resend API Key missing' };
    }

    try {
        const data = await resend.emails.send({
            from: 'Rivego <noreply@rivego.lu>', // Verify domain/sender later
            to,
            subject,
            html: html || text || '',
            text: text,
        });

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
};
