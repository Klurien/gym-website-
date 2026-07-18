const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'comrades-gym-secret-2026';

const USE_POSTGRES = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

// Convert ? placeholders to $1, $2, ... for PostgreSQL
function pgParams(sql, params) {
  let idx = 0;
  const converted = sql.replace(/\?/g, () => `$${++idx}`);
  return { sql: converted, params };
}

// Translate MySQL SQL syntax to PostgreSQL
function translatePg(sql) {
  let s = sql;
  s = s.replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'SERIAL PRIMARY KEY');
  s = s.replace(/VARCHAR\s*\(\d+\)/gi, 'VARCHAR(255)');
  s = s.replace(/TINYINT\s*\(\d+\)/gi, 'SMALLINT');
  s = s.replace(/`(\w+)`/g, '"$1"');
  return s;
}

let pool;
function getPool() {
  if (pool) return pool;

  // PostgreSQL via DATABASE_URL (bazaar motors Neon cloud database)
  if (USE_POSTGRES) {
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    console.log('🚀 PostgreSQL Pool Created');
    // Return wrapper with mysql2-compatible interface
    pool = {
      query: (sql, params) => pgQuery(sql, params).then(r => [r.rows, r.fields || []]),
      execute: (sql, params) => pgExecute(sql, params).then(r => [{ affectedRows: r.rowCount, insertId: r.rows[0]?.id || 0 }, []])
    };
    return pool;
  }

  // MySQL / TiDB via individual env vars
  if (process.env.DB_HOST) {
    const dbPort = parseInt(process.env.DB_PORT || '4000', 10);
    const useSsl = process.env.DB_SSL === 'true' || dbPort === 4000;
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: dbPort,
      ssl: useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: 10
    });
  }
  return pool;
}

// Wrapper to make postgres queries compatible with mysql2 result format
// PostgreSQL pool — wrapped to match mysql2 query/execute interface
let pgPool;
function pgQuery(sql, params = []) {
  const converted = pgParams(translatePg(sql), params);
  return pgPool.query(converted.sql, converted.params);
}
function pgExecute(sql, params = []) {
  const translated = translatePg(sql);
  const isInsert = /^\s*INSERT\s/i.test(translated);
  const finalSql = isInsert ? translated + ' RETURNING id' : translated;
  const converted = pgParams(finalSql, params);
  return pgPool.query(converted.sql, converted.params);
}

function requireDb() {
  const p = getPool();
  if (!p) throw new Error('Database not configured. Set DATABASE_URL, or DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables.');
  return p;
}

// ── M-Pesa helpers ──
const https = require('https');
const MPESA_BASE = (process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke');

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;

function requireMpesaConfig() {
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_SHORTCODE || !MPESA_PASSKEY) {
    throw new Error('M-Pesa is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, and MPESA_PASSKEY environment variables.');
  }
}

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
  requireMpesaConfig();
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const url = new URL(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`);
  const res = await httpsRequest(url, { method: 'GET', headers: { Authorization: `Basic ${auth}` } });
  if (res.access_token) return res.access_token;
  throw new Error(res.errorMessage || 'OAuth failed');
}

async function mpesaStkPush(phone, amount, accountRef, desc) {
  requireMpesaConfig();
  const token = await mpesaToken();
  const ts = mpesaTimestamp();
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${ts}`).toString('base64');
  const body = JSON.stringify({
    BusinessShortCode: MPESA_SHORTCODE, Password: password, Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline', Amount: Math.floor(amount),
    PartyA: phone, PartyB: MPESA_SHORTCODE, PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://gym-website-ochre-one.vercel.app/api/mpesa/callback',
    AccountReference: accountRef, TransactionDesc: desc || 'Comrades Gym'
  });
  return await httpsRequest(new URL(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }, body);
}

