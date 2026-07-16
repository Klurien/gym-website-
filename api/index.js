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

// ── In-memory demo store (used when no DB) ──
const demoPayments = [];
const demoUsers = [
  { id: 1, username: 'Admin', email: 'admin@comrades.com', password: bcrypt.hashSync('admin123', 10), role: 'admin', level: 'advanced', premium: true, profile_pic: null, created_at: new Date().toISOString() },
];

function demoRegister(username, email, password) {
  if (demoUsers.find(u => u.email === email)) return null;
  const hashed = bcrypt.hashSync(password, 10);
  const id = demoUsers.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const u = { id, username, email, password: hashed, role: 'trainee', level: 'beginner', premium: false, profile_pic: null, created_at: new Date().toISOString() };
  demoUsers.push(u);
  return u;
}

function demoFindUser(email) {
  return demoUsers.find(u => u.email === email);
}

function demoGetUser(id) {
  return demoUsers.find(u => u.id === id);
}

async function seedAdmin(db) {
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE role = ?', ['admin']);
    if (!rows.length) {
      const hashed = bcrypt.hashSync('admin123', 10);
      await db.query('INSERT INTO users (username, email, password, role, level, premium) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'admin@comrades.com', hashed, 'admin', 'advanced', true]);
      console.log('[SEED] Default admin account created');
    }
  } catch (e) {
    console.log('[SEED] Could not seed admin:', e.message);
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
  if (db) seedAdmin(db);
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
    const decoded = getUser(req);
    const { programId } = req.body || {};
    if (!db) {
      const u = demoGetUser(decoded?.id);
      if (u) {
        u.premium = true;
        if (programId) {
          demoPayments.push({ id: Date.now(), user_id: u.id, phone: 'DEMO', amount: 0, program_id: programId, checkout_id: `demo_${Date.now()}`, status: 'completed', created_at: new Date().toISOString(), username: u.username });
        }
      }
      return res.json({ success: true, demo: true });
    }
    if (decoded?.id) {
      await db.query('UPDATE users SET premium = 1 WHERE id = ?', [decoded.id]);
      if (programId) {
        try { await db.query('INSERT INTO payments (user_id, phone, amount, program_id, checkout_id, status) VALUES (?, ?, ?, ?, ?, ?)', [decoded.id, 'DEMO', 0, programId, `demo_${Date.now()}`, 'completed']); } catch {}
      }
    }
    return res.json({ success: true, demo: true });
  }

  // ── Auth: Register ──
  if (path === 'register' && req.method === 'POST') {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    if (!db) {
      const existing = demoFindUser(email);
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const u = demoRegister(username, email, password);
      if (!u) return res.status(409).json({ error: 'Email already registered' });
      return res.status(201).json({ message: 'Registered', user: u });
    }
    try {
      const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) return res.status(409).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, 'trainee']);
      return res.status(201).json({ message: 'Registered' });
    } catch (e) { return res.status(500).json({ error: 'Registration failed' }); }
  }

  // ── Auth: Login ──
  if (path === 'login' && req.method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (!db) {
      const u = demoFindUser(email);
      if (!u) return res.status(401).json({ error: 'Invalid credentials' });
      if (!bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    }
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
      if (!db) {
        const u = demoGetUser(user.id);
        if (!u) return res.status(404).json({ error: 'Not found' });
        const { password, ...safe } = u;
        return res.json({ user: safe });
      }
      const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, created_at FROM users WHERE id = ?', [user.id]);
      return rows[0] ? res.json({ user: rows[0] }) : res.status(404).json({ error: 'Not found' });
    }
    if (req.method === 'POST') {
      const { profile_pic } = req.body || {};
      if (!profile_pic) return res.status(400).json({ error: 'No data' });
      if (!db) {
        const u = demoGetUser(user.id);
        if (u) u.profile_pic = profile_pic;
        return res.json({ message: 'Updated (demo)' });
      }
      await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, user.id]);
      return res.json({ message: 'Updated' });
    }
  }

  // ── Programs ──
  if (path === 'programs') {
    // DEMO SEED DATA
    const DEMO_PROGRAMS = [
      { id: 1, title: 'Foundation Strength', description: 'Build your core foundation with compound movements. Perfect for first-timers.', level: 'beginner', duration: '4 weeks', sessions: 12, price: 0, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop', level_sort: 1 },
      { id: 2, title: 'Bodyweight Mastery', description: 'Master pushups, pullups, and bodyweight fundamentals anywhere.', level: 'beginner', duration: '6 weeks', sessions: 18, price: 0, image: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop', level_sort: 1 },
      { id: 3, title: 'Hypertrophy Accelerator', description: 'Progressive overload programming for lean muscle growth.', level: 'intermediate', duration: '8 weeks', sessions: 24, price: 29, image: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop', level_sort: 2 },
      { id: 4, title: 'Power & Explosiveness', description: 'Olympic lifts and plyometrics for explosive athletic performance.', level: 'intermediate', duration: '6 weeks', sessions: 18, price: 39, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop', level_sort: 2 },
      { id: 5, title: 'Elite Performance', description: 'Advanced periodization for experienced lifters chasing peak results.', level: 'advanced', duration: '12 weeks', sessions: 36, price: 79, image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop', level_sort: 3 },
      { id: 6, title: 'Certified Coach Program', description: 'Become a certified trainer under expert mentorship.', level: 'advanced', duration: '16 weeks', sessions: 48, price: 149, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop', level_sort: 3 },
    ];

    // GET /api/programs — list all
    if (req.method === 'GET') {
      if (!db) return res.json(DEMO_PROGRAMS);
      try {
        const [rows] = await db.query('SELECT * FROM programs ORDER BY level_sort ASC');
        return res.json(rows.length ? rows : DEMO_PROGRAMS);
      } catch { return res.json(DEMO_PROGRAMS); }
    }

    // POST /api/programs — create new
    if (req.method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      if (!title || !level) return res.status(400).json({ error: 'Title and level required' });
      if (!db) return res.status(201).json({ id: Date.now(), message: 'Created (demo)' });
      const levelSort = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
      await db.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [title, description || '', level, duration || '', sessions || 0, price || 0, image || '', levelSort, user.id]);
      return res.status(201).json({ message: 'Created' });
    }

    // PUT /api/programs/:id — update program
    if (req.method === 'PUT' && sub && !isNaN(sub)) {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      if (!db) {
        const idx = DEMO_PROGRAMS.findIndex(p => p.id == sub);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        return res.json({ message: 'Updated (demo)' });
      }
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
      if (!db) return res.json({ message: 'Deleted (demo)' });
      await db.query('DELETE FROM programs WHERE id = ?', [sub]);
      return res.json({ message: 'Deleted' });
    }
  }

  // ── Admin: users list ──
  if (path === 'admin' && sub === 'users' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!db) {
      const safe = demoUsers.map(({ password, ...u }) => u);
      return res.json(safe);
    }
    const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, last_seen, created_at FROM users ORDER BY last_seen DESC');
    return res.json(rows);
  }

  // ── Admin: payments list ──
  if (path === 'admin' && sub === 'payments' && req.method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!db) return res.json(demoPayments);
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
    if (!db) {
      const totalClients = demoUsers.filter(u => u.role === 'trainee').length;
      const completedPayments = demoPayments.filter(p => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((s, p) => s + (p.amount || 0), 0);
      return res.json({ totalClients, totalRevenue, totalPayments: completedPayments.length, recentPayments: [], programStats: [] });
    }
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
    if (!db) return res.json(demoPayments.filter(p => p.user_id === user.id));
    const [rows] = await db.query('SELECT p.*, pr.title as program_name FROM payments p LEFT JOIN programs pr ON p.program_id = pr.id WHERE p.user_id = ? ORDER BY p.created_at DESC', [user.id]);
    return res.json(rows);
  }

  // ── Heartbeat ──
  if (path === 'heartbeat' && req.method === 'POST') {
    if (!db) return res.json({ success: true });
    await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
    return res.json({ success: true });
  }

  // ── Exercises ──
  if (path === 'exercises') {
    // DEMO SEED DATA
    const DEMO_EXERCISES = [
      { id: 1, program_id: 1, name: 'Barbell Squat', description: 'Compound leg movement', sets: 4, reps: '8-10', rest_seconds: 120, order_index: 1, video_url: '', image_url: '' },
      { id: 2, program_id: 1, name: 'Bench Press', description: 'Upper body pushing strength', sets: 4, reps: '8-10', rest_seconds: 120, order_index: 2, video_url: '', image_url: '' },
      { id: 3, program_id: 1, name: 'Bent Over Row', description: 'Back thickness and width', sets: 4, reps: '8-10', rest_seconds: 90, order_index: 3, video_url: '', image_url: '' },
      { id: 4, program_id: 1, name: 'Overhead Press', description: 'Shoulder strength and stability', sets: 3, reps: '8-12', rest_seconds: 90, order_index: 4, video_url: '', image_url: '' },
      { id: 5, program_id: 1, name: 'Deadlift', description: 'Full body posterior chain', sets: 3, reps: '6-8', rest_seconds: 180, order_index: 5, video_url: '', image_url: '' },
      { id: 6, program_id: 2, name: 'Push-up', description: 'Chest, shoulders, triceps', sets: 3, reps: '10-15', rest_seconds: 60, order_index: 1, video_url: '', image_url: '' },
      { id: 7, program_id: 2, name: 'Pull-up', description: 'Back and biceps', sets: 3, reps: '5-10', rest_seconds: 90, order_index: 2, video_url: '', image_url: '' },
      { id: 8, program_id: 2, name: 'Air Squat', description: 'Leg endurance', sets: 4, reps: '15-20', rest_seconds: 60, order_index: 3, video_url: '', image_url: '' },
      { id: 9, program_id: 2, name: 'Plank', description: 'Core stability', sets: 3, reps: '30-60s', rest_seconds: 60, order_index: 4, video_url: '', image_url: '' },
      { id: 10, program_id: 2, name: 'Lunge', description: 'Unilateral leg strength', sets: 3, reps: '12-15', rest_seconds: 60, order_index: 5, video_url: '', image_url: '' },
    ];

    // GET /api/exercises — list all (optionally filter by program_id)
    if (req.method === 'GET') {
      if (!db) {
        const programId = req.query?.program_id ? parseInt(req.query.program_id) : null;
        const filtered = programId ? DEMO_EXERCISES.filter(e => e.program_id === programId) : DEMO_EXERCISES;
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
        return res.json(rows.length ? rows : DEMO_EXERCISES);
      } catch { return res.json(DEMO_EXERCISES); }
    }

    // POST /api/exercises — create new exercise
    if (req.method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url } = req.body || {};
      if (!program_id || !name) return res.status(400).json({ error: 'Program ID and name required' });
      if (!db) return res.status(201).json({ id: Date.now(), message: 'Created (demo)' });
      await db.query('INSERT INTO exercises (program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [program_id, name, description || '', sets || 3, reps || '10', rest_seconds || 60, order_index || 0, video_url || '', image_url || '']);
      return res.status(201).json({ message: 'Created' });
    }

    // PUT /api/exercises/:id — update exercise
    if (req.method === 'PUT' && sub && !isNaN(sub)) {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { program_id, name, description, sets, reps, rest_seconds, order_index, video_url, image_url } = req.body || {};
      if (!db) {
        const idx = DEMO_EXERCISES.findIndex(e => e.id == sub);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        return res.json({ message: 'Updated (demo)' });
      }
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
      if (!db) return res.json({ message: 'Deleted (demo)' });
      await db.query('DELETE FROM exercises WHERE id = ?', [sub]);
      return res.json({ message: 'Deleted' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
