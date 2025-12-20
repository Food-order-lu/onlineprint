// Email Service using Resend API
// Requires RESEND_API_KEY in environment variables

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface QuoteEmailData {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  quoteNumber: string;
  quoteTotal: string;
  signatureUrl: string;
  pdfUrl?: string;
}

// Email templates
export const emailTemplates = {
  quoteCreated: (data: QuoteEmailData) => ({
    subject: `Votre devis WebVision N° ${data.quoteNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis WebVision</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1A3A5C; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">RIVEGO</h1>
              <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0; font-size: 12px; letter-spacing: 2px;">T&M GROUP</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1A1A1A; font-size: 24px; margin: 0 0 20px;">Bonjour ${data.clientName},</h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Merci pour votre intérêt ! Nous avons le plaisir de vous transmettre votre devis pour la création de votre site web.
              </p>
              
              <!-- Quote Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-bottom: 10px;">Devis N°</td>
                        <td style="color: #1A1A1A; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 10px;">${data.quoteNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-bottom: 10px;">Client</td>
                        <td style="color: #1A1A1A; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 10px;">${data.clientCompany}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #e0e0e0; padding-top: 15px;">
                          <table width="100%">
                            <tr>
                              <td style="color: #1A1A1A; font-size: 18px; font-weight: 700;">Total</td>
                              <td style="color: #0D7377; font-size: 24px; font-weight: 700; text-align: right;">${data.quoteTotal}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Pour accepter ce devis, cliquez sur le bouton ci-dessous pour le signer électroniquement :
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.signatureUrl}" style="display: inline-block; background-color: #1A3A5C; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Signer le devis
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                Ce devis est valable pendant 30 jours. Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                RIVEGO T&M Group | Luxembourg<br>
                <a href="mailto:formulaire@webvision.lu" style="color: #1A3A5C;">formulaire@webvision.lu</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  quoteSigned: (data: QuoteEmailData) => ({
    subject: `Devis N° ${data.quoteNumber} signé - Confirmation`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0D7377; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ Devis Signé</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1A1A1A; font-size: 24px; margin: 0 0 20px;">Bonjour ${data.clientName},</h2>
              
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Nous confirmons la réception de votre signature pour le devis N° <strong>${data.quoteNumber}</strong>.
              </p>
              
              <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #2e7d32; margin: 0; font-size: 16px;">
                  <strong>Montant total :</strong> ${data.quoteTotal}
                </p>
              </div>

              <h3 style="color: #1A1A1A; font-size: 18px; margin: 30px 0 15px;">Prochaines étapes</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: #1A3A5C; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 10px;">1</span>
                    <span style="color: #666666; font-size: 14px;">Vous recevrez une facture d'acompte (20%)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: #1A3A5C; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 10px;">2</span>
                    <span style="color: #666666; font-size: 14px;">Notre équipe vous contactera sous 24h</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="display: inline-block; width: 24px; height: 24px; background-color: #1A3A5C; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 10px;">3</span>
                    <span style="color: #666666; font-size: 14px;">Le projet démarrera après réception de l'acompte</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                RIVEGO T&M Group | <a href="mailto:formulaire@webvision.lu" style="color: #1A3A5C;">formulaire@webvision.lu</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }),

  internalNotification: (data: QuoteEmailData & { action: 'created' | 'signed' }) => ({
    subject: `[RIVEGO] ${data.action === 'signed' ? '✓ Devis signé' : 'Nouveau devis'} - ${data.clientCompany}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>${data.action === 'signed' ? '✓ Devis Signé' : 'Nouveau Devis Créé'}</h2>
  <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Client:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.clientCompany}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Contact:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.clientName}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.clientEmail}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Devis N°:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.quoteNumber}</td></tr>
    <tr><td style="padding: 8px;"><strong>Montant:</strong></td><td style="padding: 8px; color: #0D7377; font-weight: bold;">${data.quoteTotal}</td></tr>
  </table>
  <p style="margin-top: 20px;"><a href="${data.signatureUrl}" style="color: #1A3A5C;">Voir le devis →</a></p>
</body>
</html>
    `,
  }),
};

// Send email via Resend API
export async function sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  // Log for debugging
  console.log('📧 Sending email:', {
    to: data.to,
    subject: data.subject,
    from: data.from || 'RIVEGO <onboarding@resend.dev>',
    hasApiKey: !!RESEND_API_KEY,
  });

  // If no API key, use demo mode
  if (!RESEND_API_KEY) {
    console.log('⚠️ No RESEND_API_KEY - running in demo mode');
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      messageId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: data.from || 'RIVEGO <onboarding@resend.dev>', // Use Resend's test domain until you verify your domain
        to: data.to,
        subject: data.subject,
        html: data.html,
        reply_to: data.replyTo || 'formulaire@webvision.lu',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Email API error:', result);
      return { success: false, error: result.message || 'Failed to send email' };
    }

    console.log('✅ Email sent successfully:', result.id);
    return { success: true, messageId: result.id };

  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Convenience functions
export async function sendQuoteToClient(data: QuoteEmailData) {
  const template = emailTemplates.quoteCreated(data);
  return sendEmail({
    to: data.clientEmail,
    subject: template.subject,
    html: template.html,
    replyTo: 'formulaire@webvision.lu',
  });
}

export async function sendSignatureConfirmation(data: QuoteEmailData) {
  const template = emailTemplates.quoteSigned(data);
  return sendEmail({
    to: data.clientEmail,
    subject: template.subject,
    html: template.html,
  });
}

export async function notifyTeam(data: QuoteEmailData, action: 'created' | 'signed') {
  const template = emailTemplates.internalNotification({ ...data, action });
  return sendEmail({
    to: process.env.TEAM_NOTIFICATION_EMAIL || 'formulaire@webvision.lu',
    subject: template.subject,
    html: template.html,
  });
}