async function mpesaQuery(checkoutRequestId) {
  requireMpesaConfig();
  const token = await mpesaToken();
  const ts = mpesaTimestamp();
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${ts}`).toString('base64');
  const body = JSON.stringify({ BusinessShortCode: MPESA_SHORTCODE, Password: password, Timestamp: ts, CheckoutRequestID: checkoutRequestId });
  return await httpsRequest(new URL(`${MPESA_BASE}/mpesa/stkpushquery/v1/query`), { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }, body);
}

// ── Seed data (used when DB tables are empty OR as demo fallback) ──
const SEED_PROGRAMS = [
  { id: 1, title: 'Foundation Strength', description: 'Build your core foundation with compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', level_sort: 1 },
  { id: 2, title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals anywhere.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop', level_sort: 1 },
  { id: 3, title: 'Hypertrophy Accelerator', description: 'Progressive overload programming for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop', level_sort: 2 },
  { id: 4, title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for explosive athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', level_sort: 2 },
  { id: 5, title: 'Elite Performance', description: 'Advanced periodization for experienced lifters chasing peak results.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop', level_sort: 3 },
  { id: 6, title: 'Certified Coach Program', description: 'Become a certified trainer under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop', level_sort: 3 },
];

const SEED_EXERCISES = [
  { id: 1, program_id: 1, name: 'Barbell Squat', description: 'Compound leg movement', sets: 4, reps: '8-10', rest_seconds: 120, order_index: 1 },
  { id: 2, program_id: 1, name: 'Bench Press', description: 'Upper body pushing strength', sets: 4, reps: '8-10', rest_seconds: 120, order_index: 2 },
  { id: 3, program_id: 1, name: 'Bent Over Row', description: 'Back thickness and width', sets: 4, reps: '8-10', rest_seconds: 90, order_index: 3 },
  { id: 4, program_id: 1, name: 'Overhead Press', description: 'Shoulder strength and stability', sets: 3, reps: '8-12', rest_seconds: 90, order_index: 4 },
  { id: 5, program_id: 1, name: 'Deadlift', description: 'Full body posterior chain', sets: 3, reps: '6-8', rest_seconds: 180, order_index: 5 },
  { id: 6, program_id: 2, name: 'Push-up', description: 'Chest, shoulders, triceps', sets: 3, reps: '10-15', rest_seconds: 60, order_index: 1 },
  { id: 7, program_id: 2, name: 'Pull-up', description: 'Back and biceps', sets: 3, reps: '5-10', rest_seconds: 90, order_index: 2 },
  { id: 8, program_id: 2, name: 'Air Squat', description: 'Leg endurance', sets: 4, reps: '15-20', rest_seconds: 60, order_index: 3 },
  { id: 9, program_id: 2, name: 'Plank', description: 'Core stability', sets: 3, reps: '30-60s', rest_seconds: 60, order_index: 4 },
  { id: 10, program_id: 2, name: 'Lunge', description: 'Unilateral leg strength', sets: 3, reps: '12-15', rest_seconds: 60, order_index: 5 },
];

// ── In-memory demo store (fallback when no DB) ──
const DEMO_DATA_PATH = '/tmp/gym-demo-data.json';
const CRED_SECRET = JWT_SECRET + '-cred';

function loadDemoData() {
  try {
    if (fs.existsSync(DEMO_DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DEMO_DATA_PATH, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveDemoData() {
  try {
    fs.writeFileSync(DEMO_DATA_PATH, JSON.stringify({ users: demoUsers, payments: demoPayments, nextId: demoNextId }), 'utf-8');
  } catch {}
}

let demoUsers = [];
let demoPayments = [];
let demoNextId = 2;

function initDemoStore() {
  const saved = loadDemoData();
  const adminPw = bcrypt.hashSync('admin123', 10);
  if (saved && saved.users && saved.users.length > 0) {
    demoUsers = saved.users;
    demoPayments = saved.payments || [];
    demoNextId = saved.nextId || 2;
  } else {
    demoUsers.push({ id: 1, username: 'Admin', email: 'admin@comrades.com', password: adminPw, role: 'admin', level: 'advanced', premium: true, profile_pic: null, created_at: new Date().toISOString() });
    saveDemoData();
  }
  console.log('[DEMO] Users:', demoUsers.length, '| Payments:', demoPayments.length);
}

initDemoStore();

function buildCredential(u) {
  return jwt.sign(
    { id: u.id, email: u.email, passwordHash: u.password, username: u.username, role: u.role, level: u.level, premium: !!u.premium, profile_pic: u.profile_pic },
    CRED_SECRET,
    { expiresIn: '90d' }
  );
}

function demoRegister(username, email, password, role) {
  if (demoUsers.find(u => u.email === email)) return null;
  const hashed = bcrypt.hashSync(password, 10);
  const id = ++demoNextId;
  const u = { id, username, email, password: hashed, role: role || 'trainee', level: 'beginner', premium: false, profile_pic: null, created_at: new Date().toISOString() };
  demoUsers.push(u);
  saveDemoData();
  return u;
}

function demoFindUser(email) {
  return demoUsers.find(u => u.email === email);
}

function demoGetUser(id) {
  return demoUsers.find(u => u.id === id);
}

function demoLoginFallback(email, password) {
  // First try the in-memory store
  let u = demoFindUser(email);
  if (u && bcrypt.compareSync(password, u.password)) return u;
  return null;
}

const SCHEMA_SQL = USE_POSTGRES ? [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'trainee',
    profile_pic TEXT,
    level VARCHAR(20) DEFAULT 'beginner',
    premium BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(20) NOT NULL,
    level_sort INT DEFAULT 1,
    duration VARCHAR(50),
    sessions INT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(500),
    trainer_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    program_id INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sets INT DEFAULT 3,
    reps VARCHAR(20) DEFAULT '10',
    rest_seconds INT DEFAULT 60,
    order_index INT DEFAULT 0,
    video_url VARCHAR(500) DEFAULT '',
    image_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    amount DECIMAL(10,2) DEFAULT 0,
    program_id INT REFERENCES programs(id) ON DELETE SET NULL,
    checkout_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
] : [];

async function seedIfEmpty() {
  let d;
  try { d = requireDb(); if (!d) return; } catch { return; }
  try {
    // Create tables if they don't exist (for cloud databases)
    for (const sql of SCHEMA_SQL) {
      try { await d.query(sql); } catch (e) { console.log('[SCHEMA] Skipped:', e.message.substring(0, 60)); }
    }
    const [adminRows] = await d.query('SELECT id FROM users WHERE role = ?', ['admin']);
    if (!adminRows.length) {
      const hashed = bcrypt.hashSync('admin123', 10);
      await d.query('INSERT INTO users (username, email, password, role, level, premium) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'admin@comrades.com', hashed, 'admin', 'advanced', true]);
      console.log('[SEED] Default admin account created (admin@comrades.com / admin123)');
    }
    const [progRows] = await d.query('SELECT id FROM programs LIMIT 1');
    if (!progRows.length) {
      for (const p of SEED_PROGRAMS) {
        await d.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [p.title, p.description, p.level, p.duration, p.sessions, p.price, p.image, p.level_sort]);
      }
      console.log('[SEED] Default programs created');
    }
    const [exRows] = await d.query('SELECT id FROM exercises LIMIT 1');
    if (!exRows.length) {
      for (const e of SEED_EXERCISES) {
        await d.query('INSERT INTO exercises (program_id, name, description, sets, reps, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [e.program_id, e.name, e.description, e.sets, e.reps, e.rest_seconds, e.order_index]);
      }
      console.log('[SEED] Default exercises created');
    }
  } catch (e) {
    console.log('[SEED] Could not seed data:', e.message);
  }
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
  if (db) seedIfEmpty();

  const url = (req.url || '/').split('?')[0];
  const parts = url.split('/').filter(Boolean);
  const path = parts[0] === 'api' ? parts[1] : parts[0];
  const sub = parts[0] === 'api' ? parts[2] : parts[1];

  // ── Health ──
  if (path === 'health') return res.json({ status: 'ok', db: !!db, mpesa: !!MPESA_CONSUMER_KEY });

  // ── M-Pesa callback (no auth, called by Safaricom) ──
  if (path === 'mpesa' && sub === 'callback' && req.method === 'POST') {
    console.log('[MPESA CALLBACK]', JSON.stringify(req.body));
    return res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }

  // ── M-Pesa STK Push ──
  if (path === 'mpesa' && sub === 'stkpush' && req.method === 'POST') {
    try {
      const user = getUser(req);
      const { phone, amount, programId, programName } = req.body || {};
      if (!phone || !amount) return res.status(400).json({ error: 'Phone and amount required' });
      const clean = phone.replace(/[^0-9]/g, '');
      if (clean.length < 9) return res.status(400).json({ error: 'Invalid phone' });
      const mpesaPhone = clean.startsWith('254') ? clean : clean.startsWith('0') ? '254' + clean.slice(1) : '254' + clean;
      const result = await mpesaStkPush(mpesaPhone, amount, `CG-${programId || 'PREMIUM'}`, programName || 'Comrades Gym');
      if (db && user) {
        try { await db.query('INSERT INTO payments (user_id, phone, amount, program_id, checkout_id, status) VALUES (?, ?, ?, ?, ?, ?)', [user.id, mpesaPhone, amount, programId || null, result.CheckoutRequestID || '', 'pending']); } catch (e) { console.error('[MPESA] DB insert error:', e.message); }
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── M-Pesa query ──
  if (path === 'mpesa' && sub === 'query' && req.method === 'POST') {
    try {
      const user = getUser(req);
      const { checkoutRequestId } = req.body || {};
      if (!checkoutRequestId) return res.status(400).json({ error: 'checkoutRequestId required' });
      const result = await mpesaQuery(checkoutRequestId);
      if ((result.ResultCode === '0' || result.ResultCode === 0) && user?.id && db) {
        const [rows] = await db.query('SELECT program_id FROM payments WHERE checkout_id = ? AND status = ?', [checkoutRequestId, 'pending']);
        await db.query('UPDATE users SET premium = 1 WHERE id = ?', [user.id]);
        await db.query('UPDATE payments SET status = ? WHERE checkout_id = ?', ['completed', checkoutRequestId]);
        if (rows[0]?.program_id) {
          const [[prog]] = await db.query('SELECT level FROM programs WHERE id = ?', [rows[0].program_id]);
          if (prog) await db.query('UPDATE users SET level = ? WHERE id = ?', [prog.level, user.id]);
        }
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Auth: Register ──
  if (path === 'register' && req.method === 'POST') {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

    // DEMO MODE: no database configured
    if (!db) {
      const existing = demoFindUser(email);
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const u = demoRegister(username, email, password, role);
      if (!u) return res.status(409).json({ error: 'Email already registered' });
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      const credential = buildCredential(u);
      return res.status(201).json({ token, credential, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    }

    // DB MODE
    try {
      const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) return res.status(409).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, 'trainee']);
      const [[newUser]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const token = jwt.sign({ id: newUser.id, role: newUser.role, username: newUser.username, profile_pic: newUser.profile_pic, level: newUser.level || 'beginner', premium: !!newUser.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, profile_pic: newUser.profile_pic, level: newUser.level || 'beginner', premium: !!newUser.premium } });
    } catch (e) {
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  // ── Auth: Login ──
  if (path === 'login' && req.method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    // DEMO MODE: no database configured
    if (!db) {
      // Try in-memory store first
      let u = demoLoginFallback(email, password);
      
      // If not found, try to reconstruct from saved credential
      if (!u) {
        const credHeader = req.headers['x-credential'];
        if (credHeader) {
          try {
            const dec = jwt.verify(credHeader, CRED_SECRET);
            if (dec.email === email && bcrypt.compareSync(password, dec.passwordHash)) {
              u = { id: dec.id, username: dec.username, email: dec.email, password: dec.passwordHash, role: dec.role, level: dec.level || 'beginner', premium: dec.premium || false, profile_pic: dec.profile_pic || null, created_at: new Date().toISOString() };
              // Re-register into the in-memory store so subsequent requests hit it
              if (!demoFindUser(email)) {
                demoUsers.push(u);
                saveDemoData();
              }
            }
          } catch (e) { /* credential invalid or expired */ }
        }
      }
      
      if (!u) return res.status(401).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      const credential = buildCredential(u);
      return res.json({ token, credential, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    }

    // DB MODE
    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const u = rows[0];
      if (!await bcrypt.compare(password, u.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    } catch (e) {
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // ── All routes below require auth ──
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // ── Profile ──
  if (path === 'profile') {
    if (req.method === 'GET') {
      if (!db) {
        const u = demoGetUser(user.id);
        if (!u) return res.status(404).json({ error: 'Not found' });
        const { password, ...safe } = u;
        return res.json({ user: safe });
      }
      try {
        const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, created_at FROM users WHERE id = ?', [user.id]);
        return rows[0] ? res.json({ user: rows[0] }) : res.status(404).json({ error: 'Not found' });
      } catch (e) {
        return res.status(500).json({ error: 'Profile fetch failed' });
      }
    }
    if (req.method === 'POST') {
      const { profile_pic } = req.body || {};
      if (!profile_pic) return res.status(400).json({ error: 'No data' });
      if (!db) {
        const u = demoGetUser(user.id);
        if (u) { u.profile_pic = profile_pic; saveDemoData(); }
        return res.json({ message: 'Updated' });
      }
      try {
        await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, user.id]);
        return res.json({ message: 'Updated' });
      } catch (e) {
        return res.status(500).json({ error: 'Update failed' });
      }
    }
  }

  // ── Programs ──
  if (path === 'programs') {
    // GET /api/programs — list all
    if (req.method === 'GET') {
      if (!db) return res.json(SEED_PROGRAMS);
      try {
        const [rows] = await db.query('SELECT * FROM programs ORDER BY level_sort ASC');
        return res.json(rows.length ? rows : SEED_PROGRAMS);
      } catch { return res.json(SEED_PROGRAMS); }
    }

    // POST /api/programs — create new
    if (req.method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      if (!db) return res.status(503).json({ error: 'Database required for this operation' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      if (!title || !level) return res.status(400).json({ error: 'Title and level required' });
      const levelSort = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
      await db.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [title, description || '', level, duration || '', sessions || 0, price || 0, image || '', levelSort, user.id]);
      return res.status(201).json({ message: 'Created' });
    }

    // PUT /api/programs/:id — update program
    if (req.method === 'PUT' && sub && !isNaN(sub)) {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      if (!db) return res.status(503).json({ error: 'Database required for this operation' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      const fields = [];
      const vals = [];
      if (title !== undefined) { fields.push('title = ?'); vals.push(title); }
      if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
      if (level !== undefined) { fields.push('level = ?, level_sort = ?'); vals.push(level, level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3); }
      if (duration !== undefined) { fields.push('duration = ?'); vals.push(duration); }
      if (sessions !== undefined) { fields.push('sessions = ?'); vals.push(sessions); }
      if (price !== undefined) { fields.push('price = ?'); vals.push(price); }
      if (image !== undefined) { fields.push('image = ?'); vals.push(image); }
      if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
      vals.push(sub);
      await db.query(`UPDATE programs SET ${fields.join(', ')} WHERE id = ?`, vals);
      return res.json({ message: 'Updated' });
    }

    // DELETE /api/programs/:id — delete program
    if (req.method === 'DELETE' && sub && !isNaN(sub)) {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
      if (!db) return res.status(503).json({ error: 'Database required for this operation' });
      await db.query('DELETE FROM programs WHERE id = ?', [sub]);
      return res.json({ message: 'Deleted' });
    }
  }

  // ── Admin: users list ──
  if (path === 'admin' && sub === 'users' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!db) {
      const safe = demoUsers.map(({ password, ...rest }) => rest);
      return res.json(safe);
    }
    try {
      const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, last_seen, created_at FROM users ORDER BY last_seen DESC');
      return res.json(rows);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // ── Admin: payments list ──
  if (path === 'admin' && sub === 'payments' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!db) return res.json(demoPayments);
    try {
      const [rows] = await db.query(`
        SELECT p.*, u.username FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 100
      `);
      return res.json(rows);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }
  }

  // ── Admin: stats ──
  if (path === 'admin' && sub === 'stats' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!db) {
      const totalClients = demoUsers.filter(u => u.role === 'trainee').length;
      return res.json({
        totalClients,
        totalRevenue: 0,
        totalPayments: demoPayments.filter(p => p.status === 'completed').length,
        recentPayments: demoPayments.slice(-5).reverse(),
        programStats: SEED_PROGRAMS.map(p => ({ title: p.title, price: p.price, level: p.level, unlock_count: 0 }))
      });
    }
    try {
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
    } catch (e) {
      return res.status(500).json({ error: 'Stats fetch failed' });
    }
  }

  // ── Client: my payments ──
  if (path === 'my-payments' && req.method === 'GET') {
    if (!db) {
      const mine = demoPayments.filter(p => p.user_id === user.id);
      return res.json(mine);
    }
    try {
      const [rows] = await db.query('SELECT p.*, pr.title as program_name FROM payments p LEFT JOIN programs pr ON p.program_id = pr.id WHERE p.user_id = ? ORDER BY p.created_at DESC', [user.id]);
      return res.json(rows);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }
  }

  // ── Heartbeat ──
  if (path === 'heartbeat' && req.method === 'POST') {
    if (!db) return res.json({ success: true, demo: true });
    try {
      await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: 'Heartbeat failed' });
    }
  }

  // ── Exercises ──
  if (path === 'exercises') {
    // GET /api/exercises — list all (optionally filter by program_id)
    if (req.method === 'GET') {
      if (!db) {
        const programId = req.query?.program_id ? parseInt(req.query.program_id) : null;
        let filtered = SEED_EXERCISES;
        if (programId) filtered = filtered.filter(e => e.program_id === programId);
        return res.json(filtered);
      }
      try {
        const programId = req.query?.program_id ? parseInt(req.query.program_id) : null;
        let query = 'SELECT * FROM exercises';
        const params = [];
        if (programId) {
          query += ' WHERE program_id = ?';
          params.push(programId);
        }
        query += ' ORDER BY order_index ASC';
        const [rows] = await db.query(query, params);
        return res.json(rows.length ? rows : SEED_EXERCISES);
      } catch { return res.json(SEED_EXERCISES); }
    }

    // POST /api/exercises — create new exercise
    if (req.method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      if (!db) return res.status(503).json({ error: 'Database required for this operation' });
      const { program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url } = req.body || {};
      if (!program_id || !name) return res.status(400).json({ error: 'Program ID and name required' });
      await db.query('INSERT INTO exercises (program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [program_id, name, description || '', sets || 3, reps || '10', rest_seconds || 60, order_index || 0, video_url || '', image_url || '']);
      return res.status(201).json({ message: 'Created' });
    }

    // PUT /api/exercises/:id — update exercise
    if (req.method === 'PUT' && sub && !isNaN(sub)) {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      if (!db) return res.status(503).json({ error: 'Database required for this operation' });
      const { program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url } = req.body || {};
      const fields = [];
      const vals = [];
      if (program_id !== undefined) { fields.push('program_id = ?'); vals.push(program_id); }
      if (name !== undefined) { fields.push('name = ?'); vals.push(name); }
      if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
      if (sets !== undefined) { fields.push('sets = ?'); vals.push(sets); }
      if (reps !== undefined) { fields.push('reps = ?'); vals.push(reps); }
      if (rest_seconds !== undefined) { fields.push('rest_seconds = ?'); vals.push(rest_seconds); }
      if (order_index !== undefined) { fields.push('order_index = ?'); vals.push(order_index); }
      if (video_url !== undefined) { fields.push('video_url = ?'); vals.push(video_url); }
      if (image_url !== undefined) { fields.push('image_url = ?'); vals.push(image_url); }
      if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
      vals.push(sub);
      await db.query(`UPDATE exercises SET ${fields.join(', ')} WHERE id = ?`, vals);
      return res.json({ message: 'Updated' });
    }

    // DELETE /api/exercises/:id — delete exercise
    if (req.method === 'DELETE' && sub && !isNaN(sub)) {
      if (user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
      if (!db) return res.status(503).json({ error: 'Database required for this operation' });
      await db.query('DELETE FROM exercises WHERE id = ?', [sub]);
      return res.json({ message: 'Deleted' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
