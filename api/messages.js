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

export async function GET(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        const [rows] = await db.query(
            `SELECT m.*, 
             CASE WHEN m.sender_id = ? THEN 'sent' ELSE 'received' END as direction
             FROM messages m 
             WHERE m.sender_id = ? OR m.receiver_id = ? 
             ORDER BY m.created_at DESC LIMIT 100`,
            [userId || 0, userId || 0, userId || 0]
        );
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const { sender_id, receiver_id, message } = await request.json();
        if (!sender_id || !receiver_id || !message) {
            return Response.json({ error: 'Missing fields' }, { status: 400 });
        }

        await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())',
            [sender_id, receiver_id, message]
        );
        return Response.json({ message: 'Message sent' }, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
