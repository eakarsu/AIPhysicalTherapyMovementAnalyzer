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

// GET /api/patients?page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM patients');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM patients ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      data: result.rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
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

// GET /api/patients/:id - HIPAA audit logged
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // HIPAA audit log
    pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user?.id || null, 'view_patient', 'patient', id, req.ip]
    ).catch((e) => console.error('Audit log error:', e.message));

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

// POST /api/patients/:id/prescribe-exercises — delegates to AI route logic
router.post('/:id/prescribe-exercises', async (req, res) => {
  try {
    const { id } = req.params;
    const https = require('https');
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

    const [patientRes, assessmentsRes] = await Promise.all([
      pool.query('SELECT * FROM patients WHERE id = $1', [id]),
      pool.query(
        `SELECT ma.form_score, ma.ai_feedback, ma.assessment_date, e.name as exercise_name
         FROM movement_assessments ma LEFT JOIN exercises e ON ma.exercise_id = e.id
         WHERE ma.patient_id = $1 ORDER BY ma.assessment_date DESC LIMIT 5`,
        [id]
      ),
    ]);

    if (patientRes.rows.length === 0) return res.status(404).json({ error: 'Patient not found.' });
    const patient = patientRes.rows[0];
    const assessments = assessmentsRes.rows;

    pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id || null, 'ai_prescribe_exercises', 'patient', id, req.ip]
    ).catch(() => {});

    function extractJSON(content) {
      try { return JSON.parse(content); } catch {}
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) { try { return JSON.parse(match[1].trim()); } catch {} }
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch {} }
      return { raw_response: content };
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapist AI. Generate personalized, evidence-based exercise prescriptions. Respond ONLY with valid JSON in this exact format:
{
  "program_name": "<descriptive program name>",
  "rationale": "<why this program was designed this way>",
  "exercises": [
    {
      "name": "<exercise name>",
      "category": "<strength|flexibility|balance|endurance|neuromuscular>",
      "target_muscle_groups": ["<muscle>"],
      "sets": <number>,
      "reps": <number>,
      "hold_seconds": <number or null>,
      "rest_seconds": <number>,
      "frequency_per_week": <number>,
      "equipment": "<required equipment or none>",
      "instructions": ["<step>"],
      "progressions": ["<progression step>"],
      "regressions": ["<easier modification>"],
      "contraindications": ["<when NOT to do this>"],
      "rationale": "<why this exercise for this patient>"
    }
  ],
  "weekly_schedule": {
    "monday": ["<exercise names>"],
    "tuesday": ["<rest or exercise names>"],
    "wednesday": ["<exercise names>"],
    "thursday": ["<rest or exercise names>"],
    "friday": ["<exercise names>"],
    "saturday": "<rest or light activity>",
    "sunday": "<rest>"
  },
  "phase_progression": {
    "phase_1_weeks_1_2": "<focus and goals>",
    "phase_2_weeks_3_4": "<progression>",
    "phase_3_weeks_5_6": "<advanced progression>"
  },
  "red_flags": ["<symptoms requiring immediate cessation>"],
  "goals": ["<measurable goal>"],
  "estimated_program_duration_weeks": <number>
}`
      },
      {
        role: 'user',
        content: `Generate a personalized exercise prescription for:
Patient: ${patient.name}
Condition: ${patient.condition || 'Unknown'}
Injury Type: ${patient.injury_type || 'Unknown'}
Status: ${patient.status}

Recent Assessments: ${assessments.map((a, i) => `${i + 1}. ${a.exercise_name || 'Unknown'}, Form: ${a.form_score}/100, Feedback: ${a.ai_feedback || 'N/A'}`).join('\n') || 'None'}

Design a complete 6-week personalized exercise prescription.`
      }
    ];

    const bodyStr = JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.7, max_tokens: 2000 });
    const prescription = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'AI PT Movement Analyzer' },
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => (data += chunk));
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new Error(parsed.error.message));
            else resolve(extractJSON(parsed.choices[0].message.content));
          } catch (e) { reject(e); }
        });
      });
      r.on('error', reject);
      r.write(bodyStr);
      r.end();
    });

    // Save AI result
    pool.query(
      `INSERT INTO ai_results (user_id, endpoint, patient_id, result) VALUES ($1, $2, $3, $4)`,
      [req.user?.id || null, 'prescribe-exercises', id, JSON.stringify(prescription)]
    ).catch(() => {});

    res.json({ success: true, exercise_prescription: prescription });
  } catch (err) {
    console.error('Exercise prescription error:', err);
    res.status(500).json({ error: 'Failed to generate exercise prescription.', details: err.message });
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
