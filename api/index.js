import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export async function GET(request) {
    const path = new URL(request.url).pathname;
    console.log('GET start, path:', path, 'DB_HOST:', !!process.env.DB_HOST);
    
    if (path === '/api/health') {
        return Response.json({ ok: true, DB_HOST: !!process.env.DB_HOST });
    }
    
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 4000,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 1,
            connectTimeout: 25000
        });
        
        console.log('Pool created');
        
        const [rows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50');
        console.log('Posts:', rows.length);
        
        await pool.end();
        return Response.json(rows);
    } catch (err) {
        console.error('Error:', err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const path = new URL(request.url).pathname;
    
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 4000,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 1,
            connectTimeout: 25000
        });
        
        const user = (() => {
            const authHeader = request.headers.get('Authorization');
            const token = authHeader?.split(' ')[1];
            if (!token) return null;
            try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
        })();
        
        if (!user) {
            await pool.end();
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (path === '/api/posts' || path === '/login' || path === '/register') {
            const body = await request.json();
            
            if (path === '/api/login') {
                const { email, password } = body;
                const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
                if (rows.length === 0) {
                    await pool.end();
                    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
                }
                const u = rows[0];
                if (!await bcrypt.compare(password, u.password)) {
                    await pool.end();
                    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
                }
                const token = jwt.sign({ id: u.id, role: u.role, username: u.username }, JWT_SECRET, { expiresIn: '1d' });
                await pool.end();
                return Response.json({ token, user: { id: u.id, username: u.username, role: u.role } });
            }
            
            if (path === '/api/register') {
                const { username, email, password } = body;
                if (!username || !email || !password) {
                    await pool.end();
                    return Response.json({ error: 'Missing fields' }, { status: 400 });
                }
                const hashed = await bcrypt.hash(password, 10);
                await pool.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                    [username, email, hashed, 'user']);
                await pool.end();
                return Response.json({ message: 'User registered' }, { status: 201 });
            }
            
            if (path === '/api/posts') {
                const { title } = body;
                if (!title) {
                    await pool.end();
                    return Response.json({ error: 'Title required' }, { status: 400 });
                }
                const [r] = await pool.query(
                    'INSERT INTO posts (trainer_id, title, created_at) VALUES (?, ?, NOW())',
                    [user.id, title]
                );
                await pool.end();
                return Response.json({ message: 'Post created', postId: r.insertId }, { status: 201 });
            }
        }
        
        await pool.end();
        return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
        console.error('POST Error:', err.message);
        return Response.json({ error: err.message }, { status: 500 });
    }
}