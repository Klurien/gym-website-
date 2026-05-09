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

        const user = getUser(request);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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