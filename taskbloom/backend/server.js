// =============================================
// TaskBloom Backend — server.js
// Express + MongoDB (MERN)
// =============================================

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
require('dotenv').config();

const taskRoutes = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskbloom';

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// Serve frontend statically in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// ---- Routes ----
app.use('/api/tasks', taskRoutes);

// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ---- Connect to MongoDB ----
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🌸 TaskBloom server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
