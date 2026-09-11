require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const knex = require('knex');
const knexConfig = require('../knexfile');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const trackingRoutes = require('./routes/tracking');
const activityRoutes = require('./routes/activity');
const dashboardRoutes = require('./routes/dashboard');
const apiKeysRoutes = require('./routes/apiKeys');
const publicTrackingRoutes = require('./routes/publicTracking');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Database Setup ---
const env = process.env.NODE_ENV || 'development';
const dbConfig = knexConfig[env] || knexConfig.development;
const db = knex(dbConfig);

// Enable foreign keys for SQLite only
if (db.client.config.client === 'sqlite3') {
  db.raw('PRAGMA foreign_keys = ON').then(() => {
    console.log('✓ SQLite foreign keys enabled');
  }).catch((err) => {
    console.warn('Could not enable foreign keys:', err.message);
  });
} else {
  console.log('✓ Database client: PostgreSQL (Supabase)');
}

// Make db accessible to routes via req.app.get('db')
app.set('db', db);

// --- Middleware ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/keys', apiKeysRoutes);
app.use('/api/v1/track', publicTrackingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Error Handler ---
app.use(errorHandler);

// --- Start Server ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✓ PartTrack API running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
