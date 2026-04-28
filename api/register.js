import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

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

export async function POST(request) {
    try {
        const db = getPool();
        if (!db) {
            return Response.json({ error: 'Database configuration missing' }, { status: 500 });
        }

        const { username, email, password } = await request.json();
        if (!username || !email || !password) {
            return Response.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json({ error: 'Invalid email' }, { status: 400 });
        }

        if (password.length < 6) {
            return Response.json({ error: 'Password too short' }, { status: 400 });
        }

        const hashed = await bcrypt.hash(password, 10);
        const [rows] = await db.query('SELECT COUNT(*) as c FROM users');
        const role = rows[0].c === 0 ? 'admin' : 'user';

        await db.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashed, role]);

        return Response.json({ message: 'User registered' }, { status: 201 });
    } catch (err) {
        console.error(err);
        return Response.json({ error: 'Registration failed' }, { status: 500 });
    }
}
