const express = require('express');
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/activities - บันทึกกิจกรรม (นักเรียน)
router.post('/', authenticateToken, authorizeRole(['student']), async (req, res) => {
  try {
    const {
      activityName,
      activityType,
      activityDate,
      activityTime,
      location,
      description,
      imageUrl
    } = req.body;

    if (!activityName || !activityType || !activityDate || !activityTime) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' });
    }

    const result = await pool.query(
      `INSERT INTO activities (user_id, activity_name, activity_type, activity_date, 
       activity_time, location, description, image_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.userId, activityName, activityType, activityDate, activityTime, 
       location, description, imageUrl]
    );

    // สร้างการแจ้งเตือนให้นักเรียน
    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [req.user.userId, `กิจกรรม "${activityName}" ถูกส่งเรียบร้อยแล้ว รอการตรวจสอบ`, 'info']
    );

    res.status(201).json({
      message: 'บันทึกกิจกรรมสำเร็จ',
      activity: result.rows[0]
    });

  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม' });
  }
});

// GET /api/activities - ดึงกิจกรรมของนักเรียน
router.get('/', authenticateToken, authorizeRole(['student']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as reviewer_name 
       FROM activities a 
       LEFT JOIN users u ON a.reviewed_by = u.id 
       WHERE a.user_id = $1 
       ORDER BY a.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      activities: result.rows
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม' });
  }
});

// GET /api/activities/all - ดึงกิจกรรมทั้งหมด (ครู)
router.get('/all', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as student_name, u.student_id, u.class_year 
       FROM activities a 
       JOIN users u ON a.user_id = u.id 
       WHERE u.role = 'student'
       ORDER BY a.created_at DESC`
    );

    res.json({
      activities: result.rows
    });

  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม' });
  }
});

// PATCH /api/activities/:id/status - เปลี่ยนสถานะกิจกรรม (ครู)
router.patch('/:id/status', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!['อนุมัติแล้ว', 'ไม่ผ่าน'].includes(status)) {
      return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    }

    // อัปเดตสถานะกิจกรรม
    const activityResult = await pool.query(
      `UPDATE activities 
       SET status = $1, teacher_comment = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING user_id, activity_name`,
      [status, comment, req.user.userId, id]
    );

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบกิจกรรมนี้' });
    }

    const { user_id, activity_name } = activityResult.rows[0];

    // สร้างการแจ้งเตือนให้นักเรียน
    const notificationMessage = status === 'อนุมัติแล้ว' 
      ? `กิจกรรม "${activity_name}" ได้รับการอนุมัติแล้ว`
      : `กิจกรรม "${activity_name}" ไม่ผ่าน กรุณาแก้ไข`;
    
    const notificationType = status === 'อนุมัติแล้ว' ? 'success' : 'warning';

    await pool.query(
      'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
      [user_id, notificationMessage, notificationType]
    );

    res.json({ message: 'อัปเดตสถานะสำเร็จ' });

  } catch (error) {
    console.error('Update activity status error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
});

// GET /api/activities/search - ค้นหากิจกรรม (ครู)
router.get('/search', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const { activityType, classYear, studentId } = req.query;
    let query = `
      SELECT a.*, u.name as student_name, u.student_id, u.class_year 
      FROM activities a 
      JOIN users u ON a.user_id = u.id 
      WHERE u.role = 'student'
    `;
    const params = [];
    let paramCount = 0;

    if (activityType) {
      paramCount++;
      query += ` AND a.activity_type = $${paramCount}`;
      params.push(activityType);
    }

    if (classYear) {
      paramCount++;
      query += ` AND u.class_year = $${paramCount}`;
      params.push(parseInt(classYear));
    }

    if (studentId) {
      paramCount++;
      query += ` AND u.student_id ILIKE $${paramCount}`;
      params.push(`%${studentId}%`);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      activities: result.rows
    });

  } catch (error) {
    console.error('Search activities error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นหากิจกรรม' });
  }
});

module.exports = router;