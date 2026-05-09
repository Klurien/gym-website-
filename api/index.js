import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

let pusher = null;
try {
  const Pusher = (await import('pusher')).default;
  if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY) {
    pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
} catch (e) {
  console.log('Pusher init failed');
}

let pool = null;
async function getPool() {
    if (!pool && process.env.DB_HOST) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 4000,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 1,
            connectTimeout: 25000
        });
    }
    return pool;
}

function getUser(req) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

export async function GET(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = url.searchParams;

    const db = await getPool();
    if (!db) return Response.json({ error: 'DB missing', path }, { status: 503 });

    try {
        if (path === '/api/posts' || path.endsWith('/posts')) {
            const user = getUser(request);
            const userId = user ? user.id : 0;
            const [rows] = await db.query(
                `SELECT p.*, u.username as trainer_name,
                 (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) as likes_count,
                 (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
                 EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as is_liked
                 FROM posts p 
                 LEFT JOIN users u ON p.trainer_id = u.id 
                 ORDER BY p.created_at DESC LIMIT 50`,
                [userId]
            );
            return Response.json(rows);
        }
        if (path === '/api/workouts' || path.endsWith('/workouts')) {
            const [rows] = await db.query('SELECT * FROM workouts ORDER BY created_at DESC LIMIT 50');
            return Response.json(rows);
        }
        if (path === '/api/classes' || path.endsWith('/classes')) {
            const [rows] = await db.query('SELECT * FROM classes ORDER BY day_of_week, time');
            return Response.json(rows);
        }
        if (path === '/api/storage' || path.endsWith('/storage')) {
            const user = getUser(request);
            const action = searchParams.get('action');
            const uid = user?.id || 0;
            if (action === 'tasks') {
                const [rows] = await db.query('SELECT * FROM user_tasks WHERE user_id = ?', [uid]);
                return Response.json(rows);
            }
            if (action === 'schedules') {
                const [rows] = await db.query('SELECT * FROM user_schedules WHERE user_id = ?', [uid]);
                return Response.json(rows);
            }
            if (action === 'notifications') {
                const [rows] = await db.query('SELECT * FROM user_notifications WHERE user_id = ? LIMIT 50', [uid]);
                return Response.json(rows);
            }
            if (action === 'following') {
                const [rows] = await db.query('SELECT following_id FROM user_following WHERE user_id = ?', [uid]);
                return Response.json(rows.map(r => r.following_id));
            }
        }
        if (path === '/api/analytics' || path.endsWith('/analytics')) {
            const user = getUser(request);
            if (!user || user.role !== 'admin') return Response.json({ error: 'Requires admin privileges' }, { status: 403 });
            const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'");
            const [[{ unreadMessages }]] = await db.query("SELECT COUNT(*) as unreadMessages FROM messages WHERE receiver_id = ? AND is_read = FALSE", [user.id]);
            const [[{ totalLikes }]] = await db.query("SELECT COUNT(*) as totalLikes FROM post_likes pl JOIN posts p ON pl.post_id = p.id WHERE p.trainer_id = ?", [user.id]);
            return Response.json({ totalUsers, unreadMessages, totalLikes });
        }
        if (path === '/api/messages' || path.endsWith('/messages')) {
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const action = searchParams.get('action');
            const withUser = searchParams.get('with');
            const isAdmin = user.role === 'admin';

            if (action === 'conversations' || (!withUser && !action)) {
                const query = `
                    SELECT u.id as other_id, u.username as other_name, u.role as other_role,
                        (SELECT content FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_message,
                        (SELECT created_at FROM messages WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id) ORDER BY created_at DESC LIMIT 1) as last_at,
                        (SELECT COUNT(*) FROM messages WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread
                    FROM users u WHERE u.id != ? AND (EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id AND receiver_id = ?) OR EXISTS (SELECT 1 FROM messages WHERE sender_id = ? AND receiver_id = u.id))
                    ORDER BY last_at DESC
                `;
                const qParams = [user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id];
                const [conversations] = await db.query(query, qParams);
                const [[{ total_unread }]] = await db.query('SELECT COUNT(*) as total_unread FROM messages WHERE receiver_id = ? AND is_read = 0', [user.id]);
                
                let availableTrainers = [];
                if (!isAdmin && conversations.length === 0) {
                    const [trainers] = await db.query("SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 10");
                    availableTrainers = trainers;
                }
                return Response.json({ conversations, total_unread, availableTrainers });
            }

            if (withUser) {
                const otherId = parseInt(withUser);
                const [messages] = await db.query(
                    `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_delivered, m.created_at, u.username as sender_name
                     FROM messages m JOIN users u ON m.sender_id = u.id
                     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?) ORDER BY m.created_at ASC`,
                    [user.id, otherId, otherId, user.id]
                );
                await db.query('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [otherId, user.id]);
                const [[other]] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [otherId]);
                return Response.json({ messages, other });
            }
            return Response.json({ error: 'Specify action' }, { status: 400 });
        }
        if (path === '/api/profile' || path.endsWith('/profile')) {
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const [rows] = await db.query('SELECT id, username, email, role, profile_pic, created_at FROM users WHERE id = ?', [user.id]);
            if (rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
            return Response.json({ user: rows[0] });
        }
        if (path === '/api/bookings' || path.endsWith('/bookings')) {
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const [rows] = await db.query(`SELECT b.id, b.status, c.name, c.time, c.location, c.instructor, c.id as class_id FROM bookings b JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? ORDER BY c.time ASC`, [user.id]);
            return Response.json({ bookings: rows });
        }
        if (path === '/api/admin/responses' || path.endsWith('/responses')) {
            const user = getUser(request);
            if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
            const [rows] = await db.query('SELECT * FROM client_info ORDER BY created_at DESC');
            return Response.json({ responses: rows });
        }

        return Response.json({ error: 'Not found', path }, { status: 404 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const db = await getPool();
    if (!db) return Response.json({ error: 'DB missing' }, { status: 503 });

    try {
        if (path === '/api/login' || path.endsWith('/login')) {
            const { email, password } = await request.json();
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
            const u = rows[0];
            if (!await bcrypt.compare(password, u.password)) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
            const token = jwt.sign({ id: u.id, role: u.role, username: u.username }, JWT_SECRET, { expiresIn: '1d' });
            return Response.json({ token, user: { id: u.id, username: u.username, role: u.role } });
        }

        if (path === '/api/register' || path.endsWith('/register')) {
            const { username, email, password } = await request.json();
            const hashed = await bcrypt.hash(password, 10);
            const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
            const role = rows[0].c === 0 ? 'admin' : 'user';
            await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, role]);
            return Response.json({ message: 'User registered' }, { status: 201 });
        }

        if (path === '/api/contact' || path.endsWith('/contact')) {
            const { name, email, phone, interests, message } = await request.json();
            const [result] = await db.query('INSERT INTO client_info (name, email, phone, interests, message) VALUES (?, ?, ?, ?, ?)', [name, email, phone, interests, message]);
            return Response.json({ message: 'Saved successfully!', id: result.insertId }, { status: 201 });
        }

        const user = getUser(request);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        if (path === '/api/profile' || path.endsWith('/profile')) {
            const { profile_pic } = await request.json();
            if (!profile_pic || !/^data:image\/\w+;base64,/.test(profile_pic)) return Response.json({ error: 'Invalid format' }, { status: 400 });
            await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, user.id]);
            return Response.json({ message: 'Profile picture updated successfully' });
        }

        if (path === '/api/bookings' || path.endsWith('/bookings')) {
            // Because Vercel Edge request json is standard, we read the body
            let body;
            try { body = await request.json(); } catch { body = {}; }
            
            // To handle DELETE requests sent as POST (for compatibility) or standard POST:
            if (body.booking_id) { // Usually meant to be a DELETE but sent as POST
                await db.query('DELETE FROM bookings WHERE id = ? AND user_id = ?', [body.booking_id, user.id]);
                return Response.json({ message: 'Booking cancelled' });
            }
            
            if (body.class_id) {
                const [existing] = await db.query('SELECT * FROM bookings WHERE user_id = ? AND class_id = ?', [user.id, body.class_id]);
                if (existing.length > 0) return Response.json({ error: 'Already booked' }, { status: 400 });
                const [result] = await db.query('INSERT INTO bookings (user_id, class_id) VALUES (?, ?)', [user.id, body.class_id]);
                return Response.json({ message: 'Booking successful', id: result.insertId }, { status: 201 });
            }
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (path === '/api/classes' || path.endsWith('/classes')) {
            if (user.role !== 'admin') return Response.json({ error: 'Admin privileges required' }, { status: 403 });
            const { name, instructor, time, capacity, location } = await request.json();
            if (!name || !time) return Response.json({ error: 'Missing required fields' }, { status: 400 });
            const [result] = await db.query('INSERT INTO classes (name, instructor, time, capacity, location) VALUES (?, ?, ?, ?, ?)', [name, instructor, time, capacity || 30, location]);
            return Response.json({ message: 'Class created', id: result.insertId }, { status: 201 });
        }

        if (path === '/api/workouts' || path.endsWith('/workouts')) {
            const { log_date, duration_minutes, calories_burned, notes } = await request.json();
            if (!log_date) return Response.json({ error: 'log_date missing' }, { status: 400 });
            const [result] = await db.query('INSERT INTO workout_logs (user_id, log_date, duration_minutes, calories_burned, notes) VALUES (?, ?, ?, ?, ?)', [user.id, log_date, duration_minutes || 0, calories_burned || 0, notes || '']);
            return Response.json({ message: 'Log created', id: result.insertId }, { status: 201 });
        }

        if (path === '/api/messages' || path.endsWith('/messages')) {
            const { receiver_id, content } = await request.json();
            if (!receiver_id || !content) return Response.json({ error: 'Missing fields' }, { status: 400 });
            if (user.role !== 'admin') {
                const [[receiver]] = await db.query('SELECT role FROM users WHERE id = ?', [receiver_id]);
                if (!receiver || receiver.role !== 'admin') return Response.json({ error: 'Members can only message trainers' }, { status: 403 });
            }
            const [result] = await db.query('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)', [user.id, receiver_id, content.trim()]);
            return Response.json({ message: 'Message sent', id: result.insertId }, { status: 201 });
        }

        if (path === '/api/upload' || path.endsWith('/upload')) {
            // Returning a mock success since local disk saves are wiped across serverless Vercel function instances.
            // Client should use external object bucket connections for dynamic upload, 
            // but this endpoint handles form-data quietly to not crash the modal.
            return Response.json({ error: 'Vercel static upload currently requires external storage bucket. Please use the Alternative URL input to paste a link to an image/video.' }, { status: 400 });
        }

        if (path === '/api/posts' || path.endsWith('/posts')) {
            const { title, description, media_url, tags, type } = await request.json();
            if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
            const [r] = await db.query(
                'INSERT INTO posts (trainer_id, title, description, tags, type, media_url, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [user.id, title, description || '', tags || '', type || 'static', media_url || '']
            );
            if (pusher) try { pusher.trigger('gym-posts', 'new_post', { title }); } catch (e) {}
            return Response.json({ message: 'Post created', postId: r.insertId }, { status: 201 });
        }

        if (path === '/api/posts_social' || path.endsWith('/posts_social')) {
            const { post_id, comment, action } = await request.json();
            if (action === 'like') {
                const [existing] = await db.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                if (existing.length > 0) {
                    await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                    return Response.json({ status: 'deleted' });
                }
                await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, user.id]);
                return Response.json({ status: 'added' }, { status: 201 });
            }
            if (action === 'comment') {
                await db.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, user.id, comment]);
                return Response.json({ message: 'Comment added' }, { status: 201 });
            }
        }

        if (path === '/api/storage' || path.endsWith('/storage')) {
            const { action, tasks, schedules, following, id } = await request.json();
            if (action === 'tasks' && tasks) {
                await db.query('DELETE FROM user_tasks WHERE user_id = ?', [user.id]);
                for (const t of tasks) {
                    await db.query('INSERT INTO user_tasks (user_id, text, task_time, done) VALUES (?, ?, ?, ?)',
                        [user.id, t.text, t.time || null, t.done || false]);
                }
                return Response.json({ success: true });
            }
            if (action === 'schedules' && schedules) {
                await db.query('DELETE FROM user_schedules WHERE user_id = ?', [user.id]);
                for (const s of schedules) {
                    await db.query('INSERT INTO user_schedules (user_id, title, schedule_time, schedule_date) VALUES (?, ?, ?, ?)',
                        [user.id, s.title, s.time || null, s.date || null]);
                }
                return Response.json({ success: true });
            }
            if (action === 'follow' && following) {
                await db.query('INSERT IGNORE INTO user_following (user_id, following_id) VALUES (?, ?)', [user.id, following]);
                return Response.json({ success: true });
            }
            if (action === 'unfollow' && following) {
                await db.query('DELETE FROM user_following WHERE user_id = ? AND following_id = ?', [user.id, following]);
                return Response.json({ success: true });
            }
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const db = await getPool();
    if (!db) return Response.json({ error: 'DB missing' }, { status: 503 });

    try {
        const user = getUser(request);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        if (path === '/api/messages' || path.endsWith('/messages')) {
            const { sender_id } = await request.json();
            if (!sender_id) return Response.json({ error: 'sender_id required' }, { status: 400 });
            await db.query('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0', [sender_id, user.id]);
            return Response.json({ message: 'Marked as read' }, { status: 200 });
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}