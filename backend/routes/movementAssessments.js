const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/movement-assessments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ma.*, p.name as patient_name, e.name as exercise_name
       FROM movement_assessments ma
       LEFT JOIN patients p ON ma.patient_id = p.id
       LEFT JOIN exercises e ON ma.exercise_id = e.id
       ORDER BY ma.assessment_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching movement assessments:', err);
    res.status(500).json({ error: 'Failed to fetch movement assessments.' });
  }
});

// GET /api/movement-assessments/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ma.*, p.name as patient_name, e.name as exercise_name
       FROM movement_assessments ma
       LEFT JOIN patients p ON ma.patient_id = p.id
       LEFT JOIN exercises e ON ma.exercise_id = e.id
       WHERE ma.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement assessment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching movement assessment:', err);
    res.status(500).json({ error: 'Failed to fetch movement assessment.' });
  }
});

// POST /api/movement-assessments
router.post('/', async (req, res) => {
  try {
    const { patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url } = req.body;
    const result = await pool.query(
      `INSERT INTO movement_assessments (patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, exercise_id, assessment_date, form_score, ai_feedback, JSON.stringify(joint_angles), movement_quality, recommendations, video_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating movement assessment:', err);
    res.status(500).json({ error: 'Failed to create movement assessment.' });
  }
});

// PUT /api/movement-assessments/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url } = req.body;
    const result = await pool.query(
      `UPDATE movement_assessments SET patient_id=$1, exercise_id=$2, assessment_date=$3, form_score=$4,
       ai_feedback=$5, joint_angles=$6, movement_quality=$7, recommendations=$8, video_url=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_id, exercise_id, assessment_date, form_score, ai_feedback, JSON.stringify(joint_angles), movement_quality, recommendations, video_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement assessment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating movement assessment:', err);
    res.status(500).json({ error: 'Failed to update movement assessment.' });
  }
});

// DELETE /api/movement-assessments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM movement_assessments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement assessment not found.' });
    }
    res.json({ message: 'Movement assessment deleted successfully.', assessment: result.rows[0] });
  } catch (err) {
    console.error('Error deleting movement assessment:', err);
    res.status(500).json({ error: 'Failed to delete movement assessment.' });
  }
});

module.exports = router;
