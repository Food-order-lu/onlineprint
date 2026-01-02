
const https = require('https');

// Usage: node scripts/get-zoho-token.js <ClientId> <ClientSecret> <Code> <Region>
// Example: node scripts/get-zoho-token.js 1000.xxxx xxxx 1000.yyyy eu

const [, , clientId, clientSecret, code, region = 'eu'] = process.argv;

if (!clientId || !clientSecret || !code) {
    console.error('Usage: node scripts/get-zoho-token.js <ClientId> <ClientSecret> <Code> [Region: eu/com]');
    process.exit(1);
}

const data = new URLSearchParams({
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: 'http://localhost', // Standard for Self Clients
    grant_type: 'authorization_code'
}).toString();

const options = {
    hostname: `accounts.zoho.${region}`,
    path: '/oauth/v2/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            if (json.error) {
                console.error('\u001b[31mError:', json.error);
                console.error('Details:', json);
            } else {
                console.log('\n\u001b[32mSuccess! Here is your Refresh Token:\u001b[0m');
                console.log(json.refresh_token);
                console.log('\nAdd this to your .env.local file as ZOHO_REFRESH_TOKEN');
            }
        } catch (e) {
            console.error('Failed to parse response:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.write(data);
req.end();
