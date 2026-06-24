const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'comrades-gym-secret-2026';
const DB_CONFIG = process.env.DB_HOST ? {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10
} : null;

let pool;
function getPool() {
  if (!pool && DB_CONFIG) {
    pool = mysql.createPool(DB_CONFIG);
  }
  return pool;
}

const uploadDir = path.join(os.homedir(), '.comrades', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase())
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(allowed.includes(ext) ? null : new Error('Unsupported format'), allowed.includes(ext));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }).single('file');

const mpesa = require('./mpesa');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getPool();
  const method = req.method;
  const urlPath = (req.url || '/').split('?')[0];
  const urlParts = urlPath.split('/').filter(Boolean);
  const apiPath = urlParts[0] === 'api' ? urlParts[1] : urlParts[0];

  // ── M-Pesa (no auth needed for callback) ──
  if (apiPath === 'mpesa' && urlParts[2] === 'callback' && method === 'POST') {
    console.log('[MPESA CALLBACK]', JSON.stringify(req.body));
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  let user = null;

  if (token) {
    try { user = jwt.verify(token, JWT_SECRET); } catch {}
  }

  if (apiPath === 'health') {
    return res.status(200).json({ status: 'ok' });
  }

  // ── Auth Routes ──
  if (apiPath === 'register' && method === 'POST') {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

    try {
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'Email already registered' });

      const hashed = await bcrypt.hash(password, 10);
      const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
      const userRole = rows[0].c === 0 ? 'admin' : (role === 'trainer' ? 'trainer' : 'trainee');
      await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, userRole]);
      return res.status(201).json({ message: 'User registered' });
    } catch (err) {
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  if (apiPath === 'login' && method === 'POST') {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const u = rows[0];
      if (!await bcrypt.compare(password, u.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ token, user: { id: u.id, username: u.username, role: u.role, email: u.email, profile_pic: u.profile_pic, level: u.level || 'beginner', premium: !!u.premium } });
    } catch (err) {
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  // ── M-Pesa Payment Routes ──
  if (apiPath === 'mpesa' && method === 'POST') {
    const action = urlParts[2];
    const body = req.body || {};

    if (action === 'stkpush') {
      const { phone, amount, programId, programName } = body;
      if (!phone || !amount) return res.status(400).json({ error: 'Phone and amount required' });

      // Validate phone (254 format)
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) return res.status(400).json({ error: 'Invalid phone number' });

      const mpesaPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1)
        : cleanPhone.startsWith('254') ? cleanPhone
        : '254' + cleanPhone;

      try {
        const result = await mpesa.stkPush(mpesaPhone, amount, `CG-${programId || 'PREMIUM'}`, programName || 'Comrades Gym Premium');

        // Store pending payment in DB if available
        if (db && user) {
          try {
            await db.query(
              'INSERT INTO payments (user_id, phone, amount, program_id, checkout_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
              [user?.id || 0, mpesaPhone, amount, programId || null, result.CheckoutRequestID || `demo_${Date.now()}`, 'pending']
            );
          } catch {}
        }

        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({ error: err.message || 'STK push failed' });
      }
    }

    if (action === 'query') {
      const { checkoutRequestId } = body;
      if (!checkoutRequestId) return res.status(400).json({ error: 'checkoutRequestId required' });
      try {
        const result = await mpesa.queryStatus(checkoutRequestId);

        // If successful, unlock premium
        if (result.ResultCode === '0' || result.ResultCode === 0 || (result.demo && result.success)) {
          if (user?.id && db) {
            const [rows] = await db.query('SELECT program_id FROM payments WHERE checkout_id = ? AND status = ?', [checkoutRequestId, 'pending']);
            await db.query('UPDATE users SET premium = 1 WHERE id = ?', [user.id]);
            await db.query('UPDATE payments SET status = ? WHERE checkout_id = ?', ['completed', checkoutRequestId]);
            if (rows[0]?.program_id) {
              await db.query('UPDATE users SET level = (SELECT level FROM programs WHERE id = ?) WHERE id = ?', [rows[0].program_id, user.id]);
            }
          }
        }

        return res.status(200).json(result);
      } catch (err) {
        return res.status(500).json({ error: err.message || 'Query failed' });
      }
    }

    if (action === 'demo-unlock') {
      // Direct demo unlock (no actual payment)
      if (user?.id && db) {
        const programId = body.programId;
        await db.query('UPDATE users SET premium = 1 WHERE id = ?', [user.id]);
        if (programId) {
          await db.query('UPDATE users SET level = (SELECT level FROM programs WHERE id = ?) WHERE id = ?', [programId, user.id]);
        }
        return res.status(200).json({ success: true, demo: true, message: 'Premium unlocked (demo)' });
      }
      return res.status(200).json({ success: true, demo: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (apiPath === 'profile') {
    if (method === 'GET') {
      try {
        const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, created_at FROM users WHERE id = ?', [user.id]);
        return rows[0] ? res.status(200).json({ user: rows[0] }) : res.status(404).json({ error: 'Not found' });
      } catch { return res.status(500).json({ error: 'DB error' }); }
    }
    if (method === 'POST') {
      const { profile_pic } = req.body || {};
      if (!profile_pic || !/^data:image\/\w+;base64,/.test(profile_pic)) return res.status(400).json({ error: 'Invalid format' });
      try {
        await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, user.id]);
        return res.status(200).json({ message: 'Profile updated' });
      } catch { return res.status(500).json({ error: 'DB error' }); }
    }
  }

  // ── Programs API ──
  if (apiPath === 'programs') {
    if (method === 'GET') {
      try {
        const [rows] = await db.query('SELECT * FROM programs ORDER BY level_sort ASC');
        return res.status(200).json(rows);
      } catch { return res.status(500).json({ error: 'DB error' }); }
    }
    if (method === 'POST') {
      if (user.role !== 'trainer' && user.role !== 'admin') return res.status(403).json({ error: 'Trainers only' });
      const { title, description, level, duration, sessions, price, image } = req.body || {};
      if (!title || !level) return res.status(400).json({ error: 'Title and level required' });
      try {
        const levelSort = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
        await db.query('INSERT INTO programs (title, description, level, duration, sessions, price, image, level_sort, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [title, description || '', level, duration || '', sessions || 0, price || 0, image || '', levelSort, user.id]);
        return res.status(201).json({ message: 'Program created' });
      } catch { return res.status(500).json({ error: 'DB error' }); }
    }
  }

  // ── Unlock Program (Premium) ──
  if (apiPath === 'programs' && urlParts[3] === 'unlock' && method === 'POST') {
    const programId = urlParts[2];
    try {
      await db.query('UPDATE users SET premium = 1, level = (SELECT level FROM programs WHERE id = ?) WHERE id = ?', [programId, user.id]);
      return res.status(200).json({ message: 'Program unlocked!' });
    } catch { return res.status(500).json({ error: 'Unlock failed' }); }
  }

  // ── Heartbeat ──
  if (apiPath === 'heartbeat' && method === 'POST') {
    try {
      await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
      return res.status(200).json({ success: true });
    } catch { return res.status(500).json({ error: 'Heartbeat failed' }); }
  }

  // ── Admin Users ──
  if (apiPath === 'admin' && urlParts[2] === 'users') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const [rows] = await db.query('SELECT id, username, email, role, profile_pic, level, premium, last_seen, created_at FROM users ORDER BY last_seen DESC');
      return res.status(200).json(rows);
    } catch { return res.status(500).json({ error: 'Fetch failed' }); }
  }

  // ── Messages (trainer-trainee) ──
  if (apiPath === 'messages') {
    if (method === 'POST') {
      const { receiver_id, content } = req.body || {};
      if (!receiver_id || !content) return res.status(400).json({ error: 'Missing fields' });
      try {
        const [result] = await db.query('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [user.id, receiver_id, content.trim()]);
        return res.status(201).json({ message: 'Sent', id: result.insertId });
      } catch { return res.status(500).json({ error: 'Message failed' }); }
    }
    if (method === 'GET') {
      const withUser = req.query?.with;
      try {
        if (withUser) {
          const otherId = parseInt(withUser);
          const [messages] = await db.query(
            `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at, u.username as sender_name
             FROM messages m JOIN users u ON m.sender_id = u.id
             WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.created_at ASC`,
            [user.id, otherId, otherId, user.id]
          );
          await db.query('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [otherId, user.id]);
          const [otherRows] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [otherId]);
          return res.status(200).json({ messages, other: otherRows[0] });
        }
        const [conversations] = await db.query(
          `SELECT u.id as other_id, u.username as other_name, u.role as other_role,
              (SELECT content FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_at,
              (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread
           FROM users u WHERE u.id != ? AND (
              EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id AND receiver_id = ?) OR
              EXISTS (SELECT 1 FROM messages WHERE sender_id = ? AND receiver_id = u.id)
           ) ORDER BY last_at DESC`,
          [user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id]
        );
        return res.status(200).json({ conversations });
      } catch { return res.status(500).json({ error: 'Messages fetch failed' }); }
    }
  }

  // ── Storage ──
  if (apiPath === 'storage') {
    if (method === 'GET') {
      const action = req.query?.action;
      try {
        if (action === 'notifications') {
          const [rows] = await db.query('SELECT * FROM user_notifications WHERE user_id = ? LIMIT 50', [user.id]);
          return res.status(200).json(rows);
        }
        return res.status(200).json([]);
      } catch { return res.status(500).json({ error: 'Storage error' }); }
    }
  }

  // ── Contact ──
  if (apiPath === 'contact' && method === 'POST') {
    const { name, email, phone, interests, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
    try {
      await db.query('INSERT INTO client_info (name, email, phone, interests, message) VALUES (?, ?, ?, ?, ?)', [name, email, phone, interests, message]);
      return res.status(201).json({ message: 'Saved!' });
    } catch { return res.status(500).json({ error: 'Contact save failed' }); }
  }

  return res.status(404).json({ error: 'Endpoint not found' });
};
