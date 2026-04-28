import mysql from 'mysql2/promise';
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

export async function GET(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET);

        const [rows] = await db.query('SELECT id, username, email, role, profile_pic FROM users WHERE id = ?', [decoded.id]);
        if (rows.length === 0) return Response.json({ error: 'User not found' }, { status: 404 });

        return Response.json(rows[0]);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = jwt.verify(token, JWT_SECRET);
        const { username, profile_pic } = await request.json();

        await db.query('UPDATE users SET username = ?, profile_pic = ? WHERE id = ?',
            [username || '', profile_pic || '', decoded.id]);

        return Response.json({ message: 'Profile updated' });
    } catch (error) {
        return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
