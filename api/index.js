import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const INCLUDE_STACK = process.env.NODE_ENV !== 'production';

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
  console.log('DB config:', { host: process.env.DB_HOST, user: process.env.DB_USER, db: process.env.DB_NAME, port: process.env.DB_PORT });
}

let pool = null;
async function getPool() {
    if (!pool && process.env.DB_HOST) {
        try {
            pool = mysql.createPool({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 4000,
                ssl: { rejectUnauthorized: false },
                waitForConnections: true,
                connectionLimit: 1,
                connectTimeout: 20000,
                acquireTimeout: 20000
            });
            const conn = await pool.getConnection();
            conn.release();
} catch (e) {
    console.log('DB config:', { host: !!process.env.DB_HOST, hasUser: !!process.env.DB_USER });
}
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

    console.log('GET start, path:', path);

    const db = await getPool();
    console.log('GET db:', !!db);
    
    if (!db) {
        return Response.json({ error: 'Database connection failed', path }, { status: 503 });
    }

    try {
        if (path === '/api/posts' || path === '/posts' || path.endsWith('/posts')) {
            const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50');
            return Response.json(rows);
        }

        if (path === '/api/workouts' || path === '/workouts' || path.endsWith('/workouts')) {
            const [rows] = await db.query('SELECT * FROM workouts ORDER BY created_at DESC LIMIT 50');
            return Response.json(rows);
        }

        if (path === '/api/classes' || path === '/classes' || path.endsWith('/classes')) {
            const [rows] = await db.query('SELECT * FROM classes ORDER BY day_of_week, time');
            return Response.json(rows);
        }

        if (path === '/api/bookings' || path === '/bookings' || path.endsWith('/bookings')) {
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const [rows] = await db.query(
                user.role === 'admin' ? 'SELECT b.*, u.username, c.name as class_name FROM bookings b LEFT JOIN users u ON b.user_id = u.id LEFT JOIN classes c ON b.class_id = c.id ORDER BY b.booking_date DESC'
                : 'SELECT b.*, c.name as class_name FROM bookings b LEFT JOIN classes c ON b.class_id = c.id WHERE b.user_id = ? ORDER BY b.booking_date DESC',
                user.role !== 'admin' ? [user.id] : []
            );
            return Response.json(rows);
        }

        if (path === '/api/messages' || path === '/messages' || path.endsWith('/messages')) {
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const [rows] = await db.query(
                user.role === 'admin' ? 'SELECT m.*, u.username FROM messages m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC LIMIT 50'
                : 'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                user.role !== 'admin' ? [user.id] : []
            );
            return Response.json(rows);
        }

        if (path === '/api/storage' || path.endsWith('/storage')) {
            const user = getUser(request);
            const action = searchParams.get('action');
            const uid = user?.id || 0;
            
            if (action === 'tasks') {
                const [rows] = await db.query('SELECT * FROM user_tasks WHERE user_id = ? ORDER BY created_at DESC', [uid]);
                return Response.json(rows);
            }
            if (action === 'schedules') {
                const [rows] = await db.query('SELECT * FROM user_schedules WHERE user_id = ? ORDER BY schedule_date ASC', [uid]);
                return Response.json(rows);
            }
            if (action === 'notifications') {
                const [rows] = await db.query('SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [uid]);
                return Response.json(rows);
            }
            if (action === 'following') {
                const [rows] = await db.query('SELECT following_id FROM user_following WHERE user_id = ?', [uid]);
                return Response.json(rows.map(r => r.following_id));
            }
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = url.searchParams;

    const db = await getPool();
    if (!db) {
        return Response.json({ error: 'Database connection failed' }, { status: 503 });
    }

    try {
        if (path === '/api/login' || path === '/login' || path.endsWith('/login')) {
            const { email, password } = await request.json();
            if (!email || !password) return Response.json({ error: 'Missing fields' }, { status: 400 });
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
            const u = rows[0];
            if (!await bcrypt.compare(password, u.password)) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
            const token = jwt.sign({ id: u.id, role: u.role, username: u.username, profile_pic: u.profile_pic }, JWT_SECRET, { expiresIn: '1d' });
            return Response.json({ token, user: { id: u.id, username: u.username, role: u.role, profile_pic: u.profile_pic } });
        }

        if (path === '/api/register' || path.endsWith('/register')) {
            const { username, email, password } = await request.json();
            if (!username || !email || !password) return Response.json({ error: 'Missing fields' }, { status: 400 });
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'Invalid email' }, { status: 400 });
            if (password.length < 6) return Response.json({ error: 'Password too short' }, { status: 400 });
            const hashed = await bcrypt.hash(password, 10);
            const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
            const role = rows[0].c === 0 ? 'admin' : 'user';
            await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, role]);
            return Response.json({ message: 'User registered' }, { status: 201 });
        }

        const user = getUser(request);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        if (path === '/api/posts' || path === '/posts' || path.endsWith('/posts')) {
            const { media_url, title, description, tags, type } = await request.json();
            if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
            const [r] = await db.query(
                'INSERT INTO posts (trainer_id, media_url, title, description, tags, type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [user.id, media_url || '', title, description || '', tags || '', type || 'static']
            );
            if (pusher) {
                try { pusher.trigger('gym-posts', 'new_post', { title, id: r.insertId }); } catch (e) {}
            }
            return Response.json({ message: 'Post created', postId: r.insertId }, { status: 201 });
        }

        if (path === '/api/posts_social' || path.endsWith('/posts_social')) {
            const { post_id, comment, action } = await request.json();
            if (action === 'like') {
                if (!post_id) return Response.json({ error: 'post_id required' }, { status: 400 });
                const [existing] = await db.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                if (existing.length > 0) {
                    await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                    return Response.json({ status: 'deleted' });
                } else {
                    await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, user.id]);
                    return Response.json({ status: 'added' }, { status: 201 });
                }
            }
            if (action === 'comment') {
                if (!post_id || !comment) return Response.json({ error: 'post_id and comment required' }, { status: 400 });
                await db.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, user.id, comment]);
                return Response.json({ message: 'Comment added' }, { status: 201 });
            }
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (path === '/api/profile' || path.endsWith('/profile')) {
            const { username, profile_pic } = await request.json();
            await db.query('UPDATE users SET username = ?, profile_pic = ? WHERE id = ?', [username || '', profile_pic || '', user.id]);
            return Response.json({ message: 'Profile updated' });
        }

        if (path === '/api/bookings' || path === '/bookings' || path.endsWith('/bookings')) {
            const { class_id, booking_date } = await request.json();
            if (!class_id || !booking_date) return Response.json({ error: 'class_id and booking_date required' }, { status: 400 });
            await db.query('INSERT INTO bookings (user_id, class_id, booking_date, status) VALUES (?, ?, ?, "confirmed")',
                [user.id, class_id, booking_date]);
            return Response.json({ message: 'Booked' }, { status: 201 });
        }

        if (path === '/api/contact' || path.endsWith('/contact')) {
            const { name, email, message } = await request.json();
            if (!name || !email || !message) return Response.json({ error: 'All fields required' }, { status: 400 });
            await db.query('INSERT INTO messages (user_id, name, email, message) VALUES (?, ?, ?, ?)',
                [user?.id || null, name, email, message]);
            return Response.json({ message: 'Message sent' }, { status: 201 });
        }

        if (path === '/api/push-notify' || path.endsWith('/push-notify')) {
            const { userId, title, message } = await request.json();
            if (pusher && userId && title && message) {
                try { pusher.trigger(`private-user-${userId}`, 'notification', { title, message }); } catch (e) {}
            }
            return Response.json({ success: true });
        }

        if (path === '/api/storage' || path.endsWith('/storage')) {
            const { action, tasks, schedules, following, searches, id } = await request.json();
            
            if (action === 'tasks' && tasks) {
                await db.query('DELETE FROM user_tasks WHERE user_id = ?', [user.id]);
                for (const task of tasks) {
                    await db.query(
                        'INSERT INTO user_tasks (user_id, text, task_time, done, notified) VALUES (?, ?, ?, ?, ?)',
                        [user.id, task.text, task.time || null, task.done || false, task.notified || false]
                    );
                }
                return Response.json({ success: true });
            }
            
            if (action === 'schedules' && schedules) {
                await db.query('DELETE FROM user_schedules WHERE user_id = ?', [user.id]);
                for (const s of schedules) {
                    await db.query(
                        'INSERT INTO user_schedules (user_id, title, schedule_time, schedule_date, completed) VALUES (?, ?, ?, ?, ?)',
                        [user.id, s.title, s.time || null, s.date || null, s.completed || false]
                    );
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
            
            if (action === 'mark_read' && id) {
                await db.query('UPDATE user_notifications SET read_flag = TRUE WHERE id = ? AND user_id = ?', [id, user.id]);
                return Response.json({ success: true });
            }
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}