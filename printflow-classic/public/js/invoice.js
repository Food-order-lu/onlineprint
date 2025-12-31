// onlineprint.lu - Invoice Generator

/**
 * Generate invoice HTML for PDF conversion
 * @param {object} order - Order data
 * @param {object} customer - Customer data
 * @param {object} vatInfo - VAT calculation result
 * @returns {string} - HTML content for invoice
 */
function generateInvoiceHTML(order, customer, vatInfo) {
    const invoiceDate = new Date().toLocaleDateString('fr-FR');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture ${order.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', Arial, sans-serif; font-size: 12px; color: #333; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #003d7a; }
        .logo .dot { color: #a0d911; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 28px; color: #003d7a; margin-bottom: 10px; }
        .invoice-number { font-size: 14px; color: #666; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .party { width: 45%; }
        .party h3 { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .party p { line-height: 1.6; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #003d7a; color: white; padding: 12px; text-align: left; font-weight: 500; }
        .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
        .items-table .qty { text-align: center; }
        .items-table .price { text-align: right; }
        .totals { width: 300px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .totals-row.total { font-size: 16px; font-weight: bold; color: #003d7a; border-top: 2px solid #003d7a; border-bottom: none; padding-top: 15px; }
        .reverse-charge { background: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .reverse-charge strong { color: #856404; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center; }
        .bank-info { background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 20px; }
        .bank-info h4 { margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">onlineprint<span class="dot">.lu</span></div>
        <div class="invoice-title">
            <h1>FACTURE</h1>
            <p class="invoice-number">${order.invoiceNumber}</p>
        </div>
    </div>
    
    <div class="parties">
        <div class="party">
            <h3>Vendeur</h3>
            <p>
                <strong>onlineprint.lu</strong><br>
                Adresse société<br>
                L-xxxx Luxembourg<br>
                TVA: LU xxxxxxxx<br>
                Email: contact@onlineprint.lu
            </p>
        </div>
        <div class="party">
            <h3>Client</h3>
            <p>
                <strong>${customer.companyName || customer.name}</strong><br>
                ${customer.address}<br>
                ${customer.postalCode} ${customer.city}<br>
                ${customer.country}<br>
                ${customer.vatNumber ? `TVA: ${customer.vatNumber}` : ''}<br>
                Email: ${customer.email}
            </p>
        </div>
    </div>
    
    <p style="margin-bottom: 20px;">
        <strong>Date de facture:</strong> ${invoiceDate}<br>
        <strong>Date d'échéance:</strong> ${dueDate}<br>
        <strong>Commande n°:</strong> ${order.orderNumber}
    </p>
    
    ${vatInfo.reverseCharge ? `
    <div class="reverse-charge">
        <strong>⚠️ Autoliquidation TVA</strong><br>
        TVA due par le preneur - Article 44 de la directive 2006/112/CE
    </div>
    ` : ''}
    
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%">Description</th>
                <th class="qty" style="width: 15%">Quantité</th>
                <th class="price" style="width: 17%">Prix unitaire HT</th>
                <th class="price" style="width: 18%">Total HT</th>
            </tr>
        </thead>
        <tbody>
            ${order.items.map(item => `
            <tr>
                <td>
                    <strong>${item.name}</strong><br>
                    <small style="color: #666;">${item.details}</small>
                </td>
                <td class="qty">${item.quantity}</td>
                <td class="price">${(item.priceHT / item.quantity).toFixed(4).replace('.', ',')} €</td>
                <td class="price">${item.priceHT.toFixed(2).replace('.', ',')} €</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <div class="totals-row">
            <span>Sous-total HT</span>
            <span>${order.totalHT.toFixed(2).replace('.', ',')} €</span>
        </div>
        <div class="totals-row">
            <span>${vatInfo.vatLabel}</span>
            <span>${vatInfo.vatAmount.toFixed(2).replace('.', ',')} €</span>
        </div>
        <div class="totals-row total">
            <span>Total TTC</span>
            <span>${order.totalTTC.toFixed(2).replace('.', ',')} €</span>
        </div>
    </div>
    
    <div class="bank-info">
        <h4>Coordonnées bancaires</h4>
        <p>
            <strong>Banque:</strong> Banque Internationale à Luxembourg<br>
            <strong>IBAN:</strong> LU00 0000 0000 0000 0000<br>
            <strong>BIC:</strong> BILLLULL
        </p>
    </div>
    
    <div class="footer">
        <p>onlineprint.lu - Imprimerie en ligne au Luxembourg</p>
        <p>RCS Luxembourg B-XXXXXX | TVA LU-XXXXXXXX</p>
        <p>Cette facture est payable sous 30 jours. Passé ce délai, des intérêts de retard seront appliqués.</p>
    </div>
</body>
</html>
`;
}

/**
 * Generate sequential invoice number
 * Format: INV-YYYY-XXXXX
 */
function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const lastNumber = parseInt(localStorage.getItem('lastInvoiceNumber') || '0');
    const newNumber = lastNumber + 1;
    localStorage.setItem('lastInvoiceNumber', newNumber.toString());
    return `INV-${year}-${String(newNumber).padStart(5, '0')}`;
}

/**
 * Create invoice from order and download/send
 * @param {object} order - Order data
 * @param {object} customer - Customer data
 */
async function createInvoice(order, customer) {
    // Add invoice number if not present
    if (!order.invoiceNumber) {
        order.invoiceNumber = generateInvoiceNumber();
    }

    // Calculate VAT
    const vatInfo = calculateVAT(order.totalHT, customer);
    order.totalTTC = vatInfo.amountTTC;

    // Generate HTML
    const html = generateInvoiceHTML(order, customer, vatInfo);

    // For now, open in new window for print/PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();

    return {
        invoiceNumber: order.invoiceNumber,
        html: html,
        vatInfo: vatInfo
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateInvoiceHTML, generateInvoiceNumber, createInvoice };
}
