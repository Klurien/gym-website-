const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    }
};

module.exports = async (req, res) => {
    // Basic CORS for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).end();
    
    // Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym-secret-2026');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Requires Admin privileges' });
        }

        const pool = mysql.createPool(dbConfig);
        const [rows] = await pool.query('SELECT * FROM client_info ORDER BY created_at DESC');
        
        res.status(200).json({ responses: rows });
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Authentication failed', details: err.message });
    }
};
