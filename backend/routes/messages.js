const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT m.*, p.name as patient_name FROM messages m LEFT JOIN patients p ON m.patient_id = p.id ORDER BY m.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT m.*, p.name as patient_name FROM messages m LEFT JOIN patients p ON m.patient_id = p.id WHERE m.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching message:', err);
    res.status(500).json({ error: 'Failed to fetch message.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, sender_type, subject, body, priority, category } = req.body;
    const result = await pool.query(
      `INSERT INTO messages (patient_id, sender_type, subject, body, is_read, priority, category)
       VALUES ($1,$2,$3,$4,false,$5,$6) RETURNING *`,
      [patient_id, sender_type || 'therapist', subject, body, priority || 'normal', category || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: 'Failed to create message.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { patient_id, sender_type, subject, body, is_read, priority, category } = req.body;
    const result = await pool.query(
      `UPDATE messages SET patient_id=$1, sender_type=$2, subject=$3, body=$4, is_read=$5, priority=$6, category=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [patient_id, sender_type, subject, body, is_read, priority, category, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating message:', err);
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const result = await pool.query('UPDATE messages SET is_read = true, updated_at=NOW() WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking message read:', err);
    res.status(500).json({ error: 'Failed to mark message as read.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found.' });
    res.json({ message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

module.exports = router;
