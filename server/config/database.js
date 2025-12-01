const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pg_pilot_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create the connection pool
const pool = mysql.createPool(config);

// Utility functions
const database = {
  /**
   * Execute a SQL query with parameters
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} - [rows, fields]
   */
  async query(sql, params) {
    try {
      const result = await pool.query(sql, params);
      return result; // Return [rows, fields] directly
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  },

  async getConnection() {
    return await pool.getConnection();
  },

  async testConnection() {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Successfully connected to MySQL database');
      connection.release();
      return true;
    } catch (error) {
      console.error('❌ Error connecting to MySQL:', error.message);
      throw error;
    }
  },

  async close() {
    await pool.end();
    console.log('MySQL connection pool closed');
  }
};

module.exports = database;

