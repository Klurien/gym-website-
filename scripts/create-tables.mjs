import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createTables() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: { rejectUnauthorized: false },
  });

  const tables = [
    `CREATE TABLE IF NOT EXISTS user_tasks (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      text VARCHAR(500) NOT NULL,
      task_time TIME DEFAULT NULL,
      done BOOLEAN DEFAULT FALSE,
      notified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_schedules (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(500) NOT NULL,
      schedule_time TIME DEFAULT NULL,
      schedule_date DATE DEFAULT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_notifications (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) DEFAULT NULL,
      text VARCHAR(1000) DEFAULT NULL,
      goal_id BIGINT DEFAULT NULL,
      read_flag BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_following (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      following_id INT NOT NULL,
      INDEX idx_user (user_id),
      UNIQUE KEY unique_follow (user_id, following_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_searches (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      query VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user (user_id)
    )`,
  ];

  for (const sql of tables) {
    try {
      await pool.query(sql);
      console.log('Created:', sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  await pool.end();
  console.log('Done!');
}

createTables();