const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const schema = [
  `CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sets INT DEFAULT 3,
    reps VARCHAR(20) DEFAULT '10',
    rest_seconds INT DEFAULT 60,
    order_index INT DEFAULT 0,
    video_url VARCHAR(500) DEFAULT '',
    image_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('trainee', 'trainer', 'admin') DEFAULT 'trainee',
    profile_pic LONGTEXT,
    level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    premium BOOLEAN DEFAULT FALSE,
    last_seen DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    level_sort INT DEFAULT 1,
    duration VARCHAR(50),
    sessions INT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    image VARCHAR(500),
    trainer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(50),
    amount DECIMAL(10,2) DEFAULT 0,
    program_id INT,
    checkout_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL
  )`,
  `INSERT IGNORE INTO programs (title, description, level, level_sort, duration, sessions, price, image) VALUES
    ('Foundation Strength', 'Build your core foundation with compound movements. Perfect for first-timers getting started.', 'beginner', 1, '4 weeks', 12, 0, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'),
    ('Bodyweight Mastery', 'Master pushups, pullups, and bodyweight fundamentals anywhere, anytime.', 'beginner', 2, '6 weeks', 18, 0, 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop'),
    ('Hypertrophy Accelerator', 'Progressive overload programming designed for lean muscle growth.', 'intermediate', 3, '8 weeks', 24, 29, 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=800&auto=format&fit=crop'),
    ('Power & Explosiveness', 'Olympic lifts and plyometrics for explosive athletic performance.', 'intermediate', 4, '6 weeks', 18, 39, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop'),
    ('Elite Performance', 'Advanced periodization for experienced lifters chasing peak results.', 'advanced', 5, '12 weeks', 36, 79, 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop'),
    ('Certified Coach Program', 'Become a certified trainer under expert mentorship and guidance.', 'advanced', 6, '16 weeks', 48, 149, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop')
  `
];

async function init() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Connected. Running schema...');
  for (const sql of schema) {
    try { await connection.query(sql); console.log('OK:', sql.substring(0, 50) + '...'); }
    catch (e) { console.log('Skip:', e.message.substring(0, 50)); }
  }
  console.log('Database initialized.');
  await connection.end();
}
init().catch(e => { console.error('Init failed:', e); process.exit(1); });
