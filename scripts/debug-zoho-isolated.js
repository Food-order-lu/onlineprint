
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const CLIENT_ID = env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = env.ZOHO_CLIENT_SECRET;
const REFRESH_TOKEN = env.ZOHO_REFRESH_TOKEN;
const ORG_ID = env.ZOHO_ORGANIZATION_ID;
const REGION = env.ZOHO_REGION || 'eu';

console.log('--- DEBUG INFO ---');
console.log('Region:', REGION);
console.log('Org ID:', ORG_ID);
console.log('Client ID:', CLIENT_ID ? 'Set' : 'Missing');
console.log('Refresh Token:', REFRESH_TOKEN ? REFRESH_TOKEN.substring(0, 10) + '...' : 'Missing');
console.log('------------------');

// 1. Refresh Token
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const postData = `refresh_token=${REFRESH_TOKEN}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=refresh_token`;
        const options = {
            hostname: `accounts.zoho.${REGION}`,
            path: '/oauth/v2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        reject(new Error(`Token Error: ${JSON.stringify(parsed)}`));
                    } else {
                        resolve(parsed.access_token);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 2. Call API (List Contacts)
async function testApi() {
    try {
        console.log('Fetching Access Token...');
        const token = await getAccessToken();
        console.log('Access Token obtained.');

        console.log(`Listing Organizations on data center ${REGION}...`);
        const options = {
            hostname: `www.zohoapis.${REGION}`,
            path: `/books/v3/organizations`,
            method: 'GET',
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('API Response Status:', res.statusCode);
                console.log('API Response Body:', data);
            });
        });

        req.on('error', (e) => console.error('API Request Error:', e));
        req.end();

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
}

testApi();
