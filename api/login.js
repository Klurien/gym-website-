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

        const { email, password } = await request.json();
        if (!email || !password) {
            return Response.json({ error: 'Missing fields' }, { status: 400 });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username, profile_pic: user.profile_pic },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return Response.json({
            token,
            user: { id: user.id, username: user.username, role: user.role, profile_pic: user.profile_pic }
        });
    } catch (err) {
        console.error(err);
        return Response.json({ error: 'Login failed', details: err.message }, { status: 500 });
    }
}
