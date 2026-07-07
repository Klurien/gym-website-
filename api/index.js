const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'comrades-gym-secret-2026';
const IS_DEMO = !process.env.MPESA_CONSUMER_KEY;

let pool;
function getPool() {
  if (!pool && process.env.DB_HOST) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 4000,
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

// ── M-Pesa helpers (inline, no separate file) ──
const https = require('https');
const MPESA_BASE = (process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke');
let demoPaymentId = 0;

function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function mpesaTimestamp() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function mpesaToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const url = new URL(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`);
  const res = await httpsRequest(url, { method: 'GET', headers: { Authorization: `Basic ${auth}` } });
  if (res.access_token) return res.access_token;
  throw new Error(res.errorMessage || 'OAuth failed');
}

async function mpesaStkPush(phone, amount, accountRef, desc) {
  if (IS_DEMO) {
    const id = ++demoPaymentId;
    return { success: true, demo: true, CheckoutRequestID: `demo_${id}_${Date.now()}`, ResponseDescription: 'Demo STK push', MerchantRequestID: `DEMO${id}` };
  }
  const token = await mpesaToken();
  const ts = mpesaTimestamp();
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString('base64');
  const body = JSON.stringify({
    BusinessShortCode: process.env.MPESA_SHORTCODE, Password: password, Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline', Amount: Math.floor(amount),
    PartyA: phone, PartyB: process.env.MPESA_SHORTCODE, PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://gym-website-ochre-one.vercel.app/api/mpesa/callback',
    AccountReference: accountRef, TransactionDesc: desc || 'Comrades Gym'
  });
  return await httpsRequest(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }, body);
}

async function mpesaQuery(checkoutRequestId) {
  if (IS_DEMO) return { success: true, demo: true, ResultCode: '0', ResultDesc: 'Demo success' };
  const token = await mpesaToken();
  const ts = mpesaTimestamp();
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString('base64');
  const body = JSON.stringify({ BusinessShortCode: process.env.MPESA_SHORTCODE, Password: password, Timestamp: ts, CheckoutRequestID: checkoutRequestId });
  return await httpsRequest(new URL(`${MPESA_BASE}/mpesa/stkpushquery/v1/query`), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }, body);
}

// ── Auth middleware ──
function getUser(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

// ── Main handler ──
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getPool();
  const url = (req.url || '/').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const path = parts[0] === 'api' ? parts[1] : parts[0];
  const sub = parts[0] === 'api' ? parts[2] : parts[1];

  // ── Health ──
  if (path === 'health') return res.json({ status: 'ok' });

  // ── M-Pesa callback (no auth) ──
  if (path === 'mpesa' && sub === 'callback' && req.method === 'POST') {
    console.log('[MPESA CALLBACK]', JSON.stringify(req.body));
    return res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }

  // ── M-Pesa STK Push ──
  if (path === 'mpesa' && sub === 'stkpush' && req.method === 'POST') {
    const user = getUser(req);
    const { phone, amount, programId, programName } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ error: 'Phone and amount required' });
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 9) return res.status(400).json({ error: 'Invalid phone' });
    const mpesaPhone = clean.startsWith('254') ? clean : clean.startsWith('0') ? '254' + clean.slice(1) : '254' + clean;
    try {
      const result = await mpesaStkPush(mpesaPhone, amount, `CG-${programId || 'PREMIUM'}`, programName || 'Comrades Gym');
      if (db && user) {
        try { await db.query('INSERT INTO payments (user_id, phone, amount, program_id, checkout_id, status) VALUES (?, ?, ?, ?, ?, ?)', [user.id, mpesaPhone, amount, programId || null, result.CheckoutRequestID || `demo_${Date.now()}`, 'pending']); } catch {}
      }
      return res.json(result);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // ── M-Pesa query ──
  if (path === 'mpesa' && sub === 'query' && req.method === 'POST') {
    const user = getUser(req);
    const { checkoutRequestId } = req.body || {};
    if (!checkoutRequestId) return res.status(400).json({ error: 'checkoutRequestId required' });
    try {
      const result = await mpesaQuery(checkoutRequestId);
      if ((result.ResultCode === '0' || result.ResultCode === 0 || (result.demo && result.success)) && user?.id && db) {
        const [rows] = await db.query('SELECT program_id FROM payments WHERE checkout_id = ? AND status = ?', [checkoutRequestId, 'pending']);
        await db.query('UPDATE users SET premium = 1 WHERE id = ?', [user.id]);
        await db.query('UPDATE payments SET status = ? WHERE checkout_id = ?', ['completed', checkoutRequestId]);
        if (rows[0]?.program_id) await db.query('UPDATE users level = (SELECT level FROM programs WHERE id = ?) WHERE id = ?', [rows[0].program_id, user.id]);
      }
      return res.json(result);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // ── M-Pesa demo unlock ──
  if (path === 'mpesa' && sub === 'demo-unlock' && req.method === 'POST') {
    const user = getUser(req);
    if (user?.id && db) {
      const { programId } = req.body || {};
      await db.query('UPDATE users SET premium = 1 WHERE id = ?', [user.id]);
      if (programId) {
        try { await db.query('UPDATE users SET level = (SELECT level FROM programs WHERE id = ?) WHERE id = ?', [programId, user.id]); } catch {}
        try { await db.query('INSERT INTO payments (user_id, phone, amount, program_id, checkout_id, status) VALUES (?, ?, ?, ?, ?, ?)', [user.id, 'DEMO', 0, programId, `demo_${Date.now()}`, 'completed']); } catch {}
      }
      return res.json({ success: true, demo: true });
    }
    return res.json({ success: true, demo: true });
  }

  // ── Auth: Register ──
  if (path === 'register' && req.method === 'POST') {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    try {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
      const userRole = rows[0].c === 0 ? 'admin' : (role === 'trainer' ? 'trainer' : 'trainee');
      await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, userRole]);
      return res.status(201).json({ message: 'Registered' });
    } catch { return res.status(500).json({ error: 'Registration failed' }); }
  }

  // ── Auth: Login ──
  if (path === 'login' && req.method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const u = rows[0];
      if (!await bcrypt.compare(password, u.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    } catch { return res.status(500).json({ error: 'Login failed' }); }
  }

  // ── All routes below require auth ──
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // ── Profile ──
  if (path === 'profile') {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, created_at FROM users WHERE id = ?', [user.id]);
      return rows[0] ? res.json({ user: rows[0] }) : res.status(404).json({ error: 'Not found' });
    }
    if (req.method === 'POST') {
      const { profile_pic } = req.body || {};
      if (!profile_pic) return res.status(400).json({ error: 'No data' });
      await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, user.id]);
      return res.json({ message: 'Updated' });
    }
  }

  // ── Programs ──
  if (path === 'programs') {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM programs ORDER BY level_sort ASC');
      return res.json(rows);
    }
    if (req.method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      if (!title || !level) return res.status(400).json({ error: 'Title and level required' });
      const levelSort = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
      await db.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [title, description || '', level, duration || '', sessions || 0, price || 0, image || '', levelSort, user.id]);
      return res.status(201).json({ message: 'Created' });
    }
  }

  // ── Admin: users list ──
  if (path === 'admin' && sub === 'users' && req.method === 'GET') {
    if (user.role !== 'admin' && user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, last_seen, created_at FROM users ORDER BY last_seen DESC');
    return res.json(rows);
  }

  // ── Admin: payments list ──
  if (path === 'admin' && sub === 'payments' && req.method === 'GET') {
    if (user.role !== 'admin' && user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const [rows] = await db.query(`
      SELECT p.*, u.username FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 100
    `);
    return res.json(rows);
  }

  // ── Admin: stats ──
  if (path === 'admin' && sub === 'stats' && req.method === 'GET') {
    if (user.role !== 'admin' && user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
    const [[userCount]] = await db.query('SELECT COUNT(*) as c FROM users WHERE role = ?', ['trainee']);
    const [[revenue]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = ?', ['completed']);
    const [[payments]] = await db.query('SELECT COUNT(*) as c FROM payments WHERE status = ?', ['completed']);
    const [recentPayments] = await db.query(`
      SELECT p.*, u.username FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 5
    `);
    const [programStats] = await db.query(`
      SELECT pr.title, pr.price, pr.level, COUNT(p.id) as unlock_count
      FROM programs pr
      LEFT JOIN payments p ON p.program_id = pr.id AND p.status = 'completed'
      GROUP BY pr.id ORDER BY pr.level_sort ASC
    `);
    return res.json({ totalClients: userCount.c, totalRevenue: revenue.total, totalPayments: payments.c, recentPayments, programStats });
  }

  // ── Client: my payments ──
  if (path === 'my-payments' && req.method === 'GET') {
    const [rows] = await db.query('SELECT p.*, pr.title as program_name FROM payments p LEFT JOIN programs pr ON p.program_id = pr.id WHERE p.user_id = ? ORDER BY p.created_at DESC', [user.id]);
    return res.json(rows);
  }

  // ── Heartbeat ──
  if (path === 'heartbeat' && req.method === 'POST') {
    await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
    return res.json({ success: true });
  }

  return res.status(404).json({ error: 'Not found' });
};
