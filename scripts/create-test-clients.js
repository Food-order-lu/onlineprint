
// Script to create clients via API

// Native fetch used in Node 18+

async function createExamples() {
    const baseUrl = 'http://localhost:3000/api/clients';

    // 1. Client Commission (SEPA)
    console.log('Creating Client 1: Pizzeria Test (Commission 5%)...');
    const client1 = {
        company_name: 'Pizzeria Test',
        contact_name: 'Luigi Mario',
        email: `pizzeria_test_${Date.now()}@test.com`,
        phone: '+352 691 000 001',
        address: '1 rue de la Pizza',
        city: 'Luxembourg',
        postal_code: 'L-1000',
        country: 'Luxembourg',
        status: 'active',
        client_type: 'new',
        payment_method: 'sepa',
        commission_config: {
            type: 'legacy_percent',
            percent: 5
        }
    };

    try {
        const res1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client1)
        });
        const data1 = await res1.json();
        console.log('Client 1 Result:', data1);
    } catch (e) {
        console.error('Error C1:', e.message);
    }

    // 2. Client Forfait (Manual - No SEPA)
    console.log('Creating Client 2: Kebab Test (Forfait 50€, No SEPA)...');
    const client2 = {
        company_name: 'Kebab Test',
        contact_name: 'Chef Kebab',
        email: `kebab_test_${Date.now()}@test.com`,
        phone: '+352 691 000 002',
        address: '2 rue du Kebab',
        city: 'Esch',
        postal_code: 'L-4000',
        country: 'Luxembourg',
        status: 'active',
        client_type: 'new',
        payment_method: 'manual', // Explicitly Manual
        commission_config: {
            type: 'legacy_fixed',
            fixed_amount: 50
        }
    };

    try {
        const res2 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client2)
        });
        const data2 = await res2.json();
        console.log('Client 2 Result:', data2);
    } catch (e) {
        console.error('Error C2:', e.message);
    }
}

createExamples();
