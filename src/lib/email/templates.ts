
export const EmailTemplates = {
    QuoteSigned: (
        clientName: string,
        quoteNumber: string,
        link: string
    ) => `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h2 style="color: #0D7377; margin: 0;">Rivego</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <h3 style="margin-top: 0;">Devis signé avec succès !</h3>
                <p>Bonjour ${clientName},</p>
                <p>Nous vous confirmons la bonne réception de la signature électronique pour le devis <strong>${quoteNumber}</strong>.</p>
                <p>Votre contrat a été généré et votre espace client est en cours de préparation.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="background-color: #0D7377; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Accéder à mon espace & configurer le paiement
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                    Prochaine étape : Si ce n'est pas déjà fait, merci de configurer votre mandat de prélèvement via le bouton ci-dessus pour activer vos services.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">
                    RIVEGO Trade and Marketing Group S.à r.l.-S<br>
                    7, rue Jean-Pierre Sauvage, L-2514 Kirchberg
                </p>
            </div>
        </div>
    `,

    WelcomeClient: (
        clientName: string,
        portalLink: string
    ) => `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0D7377;">Bienvenue chez Rivego</h2>
            <p>Bonjour ${clientName},</p>
            <p>Votre compte client est désormais actif. Vous pouvez accéder à votre portail pour gérer vos abonnements, voir vos factures et suivre vos services.</p>
            <p><a href="${portalLink}">Accéder à mon compte</a></p>
        </div>
    `,

    InvoiceSent: (
        clientName: string,
        invoiceNumber: string,
        amount: string,
        dueDate: string,
        link: string
    ) => `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0D7377;">Nouvelle Facture</h2>
            <p>Bonjour ${clientName},</p>
            <p>Une nouvelle facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${amount}</strong> a été émise.</p>
            <p>Date d'échéance : ${dueDate}</p>
            <p><a href="${link}">Voir la facture</a></p>
        </div>
    `
};
