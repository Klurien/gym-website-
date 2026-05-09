const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET must be set'); })();

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

module.exports = async function handler(req, res) {
    const db = getPool();
    if (!db) {
        return res.status(500).json({ error: 'Database configuration missing' });
    }

    const { method, query: { userId }, body } = req;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token || typeof token !== 'string') {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    try {
        if (method === 'GET') {
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
            return res.status(200).json(rows);
            
        } else if (method === 'POST') {
            // Allow any authenticated user to create a post

            const { media_url, title, description, tags, type } = body;
            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }

            const postType = type || 'static';
            const postTags = tags || '';
            const postDesc = description || '';

            const [result] = await db.query(
                `INSERT INTO posts (trainer_id, media_url, title, description, tags, type, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [decodedToken.id, media_url, title, postDesc, postTags, postType]
            );

            return res.status(201).json({ message: 'Post created successfully', postId: result.insertId });
            
        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('Error handling posts request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
