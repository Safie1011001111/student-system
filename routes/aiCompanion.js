const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/ai-companion/chat - บันทึกการสนทนากับ AI
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { prompt, response } = req.body;

    if (!prompt || !response) {
      return res.status(400).json({ error: 'กรุณาระบุคำถามและคำตอบ' });
    }

    await pool.query(
      'INSERT INTO ai_companion_logs (user_id, prompt, response) VALUES ($1, $2, $3)',
      [req.user.userId, prompt, response]
    );

    res.status(201).json({ message: 'บันทึกการสนทนาสำเร็จ' });

  } catch (error) {
    console.error('AI companion log error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกการสนทนา' });
  }
});

// GET /api/ai-companion/logs - ดึงประวัติการสนทนา (ครู)
router.get('/logs', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as student_name, u.student_id 
       FROM ai_companion_logs a 
       JOIN users u ON a.user_id = u.id 
       ORDER BY a.created_at DESC 
       LIMIT 50`
    );

    res.json({
      logs: result.rows
    });

  } catch (error) {
    console.error('Get AI companion logs error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงประวัติการสนทนา' });
  }
});

module.exports = router;