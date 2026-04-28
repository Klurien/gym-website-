const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

let pool;
function getPool() {
    if (!pool && process.env.DB_HOST) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 4000,
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 10
        });
    }
    return pool;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end();
    
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Efficient Security Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short (min 6 chars)' });

    try {
        const db = getPool();
        if (!db) return res.status(500).json({ error: 'Database configuration missing' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        const role = users[0].count === 0 ? 'admin' : 'user';

        await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
};
