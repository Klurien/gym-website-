const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'comrades-gym-secret-2026';

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

function requireDb() {
  const db = getPool();
  if (!db) throw new Error('Database not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables.');
  return db;
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

// ── Seed data (used when DB tables are empty) ──
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

async function seedIfEmpty() {
  const db = getPool();
  if (!db) return;
  try {
    const [adminRows] = await db.query('SELECT id FROM users WHERE role = ?', ['admin']);
    if (!adminRows.length) {
      const hashed = bcrypt.hashSync('admin123', 10);
      await db.query('INSERT INTO users (username, email, password, role, level, premium) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'admin@comrades.com', hashed, 'admin', 'advanced', true]);
      console.log('[SEED] Default admin account created (admin@comrades.com / admin123)');
    }
    const [progRows] = await db.query('SELECT id FROM programs LIMIT 1');
    if (!progRows.length) {
      for (const p of SEED_PROGRAMS) {
        await db.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [p.title, p.description, p.level, p.duration, p.sessions, p.price, p.image, p.level_sort]);
      }
      console.log('[SEED] Default programs created');
    }
    const [exRows] = await db.query('SELECT id FROM exercises LIMIT 1');
    if (!exRows.length) {
      for (const e of SEED_EXERCISES) {
        await db.query('INSERT INTO exercises (program_id, name, description, sets, reps, rest_seconds, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
    try {
      const _db = requireDb();
      const { username, email, password, role } = req.body || {};
      if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
      if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
      const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) return res.status(409).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, 'trainee']);
      const [[newUser]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      const token = jwt.sign({ id: newUser.id, role: newUser.role, username: newUser.username, profile_pic: newUser.profile_pic, level: newUser.level || 'beginner', premium: !!newUser.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, profile_pic: newUser.profile_pic, level: newUser.level || 'beginner', premium: !!newUser.premium } });
    } catch (e) {
      if (e.message === 'Database not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables.') {
        return res.status(500).json({ error: 'Database not configured. Please contact the administrator.' });
      }
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  // ── Auth: Login ──
  if (path === 'login' && req.method === 'POST') {
    try {
      const _db = requireDb();
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
      const u = rows[0];
      if (!await bcrypt.compare(password, u.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    } catch (e) {
      if (e.message === 'Database not configured. Set DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME environment variables.') {
        return res.status(500).json({ error: 'Database not configured. Please contact the administrator.' });
      }
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // ── All routes below require auth ──
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // ── Profile ──
  if (path === 'profile') {
    const _db = requireDb();
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
    const _db = requireDb();

    // GET /api/programs — list all
    if (req.method === 'GET') {
      try {
        const [rows] = await db.query('SELECT * FROM programs ORDER BY level_sort ASC');
        return res.json(rows.length ? rows : SEED_PROGRAMS);
      } catch { return res.json(SEED_PROGRAMS); }
    }

    // POST /api/programs — create new
    if (req.method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      if (!title || !level) return res.status(400).json({ error: 'Title and level required' });
      const levelSort = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
      await db.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [title, description || '', level, duration || '', sessions || 0, price || 0, image || '', levelSort, user.id]);
      return res.status(201).json({ message: 'Created' });
    }

    // PUT /api/programs/:id — update program
    if (req.method === 'PUT' && sub && !isNaN(sub)) {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
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
      await db.query('DELETE FROM programs WHERE id = ?', [sub]);
      return res.json({ message: 'Deleted' });
    }
  }

  // ── Admin: users list ──
  if (path === 'admin' && sub === 'users' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const _db = requireDb();
    const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, last_seen, created_at FROM users ORDER BY last_seen DESC');
    return res.json(rows);
  }

  // ── Admin: payments list ──
  if (path === 'admin' && sub === 'payments' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const _db = requireDb();
    const [rows] = await db.query(`
      SELECT p.*, u.username FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 100
    `);
    return res.json(rows);
  }

  // ── Admin: stats ──
  if (path === 'admin' && sub === 'stats' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const _db = requireDb();
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
    const _db = requireDb();
    const [rows] = await db.query('SELECT p.*, pr.title as program_name FROM payments p LEFT JOIN programs pr ON p.program_id = pr.id WHERE p.user_id = ? ORDER BY p.created_at DESC', [user.id]);
    return res.json(rows);
  }

  // ── Heartbeat ──
  if (path === 'heartbeat' && req.method === 'POST') {
    const _db = requireDb();
    await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
    return res.json({ success: true });
  }

  // ── Exercises ──
  if (path === 'exercises') {
    const _db = requireDb();

    // GET /api/exercises — list all (optionally filter by program_id)
    if (req.method === 'GET') {
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
      const { program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url } = req.body || {};
      if (!program_id || !name) return res.status(400).json({ error: 'Program ID and name required' });
      await db.query('INSERT INTO exercises (program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [program_id, name, description || '', sets || 3, reps || '10', rest_seconds || 60, order_index || 0, video_url || '', image_url || '']);
      return res.status(201).json({ message: 'Created' });
    }

    // PUT /api/exercises/:id — update exercise
    if (req.method === 'PUT' && sub && !isNaN(sub)) {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
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
      await db.query('DELETE FROM exercises WHERE id = ?', [sub]);
      return res.json({ message: 'Deleted' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
