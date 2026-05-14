const express = require('express');
const router = express.Router();
const pool = require('../db');

// Initialize outcome_measure_templates table
pool.query(`
  CREATE TABLE IF NOT EXISTS outcome_measure_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20),
    scale VARCHAR(100),
    description TEXT,
    questions JSONB,
    scoring_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).then(() => {
  // Seed default templates if empty
  return pool.query('SELECT COUNT(*) FROM outcome_measure_templates');
}).then(r => {
  if (parseInt(r.rows[0].count) === 0) {
    pool.query(`INSERT INTO outcome_measure_templates (name, abbreviation, scale, description, scoring_instructions) VALUES
      ('Oswestry Disability Index','ODI','0-100%','Assesses disability from low back pain (10 questions, 0-5 each)','Sum all responses / 50 × 100 = disability%'),
      ('Neck Disability Index','NDI','0-100%','Assesses disability from neck pain (10 questions, 0-5 each)','Sum all responses / 50 × 100 = disability%'),
      ('DASH Outcome Measure','DASH','0-100','Disabilities of Arm, Shoulder, Hand (30 items, 1-5 each)','((Sum/30)-1)/4×100 = score'),
      ('Knee Injury and Osteoarthritis Outcome Score','KOOS','0-100 per subscale','Knee symptoms, pain, function, sport, QoL (5 subscales)','Each subscale scored 0 (worst) to 100 (best)'),
      ('Patient-Reported Outcomes Measurement','PROMIS','T-score','Standardized outcome measures calibrated to US general population','Higher T-score = more of the domain')
    `).catch(() => {});
  }
}).catch(() => {});

// Scoring functions

function scoreOswestry(responses) {
  // 10 questions, each 0-5
  if (!Array.isArray(responses) || responses.length !== 10) {
    throw new Error('Oswestry requires exactly 10 responses (0-5 each)');
  }
  const total = responses.reduce((sum, r) => sum + Number(r), 0);
  const percentage = (total / 50) * 100;
  let interpretation;
  if (percentage <= 20) interpretation = 'Minimal disability';
  else if (percentage <= 40) interpretation = 'Moderate disability';
  else if (percentage <= 60) interpretation = 'Severe disability';
  else if (percentage <= 80) interpretation = 'Crippling back pain';
  else interpretation = 'Bed-bound or exaggerating';
  return { raw_score: total, max_score: 50, percentage: parseFloat(percentage.toFixed(1)), interpretation };
}

function scoreNDI(responses) {
  // 10 questions, each 0-5
  if (!Array.isArray(responses) || responses.length !== 10) {
    throw new Error('NDI requires exactly 10 responses (0-5 each)');
  }
  const total = responses.reduce((sum, r) => sum + Number(r), 0);
  const percentage = (total / 50) * 100;
  let interpretation;
  if (percentage <= 8) interpretation = 'No disability';
  else if (percentage <= 28) interpretation = 'Mild disability';
  else if (percentage <= 48) interpretation = 'Moderate disability';
  else if (percentage <= 64) interpretation = 'Severe disability';
  else interpretation = 'Complete disability';
  return { raw_score: total, max_score: 50, percentage: parseFloat(percentage.toFixed(1)), interpretation };
}

function scoreDASH(responses) {
  // 30 items, each 1-5
  if (!Array.isArray(responses) || responses.length !== 30) {
    throw new Error('DASH requires exactly 30 responses (1-5 each)');
  }
  const n = responses.length;
  const sum = responses.reduce((acc, r) => acc + Number(r), 0);
  const score = ((sum / n) - 1) / 4 * 100;
  let interpretation;
  if (score <= 20) interpretation = 'Minimal disability';
  else if (score <= 40) interpretation = 'Mild disability';
  else if (score <= 60) interpretation = 'Moderate disability';
  else if (score <= 80) interpretation = 'Severe disability';
  else interpretation = 'Most severe disability';
  return { raw_score: parseFloat(score.toFixed(1)), max_score: 100, percentage: parseFloat(score.toFixed(1)), interpretation };
}

// GET /api/outcome-measures/templates
router.get('/templates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outcome_measure_templates ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ error: 'Failed to fetch outcome measure templates.' });
  }
});

// POST /api/outcome-measures/templates
router.post('/templates', async (req, res) => {
  try {
    const { name, abbreviation, scale, description, questions, scoring_instructions } = req.body;
    const result = await pool.query(
      `INSERT INTO outcome_measure_templates (name, abbreviation, scale, description, questions, scoring_instructions)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, abbreviation, scale, description, questions ? JSON.stringify(questions) : null, scoring_instructions]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).json({ error: 'Failed to create outcome measure template.' });
  }
});

