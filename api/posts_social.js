const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gym-secret-2026';

let pool;

module.exports = async function handler(req, res) {
    if (!pool && process.env.DB_HOST) {
        const dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 4000,
            ssl: { rejectUnauthorized: false }
        };
        pool = mysql.createPool(dbConfig);
    }
    
    if (!pool) return res.status(500).json({ error: 'DB config missing' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym-secret-2026');
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { action } = req.query;

    if (req.method === 'POST') {
        const { post_id } = req.body;
        if (!post_id) return res.status(400).json({ error: 'post_id required' });

        if (action === 'like') {
            try {
                // Toggle like (if exists delete, else insert)
                const [existing] = await pool.query('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, decoded.id]);
                if (existing.length > 0) {
                    await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, decoded.id]);
                    return res.status(200).json({ message: 'Unliked', status: 'deleted' });
                } else {
                    await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, decoded.id]);
                    return res.status(201).json({ message: 'Liked', status: 'added' });
                }
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Like operation failed' });
            }
        } 
        
        if (action === 'comment') {
            const { comment } = req.body;
            if (!comment) return res.status(400).json({ error: 'Comment text required' });
            try {
                await pool.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, decoded.id, comment]);
                return res.status(201).json({ message: 'Comment added' });
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Comment operation failed' });
            }
        }
    } else if (req.method === 'GET') {
        if (action === 'comments') {
            const { post_id } = req.query;
            if (!post_id) return res.status(400).json({ error: 'post_id required' });
            try {
                const [rows] = await pool.query('SELECT c.comment, c.created_at, u.username, u.profile_pic FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC', [post_id]);
                return res.status(200).json(rows);
            } catch (err) {
                console.error(err);
                return res.status(500).json({ error: 'Comment fetch failed' });
            }
        }
    }

    res.status(400).json({ error: 'Invalid action or method' });
};
