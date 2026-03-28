const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// TiDB Connection setup
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
        rejectUnauthorized: true
    }
};

let pool;

async function initDB() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Connected to TiDB');
        
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
    } catch (err) {
        console.error('Error connecting to TiDB:', err);
    }
}

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, interests, message } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO client_info (name, email, phone, interests, message) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, interests, message]
        );
        res.status(201).json({ message: 'Information saved successfully!', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save information' });
    }
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
