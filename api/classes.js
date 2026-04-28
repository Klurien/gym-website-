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
        const [rows] = await db.query('SELECT * FROM classes ORDER BY day_of_week, time');
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}

export async function POST(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const { name, instructor, day_of_week, time, duration, capacity } = await request.json();
        if (!name) return Response.json({ error: 'Name required' }, { status: 400 });

        await db.query(
            'INSERT INTO classes (name, instructor, day_of_week, time, duration, capacity) VALUES (?, ?, ?, ?, ?, ?)',
            [name, instructor || '', day_of_week || '', time || '', duration || 60, capacity || 20]
        );
        return Response.json({ message: 'Class added' }, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to add class' }, { status: 500 });
    }
}
