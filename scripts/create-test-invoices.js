
// Script to create invoices via API
// Native fetch used


async function createInvoices() {
    const baseUrl = 'http://localhost:3000/api/invoicing/create-draft';

    // 1. Invoice for Pizzeria (Commission 5%)
    console.log('Creating Invoice 1: Pizzeria Test (Commission 5% on 2000€)...');
    const invoice1 = {
        report_id: 'report_pizzeria_001',
        report_data: {
            client_id: '95549f3e-598d-4852-bfeb-b3c359d8cfc8', // ID from previous run
            client_name: 'Pizzeria Test',
            client_details: {
                company_name: 'Pizzeria Test',
                contact_name: 'Luigi Mario',
                email: 'pizzeria_test_1767351317151@test.com'
            },
            month: 'Janvier 2026',
            turnover: 2000,
            commission_amount: 100, // 5% of 2000
            commission_percentage: 5
        }
    };

    try {
        const res1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice1)
        });
        const data1 = await res1.json();
        console.log('Invoice 1 Result:', data1);
    } catch (e) {
        console.error('Error I1:', e.message);
    }

    // 2. Invoice for Kebab (Forfait 50€)
    console.log('Creating Invoice 2: Kebab Test (Forfait 50€)...');
    const invoice2 = {
        report_id: 'report_kebab_001',
        report_data: {
            client_id: 'e17e5177-adcb-435e-9a66-12cec9782538', // ID from previous run
            client_name: 'Kebab Test',
            client_details: {
                company_name: 'Kebab Test',
                contact_name: 'Chef Kebab',
                email: 'kebab_test_1767351318702@test.com'
            },
            month: 'Janvier 2026',
            turnover: 0, // Irrelevant for fixed
            commission_amount: 50,
            commission_percentage: 0
        }
    };

    try {
        const res2 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice2)
        });
        const data2 = await res2.json();
        console.log('Invoice 2 Result:', data2);
    } catch (e) {
        console.error('Error I2:', e.message);
    }
}

createInvoices();
