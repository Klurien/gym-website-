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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            const [rows] = await pool.query('SELECT * FROM classes ORDER BY time ASC');
            return res.status(200).json({ classes: rows });
        } else if (req.method === 'POST') {
            if (decoded.role !== 'admin') {
                return res.status(403).json({ error: 'Admin privileges required' });
            }
            const { name, instructor, time, capacity, location } = req.body;
            if (!name || !time) return res.status(400).json({ error: 'Missing required fields' });

            const [result] = await pool.query(
                'INSERT INTO classes (name, instructor, time, capacity, location) VALUES (?, ?, ?, ?, ?)',
                [name, instructor, time, capacity || 30, location]
            );
            return res.status(201).json({ message: 'Class created', id: result.insertId });
        } else {
            return res.status(405).end();
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error', details: err.message });
    }
};
