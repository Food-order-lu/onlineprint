import { NextRequest, NextResponse } from 'next/server';

// VIES SOAP API endpoint
const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';

interface ViesResponse {
    valid: boolean;
    countryCode: string;
    vatNumber: string;
    name?: string;
    address?: string;
    error?: string;
}

// Build SOAP request
function buildSoapRequest(countryCode: string, vatNumber: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:checkVat>
         <urn:countryCode>${countryCode}</urn:countryCode>
         <urn:vatNumber>${vatNumber}</urn:vatNumber>
      </urn:checkVat>
   </soapenv:Body>
</soapenv:Envelope>`;
}

// Parse SOAP response - handles namespaced tags like ns2:valid
function parseSoapResponse(xml: string): ViesResponse {
    // Extract values using regex that handles optional namespace prefixes
    const validMatch = xml.match(/<(?:\w+:)?valid>(true|false)<\/(?:\w+:)?valid>/i);
    const nameMatch = xml.match(/<(?:\w+:)?name>([^<]*)<\/(?:\w+:)?name>/i);
    const addressMatch = xml.match(/<(?:\w+:)?address>([\s\S]*?)<\/(?:\w+:)?address>/i);
    const countryMatch = xml.match(/<(?:\w+:)?countryCode>([^<]*)<\/(?:\w+:)?countryCode>/i);
    const vatMatch = xml.match(/<(?:\w+:)?vatNumber>([^<]*)<\/(?:\w+:)?vatNumber>/i);
    const faultMatch = xml.match(/<(?:\w+:)?faultstring>([^<]*)<\/(?:\w+:)?faultstring>/i);

    if (faultMatch) {
        return {
            valid: false,
            countryCode: '',
            vatNumber: '',
            error: faultMatch[1],
        };
    }

    // Decode HTML entities (& -> &)
    const decodeName = (str: string) => str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    return {
        valid: validMatch ? validMatch[1].toLowerCase() === 'true' : false,
        countryCode: countryMatch ? countryMatch[1] : '',
        vatNumber: vatMatch ? vatMatch[1] : '',
        name: nameMatch ? decodeName(nameMatch[1].trim()) : undefined,
        address: addressMatch ? addressMatch[1].trim().replace(/\n/g, ', ') : undefined,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { vatNumber } = body as { vatNumber: string };

        if (!vatNumber || vatNumber.length < 4) {
            return NextResponse.json(
                { error: 'Numéro de TVA invalide' },
                { status: 400 }
            );
        }

        // Extract country code (first 2 chars) and VAT number
        const countryCode = vatNumber.substring(0, 2).toUpperCase();
        const number = vatNumber.substring(2).replace(/\s/g, '');

        // Valid EU country codes
        const euCountries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES',
            'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
            'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];

        if (!euCountries.includes(countryCode)) {
            return NextResponse.json(
                { error: `Code pays non reconnu: ${countryCode}. Utilisez un code pays UE (ex: LU, FR, BE...)` },
                { status: 400 }
            );
        }

        console.log(`🔍 VIES lookup: ${countryCode}${number}`);

        // Call VIES API
        const soapRequest = buildSoapRequest(countryCode, number);

        const response = await fetch(VIES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': '',
            },
            body: soapRequest,
        });

        const xmlResponse = await response.text();
        const result = parseSoapResponse(xmlResponse);

        if (result.error) {
            console.log(`❌ VIES error: ${result.error}`);
            return NextResponse.json(
                {
                    valid: false,
                    error: result.error === 'INVALID_INPUT'
                        ? 'Format de numéro TVA invalide'
                        : result.error
                },
                { status: 200 }
            );
        }

        if (!result.valid) {
            console.log(`❌ VIES: Invalid VAT number`);
            return NextResponse.json({
                valid: false,
                message: 'Numéro de TVA non valide ou non enregistré',
            });
        }

        console.log(`✅ VIES valid: ${result.name}`);

        return NextResponse.json({
            valid: true,
            countryCode: result.countryCode,
            vatNumber: result.vatNumber,
            companyName: result.name || '',
            address: result.address || '',
        });

    } catch (error) {
        console.error('VIES API error:', error);
        return NextResponse.json(
            { error: 'Erreur de connexion au service VIES. Réessayez plus tard.' },
            { status: 500 }
        );
    }
}
