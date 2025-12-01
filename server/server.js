const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const database = require('./config/database');
const routes = require('./routes/routes');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Test database connection on startup
database.testConnection()
  .then(() => console.log('Database connection verified'))
  .catch(err => {
    console.error('Failed to connect to database:', err);
    // Don't exit in development, just log the error
  });

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

// Basic route
app.get('/', (req, res) => {
  res.send('PG Pilot Project Server is running');
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await database.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

