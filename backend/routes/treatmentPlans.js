const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/treatment-plans?page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM treatment_plans');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT tp.*, p.name as patient_name FROM treatment_plans tp
       LEFT JOIN patients p ON tp.patient_id = p.id
       ORDER BY tp.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ data: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Error fetching treatment plans:', err);
    res.status(500).json({ error: 'Failed to fetch treatment plans.' });
  }
});

// GET /api/treatment-plans/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT tp.*, p.name as patient_name FROM treatment_plans tp
       LEFT JOIN patients p ON tp.patient_id = p.id WHERE tp.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment plan not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching treatment plan:', err);
    res.status(500).json({ error: 'Failed to fetch treatment plan.' });
  }
});

// POST /api/treatment-plans
router.post('/', async (req, res) => {
  try {
    const { patient_id, therapist_name, diagnosis, goals, start_date, end_date, status, frequency, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO treatment_plans (patient_id, therapist_name, diagnosis, goals, start_date, end_date, status, frequency, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, therapist_name, diagnosis, goals, start_date, end_date, status || 'active', frequency, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating treatment plan:', err);
    res.status(500).json({ error: 'Failed to create treatment plan.' });
  }
});

// PUT /api/treatment-plans/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, therapist_name, diagnosis, goals, start_date, end_date, status, frequency, notes } = req.body;
    const result = await pool.query(
      `UPDATE treatment_plans SET patient_id=$1, therapist_name=$2, diagnosis=$3, goals=$4, start_date=$5,
       end_date=$6, status=$7, frequency=$8, notes=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [patient_id, therapist_name, diagnosis, goals, start_date, end_date, status, frequency, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment plan not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating treatment plan:', err);
    res.status(500).json({ error: 'Failed to update treatment plan.' });
  }
});

// DELETE /api/treatment-plans/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM treatment_plans WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Treatment plan not found.' });
    }
    res.json({ message: 'Treatment plan deleted successfully.', treatmentPlan: result.rows[0] });
  } catch (err) {
    console.error('Error deleting treatment plan:', err);
    res.status(500).json({ error: 'Failed to delete treatment plan.' });
  }
});

module.exports = router;
