import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

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

export async function GET(request) {
    const db = getPool();
    if (!db) {
        return Response.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return Response.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return Response.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    try {
        const [rows] = await db.query(
            `SELECT p.*, u.username as trainer_name,
             (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM post_comments c WHERE c.post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM post_likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as is_liked
             FROM posts p
             LEFT JOIN users u ON p.trainer_id = u.id
             ORDER BY p.created_at DESC LIMIT 50`,
            [decodedToken.id]
        );
        return Response.json(rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    const db = getPool();
    if (!db) {
        return Response.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return Response.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return Response.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    if (decodedToken.role !== 'admin' && decodedToken.role !== 'trainer') {
        return Response.json({ error: 'Forbidden: Only trainers/admins can post.' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { media_url, title, description, tags, type } = body;

        if (!title) {
            return Response.json({ error: 'Title is required' }, { status: 400 });
        }

        const postType = type || 'static';
        const postTags = tags || '';
        const postDesc = description || '';

        const [result] = await db.query(
            `INSERT INTO posts (trainer_id, media_url, title, description, tags, type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [decodedToken.id, media_url, title, postDesc, postTags, postType]
        );

        return Response.json({ message: 'Post created successfully', postId: result.insertId }, { status: 201 });
    } catch (error) {
        console.error('Error creating post:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
