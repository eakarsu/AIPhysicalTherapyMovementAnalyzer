const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.name as patient_name FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id ORDER BY a.appointment_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, p.name as patient_name FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.id WHERE a.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching appointment:', err);
    res.status(500).json({ error: 'Failed to fetch appointment.' });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { patient_id, therapist_name, appointment_date, duration_minutes, type, status, notes, location } = req.body;
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, therapist_name, appointment_date, duration_minutes, type, status, notes, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_id, therapist_name, appointment_date, duration_minutes, type, status || 'scheduled', notes, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment.' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, therapist_name, appointment_date, duration_minutes, type, status, notes, location } = req.body;
    const result = await pool.query(
      `UPDATE appointments SET patient_id=$1, therapist_name=$2, appointment_date=$3, duration_minutes=$4,
       type=$5, status=$6, notes=$7, location=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [patient_id, therapist_name, appointment_date, duration_minutes, type, status, notes, location, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment.' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }
    res.json({ message: 'Appointment deleted successfully.', appointment: result.rows[0] });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment.' });
  }
});

module.exports = router;
