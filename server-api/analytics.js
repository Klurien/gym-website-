const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_CA_PATH ? true : false,
        ca: process.env.DB_CA_PATH ? fs.readFileSync(process.env.DB_CA_PATH) : undefined
    }
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header provided' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym-secret-2026');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Requires admin privileges' });
        }
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        const pool = mysql.createPool(dbConfig);
        
        // Count users (excluding self)
        const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'");
        
        // Count unread messages for this coach
        const [[{ unreadMessages }]] = await pool.query("SELECT COUNT(*) as unreadMessages FROM messages WHERE receiver_id = ? AND is_read = FALSE", [decoded.id]);
        
        // Count total social likes on trainer's posts
        const [[{ totalLikes }]] = await pool.query(`
            SELECT COUNT(*) as totalLikes 
            FROM post_likes pl
            JOIN posts p ON pl.post_id = p.id
            WHERE p.trainer_id = ?
        `, [decoded.id]);

        return res.status(200).json({ 
            totalUsers,
            unreadMessages,
            totalLikes
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error', details: err.message });
    }
};
