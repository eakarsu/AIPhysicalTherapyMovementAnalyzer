const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT b.*, p.name as patient_name FROM billing b LEFT JOIN patients p ON b.patient_id = p.id ORDER BY b.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ error: 'Failed to fetch billing records.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT b.*, p.name as patient_name FROM billing b LEFT JOIN patients p ON b.patient_id = p.id WHERE b.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Billing record not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching billing record:', err);
    res.status(500).json({ error: 'Failed to fetch billing record.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, insurance_provider, policy_number, claim_number, service_date, service_type, cpt_code, diagnosis_code, amount, paid_amount, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO billing (patient_id, insurance_provider, policy_number, claim_number, service_date, service_type, cpt_code, diagnosis_code, amount, paid_amount, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [patient_id, insurance_provider, policy_number, claim_number, service_date, service_type, cpt_code, diagnosis_code, amount, paid_amount || 0, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating billing:', err);
    res.status(500).json({ error: 'Failed to create billing record.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { patient_id, insurance_provider, policy_number, claim_number, service_date, service_type, cpt_code, diagnosis_code, amount, paid_amount, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE billing SET patient_id=$1, insurance_provider=$2, policy_number=$3, claim_number=$4, service_date=$5, service_type=$6, cpt_code=$7, diagnosis_code=$8, amount=$9, paid_amount=$10, status=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *`,
      [patient_id, insurance_provider, policy_number, claim_number, service_date, service_type, cpt_code, diagnosis_code, amount, paid_amount, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Billing record not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating billing:', err);
    res.status(500).json({ error: 'Failed to update billing record.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM billing WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Billing record not found.' });
    res.json({ message: 'Billing record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting billing:', err);
    res.status(500).json({ error: 'Failed to delete billing record.' });
  }
});

module.exports = router;
