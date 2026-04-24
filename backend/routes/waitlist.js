const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/waitlist
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, p.name as patient_name, p.condition, p.phone, p.email
      FROM waitlist w
      LEFT JOIN patients p ON w.patient_id = p.id
      ORDER BY w.priority DESC, w.requested_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching waitlist:', err);
    res.status(500).json({ error: 'Failed to fetch waitlist.' });
  }
});

// GET /api/waitlist/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT w.*, p.name as patient_name, p.condition, p.phone, p.email
      FROM waitlist w
      LEFT JOIN patients p ON w.patient_id = p.id
      WHERE w.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waitlist entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching waitlist entry:', err);
    res.status(500).json({ error: 'Failed to fetch waitlist entry.' });
  }
});

// POST /api/waitlist
router.post('/', async (req, res) => {
  try {
    const { patient_id, preferred_therapist, preferred_time, reason, priority, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO waitlist (patient_id, preferred_therapist, preferred_time, reason, priority, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [patient_id, preferred_therapist, preferred_time, reason, priority || 'normal', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating waitlist entry:', err);
    res.status(500).json({ error: 'Failed to create waitlist entry.' });
  }
});

// PUT /api/waitlist/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, preferred_therapist, preferred_time, reason, priority, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE waitlist SET patient_id=$1, preferred_therapist=$2, preferred_time=$3, reason=$4,
       priority=$5, status=$6, notes=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [patient_id, preferred_therapist, preferred_time, reason, priority, status, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waitlist entry not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating waitlist entry:', err);
    res.status(500).json({ error: 'Failed to update waitlist entry.' });
  }
});

// DELETE /api/waitlist/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM waitlist WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waitlist entry not found.' });
    }
    res.json({ message: 'Waitlist entry removed.', entry: result.rows[0] });
  } catch (err) {
    console.error('Error deleting waitlist entry:', err);
    res.status(500).json({ error: 'Failed to delete waitlist entry.' });
  }
});

module.exports = router;
