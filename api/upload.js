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

export async function POST(request) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        jwt.verify(token, JWT_SECRET);
    } catch {
        return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}-${file.name}`;
        const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';

        const fs = await import('fs');
        const path = await import('path');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);

        const url = `${process.env.BASE_URL || ''}/uploads/${filename}`;
        return Response.json({ url });
    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ error: 'Upload failed' }, { status: 500 });
    }
}
