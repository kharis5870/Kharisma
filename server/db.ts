import mysql from 'mysql2/promise';
import 'dotenv/config';

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'kharisma_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;