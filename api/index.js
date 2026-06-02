// CommonJS format for Vercel Node.js Serverless runtime
// Using legacy 'mysql' driver to avoid 'iconv-lite' resolution errors on Vercel
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const util = require('util');

const JWT_SECRET = process.env.JWT_SECRET || 'gym-elite-secret-default-2026';

let pool = null;
function getPool() {
    if (!pool && process.env.DB_HOST) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '4000'),
            ssl: { rejectUnauthorized: false },
            connectionLimit: 1,
            connectTimeout: 25000
        });
        // Promisify the pool query method
        pool.queryP = util.promisify(pool.query).bind(pool);
    }
    return pool;
}

function getUser(req) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function getBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try { return JSON.parse(req.body); } catch { return {}; }
    }
    return req.body;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = req.url || '/';
    const [pathWithApi, searchRaw] = url.split('?');
    const path = pathWithApi;
    const searchParams = new URLSearchParams(searchRaw || '');

    const db = getPool();

    try {
        // ============================
        // GET ROUTES
        // ============================
        if (req.method === 'GET') {
            if (!db) return res.status(503).json({ error: 'DB not configured' });

            if (path.endsWith('/health')) {
                return res.status(200).json({ status: 'ok', using_old_mysql: true });
            }

            if (path.endsWith('/posts')) {
                const user = getUser(req);
                const userId = user ? user.id : 0;
                const rows = await db.queryP(
                    `SELECT p.*, u.username as trainer_name,
                     (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) as likes_count,
                     (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
                     EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as is_liked
                     FROM posts p LEFT JOIN users u ON p.trainer_id = u.id
                     ORDER BY p.created_at DESC LIMIT 50`,
                    [userId]
                );
                return res.status(200).json(rows);
            }

            if (path.endsWith('/workouts')) {
                const rows = await db.queryP('SELECT * FROM workouts ORDER BY created_at DESC LIMIT 50');
                return res.status(200).json(rows);
            }

            if (path.endsWith('/classes')) {
                const rows = await db.queryP('SELECT * FROM classes ORDER BY day_of_week, time');
                return res.status(200).json(rows);
            }

            if (path.endsWith('/profile')) {
                const user = getUser(req);
                if (!user) return res.status(401).json({ error: 'Unauthorized' });
                const rows = await db.queryP('SELECT id, username, email, role, profile_pic, created_at FROM users WHERE id = ?', [user.id]);
                return rows.length ? res.status(200).json({ user: rows[0] }) : res.status(404).json({ error: 'Not found' });
            }

            if (path.endsWith('/bookings')) {
                const user = getUser(req);
                if (!user) return res.status(401).json({ error: 'Unauthorized' });
                const rows = await db.queryP(
                    `SELECT b.id, b.status, c.name, c.time, c.location, c.instructor, c.id as class_id
                     FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? ORDER BY c.time ASC`,
                    [user.id]
                );
                return res.status(200).json({ bookings: rows });
            }

            if (path.endsWith('/analytics')) {
                const user = getUser(req);
                if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
                const totalUsersRows = await db.queryP("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'");
                const totalUsers = totalUsersRows[0].totalUsers;
                const unreadMessagesRows = await db.queryP('SELECT COUNT(*) as unreadMessages FROM messages WHERE receiver_id = ? AND is_read = FALSE', [user.id]);
                const unreadMessages = unreadMessagesRows[0].unreadMessages;
                const totalLikesRows = await db.queryP('SELECT COUNT(*) as totalLikes FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.trainer_id = ?', [user.id]);
                const totalLikes = totalLikesRows[0].totalLikes;
                return res.status(200).json({ totalUsers, unreadMessages, totalLikes });
            }

            if (path.endsWith('/messages')) {
                const user = getUser(req);
                if (!user) return res.status(401).json({ error: 'Unauthorized' });
                const withUser = searchParams.get('with');

                if (withUser) {
                    const otherId = parseInt(withUser);
                    const messages = await db.queryP(
                        `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at, u.username as sender_name
                         FROM messages m JOIN users u ON m.sender_id = u.id
                         WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
                         ORDER BY m.created_at ASC`,
                        [user.id, otherId, otherId, user.id]
                    );
                    await db.queryP('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [otherId, user.id]);
                    const otherRows = await db.queryP('SELECT id, username, role FROM users WHERE id = ?', [otherId]);
                    const other = otherRows[0];
                    return res.status(200).json({ messages, other });
                }

                const query = `
                    SELECT u.id as other_id, u.username as other_name, u.role as other_role,
                        (SELECT content FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
                        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread
                    FROM users u WHERE u.id != ? AND (
                        EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id AND receiver_id = ?) OR
                        EXISTS (SELECT 1 FROM messages WHERE sender_id = ? AND receiver_id = u.id)
                    ) ORDER BY last_message DESC`;
                const conversations = await db.queryP(query, [user.id, user.id, user.id, user.id, user.id, user.id]);
                const unreadTotalRows = await db.queryP('SELECT COUNT(*) as total_unread FROM messages WHERE receiver_id = ? AND is_read = 0', [user.id]);
                const total_unread = unreadTotalRows[0].total_unread;
                let availableTrainers = [];
                if (user.role !== 'admin' && conversations.length === 0) {
                    availableTrainers = await db.queryP("SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 10");
                }
                return res.status(200).json({ conversations, total_unread, availableTrainers });
            }

            if (path.endsWith('/storage')) {
                const user = getUser(req);
                const action = searchParams.get('action');
                const uid = user ? user.id : 0;
                if (action === 'tasks') {
                    const rows = await db.queryP('SELECT * FROM user_tasks WHERE user_id = ?', [uid]);
                    return res.status(200).json(rows);
                }
                if (action === 'notifications') {
                    const rows = await db.queryP('SELECT * FROM user_notifications WHERE user_id = ? LIMIT 50', [uid]);
                    return res.status(200).json(rows);
                }
                return res.status(200).json([]);
            }

            if (path.endsWith('/responses')) {
                const user = getUser(req);
                if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
                const rows = await db.queryP('SELECT * FROM client_info ORDER BY created_at DESC');
                return res.status(200).json({ responses: rows });
            }

            if (path.endsWith('/admin/users')) {
                const user = getUser(req);
                if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
                const rows = await db.queryP('SELECT id, username, email, role, profile_pic, last_seen, created_at FROM users ORDER BY last_seen DESC, created_at DESC');
                return res.status(200).json(rows);
            }

            return res.status(404).json({ error: 'API endpoint not found', path });
        }

        // ============================
        // POST ROUTES
        // ============================
        if (req.method === 'POST') {
            if (!db) return res.status(503).json({ error: 'DB not configured' });
            const body = getBody(req);

            if (path.endsWith('/login')) {
                const { email, password } = body;
                if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
                const rows = await db.queryP('SELECT * FROM users WHERE email = ?', [email]);
                if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
                const u = rows[0];
                const match = await bcrypt.compare(password, u.password);
                if (!match) return res.status(401).json({ error: 'Invalid credentials' });
                const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic }, JWT_SECRET, { expiresIn: '1d' });
                return res.status(200).json({ token, user: { id: u.id, username: u.username, role: u.role, profile_pic: u.profile_pic } });
            }

            if (path.endsWith('/register')) {
                const { username, email, password } = body;
                if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
                if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
                const hashed = await bcrypt.hash(password, 10);
                const existing = await db.queryP('SELECT id FROM users WHERE email = ?', [email]);
                if (existing.length) return res.status(409).json({ error: 'Email already registered' });
                const countRows = await db.queryP('SELECT COUNT(*) as c FROM users');
                const role = countRows[0].c === 0 ? 'admin' : 'user';
                await db.queryP('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, role]);
                return res.status(201).json({ message: 'Account created' });
            }

            if (path.endsWith('/contact')) {
                const { name, email, phone, interests, message } = body;
                const result = await db.queryP('INSERT INTO client_info (name, email, phone, interests, message) VALUES (?, ?, ?, ?, ?)', [name, email, phone, interests, message]);
                return res.status(201).json({ message: 'Saved!', id: result.insertId });
            }

            // Protected routes from this point
            const user = getUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            if (path.endsWith('/profile')) {
                const { profile_pic } = body;
                if (!profile_pic) return res.status(400).json({ error: 'No image provided' });
                await db.queryP('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, user.id]);
                return res.status(200).json({ message: 'Profile updated' });
            }

            if (path.endsWith('/posts')) {
                const { title, description, media_url, tags, type } = body;
                if (!title) return res.status(400).json({ error: 'Title required' });
                const r = await db.queryP(
                    'INSERT INTO posts (trainer_id, title, description, tags, type, media_url, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [user.id, title, description || '', tags || '', type || 'static', media_url || '']
                );
                return res.status(201).json({ message: 'Post created', postId: r.insertId });
            }

            if (path.endsWith('/posts_social')) {
                const action = searchParams.get('action');
                const { post_id, comment } = body;
                if (action === 'like') {
                    const existing = await db.queryP('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                    if (existing.length) {
                        await db.queryP('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                        return res.status(200).json({ status: 'deleted' });
                    }
                    await db.queryP('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, user.id]);
                    return res.status(201).json({ status: 'added' });
                }
                if (action === 'comment' && post_id && comment) {
                    await db.queryP('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, user.id, comment]);
                    return res.status(201).json({ message: 'Comment added' });
                }
                return res.status(400).json({ error: 'Invalid action' });
            }

            if (path.endsWith('/messages')) {
                const { receiver_id, content } = body;
                if (!receiver_id || !content) return res.status(400).json({ error: 'Missing fields' });
                if (user.role !== 'admin') {
                    const receiverRows = await db.queryP('SELECT role FROM users WHERE id = ?', [receiver_id]);
                    const receiver = receiverRows[0];
                    if (!receiver || receiver.role !== 'admin') return res.status(403).json({ error: 'Can only message admins' });
                }
                const result = await db.queryP('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [user.id, receiver_id, content.trim()]);
                return res.status(201).json({ message: 'Sent', id: result.insertId });
            }

            if (path.endsWith('/bookings')) {
                if (body.booking_id) {
                    await db.queryP('DELETE FROM bookings WHERE id = ? AND user_id = ?', [body.booking_id, user.id]);
                    return res.status(200).json({ message: 'Cancelled' });
                }
                if (body.class_id) {
                    const existing = await db.queryP('SELECT id FROM bookings WHERE user_id = ? AND class_id = ?', [user.id, body.class_id]);
                    if (existing.length) return res.status(400).json({ error: 'Already booked' });
                    const result = await db.queryP('INSERT INTO bookings (user_id, class_id) VALUES (?, ?)', [user.id, body.class_id]);
                    return res.status(201).json({ message: 'Booked', id: result.insertId });
                }
                return res.status(400).json({ error: 'Missing class_id' });
            }

            if (path.endsWith('/storage')) {
                const { action, tasks, schedules, following } = body;
                if (action === 'tasks' && tasks) {
                    await db.queryP('DELETE FROM user_tasks WHERE user_id = ?', [user.id]);
                    for (const t of tasks) {
                        await db.queryP('INSERT INTO user_tasks (user_id, text, task_time, done) VALUES (?, ?, ?, ?)', [user.id, t.text, t.time || null, t.done ? 1 : 0]);
                    }
                    return res.status(200).json({ success: true });
                }
                if (action === 'follow' && following) {
                    await db.queryP('INSERT IGNORE INTO user_following (user_id, following_id) VALUES (?, ?)', [user.id, following]);
                    return res.status(200).json({ success: true });
                }
                if (action === 'unfollow' && following) {
                    await db.queryP('DELETE FROM user_following WHERE user_id = ? AND following_id = ?', [user.id, following]);
                    return res.status(200).json({ success: true });
                }
            }

            if (path.endsWith('/heartbeat')) {
                const user = getUser(req);
                if (!user) return res.status(401).json({ error: 'Unauthorized' });
                await db.queryP('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);
                return res.status(200).json({ success: true });
            }

            return res.status(404).json({ error: 'Not found', path });
        }

        // ============================
        // PATCH ROUTES
        // ============================
        if (req.method === 'PATCH') {
            if (!db) return res.status(503).json({ error: 'DB not configured' });
            const user = getUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            const body = getBody(req);

            if (path.endsWith('/messages')) {
                const { sender_id } = body;
                if (!sender_id) return res.status(400).json({ error: 'sender_id required' });
                await db.queryP('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [sender_id, user.id]);
                return res.status(200).json({ message: 'Marked as read' });
            }

            return res.status(404).json({ error: 'Not found' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
};
