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
  console.log('Pusher not configured');
}

let pool;
function getPool() {
    if (!pool && process.env.DB_HOST) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 4000,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 10
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
    const search = url.search;
    const searchParams = url.searchParams;

    if (path === '/api/health' || path === '/health') {
        return Response.json({ status: 'ok', path, search });
    }

    const db = getPool();
    if (!db) return Response.json({ error: 'Database config missing', path, search }, { status: 500 });

    try {
        console.log('GET path:', path, 'search:', search);
        
        if (path === '/api/posts' || path === '/posts' || path.endsWith('/posts')) {
            const user = getUser(request);
            const [rows] = await db.query(
                `SELECT p.*, u.username as trainer_name,
                 (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) as likes_count,
                 (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
                 EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as is_liked
                 FROM posts p LEFT JOIN users u ON p.trainer_id = u.id ORDER BY p.created_at DESC LIMIT 50`,
                [user?.id || 0]
            );
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

        if (path === '/api/analytics' || path === '/analytics' || path.endsWith('/analytics')) {
            const user = getUser(request);
            if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
            const [stats] = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM bookings WHERE WEEK(booking_date) = WEEK(NOW())) as weekly_bookings,
                    (SELECT COUNT(*) FROM posts) as total_posts,
                    (SELECT COUNT(*) FROM classes) as total_classes
            `);
            return Response.json(stats[0]);
        }

        if (path === '/api/messages' || path === '/messages' || path.endsWith('/messages')) {
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const [rows] = await db.query(
                user.role === 'admin' 
                ? 'SELECT m.*, u.username FROM messages m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC LIMIT 50'
                : 'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                user.role !== 'admin' ? [user.id] : []
            );
            return Response.json(rows);
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const db = getPool();
    if (!db) return Response.json({ error: 'Database config missing' }, { status: 500 });

    try {
        if (path === '/api/pusher-auth' || path.endsWith('/pusher-auth')) {
            if (!pusher) return Response.json({ error: 'Pusher not configured' }, { status: 503 });
            const user = getUser(request);
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const auth = pusher.authenticate(request.headers.get('socket_id'), {
                user_id: String(user.id),
                user_info: { username: user.username, role: user.role },
            });
            return Response.json(auth);
        }

        if (path === '/api/pusher-trigger' || path.endsWith('/pusher-trigger')) {
            if (!pusher) return Response.json({ error: 'Pusher not configured' }, { status: 503 });
            const { channel, event, data } = await request.json();
            if (!channel || !event || !data) return Response.json({ error: 'Missing params' }, { status: 400 });
            try {
                pusher.trigger(channel, event, data);
                return Response.json({ success: true });
            } catch (e) {
                return Response.json({ error: 'Trigger failed' }, { status: 500 });
            }
        }

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

        if (path === '/api/posts' || path.endsWith('/posts')) {
            if (user.role !== 'admin' && user.role !== 'trainer') return Response.json({ error: 'Forbidden' }, { status: 403 });
            const { media_url, title, description, tags, type } = await request.json();
            if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
            const [r] = await db.query('INSERT INTO posts (trainer_id, media_url, title, description, tags, type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [user.id, media_url || '', title, description || '', tags || '', type || 'static']);
            if (pusher) {
                pusher.trigger('gym-posts', 'new_post', { title, id: r.insertId });
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

        if (path === '/api/workouts' || path.endsWith('/workouts')) {
            if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
            const { title, description, video_url, duration, difficulty } = await request.json();
            if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
            await db.query('INSERT INTO workouts (title, description, video_url, duration, difficulty, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [title, description || '', video_url || '', duration || 0, difficulty || 'beginner']);
            return Response.json({ message: 'Workout added' }, { status: 201 });
        }

        if (path === '/api/classes' || path === '/classes' || path.endsWith('/classes')) {
            if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
            const { name, instructor, day_of_week, time, duration, capacity } = await request.json();
            if (!name) return Response.json({ error: 'Name required' }, { status: 400 });
            await db.query('INSERT INTO classes (name, instructor, day_of_week, time, duration, capacity) VALUES (?, ?, ?, ?, ?, ?)',
                [name, instructor || '', day_of_week || '', time || '', duration || 60, capacity || 20]);
            return Response.json({ message: 'Class added' }, { status: 201 });
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
            if (!userId || !title || !message) return Response.json({ error: 'Missing params' }, { status: 400 });
            if (!pusher) return Response.json({ error: 'Pusher not configured' }, { status: 503 });
            try {
                pusher.trigger(`private-user-${userId}`, 'notification', { title, message });
                return Response.json({ success: true });
            } catch (e) {
                return Response.json({ error: 'Push failed' }, { status: 500 });
            }
        }

        if (path === '/api/storage' || path.endsWith('/storage')) {
            const action = searchParams.get('action');
            if (action === 'tasks') {
                const [rows] = await db.query('SELECT * FROM user_tasks WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
                return Response.json(rows);
            }
            if (action === 'schedules') {
                const [rows] = await db.query('SELECT * FROM user_schedules WHERE user_id = ? ORDER BY date ASC', [user.id]);
                return Response.json(rows);
            }
            if (action === 'notifications') {
                const [rows] = await db.query('SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [user.id]);
                return Response.json(rows);
            }
            if (action === 'following') {
                const [rows] = await db.query('SELECT following_id FROM user_following WHERE user_id = ?', [user.id]);
                return Response.json(rows.map(r => r.following_id));
            }
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}
