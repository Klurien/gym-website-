const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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
    
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const pool = mysql.createPool(dbConfig);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Default first user to admin, others to user (simple logic for now)
        const [users] = await pool.query('SELECT id FROM users LIMIT 1');
        const role = users.length === 0 ? 'admin' : 'user';

        await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
};
