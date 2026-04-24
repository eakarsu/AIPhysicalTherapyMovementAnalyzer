const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT pa.*, p.name as patient_name FROM pain_assessments pa LEFT JOIN patients p ON pa.patient_id = p.id ORDER BY pa.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pain assessments:', err);
    res.status(500).json({ error: 'Failed to fetch pain assessments.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT pa.*, p.name as patient_name FROM pain_assessments pa LEFT JOIN patients p ON pa.patient_id = p.id WHERE pa.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pain assessment not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching pain assessment:', err);
    res.status(500).json({ error: 'Failed to fetch pain assessment.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, assessment_date, body_region, pain_level, pain_type, triggers, relieving_factors, functional_impact, duration_of_pain, notes, assessed_by } = req.body;
    const result = await pool.query(
      `INSERT INTO pain_assessments (patient_id, assessment_date, body_region, pain_level, pain_type, triggers, relieving_factors, functional_impact, duration_of_pain, notes, assessed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_id, assessment_date || new Date(), body_region, pain_level, pain_type, triggers, relieving_factors, functional_impact, duration_of_pain, notes, assessed_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating pain assessment:', err);
    res.status(500).json({ error: 'Failed to create pain assessment.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { patient_id, assessment_date, body_region, pain_level, pain_type, triggers, relieving_factors, functional_impact, duration_of_pain, notes, assessed_by } = req.body;
    const result = await pool.query(
      `UPDATE pain_assessments SET patient_id=$1, assessment_date=$2, body_region=$3, pain_level=$4, pain_type=$5, triggers=$6, relieving_factors=$7, functional_impact=$8, duration_of_pain=$9, notes=$10, assessed_by=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [patient_id, assessment_date, body_region, pain_level, pain_type, triggers, relieving_factors, functional_impact, duration_of_pain, notes, assessed_by, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pain assessment not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating pain assessment:', err);
    res.status(500).json({ error: 'Failed to update pain assessment.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pain_assessments WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pain assessment not found.' });
    res.json({ message: 'Pain assessment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting pain assessment:', err);
    res.status(500).json({ error: 'Failed to delete pain assessment.' });
  }
});

module.exports = router;
