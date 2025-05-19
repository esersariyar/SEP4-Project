import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Remote SQL server configuration
const DB_HOST = process.env.DB_HOST || '77.37.35.74';
const DB_USER = process.env.DB_USER || 'u127812886_greenhouse';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Viagreenhouse123';
const DB_NAME = process.env.DB_NAME || 'u127812886_greenhouse';
const DB_PORT = Number(process.env.DB_PORT) || 3306;

// Create a connection pool to MySQL
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  ssl: {
    rejectUnauthorized: false
  },
  // Denmark timezone
  timezone: 'Europe/Copenhagen'
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log(`[${new Date().toISOString()}] ✅ Database connection successful: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    connection.release();
  })
  .catch(err => {
    console.error(`[${new Date().toISOString()}] ❌ Database connection error:`, err);
  });

export default pool;
