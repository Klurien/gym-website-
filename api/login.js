const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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
    if (req.method !== 'POST') return res.status(405).end();
    
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const pool = mysql.createPool(dbConfig);
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, profile_pic: user.profile_pic },
            process.env.JWT_SECRET || 'gym-secret-2026',
            { expiresIn: '1d' }
        );

        res.status(200).json({ 
            token, 
            user: { id: user.id, username: user.username, role: user.role, profile_pic: user.profile_pic } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
};
