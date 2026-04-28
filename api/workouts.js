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
        const [rows] = await db.query('SELECT * FROM workouts ORDER BY created_at DESC LIMIT 50');
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch workouts' }, { status: 500 });
    }
}

export async function POST(request) {
    const db = getPool();
    if (!db) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    try {
        const { title, description, video_url, duration, difficulty } = await request.json();
        if (!title) return Response.json({ error: 'Title required' }, { status: 400 });

        await db.query(
            'INSERT INTO workouts (title, description, video_url, duration, difficulty, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [title, description || '', video_url || '', duration || 0, difficulty || 'beginner']
        );
        return Response.json({ message: 'Workout added' }, { status: 201 });
    } catch (error) {
        return Response.json({ error: 'Failed to add workout' }, { status: 500 });
    }
}
