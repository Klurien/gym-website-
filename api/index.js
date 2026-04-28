const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
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

const uploadDir = path.join(os.homedir(), '.kinetic', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: () => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase())
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(allowed.includes(ext) ? null : new Error('Unsupported format'), allowed.includes(ext));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }).single('file');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getPool();
  const method = req.method;
  const urlParts = (req.url || '/').split('/').filter(Boolean);
  const apiPath = urlParts[0] === 'api' ? urlParts[1] : urlParts[0];
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  let user = null;
  
  if (token) {
    try { user = jwt.verify(token, JWT_SECRET); } catch {}
  }

  if (apiPath === 'health') {
    return res.status(200).json({ status: 'ok' });
  }

  if (apiPath === 'register' && method === 'POST') {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    
    try {
      const hashed = await bcrypt.hash(password, 10);
      const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
      const role = rows[0].c === 0 ? 'admin' : 'user';
      await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, role]);
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
      const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic }, JWT_SECRET, { expiresIn: '1d' });
      return res.status(200).json({ token, user: { id: u.id, username: u.username, role: u.role, profile_pic: u.profile_pic } });
    } catch (err) {
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (apiPath === 'profile') {
    if (method === 'GET') {
      try {
        const [rows] = await db.query('SELECT id, username, email, role, profile_pic, created_at FROM users WHERE id = ?', [user.id]);
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

  if (apiPath === 'posts') {
    if (method === 'GET') {
      try {
        const [rows] = await db.query(
          `SELECT p.*, u.username as trainer_name,
           (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) as likes_count,
           (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
           EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as is_liked
           FROM posts p LEFT JOIN users u ON p.trainer_id = u.id ORDER BY p.created_at DESC LIMIT 50`,
          [user.id]
        );
        return res.status(200).json(rows);
      } catch { return res.status(500).json({ error: 'DB error' }); }
    }
    if (method === 'POST') {
      if (user.role !== 'admin' && user.role !== 'trainer') return res.status(403).json({ error: 'Forbidden' });
      const { media_url, title, description, tags, type } = req.body || {};
      if (!title) return res.status(400).json({ error: 'Title required' });
      try {
        const [r] = await db.query(
          'INSERT INTO posts (trainer_id, media_url, title, description, tags, type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [user.id, media_url || '', title, description || '', tags || '', type || 'static']
        );
        return res.status(201).json({ message: 'Post created', postId: r.insertId });
      } catch { return res.status(500).json({ error: 'DB error' }); }
    }
  }

  if (apiPath === 'posts_social') {
    const action = req.query?.action;
    const { post_id, comment } = req.body || {};
    
    if (action === 'like' && method === 'POST') {
      if (!post_id) return res.status(400).json({ error: 'post_id required' });
      try {
        const [existing] = await db.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
        if (existing.length > 0) {
          await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
          return res.status(200).json({ status: 'deleted' });
        } else {
          await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, user.id]);
          return res.status(201).json({ status: 'added' });
        }
      } catch { return res.status(500).json({ error: 'Like failed' }); }
    }
    
    if (action === 'comment' && method === 'POST') {
      if (!post_id || !comment) return res.status(400).json({ error: 'post_id and comment required' });
      try {
        await db.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, user.id, comment]);
        return res.status(201).json({ message: 'Comment added' });
      } catch { return res.status(500).json({ error: 'Comment failed' }); }
    }
    
    if (action === 'comments' && method === 'GET') {
      if (!post_id) return res.status(400).json({ error: 'post_id required' });
      try {
        const [rows] = await db.query('SELECT c.*, u.username, u.profile_pic FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC', [post_id]);
        return res.status(200).json(rows);
      } catch { return res.status(500).json({ error: 'Fetch failed' }); }
    }
  }

  if (apiPath === 'upload' && method === 'POST') {
    return new Promise((resolve) => {
      upload(req, res, (err) => {
        if (err) return resolve(res.status(400).json({ error: err.message }));
        if (!req.file) return resolve(res.status(400).json({ error: 'No file' }));
        return resolve(res.status(200).json({ url: `/uploads/${req.file.filename}` }));
      });
    });
  }

  return res.status(404).json({ error: 'Endpoint not found' });
};