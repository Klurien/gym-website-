const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

const fs = require('fs');

// TiDB Connection setup
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

let pool;

async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Connected to TiDB');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                profile_pic TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Safely add profile_pic if table already existed without it
        try {
            await pool.query("ALTER TABLE users ADD COLUMN profile_pic TEXT");
        } catch (e) {
            // Error code for duplicate column
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Column check:', e.message);
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS client_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                interests TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Advanced Gym Platform Tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                instructor VARCHAR(100),
                time DATETIME NOT NULL,
                capacity INT DEFAULT 30,
                location VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                class_id INT NOT NULL,
                status ENUM('booked', 'cancelled') DEFAULT 'booked',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (class_id) REFERENCES classes(id)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS workout_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                log_date DATE NOT NULL,
                duration_minutes INT,
                calories_burned INT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS memberships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                tier ENUM('basic', 'premium', 'elite') DEFAULT 'basic',
                start_date DATE NOT NULL,
                end_date DATE,
                status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Messaging System Table
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

        // Safely add is_delivered if table already existed
        try { await pool.query("ALTER TABLE messages ADD COLUMN is_delivered BOOLEAN DEFAULT FALSE"); } catch (e) {}

        // Trainer–Member Assignments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trainer_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                member_id INT NOT NULL UNIQUE,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES users(id),
                FOREIGN KEY (member_id) REFERENCES users(id)
            )
        `);

        // Posts feed
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                media_url VARCHAR(1024),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                tags VARCHAR(255),
                type VARCHAR(50) DEFAULT 'static',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES users(id)
            )
        `);

        // Posts Social interactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS post_likes (
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                PRIMARY KEY(post_id, user_id)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS post_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database schema successfully initialized.');
    } catch (err) {
        console.error('Error connecting to TiDB:', err);
    }
}

// ── Mount Vercel serverless functions as local Express routes ─────────────────
const registerHandler  = require('./api/register');
const loginHandler     = require('./api/login');
const bookingsHandler  = require('./api/bookings');
const workoutsHandler  = require('./api/workouts');
const messagesHandler  = require('./api/messages');
const analyticsHandler = require('./api/analytics');
const classesHandler   = require('./api/classes');
const contactHandler   = require('./api/contact');
const adminResponses   = require('./api/admin/responses');

// Wrap serverless handlers (they use req.method internally)
const wrap = (handler) => (req, res) => handler(req, res);

app.all('/api/register',          wrap(registerHandler));
app.all('/api/login',             wrap(loginHandler));
app.all('/api/bookings',          wrap(bookingsHandler));
app.all('/api/workouts',          wrap(workoutsHandler));
app.all('/api/messages',          wrap(messagesHandler));
app.all('/api/analytics',         wrap(analyticsHandler));
app.all('/api/classes',           wrap(classesHandler));
app.all('/api/contact',           wrap(contactHandler));
app.all('/api/admin/responses',   wrap(adminResponses));
app.all('/api/posts',             wrap(require('./api/posts')));
app.all('/api/posts_social',      wrap(require('./api/posts_social')));
app.all('/api/profile',           wrap(require('./api/profile')));
app.all('/api/upload',            wrap(require('./api/upload')));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

// ── Fallback for React SPA Routing ──
app.get('*', (req, res) => {
    // Only intercept if it's a browser navigation request, not a file
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO Logic
io.on('connection', (socket) => {
    let currentUserId = null;
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gym-secret-2026');
            currentUserId = decoded.id;
            socket.join(`user_${currentUserId}`);
            console.log(`User ${currentUserId} authenticated to sockets.`);
        } catch (err) {
            socket.disconnect();
        }
    });

    socket.on('send_message_ping', ({ receiver_id, message_id }) => {
        io.to(`user_${receiver_id}`).emit('new_message_ping', { sender_id: currentUserId, message_id });
    });
    
    socket.on('typing', ({ receiver_id }) => {
        io.to(`user_${receiver_id}`).emit('typing_status', { userId: currentUserId, isTyping: true });
    });

    socket.on('stop_typing', ({ receiver_id }) => {
        io.to(`user_${receiver_id}`).emit('typing_status', { userId: currentUserId, isTyping: false });
    });

    socket.on('message_delivered', async ({ message_id, sender_id }) => {
        try {
            await pool.query('UPDATE messages SET is_delivered = 1 WHERE id = ?', [message_id]);
            io.to(`user_${sender_id}`).emit('message_status_update', { message_id, status: 'delivered' });
        } catch (err) { console.error(err); }
    });

    socket.on('message_seen', async ({ sender_id }) => {
        try {
            await pool.query('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?', [sender_id, currentUserId]);
            io.to(`user_${sender_id}`).emit('message_status_update', { sender_id: currentUserId, status: 'seen' });
        } catch (err) { console.error(err); }
    });

    // Calling Events
    socket.on('initiate_call', ({ receiver_id, roomName, callerName }) => {
        io.to(`user_${receiver_id}`).emit('incoming_call', { fromUserId: currentUserId, fromUserName: callerName, roomName });
    });

    socket.on('reject_call', ({ caller_id }) => {
        io.to(`user_${caller_id}`).emit('call_rejected', { fromUserId: currentUserId });
    });

    socket.on('cancel_call', ({ receiver_id }) => {
        io.to(`user_${receiver_id}`).emit('call_cancelled', { fromUserId: currentUserId });
    });

    socket.on('disconnect', () => {
        if (currentUserId) console.log(`User ${currentUserId} disconnected.`);
    });
});

initDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n  ✅ COMRADES GYM SERVER RUNNING`);
        console.log(`  ➜  http://localhost:${PORT}\n`);
    });
});
