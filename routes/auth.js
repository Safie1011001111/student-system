const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { studentId, parentPhone } = req.body;

    if (!studentId || !parentPhone) {
      return res.status(400).json({ 
        error: 'กรุณากรอกรหัสนักเรียนและเบอร์โทรผู้ปกครอง' 
      });
    }

    // ตรวจสอบข้อมูลในฐานข้อมูล
    const result = await pool.query(
      'SELECT id, student_id, role, name, class_year FROM users WHERE student_id = $1 AND parent_phone = $2',
      [studentId, parentPhone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'รหัสนักเรียนหรือเบอร์โทรผู้ปกครองไม่ถูกต้อง' 
      });
    }

    const user = result.rows[0];

    // สร้าง JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        studentId: user.student_id, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        studentId: user.student_id,
        role: user.role,
        name: user.name,
        classYear: user.class_year
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

module.exports = router;