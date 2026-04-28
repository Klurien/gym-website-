import mysql from 'mysql2/promise';

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
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const { name, email, message } = await request.json();
        if (!name || !email || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await db.query(
            'INSERT INTO contacts (name, email, message, created_at) VALUES (?, ?, ?, NOW())',
            [name, email, message]
        );
        return Response.json({ message: 'Message sent successfully' }, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
