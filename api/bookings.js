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
            `SELECT b.*, c.name as class_name, c.instructor, c.day_of_week, c.time
             FROM bookings b
             LEFT JOIN classes c ON b.class_id = c.id
             WHERE b.user_id = ? OR ? IS NULL
             ORDER BY b.created_at DESC LIMIT 50`,
            [userId || 0, userId || 0]
        );
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const { user_id, class_id } = await request.json();
        if (!user_id || !class_id) return Response.json({ error: 'Missing fields' }, { status: 400 });

        await db.query(
            'INSERT INTO bookings (user_id, class_id, created_at) VALUES (?, ?, NOW())',
            [user_id, class_id]
        );
        return Response.json({ message: 'Booking created' }, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