// POST /api/outcome-measures/score
router.post('/score', async (req, res) => {
  try {
    const { instrument, responses, patient_id, assessed_by, notes } = req.body;

    if (!instrument || !responses) {
      return res.status(400).json({ error: 'instrument and responses are required.' });
    }

    let scoreResult;
    switch (instrument.toLowerCase()) {
      case 'oswestry':
      case 'odi':
        scoreResult = scoreOswestry(responses);
        break;
      case 'ndi':
        scoreResult = scoreNDI(responses);
        break;
      case 'dash':
        scoreResult = scoreDASH(responses);
        break;
      default:
        return res.status(400).json({ error: `Unknown instrument: ${instrument}. Supported: oswestry, ndi, dash` });
    }

    // Store in outcome_measures table
    let savedRow = null;
    if (patient_id) {
      const result = await pool.query(
        `INSERT INTO outcome_measures
         (patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, notes)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8) RETURNING *`,
        [
          patient_id,
          instrument.toUpperCase(),
          scoreResult.raw_score,
          scoreResult.max_score,
          scoreResult.percentage,
          assessed_by || null,
          scoreResult.interpretation,
          notes || null,
        ]
      );
      savedRow = result.rows[0];
    }

    res.json({ success: true, instrument, score: scoreResult, saved: savedRow });
  } catch (err) {
    console.error('Outcome score error:', err);
    res.status(400).json({ error: err.message || 'Failed to score.' });
  }
});

// GET /api/outcome-measures/patient/:patientId/trend
router.get('/patient/:patientId/trend', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT measure_type, score, max_score, percentage, assessment_date, interpretation
       FROM outcome_measures
       WHERE patient_id = $1
       ORDER BY assessment_date ASC`,
      [patientId]
    );

    // Group by instrument
    const trend = {};
    for (const row of result.rows) {
      const key = row.measure_type;
      if (!trend[key]) trend[key] = [];
      trend[key].push({
        date: row.assessment_date,
        score: row.score,
        max_score: row.max_score,
        percentage: row.percentage,
        interpretation: row.interpretation,
      });
    }

    res.json({ patient_id: patientId, trend });
  } catch (err) {
    console.error('Trend error:', err);
    res.status(500).json({ error: 'Failed to fetch trend data.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT om.*, p.name as patient_name FROM outcome_measures om LEFT JOIN patients p ON om.patient_id = p.id ORDER BY om.created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching outcome measures:', err);
    res.status(500).json({ error: 'Failed to fetch outcome measures.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT om.*, p.name as patient_name FROM outcome_measures om LEFT JOIN patients p ON om.patient_id = p.id WHERE om.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outcome measure not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching outcome measure:', err);
    res.status(500).json({ error: 'Failed to fetch outcome measure.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes } = req.body;
    const calcPercentage = percentage || (score && max_score ? ((score / max_score) * 100).toFixed(1) : null);
    const calcChange = change_from_previous || (previous_score != null && score != null ? score - previous_score : null);
    const result = await pool.query(
      `INSERT INTO outcome_measures (patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_id, measure_type, score, max_score, calcPercentage, assessment_date || new Date(), assessed_by, interpretation, previous_score, calcChange, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating outcome measure:', err);
    res.status(500).json({ error: 'Failed to create outcome measure.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes } = req.body;
    const calcPercentage = percentage || (score && max_score ? ((score / max_score) * 100).toFixed(1) : null);
    const result = await pool.query(
      `UPDATE outcome_measures SET patient_id=$1, measure_type=$2, score=$3, max_score=$4, percentage=$5, assessment_date=$6, assessed_by=$7, interpretation=$8, previous_score=$9, change_from_previous=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [patient_id, measure_type, score, max_score, calcPercentage, assessment_date, assessed_by, interpretation, previous_score, change_from_previous, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outcome measure not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating outcome measure:', err);
    res.status(500).json({ error: 'Failed to update outcome measure.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM outcome_measures WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Outcome measure not found.' });
    res.json({ message: 'Outcome measure deleted successfully.' });
  } catch (err) {
    console.error('Error deleting outcome measure:', err);
    res.status(500).json({ error: 'Failed to delete outcome measure.' });
  }
});

// POST /api/outcome-measures/patient-assessment
// Records patient responses, AI scores and interprets using known algorithm + AI context
router.post('/patient-assessment', async (req, res) => {
  try {
    const { patient_id, instrument, responses, assessed_by, notes } = req.body;
    if (!instrument || !responses) {
      return res.status(400).json({ error: 'instrument and responses are required.' });
    }

    let scoreResult;
    switch (instrument.toLowerCase()) {
      case 'oswestry': case 'odi': scoreResult = scoreOswestry(responses); break;
      case 'ndi': scoreResult = scoreNDI(responses); break;
      case 'dash': scoreResult = scoreDASH(responses); break;
      default: {
        // Generic scoring for unknown instruments
        const nums = responses.map(Number).filter(n => !isNaN(n));
        const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        scoreResult = { raw_score: avg, max_score: 100, percentage: Math.round(avg), interpretation: 'Requires manual interpretation' };
      }
    }

    // Save to DB
    let savedRow = null;
    if (patient_id) {
      const result = await pool.query(
        `INSERT INTO outcome_measures (patient_id, measure_type, score, max_score, percentage, assessment_date, assessed_by, interpretation, notes)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8) RETURNING *`,
        [patient_id, instrument.toUpperCase(), scoreResult.raw_score, scoreResult.max_score, scoreResult.percentage, assessed_by || null, scoreResult.interpretation, notes || null]
      );
      savedRow = result.rows[0];
    }

    // Log audit
    pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id || null, 'outcome_assessment', 'patient', patient_id, req.ip]
    ).catch(() => {});

    res.json({ success: true, instrument, score: scoreResult, saved: savedRow });
  } catch (err) {
    console.error('Patient assessment error:', err);
    res.status(400).json({ error: err.message || 'Failed to record assessment.' });
  }
});

module.exports = router;
