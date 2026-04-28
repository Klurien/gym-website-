import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { put } from '@vercel/blob';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

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

function getPathname(request) {
    return new URL(request.url).pathname;
}

export async function GET(request) {
    const pathname = getPathname(request);
    const url = new URL(request.url);
    const db = getPool();

    try {
        if (pathname === '/api/posts') {
            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split(' ')[1];
            if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const decoded = jwt.verify(token, JWT_SECRET);
            const [rows] = await db.query(
                `SELECT p.*, u.username as trainer_name,
                 (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) as likes_count,
                 (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
                 EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as is_liked
                 FROM posts p LEFT JOIN users u ON p.trainer_id = u.id
                 ORDER BY p.created_at DESC LIMIT 50`,
                [decoded.id]
            );
            return Response.json(rows);
        }

        if (pathname === '/api/posts_social') {
            const action = url.searchParams.get('action');
            if (action === 'comments') {
                const postId = url.searchParams.get('post_id');
                const [comments] = await db.query(
                    'SELECT c.*, u.username FROM post_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC',
                    [postId]
                );
                return Response.json(comments);
            }
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e) {
        console.error('GET error:', e);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(request) {
    const pathname = getPathname(request);
    const url = new URL(request.url);
    const db = getPool();

    try {
        if (pathname === '/api/login') {
            const { email, password } = await request.json();
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0 || !await bcrypt.compare(password, rows[0].password)) {
                return Response.json({ error: 'Invalid credentials' }, { status: 401 });
            }
            const user = rows[0];
            const token = jwt.sign({ id: user.id, role: user.role, username: user.username, profile_pic: user.profile_pic }, JWT_SECRET, { expiresIn: '1d' });
            return Response.json({ token, user: { id: user.id, username: user.username, role: user.role, profile_pic: user.profile_pic } });
        }

        if (pathname === '/api/register') {
            const { username, email, password } = await request.json();
            const hashed = await bcrypt.hash(password, 10);
            const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
            const role = rows[0].c === 0 ? 'admin' : 'user';
            await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashed, role]);
            return Response.json({ message: 'Registered' }, { status: 201 });
        }

        if (pathname === '/api/posts') {
            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split(' ')[1];
            if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role !== 'admin' && decoded.role !== 'trainer') {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
            }
            const { title, media_url, description, tags, type } = await request.json();
            const [result] = await db.query(
                'INSERT INTO posts (trainer_id, media_url, title, description, tags, type, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [decoded.id, media_url || '', title, description || '', tags || '', type || 'static']
            );
            return Response.json({ message: 'Post created', postId: result.insertId }, { status: 201 });
        }

        if (pathname === '/api/posts_social') {
            const action = url.searchParams.get('action');
            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            if (action === 'like') {
                const { post_id } = await request.json();
                const [existing] = await db.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, decoded.id]);
                if (existing.length > 0) {
                    await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, decoded.id]);
                    return Response.json({ status: 'deleted' });
                } else {
                    await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, decoded.id]);
                    return Response.json({ status: 'added' });
                }
            }

            if (action === 'comment') {
                const { post_id, comment } = await request.json();
                await db.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, decoded.id, comment]);
                return Response.json({ message: 'Comment added' }, { status: 201 });
            }
        }

        if (pathname === '/api/upload') {
            const formData = await request.formData();
            const file = formData.get('file');
            const blob = await put(`${Date.now()}-${file.name}`, file, { access: 'public' });
            return Response.json({ url: blob.url });
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e) {
        console.error('POST error:', e);
        return Response.json({ error: 'Internal error' }, { status: 500 });
    }
}
