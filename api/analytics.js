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
        
        // Count users
        const [[{ total_users }]] = await pool.query("SELECT COUNT(*) as total_users FROM users WHERE role = 'user'");
        
        // Count inquiries
        const [[{ total_inquiries }]] = await pool.query('SELECT COUNT(*) as total_inquiries FROM client_info');
        
        // Count total bookings
        const [[{ total_bookings }]] = await pool.query("SELECT COUNT(*) as total_bookings FROM bookings WHERE status = 'booked'");

        // Get recent log activity
        const [recent_logs] = await pool.query(`
            SELECT wl.log_date, wl.duration_minutes, wl.calories_burned, u.username
            FROM workout_logs wl
            JOIN users u ON wl.user_id = u.id
            ORDER BY wl.log_date DESC
            LIMIT 10
        `);

        return res.status(200).json({ 
            stats: { total_users, total_inquiries, total_bookings },
            recentLogs: recent_logs
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error', details: err.message });
    }
};
