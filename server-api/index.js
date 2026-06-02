const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'gym-elite-secret-default-2026';
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
  const urlPath = (req.url || '/').split('?')[0];
  const urlParts = urlPath.split('/').filter(Boolean);
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
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length) return res.status(409).json({ error: 'Email already registered' });
      
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

  if (apiPath === 'heartbeat' && method === 'POST') {
    try {
      await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
      return res.status(200).json({ success: true });
    } catch { return res.status(500).json({ error: 'Heartbeat failed' }); }
  }

  if (apiPath === 'admin' && urlParts[2] === 'users') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const [rows] = await db.query('SELECT id, username, email, role, profile_pic, last_seen, created_at FROM users ORDER BY last_seen DESC');
      return res.status(200).json(rows);
    } catch { return res.status(500).json({ error: 'Fetch failed' }); }
  }

  if (apiPath === 'posts_social') {
    const action = req.query?.action;
    const post_id = req.query?.post_id || req.body?.post_id;
    const { comment } = req.body || {};
    
    if (action === 'like' && method === 'POST') {
      if (!post_id) return res.status(400).json({ error: 'post_id required' });
      try {
        const [existing] = await db.query('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
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

  if (apiPath === 'messages') {
    if (method === 'POST') {
      const { receiver_id, content } = req.body || {};
      if (!receiver_id || !content) return res.status(400).json({ error: 'Missing fields' });
      if (user.role !== 'admin') {
        try {
          const [receiverRows] = await db.query('SELECT role FROM users WHERE id = ?', [receiver_id]);
          const receiver = receiverRows[0];
          if (!receiver || receiver.role !== 'admin') return res.status(403).json({ error: 'Can only message admins' });
        } catch { return res.status(500).json({ error: 'DB error' }); }
      }
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
              (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread
           FROM users u WHERE u.id != ? AND (
              EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id AND receiver_id = ?) OR
              EXISTS (SELECT 1 FROM messages WHERE sender_id = ? AND receiver_id = u.id)
           ) ORDER BY last_message DESC`, [user.id, user.id, user.id, user.id, user.id, user.id]
        );
        const [unreadRows] = await db.query('SELECT COUNT(*) as total_unread FROM messages WHERE receiver_id = ? AND is_read = 0', [user.id]);
        const total_unread = unreadRows[0].total_unread;
        let availableTrainers = [];
        if (user.role !== 'admin' && conversations.length === 0) {
          [availableTrainers] = await db.query("SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 10");
        }
        return res.status(200).json({ conversations, total_unread, availableTrainers });
      } catch { return res.status(500).json({ error: 'Messages fetch failed' }); }
    }
  }

  if (apiPath === 'bookings') {
    if (method === 'POST') {
      const body = req.body || {};
      try {
        if (body.booking_id) {
          await db.query('DELETE FROM bookings WHERE id = ? AND user_id = ?', [body.booking_id, user.id]);
          return res.status(200).json({ message: 'Cancelled' });
        }
        if (body.class_id) {
          const [existing] = await db.query('SELECT 1 FROM bookings WHERE user_id = ? AND class_id = ?', [user.id, body.class_id]);
          if (existing.length) return res.status(400).json({ error: 'Already booked' });
          const [result] = await db.query('INSERT INTO bookings (user_id, class_id) VALUES (?, ?)', [user.id, body.class_id]);
          return res.status(201).json({ message: 'Booked', id: result.insertId });
        }
        return res.status(400).json({ error: 'Missing class_id' });
      } catch { return res.status(500).json({ error: 'Booking failed' }); }
    }
    if (method === 'GET') {
      try {
        const [rows] = await db.query(
          'SELECT b.id, b.status, c.name, c.time, c.location, c.instructor, c.id as class_id FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? ORDER BY c.time ASC',
          [user.id]
        );
        return res.status(200).json({ bookings: rows });
      } catch { return res.status(500).json({ error: 'Fetch failed' }); }
    }
  }

  if (apiPath === 'storage') {
    if (method === 'GET') {
      const action = req.query?.action;
      const uid = user.id;
      try {
        if (action === 'tasks') {
          const [rows] = await db.query('SELECT * FROM user_tasks WHERE user_id = ?', [uid]);
          return res.status(200).json(rows);
        }
        if (action === 'notifications') {
          const [rows] = await db.query('SELECT * FROM user_notifications WHERE user_id = ? LIMIT 50', [uid]);
          return res.status(200).json(rows);
        }
        return res.status(200).json([]);
      } catch { return res.status(500).json({ error: 'Storage error' }); }
    }
    if (method === 'POST') {
      const { action, tasks, following } = req.body || {};
      try {
        if (action === 'tasks' && tasks) {
          await db.query('DELETE FROM user_tasks WHERE user_id = ?', [user.id]);
          for (const t of tasks) {
            await db.query('INSERT INTO user_tasks (user_id, text, task_time, done) VALUES (?, ?, ?, ?)', [user.id, t.text, t.time || null, t.done ? 1 : 0]);
          }
          return res.status(200).json({ success: true });
        }
        if (action === 'follow' && following) {
          await db.query('INSERT IGNORE INTO user_following (user_id, following_id) VALUES (?, ?)', [user.id, following]);
          return res.status(200).json({ success: true });
        }
        if (action === 'unfollow' && following) {
          await db.query('DELETE FROM user_following WHERE user_id = ? AND following_id = ?', [user.id, following]);
          return res.status(200).json({ success: true });
        }
      } catch { return res.status(500).json({ error: 'Storage error' }); }
    }
  }

  if (apiPath === 'analytics' && method === 'GET') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
      const [totalRows] = await db.query("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'");
      const totalUsers = totalRows[0].totalUsers;
      const [unreadRows] = await db.query('SELECT COUNT(*) as unreadMessages FROM messages WHERE receiver_id = ? AND is_read = FALSE', [user.id]);
      const unreadMessages = unreadRows[0].unreadMessages;
      const [likeRows] = await db.query('SELECT COUNT(*) as totalLikes FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.trainer_id = ?', [user.id]);
      const totalLikes = likeRows[0].totalLikes;
      return res.status(200).json({ totalUsers, unreadMessages, totalLikes });
    } catch { return res.status(500).json({ error: 'Analytics failed' }); }
  }

  if (apiPath === 'contact' && method === 'POST') {
    const { name, email, phone, interests, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
    try {
      const [result] = await db.query('INSERT INTO client_info (name, email, phone, interests, message) VALUES (?, ?, ?, ?, ?)', [name, email, phone, interests, message]);
      return res.status(201).json({ message: 'Saved!', id: result.insertId });
    } catch { return res.status(500).json({ error: 'Contact save failed' }); }
  }

  return res.status(404).json({ error: 'Endpoint not found' });
};