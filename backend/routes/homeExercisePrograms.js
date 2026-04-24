const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/home-exercise-programs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT hep.*, p.name as patient_name FROM home_exercise_programs hep
       LEFT JOIN patients p ON hep.patient_id = p.id ORDER BY hep.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching home exercise programs:', err);
    res.status(500).json({ error: 'Failed to fetch home exercise programs.' });
  }
});

// GET /api/home-exercise-programs/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT hep.*, p.name as patient_name FROM home_exercise_programs hep
       LEFT JOIN patients p ON hep.patient_id = p.id WHERE hep.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Home exercise program not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching home exercise program:', err);
    res.status(500).json({ error: 'Failed to fetch home exercise program.' });
  }
});

// POST /api/home-exercise-programs
router.post('/', async (req, res) => {
  try {
    const { patient_id, program_name, exercises, compliance_rate, start_date, end_date, frequency, status, ai_recommendations } = req.body;
    const result = await pool.query(
      `INSERT INTO home_exercise_programs (patient_id, program_name, exercises, compliance_rate, start_date, end_date, frequency, status, ai_recommendations)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, program_name, JSON.stringify(exercises), compliance_rate, start_date, end_date, frequency, status || 'active', ai_recommendations]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating home exercise program:', err);
    res.status(500).json({ error: 'Failed to create home exercise program.' });
  }
});

// PUT /api/home-exercise-programs/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, program_name, exercises, compliance_rate, start_date, end_date, frequency, status, ai_recommendations } = req.body;
    const result = await pool.query(
      `UPDATE home_exercise_programs SET patient_id=$1, program_name=$2, exercises=$3, compliance_rate=$4,
       start_date=$5, end_date=$6, frequency=$7, status=$8, ai_recommendations=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_id, program_name, JSON.stringify(exercises), compliance_rate, start_date, end_date, frequency, status, ai_recommendations, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Home exercise program not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating home exercise program:', err);
    res.status(500).json({ error: 'Failed to update home exercise program.' });
  }
});

// DELETE /api/home-exercise-programs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM home_exercise_programs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Home exercise program not found.' });
    }
    res.json({ message: 'Home exercise program deleted successfully.', program: result.rows[0] });
  } catch (err) {
    console.error('Error deleting home exercise program:', err);
    res.status(500).json({ error: 'Failed to delete home exercise program.' });
  }
});

module.exports = router;
