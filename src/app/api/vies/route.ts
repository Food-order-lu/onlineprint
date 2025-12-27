import { NextRequest, NextResponse } from 'next/server';

// VIES SOAP API endpoint
const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';

// Backup: REST API (newer, sometimes more reliable)
const VIES_REST_URL = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';

interface ViesResponse {
    valid: boolean;
    countryCode: string;
    vatNumber: string;
    name?: string;
    address?: string;
    error?: string;
}

// Valid EU country codes
const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES',
    'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
    'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
];

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
    'AT': 'Autriche', 'BE': 'Belgique', 'BG': 'Bulgarie', 'CY': 'Chypre',
    'CZ': 'République tchèque', 'DE': 'Allemagne', 'DK': 'Danemark',
    'EE': 'Estonie', 'EL': 'Grèce', 'ES': 'Espagne', 'FI': 'Finlande',
    'FR': 'France', 'HR': 'Croatie', 'HU': 'Hongrie', 'IE': 'Irlande',
    'IT': 'Italie', 'LT': 'Lituanie', 'LU': 'Luxembourg', 'LV': 'Lettonie',
    'MT': 'Malte', 'NL': 'Pays-Bas', 'PL': 'Pologne', 'PT': 'Portugal',
    'RO': 'Roumanie', 'SE': 'Suède', 'SI': 'Slovénie', 'SK': 'Slovaquie'
};

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

// Parse SOAP response
function parseSoapResponse(xml: string): ViesResponse {
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

    const decodeName = (str: string) =>
        str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    return {
        valid: validMatch ? validMatch[1].toLowerCase() === 'true' : false,
        countryCode: countryMatch ? countryMatch[1] : '',
        vatNumber: vatMatch ? vatMatch[1] : '',
        name: nameMatch ? decodeName(nameMatch[1].trim()) : undefined,
        address: addressMatch ? addressMatch[1].trim().replace(/\n/g, ', ') : undefined,
    };
}

// Try REST API first (more reliable for some countries)
async function tryRestApi(countryCode: string, vatNumber: string): Promise<ViesResponse | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(VIES_REST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                countryCode: countryCode,
                vatNumber: vatNumber,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.log('REST API returned status:', response.status);
            return null;
        }

        const data = await response.json();

        return {
            valid: data.valid === true,
            countryCode: data.countryCode || countryCode,
            vatNumber: data.vatNumber || vatNumber,
            name: data.name || undefined,
            address: data.address || undefined,
        };
    } catch (error) {
        console.log('REST API failed, will try SOAP:', error);
        return null;
    }
}

// Try SOAP API
async function trySoapApi(countryCode: string, vatNumber: string): Promise<ViesResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(VIES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': '',
            },
            body: buildSoapRequest(countryCode, vatNumber),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const xmlResponse = await response.text();
        return parseSoapResponse(xmlResponse);
    } catch (error) {
        clearTimeout(timeoutId);

        if ((error as Error).name === 'AbortError') {
            return {
                valid: false,
                countryCode,
                vatNumber,
                error: 'TIMEOUT - Le service VIES ne répond pas',
            };
        }

        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { vatNumber } = body as { vatNumber: string };

        if (!vatNumber || vatNumber.length < 4) {
            return NextResponse.json(
                { error: 'Numéro de TVA invalide' },
                { status: 400 }
            );
        }

        // Clean VAT number: remove spaces, dots, dashes
        vatNumber = vatNumber.replace(/[\s.\-]/g, '').toUpperCase();

        // Extract country code (first 2 chars) and VAT number
        const countryCode = vatNumber.substring(0, 2);
        const number = vatNumber.substring(2);

        // Special case: Greece uses EL in VIES but GR is common
        const viesCountryCode = countryCode === 'GR' ? 'EL' : countryCode;

        if (!EU_COUNTRIES.includes(viesCountryCode)) {
            return NextResponse.json(
                {
                    error: `Code pays non reconnu: ${countryCode}. Utilisez un code pays UE (ex: LU, FR, BE, DE...)`,
                    hint: 'Format attendu: XX123456789 où XX est le code pays (FR, DE, BE, etc.)'
                },
                { status: 400 }
            );
        }

        console.log(`🔍 VIES lookup: ${viesCountryCode}${number}`);

        // Try REST API first (more reliable for some countries)
        let result = await tryRestApi(viesCountryCode, number);

        // If REST failed, try SOAP
        if (!result) {
            console.log('Trying SOAP API...');
            result = await trySoapApi(viesCountryCode, number);
        }

        if (result.error) {
            console.log(`❌ VIES error: ${result.error}`);

            // Map common errors to French
            const errorMessages: Record<string, string> = {
                'INVALID_INPUT': 'Format de numéro TVA invalide',
                'SERVICE_UNAVAILABLE': 'Service VIES temporairement indisponible',
                'MS_UNAVAILABLE': `Le service fiscal de ${COUNTRY_NAMES[viesCountryCode] || viesCountryCode} est temporairement indisponible`,
                'TIMEOUT': 'Délai dépassé - réessayez',
                'MS_MAX_CONCURRENT_REQ': 'Trop de requêtes, réessayez dans quelques secondes',
            };

            return NextResponse.json({
                valid: false,
                error: errorMessages[result.error] || result.error,
            });
        }

        if (!result.valid) {
            console.log(`❌ VIES: Invalid VAT number`);
            return NextResponse.json({
                valid: false,
                message: 'Numéro de TVA non valide ou non enregistré dans VIES',
            });
        }

        // Determine if autoliquidation applies
        // Autoliquidation = Client has valid EU VAT + is NOT from Luxembourg
        const isLuxembourg = viesCountryCode === 'LU';
        const autoliquidation = !isLuxembourg;

        console.log(`✅ VIES valid: ${result.name} | Autoliquidation: ${autoliquidation}`);

        return NextResponse.json({
            valid: true,
            countryCode: result.countryCode,
            vatNumber: result.vatNumber,
            fullVatNumber: `${result.countryCode}${result.vatNumber}`,
            companyName: result.name || '',
            address: result.address || '',
            country: COUNTRY_NAMES[viesCountryCode] || viesCountryCode,
            // AUTOLIQUIDATION INFO
            autoliquidation: autoliquidation,
            vatRate: autoliquidation ? 0 : 17,
            vatMessage: autoliquidation
                ? 'Autoliquidation de la TVA (art. 283-2 du CGI) - TVA 0%'
                : 'TVA luxembourgeoise 17%',
        });

    } catch (error) {
        console.error('VIES API error:', error);
        return NextResponse.json(
            { error: 'Erreur de connexion au service VIES. Réessayez plus tard.' },
            { status: 500 }
        );
    }
}
