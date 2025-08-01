const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const aiCompanionRoutes = require('./routes/aiCompanion');
const s3UploadRoutes = require('./routes/s3Upload');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? ['https://frontend-alpha-sand-90.vercel.app/']
//     : ['http://localhost:3000'],
//   credentials: true
// }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai-companion', aiCompanionRoutes);
app.use('/api/s3', s3UploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Student Activity System API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'ไม่พบเส้นทางที่ร้องขอ' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}/api/health`);
});

module.exports = app;