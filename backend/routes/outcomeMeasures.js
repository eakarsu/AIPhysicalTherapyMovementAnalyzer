const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT om.*, p.name as patient_name FROM outcome_measures om LEFT JOIN patients p ON om.patient_id = p.id ORDER BY om.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching outcome measures:', err);
    res.status(500).json({ error: 'Failed to fetch outcome measures.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT om.*, p.name as patient_name FROM outcome_measures om LEFT JOIN patients p ON om.patient_id = p.id WHERE om.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outcome measure not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching outcome measure:', err);
    res.status(500).json({ error: 'Failed to fetch outcome measure.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes } = req.body;
    const calcPercentage = percentage || (score && max_score ? ((score / max_score) * 100).toFixed(1) : null);
    const calcChange = change_from_previous || (previous_score != null && score != null ? score - previous_score : null);
    const result = await pool.query(
      `INSERT INTO outcome_measures (patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_id, measure_type, score, max_score, calcPercentage, assessment_date || new Date(), assessed_by, interpretation, previous_score, calcChange, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating outcome measure:', err);
    res.status(500).json({ error: 'Failed to create outcome measure.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes } = req.body;
    const calcPercentage = percentage || (score && max_score ? ((score / max_score) * 100).toFixed(1) : null);
    const result = await pool.query(
      `UPDATE outcome_measures SET patient_id=$1, measure_type=$2, score=$3, max_score=$4, percentage=$5, assessment_date=$6, assessed_by=$7, interpretation=$8, previous_score=$9, change_from_previous=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [patient_id, measure_type, score, max_score, calcPercentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outcome measure not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating outcome measure:', err);
    res.status(500).json({ error: 'Failed to update outcome measure.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM outcome_measures WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outcome measure not found.' });
    res.json({ message: 'Outcome measure deleted successfully.' });
  } catch (err) {
    console.error('Error deleting outcome measure:', err);
    res.status(500).json({ error: 'Failed to delete outcome measure.' });
  }
});

module.exports = router;
