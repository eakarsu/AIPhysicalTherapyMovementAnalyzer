const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/patients/search?q=term
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    const term = `%${q.trim()}%`;
    const result = await pool.query(
      `SELECT id, name, email, phone, condition, status
       FROM patients
       WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR condition ILIKE $1
       ORDER BY name ASC
       LIMIT 20`,
      [term]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching patients:', err);
    res.status(500).json({ error: 'Failed to search patients.' });
  }
});

// GET /api/patients
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Failed to fetch patients.' });
  }
});

// GET /api/patients/:id/profile - Full patient profile with all related data
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const [patient, treatmentPlans, appointments, treatmentNotes, recoveryProgress, assessments, hep] = await Promise.all([
      pool.query('SELECT * FROM patients WHERE id = $1', [id]),
      pool.query('SELECT * FROM treatment_plans WHERE patient_id = $1 ORDER BY start_date DESC', [id]),
      pool.query('SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC', [id]),
      pool.query('SELECT * FROM treatment_notes WHERE patient_id = $1 ORDER BY note_date DESC', [id]),
      pool.query('SELECT * FROM recovery_progress WHERE patient_id = $1 ORDER BY assessment_date DESC', [id]),
      pool.query(`SELECT ma.*, e.name as exercise_name FROM movement_assessments ma
                  LEFT JOIN exercises e ON ma.exercise_id = e.id
                  WHERE ma.patient_id = $1 ORDER BY ma.assessment_date DESC`, [id]),
      pool.query('SELECT * FROM home_exercise_programs WHERE patient_id = $1 ORDER BY start_date DESC', [id]),
    ]);
    if (patient.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    res.json({
      patient: patient.rows[0],
      treatmentPlans: treatmentPlans.rows,
      appointments: appointments.rows,
      treatmentNotes: treatmentNotes.rows,
      recoveryProgress: recoveryProgress.rows,
      assessments: assessments.rows,
      homeExercisePrograms: hep.rows,
    });
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    res.status(500).json({ error: 'Failed to fetch patient profile.' });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: 'Failed to fetch patient.' });
  }
});

// POST /api/patients
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, date_of_birth, condition, injury_type, insurance, status } = req.body;
    const result = await pool.query(
      `INSERT INTO patients (name, email, phone, date_of_birth, condition, injury_type, insurance, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, email, phone, date_of_birth, condition, injury_type, insurance, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating patient:', err);
    res.status(500).json({ error: 'Failed to create patient.' });
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, date_of_birth, condition, injury_type, insurance, status } = req.body;
    const result = await pool.query(
      `UPDATE patients SET name=$1, email=$2, phone=$3, date_of_birth=$4, condition=$5,
       injury_type=$6, insurance=$7, status=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, email, phone, date_of_birth, condition, injury_type, insurance, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ error: 'Failed to update patient.' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    res.json({ message: 'Patient deleted successfully.', patient: result.rows[0] });
  } catch (err) {
    console.error('Error deleting patient:', err);
    res.status(500).json({ error: 'Failed to delete patient.' });
  }
});

module.exports = router;
