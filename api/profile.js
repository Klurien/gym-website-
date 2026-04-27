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

function isValidBase64(str) {
    if (typeof str !== 'string') return false;
    const base64Regex = /^data:image\/\w+;base64,/;
    return base64Regex.test(str);
}

module.exports = async function handler(req, res) {
    const db = getPool();
    if (!db) return res.status(500).json({ error: 'Database configuration missing' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token || typeof token !== 'string') {
        return res.status(401).json({ error: 'Missing token' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'POST') {
        const { profile_pic } = req.body;
        if (!profile_pic) return res.status(400).json({ error: 'No profile picture provided' });
        
        if (!isValidBase64(profile_pic)) {
            return res.status(400).json({ error: 'Invalid profile picture format' });
        }

        try {
            await db.query('UPDATE users SET profile_pic = ? WHERE id = ?', [profile_pic, decoded.id]);
            res.status(200).json({ message: 'Profile picture updated successfully' });
        } catch (err) {
            console.error('Error updating profile pic:', err);
            res.status(500).json({ error: 'Database error' });
        }
    } else if (req.method === 'GET') {
        try {
            const [rows] = await db.query('SELECT id, username, email, role, profile_pic, created_at FROM users WHERE id = ?', [decoded.id]);
            if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
            res.status(200).json({ user: rows[0] });
        } catch (err) {
            res.status(500).json({ error: 'Database error' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
