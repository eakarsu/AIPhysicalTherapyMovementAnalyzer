const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ev.*, e.name as exercise_name FROM exercise_videos ev LEFT JOIN exercises e ON ev.exercise_id = e.id ORDER BY ev.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching exercise videos:', err);
    res.status(500).json({ error: 'Failed to fetch exercise videos.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT ev.*, e.name as exercise_name FROM exercise_videos ev LEFT JOIN exercises e ON ev.exercise_id = e.id WHERE ev.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Exercise video not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching exercise video:', err);
    res.status(500).json({ error: 'Failed to fetch exercise video.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { exercise_id, title, description, video_url, thumbnail_url, duration_seconds, difficulty_level, body_region, instructor_name } = req.body;
    const result = await pool.query(
      `INSERT INTO exercise_videos (exercise_id, title, description, video_url, thumbnail_url, duration_seconds, difficulty_level, body_region, instructor_name, view_count, rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,0) RETURNING *`,
      [exercise_id, title, description, video_url, thumbnail_url, duration_seconds, difficulty_level, body_region, instructor_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating exercise video:', err);
    res.status(500).json({ error: 'Failed to create exercise video.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { exercise_id, title, description, video_url, thumbnail_url, duration_seconds, difficulty_level, body_region, instructor_name } = req.body;
    const result = await pool.query(
      `UPDATE exercise_videos SET exercise_id=$1, title=$2, description=$3, video_url=$4, thumbnail_url=$5, duration_seconds=$6, difficulty_level=$7, body_region=$8, instructor_name=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [exercise_id, title, description, video_url, thumbnail_url, duration_seconds, difficulty_level, body_region, instructor_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Exercise video not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating exercise video:', err);
    res.status(500).json({ error: 'Failed to update exercise video.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM exercise_videos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Exercise video not found.' });
    res.json({ message: 'Exercise video deleted successfully.' });
  } catch (err) {
    console.error('Error deleting exercise video:', err);
    res.status(500).json({ error: 'Failed to delete exercise video.' });
  }
});

module.exports = router;
