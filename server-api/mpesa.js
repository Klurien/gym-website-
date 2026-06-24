const https = require('https');

// ── Config ──
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const BUSINESS_SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://gym-website-ochre-one.vercel.app/api/mpesa/callback';
const IS_DEMO = !CONSUMER_KEY || !CONSUMER_SECRET;
const SANDBOX = process.env.MPESA_ENV !== 'production';
const BASE_URL = SANDBOX ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

let demoPaymentId = 0;

// ── Helpers ──
function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function timestamp() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// ── Get OAuth Token ──
async function getToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const url = new URL(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`);
  const res = await httpsRequest(url, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` }
  });
  if (res.access_token) return res.access_token;
  throw new Error(res.errorMessage || 'Failed to get OAuth token');
}

// ── STK Push ──
async function stkPush(phone, amount, accountRef, transactionDesc) {
  if (IS_DEMO) {
    const id = ++demoPaymentId;
    console.log(`[MPESA DEMO] STK Push to ${phone} for KES ${amount} — ref: ${accountRef}`);
    return {
      success: true,
      demo: true,
      CheckoutRequestID: `demo_${id}_${Date.now()}`,
      ResponseDescription: 'Success. Will wait for user input (DEMO)',
      MerchantRequestID: `DEMO${id}`
    };
  }

  const token = await getToken();
  const ts = timestamp();
  const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${ts}`).toString('base64');

  const body = JSON.stringify({
    BusinessShortCode: BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.floor(amount),
    PartyA: phone,
    PartyB: BUSINESS_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: transactionDesc || 'Comrades Gym Premium'
  });

  const url = new URL(`${BASE_URL}/mpesa/stkpush/v1/processrequest`);
  return await httpsRequest(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, body);
}

// ── Query STK Status ──
async function queryStatus(checkoutRequestId) {
  if (IS_DEMO) {
    return {
      success: true,
      demo: true,
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully (DEMO)'
    };
  }

  const token = await getToken();
  const ts = timestamp();
  const password = Buffer.from(`${BUSINESS_SHORTCODE}${PASSKEY}${ts}`).toString('base64');

  const body = JSON.stringify({
    BusinessShortCode: BUSINESS_SHORTCODE,
    Password: password,
    Timestamp: ts,
    CheckoutRequestID: checkoutRequestId
  });

  const url = new URL(`${BASE_URL}/mpesa/stkpushquery/v1/query`);
  return await httpsRequest(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, body);
}

module.exports = { stkPush, queryStatus, IS_DEMO };
