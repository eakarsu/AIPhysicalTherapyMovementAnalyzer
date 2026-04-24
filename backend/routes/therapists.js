const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM therapists ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching therapists:', err);
    res.status(500).json({ error: 'Failed to fetch therapists.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM therapists WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Therapist not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching therapist:', err);
    res.status(500).json({ error: 'Failed to fetch therapist.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, license_number, years_experience, certifications, bio, status, hire_date } = req.body;
    const result = await pool.query(
      `INSERT INTO therapists (first_name, last_name, email, phone, specialization, license_number, years_experience, certifications, bio, status, hire_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [first_name, last_name, email, phone, specialization, license_number, years_experience, certifications, bio, status || 'active', hire_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating therapist:', err);
    res.status(500).json({ error: 'Failed to create therapist.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, specialization, license_number, years_experience, certifications, bio, status, hire_date } = req.body;
    const result = await pool.query(
      `UPDATE therapists SET first_name=$1, last_name=$2, email=$3, phone=$4, specialization=$5, license_number=$6, years_experience=$7, certifications=$8, bio=$9, status=$10, hire_date=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [first_name, last_name, email, phone, specialization, license_number, years_experience, certifications, bio, status, hire_date, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Therapist not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating therapist:', err);
    res.status(500).json({ error: 'Failed to update therapist.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM therapists WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Therapist not found.' });
    res.json({ message: 'Therapist deleted successfully.' });
  } catch (err) {
    console.error('Error deleting therapist:', err);
    res.status(500).json({ error: 'Failed to delete therapist.' });
  }
});

module.exports = router;
