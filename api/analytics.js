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
        const range = url.searchParams.get('range') || '30days';

        let dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        if (range === '7days') dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        if (range === '90days') dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';

        const [rows] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM bookings 
             WHERE ${dateCondition}
             GROUP BY DATE(created_at) 
             ORDER BY date`,
        );
        return Response.json(rows);
    } catch (error) {
        return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
