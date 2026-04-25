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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header provided' });

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym-secret-2026');
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        const pool = mysql.createPool(dbConfig);
        
        if (req.method === 'GET') {
            const [rows] = await pool.query(
                `SELECT b.id, b.status, c.name, c.time, c.location, c.instructor, c.id as class_id 
                 FROM bookings b 
                 JOIN classes c ON b.class_id = c.id 
                 WHERE b.user_id = ? ORDER BY c.time ASC`,
                [decoded.userId]
            );
            return res.status(200).json({ bookings: rows });
        } else if (req.method === 'POST') {
            const { class_id } = req.body;
            if (!class_id) return res.status(400).json({ error: 'class_id missing' });

            // Ensure not already booked
            const [existing] = await pool.query('SELECT * FROM bookings WHERE user_id = ? AND class_id = ?', [decoded.userId, class_id]);
            if (existing.length > 0) return res.status(400).json({ error: 'Already booked' });

            const [result] = await pool.query(
                'INSERT INTO bookings (user_id, class_id) VALUES (?, ?)',
                [decoded.userId, class_id]
            );
            return res.status(201).json({ message: 'Booking successful', id: result.insertId });
        } else if (req.method === 'DELETE') {
            const { booking_id } = req.body;
            if (!booking_id) return res.status(400).json({ error: 'booking_id missing' });
            await pool.query('DELETE FROM bookings WHERE id = ? AND user_id = ?', [booking_id, decoded.userId]);
            return res.status(200).json({ message: 'Booking cancelled' });
        } else {
            return res.status(405).end();
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error', details: err.message });
    }
};
