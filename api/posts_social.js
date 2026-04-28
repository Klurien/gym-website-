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
    if (!db) {
        return Response.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    try {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');
        const body = action ? null : await request.json().catch(() => null);

        if (action === 'like' && request.method === 'POST') {
            const { post_id } = await request.json();
            if (!post_id) return Response.json({ error: 'post_id required' }, { status: 400 });

            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split(' ')[1];
            const jwt = await import('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
            let user;
            if (token) { try { user = jwt.verify(token, JWT_SECRET); } catch {} }

            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

            const [existing] = await db.query('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
            if (existing.length > 0) {
                await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post_id, user.id]);
                return Response.json({ status: 'deleted' });
            } else {
                await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post_id, user.id]);
                return Response.json({ status: 'added' });
            }
        }

        if (action === 'comments' && request.method === 'GET') {
            const postId = url.searchParams.get('post_id');
            if (!postId) return Response.json({ error: 'post_id required' }, { status: 400 });

            const [comments] = await db.query(
                'SELECT c.*, u.username FROM post_comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC',
                [postId]
            );
            return Response.json(comments);
        }

        if (action === 'comment' && request.method === 'POST') {
            const { post_id, comment } = await request.json();
            if (!post_id || !comment) return Response.json({ error: 'post_id and comment required' }, { status: 400 });

            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split(' ')[1];
            const jwt = await import('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
            let user;
            if (token) { try { user = jwt.verify(token, JWT_SECRET); } catch {} }

            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

            await db.query('INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, user.id, comment]);
            return Response.json({ message: 'Comment added' }, { status: 201 });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in posts_social:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    return GET(request);
}
