const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/treatment-notes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tn.*, p.name as patient_name FROM treatment_notes tn
       LEFT JOIN patients p ON tn.patient_id = p.id ORDER BY tn.note_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching treatment notes:', err);
    res.status(500).json({ error: 'Failed to fetch treatment notes.' });
  }
});

// GET /api/treatment-notes/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT tn.*, p.name as patient_name FROM treatment_notes tn
       LEFT JOIN patients p ON tn.patient_id = p.id WHERE tn.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment note not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching treatment note:', err);
    res.status(500).json({ error: 'Failed to fetch treatment note.' });
  }
});

// POST /api/treatment-notes
router.post('/', async (req, res) => {
  try {
    const { patient_id, therapist_name, note_date, subjective, objective, assessment, plan, treatment_provided, patient_response, next_visit_goals } = req.body;
    const result = await pool.query(
      `INSERT INTO treatment_notes (patient_id, therapist_name, note_date, subjective, objective, assessment, plan, treatment_provided, patient_response, next_visit_goals)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [patient_id, therapist_name, note_date, subjective, objective, assessment, plan, treatment_provided, patient_response, next_visit_goals]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating treatment note:', err);
    res.status(500).json({ error: 'Failed to create treatment note.' });
  }
});

// PUT /api/treatment-notes/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, therapist_name, note_date, subjective, objective, assessment, plan, treatment_provided, patient_response, next_visit_goals } = req.body;
    const result = await pool.query(
      `UPDATE treatment_notes SET patient_id=$1, therapist_name=$2, note_date=$3, subjective=$4, objective=$5,
       assessment=$6, plan=$7, treatment_provided=$8, patient_response=$9, next_visit_goals=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [patient_id, therapist_name, note_date, subjective, objective, assessment, plan, treatment_provided, patient_response, next_visit_goals, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment note not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating treatment note:', err);
    res.status(500).json({ error: 'Failed to update treatment note.' });
  }
});

// DELETE /api/treatment-notes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM treatment_notes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment note not found.' });
    }
    res.json({ message: 'Treatment note deleted successfully.', note: result.rows[0] });
  } catch (err) {
    console.error('Error deleting treatment note:', err);
    res.status(500).json({ error: 'Failed to delete treatment note.' });
  }
});

module.exports = router;
