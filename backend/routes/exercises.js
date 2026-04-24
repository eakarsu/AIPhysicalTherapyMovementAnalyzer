const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/exercises
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exercises ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching exercises:', err);
    res.status(500).json({ error: 'Failed to fetch exercises.' });
  }
});

// GET /api/exercises/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM exercises WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching exercise:', err);
    res.status(500).json({ error: 'Failed to fetch exercise.' });
  }
});

// POST /api/exercises
router.post('/', async (req, res) => {
  try {
    const { name, description, body_region, difficulty_level, equipment_needed, repetitions, sets, duration_seconds, video_url, instructions, category } = req.body;
    const result = await pool.query(
      `INSERT INTO exercises (name, description, body_region, difficulty_level, equipment_needed, repetitions, sets, duration_seconds, video_url, instructions, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, description, body_region, difficulty_level, equipment_needed, repetitions, sets, duration_seconds, video_url, instructions, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating exercise:', err);
    res.status(500).json({ error: 'Failed to create exercise.' });
  }
});

// PUT /api/exercises/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, body_region, difficulty_level, equipment_needed, repetitions, sets, duration_seconds, video_url, instructions, category } = req.body;
    const result = await pool.query(
      `UPDATE exercises SET name=$1, description=$2, body_region=$3, difficulty_level=$4, equipment_needed=$5,
       repetitions=$6, sets=$7, duration_seconds=$8, video_url=$9, instructions=$10, category=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, description, body_region, difficulty_level, equipment_needed, repetitions, sets, duration_seconds, video_url, instructions, category, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating exercise:', err);
    res.status(500).json({ error: 'Failed to update exercise.' });
  }
});

// DELETE /api/exercises/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM exercises WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found.' });
    }
    res.json({ message: 'Exercise deleted successfully.', exercise: result.rows[0] });
  } catch (err) {
    console.error('Error deleting exercise:', err);
    res.status(500).json({ error: 'Failed to delete exercise.' });
  }
});

module.exports = router;
