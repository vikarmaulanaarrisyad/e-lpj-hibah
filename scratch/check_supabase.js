const dns = require('dns');
const net = require('net');
const https = require('https');

console.log("Checking Supabase project: wimlxentgekliulhgiwy");

// 1. Check REST API / status
const req = https.get('https://wimlxentgekliulhgiwy.supabase.co/auth/v1/health', (res) => {
  console.log(`Supabase Auth Health HTTP Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response body:', data));
});
req.on('error', (e) => {
  console.log('Supabase HTTP Error:', e.message);
});

// 2. DNS lookup direct DB host
dns.lookup('db.wimlxentgekliulhgiwy.supabase.co', (err, addr) => {
  if (err) {
    console.log('Direct DB DNS failed:', err.message);
  } else {
    console.log('Direct DB DNS resolved:', addr);
  }
});

// 3. DNS lookup pooler host
dns.lookup('aws-0-ap-southeast-1.pooler.supabase.com', (err, addr) => {
  if (err) {
    console.log('Pooler DNS failed:', err.message);
  } else {
    console.log('Pooler DNS resolved:', addr);
  }
});
