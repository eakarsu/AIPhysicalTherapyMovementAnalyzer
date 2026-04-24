const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/recovery-progress
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rp.*, p.name as patient_name FROM recovery_progress rp
       LEFT JOIN patients p ON rp.patient_id = p.id ORDER BY rp.assessment_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recovery progress:', err);
    res.status(500).json({ error: 'Failed to fetch recovery progress.' });
  }
});

// GET /api/recovery-progress/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT rp.*, p.name as patient_name FROM recovery_progress rp
       LEFT JOIN patients p ON rp.patient_id = p.id WHERE rp.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recovery progress record not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching recovery progress:', err);
    res.status(500).json({ error: 'Failed to fetch recovery progress.' });
  }
});

// POST /api/recovery-progress
router.post('/', async (req, res) => {
  try {
    const { patient_id, assessment_date, pain_level, mobility_score, strength_score, overall_progress, notes, milestones } = req.body;
    const result = await pool.query(
      `INSERT INTO recovery_progress (patient_id, assessment_date, pain_level, mobility_score, strength_score, overall_progress, notes, milestones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_id, assessment_date, pain_level, mobility_score, strength_score, overall_progress, notes, milestones]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating recovery progress:', err);
    res.status(500).json({ error: 'Failed to create recovery progress.' });
  }
});

// PUT /api/recovery-progress/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, assessment_date, pain_level, mobility_score, strength_score, overall_progress, notes, milestones } = req.body;
    const result = await pool.query(
      `UPDATE recovery_progress SET patient_id=$1, assessment_date=$2, pain_level=$3, mobility_score=$4,
       strength_score=$5, overall_progress=$6, notes=$7, milestones=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [patient_id, assessment_date, pain_level, mobility_score, strength_score, overall_progress, notes, milestones, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recovery progress record not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating recovery progress:', err);
    res.status(500).json({ error: 'Failed to update recovery progress.' });
  }
});

// DELETE /api/recovery-progress/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM recovery_progress WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recovery progress record not found.' });
    }
    res.json({ message: 'Recovery progress deleted successfully.', progress: result.rows[0] });
  } catch (err) {
    console.error('Error deleting recovery progress:', err);
    res.status(500).json({ error: 'Failed to delete recovery progress.' });
  }
});

module.exports = router;
