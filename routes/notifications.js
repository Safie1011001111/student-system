const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/notifications - ดึงการแจ้งเตือน
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.user.userId]
    );

    res.json({
      notifications: result.rows
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือน' });
  }
});

// POST /api/notifications - ส่งการแจ้งเตือน (ครู)
router.post('/', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { userId, message, type = 'info' } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'กรุณาระบุผู้รับและข้อความ' });
    }

    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [userId, message, type]
    );

    res.status(201).json({ message: 'ส่งการแจ้งเตือนสำเร็จ' });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน' });
  }
});

// PATCH /api/notifications/:id/read - ทำเครื่องหมายอ่านแล้ว
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    res.json({ message: 'ทำเครื่องหมายอ่านแล้วสำเร็จ' });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการทำเครื่องหมาย' });
  }
});

module.exports = router;