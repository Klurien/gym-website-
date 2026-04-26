const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.DB_CA_PATH ? true : false,
        ca: process.env.DB_CA_PATH ? fs.readFileSync(process.env.DB_CA_PATH) : undefined
    }
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Auth
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym-secret-2026');
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const pool = mysql.createPool(dbConfig);
    const userId = decoded.id; // Corrected from decoded.userId
    const isAdmin = decoded.role === 'admin';

    // Ensure table exists (idempotent)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT NOT NULL,
            receiver_id INT NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            is_delivered BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
    `);

    try {
        // ── GET ─────────────────────────────────────────────────────────────────
        if (req.method === 'GET') {
            // Parse query string manually for Vercel compatibility
            const urlParts = (req.url || '').split('?');
            const params = new URLSearchParams(urlParts[1] || '');
            const action = params.get('action');
            const withUser = params.get('with');

            // GET ?action=conversations — list all conversation threads
            if (action === 'conversations' || (!withUser && !action)) {
                let query, qParams;

                if (isAdmin) {
                    query = `
                        SELECT 
                            u.id as other_id,
                            u.username as other_name,
                            u.role as other_role,
                            ( SELECT content FROM messages 
                              WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
                              ORDER BY created_at DESC LIMIT 1 ) as last_message,
                            ( SELECT created_at FROM messages 
                              WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
                              ORDER BY created_at DESC LIMIT 1 ) as last_at,
                            ( SELECT COUNT(*) FROM messages 
                              WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0 ) as unread
                        FROM users u
                        WHERE u.id != ? AND (
                            EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id AND receiver_id = ?)
                            OR EXISTS (SELECT 1 FROM messages WHERE sender_id = ? AND receiver_id = u.id)
                        )
                        ORDER BY last_at DESC
                    `;
                    qParams = [userId, userId, userId, userId, userId, userId, userId, userId];
                } else {
                    query = `
                        SELECT 
                            u.id as other_id,
                            u.username as other_name,
                            u.role as other_role,
                            ( SELECT content FROM messages 
                              WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
                              ORDER BY created_at DESC LIMIT 1 ) as last_message,
                            ( SELECT created_at FROM messages 
                              WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
                              ORDER BY created_at DESC LIMIT 1 ) as last_at,
                            ( SELECT COUNT(*) FROM messages 
                              WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0 ) as unread
                        FROM users u
                        WHERE u.id != ? AND (
                            EXISTS (SELECT 1 FROM messages WHERE sender_id = ? AND receiver_id = u.id)
                            OR EXISTS (SELECT 1 FROM messages WHERE sender_id = u.id AND receiver_id = ?)
                        )
                        ORDER BY last_at DESC
                    `;
                    qParams = [userId, userId, userId, userId, userId, userId, userId, userId];
                }

                const [conversations] = await pool.query(query, qParams);
                const [[{ total_unread }]] = await pool.query(
                    'SELECT COUNT(*) as total_unread FROM messages WHERE receiver_id = ? AND is_read = 0',
                    [userId]
                );

                // If member has no conversations yet, show available trainers
                let availableTrainers = [];
                if (!isAdmin && conversations.length === 0) {
                    const [trainers] = await pool.query(
                        "SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 10"
                    );
                    availableTrainers = trainers;
                }

                return res.status(200).json({ conversations, total_unread, availableTrainers });
            }

            // GET ?with=<userId> — fetch thread between current user and another
            if (withUser) {
                const otherId = parseInt(withUser);
                if (isNaN(otherId)) return res.status(400).json({ error: 'Invalid user id' });

                const [messages] = await pool.query(
                    `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.is_delivered, m.created_at,
                            u.username as sender_name
                     FROM messages m
                     JOIN users u ON m.sender_id = u.id
                     WHERE (m.sender_id = ? AND m.receiver_id = ?)
                        OR (m.sender_id = ? AND m.receiver_id = ?)
                     ORDER BY m.created_at ASC`,
                    [userId, otherId, otherId, userId]
                );

                // Mark messages from them as read
                await pool.query(
                    'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
                    [otherId, userId]
                );

                const [[other]] = await pool.query(
                    'SELECT id, username, role FROM users WHERE id = ?',
                    [otherId]
                );

                return res.status(200).json({ messages, other });
            }

            return res.status(400).json({ error: 'Specify ?action=conversations or ?with=userId' });
        }

        // ── POST — send a message ─────────────────────────────────────────────
        if (req.method === 'POST') {
            const { receiver_id, content } = req.body;
            if (!receiver_id || !content?.trim()) {
                return res.status(400).json({ error: 'receiver_id and content are required' });
            }

            // Members can only message admins
            if (!isAdmin) {
                const [[receiver]] = await pool.query('SELECT role FROM users WHERE id = ?', [receiver_id]);
                if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
                if (receiver.role !== 'admin') {
                    return res.status(403).json({ error: 'Members can only message trainers' });
                }
            }

            const [result] = await pool.query(
                'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
                [userId, receiver_id, content.trim()]
            );

            return res.status(201).json({ message: 'Message sent', id: result.insertId });
        }

        // ── PATCH — mark messages as read ─────────────────────────────────────
        if (req.method === 'PATCH') {
            const { sender_id } = req.body;
            if (!sender_id) return res.status(400).json({ error: 'sender_id required' });

            await pool.query(
                'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
                [sender_id, userId]
            );

            return res.status(200).json({ message: 'Marked as read' });
        }

        return res.status(405).end();

    } catch (err) {
        console.error('Messages API error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
    }
};
