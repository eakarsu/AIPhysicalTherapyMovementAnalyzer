const express = require('express');
const router = express.Router();
const https = require('https');
const pool = require('../db');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

async function callOpenRouter(messages) {
  const body = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const url = new URL(`${OPENROUTER_BASE_URL}/chat/completions`);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Physical Therapy Movement Analyzer',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode < 200 || res.statusCode >= 300 || parsed.error) {
              reject(new Error(parsed.error?.message || `OpenRouter returned HTTP ${res.statusCode}`));
            } else {
              const content = parsed.choices?.[0]?.message?.content;
              if (typeof content !== 'string' || !content.trim()) {
                reject(new Error('OpenRouter returned an empty response'));
                return;
              }
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error('Failed to parse OpenRouter response'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function extractJSON(content) {
  // Strategy 1: direct parse
  try {
    return JSON.parse(content);
  } catch {}
  // Strategy 2: extract from markdown code block
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }
  // Strategy 3: find first { ... } block
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }
  return { raw_response: content };
}

// Initialize required tables
async function initTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      patient_id INTEGER,
      result JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action VARCHAR(100),
      entity_type VARCHAR(50),
      entity_id INTEGER,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Add ai_analysis column to movement_assessments if not present
  await pool.query(`ALTER TABLE movement_assessments ADD COLUMN IF NOT EXISTS ai_analysis JSONB`).catch(() => {});
}

initTables().catch(console.error);

// Helper: persist AI result
async function persistAIResult(userId, endpoint, patientId, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, patient_id, result) VALUES ($1, $2, $3, $4)`,
      [userId, endpoint, patientId || null, JSON.stringify(result)]
    );
  } catch (e) {
    console.error('Failed to persist AI result:', e.message);
  }
}

// GET /api/ai/history
router.get('/history', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ai_results WHERE user_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      data: result.rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('AI history error:', err);
    res.status(500).json({ error: 'Failed to fetch AI history.' });
  }
});

// GET /api/ai/audit-logs (admin)
router.get('/audit-logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(`SELECT COUNT(*) FROM audit_logs`);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT al.*, u.name as user_name FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
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
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

// POST /api/ai/analyze-movement
router.post('/analyze-movement', async (req, res) => {
  try {
    const { exercise_name, patient_name, patient_id, joint_angles, movement_description, pain_reported } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert AI physical therapy movement analyzer. Analyze exercise form and movement quality based on the provided data. Always respond with valid JSON in this exact format:
{
  "form_score": <number 0-100>,
  "movement_quality": "<excellent|good|fair|poor>",
  "ai_feedback": "<detailed feedback string>",
  "joint_angle_analysis": { "<joint_name>": { "angle": <number>, "optimal_range": "<range>", "status": "<within_range|outside_range>" } },
  "compensations_detected": ["<list of compensatory movements>"],
  "injury_risk_areas": ["<areas at risk>"],
  "recommendations": ["<specific improvement suggestions>"],
  "corrective_cues": ["<verbal cues for the patient>"]
}`
      },
      {
        role: 'user',
        content: `Analyze the following movement:
Patient: ${patient_name || 'Unknown'}
Exercise: ${exercise_name || 'Unknown'}
Joint Angles: ${JSON.stringify(joint_angles || {})}
Movement Description: ${movement_description || 'No description provided'}
Pain Reported: ${pain_reported || 'None reported'}

Provide a detailed movement analysis with form score, quality assessment, and specific recommendations.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const analysis = extractJSON(content);

    await persistAIResult(req.user.id, 'analyze-movement', patient_id, analysis);

    // Update movement_assessments.ai_analysis if patient_id provided
    if (patient_id) {
      await pool.query(
        `UPDATE movement_assessments SET ai_analysis = $1 WHERE patient_id = $2 AND id = (
          SELECT id FROM movement_assessments WHERE patient_id = $2 ORDER BY assessment_date DESC LIMIT 1
        )`,
        [JSON.stringify(analysis), patient_id]
      ).catch(() => {});
    }

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI analyze-movement error:', err);
    res.status(500).json({ error: 'Failed to analyze movement.', details: err.message });
  }
});

// POST /api/ai/generate-treatment-plan
router.post('/generate-treatment-plan', async (req, res) => {
  try {
    const { patient_name, patient_id, age, condition, injury_type, pain_level, mobility_score, medical_history, goals } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapist AI assistant. Generate comprehensive treatment plans based on patient information. Always respond with valid JSON in this exact format:
{
  "diagnosis": "<clinical diagnosis>",
  "goals": {
    "short_term": ["<2-week goals>"],
    "long_term": ["<6-12 week goals>"]
  },
  "treatment_phases": [
    {
      "phase": <number>,
      "name": "<phase name>",
      "duration_weeks": <number>,
      "focus": "<primary focus>",
      "exercises": ["<exercise names>"],
      "modalities": ["<treatment modalities>"],
      "frequency": "<sessions per week>",
      "precautions": ["<safety precautions>"]
    }
  ],
  "recommended_frequency": "<sessions per week>",
  "estimated_duration_weeks": <number>,
  "home_exercise_recommendations": ["<HEP exercises>"],
  "precautions": ["<general precautions>"],
  "discharge_criteria": ["<criteria for discharge>"]
}`
      },
      {
        role: 'user',
        content: `Generate a treatment plan for:
Patient: ${patient_name || 'Unknown'}
Age: ${age || 'Unknown'}
Condition: ${condition || 'Unknown'}
Injury Type: ${injury_type || 'Unknown'}
Current Pain Level: ${pain_level || 'Unknown'}/10
Current Mobility Score: ${mobility_score || 'Unknown'}/100
Medical History: ${medical_history || 'None provided'}
Patient Goals: ${goals || 'Return to normal function'}

Create a detailed, phased treatment plan.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const plan = extractJSON(content);

    await persistAIResult(req.user.id, 'generate-treatment-plan', patient_id, plan);

    // Update treatment_plans.ai_analysis if patient_id provided
    if (patient_id) {
      await pool.query(
        `UPDATE treatment_plans SET ai_analysis = $1 WHERE patient_id = $2 AND id = (
          SELECT id FROM treatment_plans WHERE patient_id = $2 ORDER BY created_at DESC LIMIT 1
        )`,
        [JSON.stringify(plan), patient_id]
      ).catch(() => {});
    }

    res.json({ success: true, treatment_plan: plan });
  } catch (err) {
    console.error('AI generate-treatment-plan error:', err);
    res.status(500).json({ error: 'Failed to generate treatment plan.', details: err.message });
  }
});

// POST /api/ai/assess-recovery
router.post('/assess-recovery', async (req, res) => {
  try {
    const { patient_name, patient_id, condition, injury_type, weeks_in_treatment, pain_history, mobility_history, strength_history, current_exercises, compliance_rate } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI that assesses patient recovery progress. Analyze trends and provide actionable insights. Always respond with valid JSON in this exact format:
{
  "overall_progress_rating": "<excellent|good|fair|slow|stalled>",
  "progress_percentage": <number 0-100>,
  "pain_trend": "<decreasing|stable|increasing>",
  "mobility_trend": "<improving|stable|declining>",
  "strength_trend": "<improving|stable|declining>",
  "key_improvements": ["<notable improvements>"],
  "areas_of_concern": ["<areas needing attention>"],
  "milestone_assessment": { "achieved": ["<milestones met>"], "upcoming": ["<next milestones>"] },
  "treatment_adjustments": ["<recommended changes>"],
  "estimated_remaining_weeks": <number>,
  "notes": "<summary narrative>"
}`
      },
      {
        role: 'user',
        content: `Assess recovery progress for:
Patient: ${patient_name || 'Unknown'}
Condition: ${condition || 'Unknown'}
Injury Type: ${injury_type || 'Unknown'}
Weeks in Treatment: ${weeks_in_treatment || 0}
Pain History (recent readings): ${JSON.stringify(pain_history || [])}
Mobility Scores: ${JSON.stringify(mobility_history || [])}
Strength Scores: ${JSON.stringify(strength_history || [])}
Current Exercises: ${JSON.stringify(current_exercises || [])}
HEP Compliance Rate: ${compliance_rate || 'Unknown'}%

Provide a comprehensive recovery assessment.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const assessment = extractJSON(content);

    await persistAIResult(req.user.id, 'assess-recovery', patient_id, assessment);

    res.json({ success: true, recovery_assessment: assessment });
  } catch (err) {
    console.error('AI assess-recovery error:', err);
    res.status(500).json({ error: 'Failed to assess recovery.', details: err.message });
  }
});

// POST /api/ai/recommend-exercises
router.post('/recommend-exercises', async (req, res) => {
  try {
    const { patient_id, condition, injury_type, pain_level, mobility_score, strength_score, phase, equipment_available, contraindications } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI that recommends exercises tailored to patient conditions. Always respond with valid JSON in this exact format:
{
  "recommended_exercises": [
    {
      "name": "<exercise name>",
      "category": "<strength|flexibility|balance|cardio>",
      "body_region": "<target region>",
      "difficulty_level": "<beginner|intermediate|advanced>",
      "sets": <number>,
      "repetitions": <number>,
      "hold_seconds": <number or null>,
      "description": "<how to perform>",
      "purpose": "<why this exercise>",
      "precautions": "<safety notes>",
      "progression": "<how to advance>"
    }
  ],
  "exercise_sequence": "<recommended order>",
  "warm_up_suggestions": ["<warm-up exercises>"],
  "cool_down_suggestions": ["<cool-down exercises>"],
  "exercises_to_avoid": ["<contraindicated exercises>"],
  "weekly_schedule": { "monday": ["<exercises>"], "wednesday": ["<exercises>"], "friday": ["<exercises>"] },
  "notes": "<additional recommendations>"
}`
      },
      {
        role: 'user',
        content: `Recommend exercises for:
Condition: ${condition || 'Unknown'}
Injury Type: ${injury_type || 'Unknown'}
Pain Level: ${pain_level || 'Unknown'}/10
Mobility Score: ${mobility_score || 'Unknown'}/100
Strength Score: ${strength_score || 'Unknown'}/100
Recovery Phase: ${phase || 'Unknown'}
Equipment Available: ${JSON.stringify(equipment_available || ['None specified'])}
Contraindications: ${JSON.stringify(contraindications || ['None'])}

Recommend 8-12 appropriate exercises with full details.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const recommendations = extractJSON(content);

    await persistAIResult(req.user.id, 'recommend-exercises', patient_id, recommendations);

    res.json({ success: true, exercise_recommendations: recommendations });
  } catch (err) {
    console.error('AI recommend-exercises error:', err);
    res.status(500).json({ error: 'Failed to recommend exercises.', details: err.message });
  }
});

// POST /api/ai/generate-hep
router.post('/generate-hep', async (req, res) => {
  try {
    const { patient_name, patient_id, condition, injury_type, current_phase, pain_level, functional_goals, available_equipment, time_per_session } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI that creates personalized home exercise programs (HEP). Always respond with valid JSON in this exact format:
{
  "program_name": "<descriptive program name>",
  "frequency": "<times per week>",
  "duration_weeks": <number>,
  "exercises": [
    {
      "name": "<exercise name>",
      "category": "<strength|flexibility|balance|cardio>",
      "sets": <number>,
      "reps": <number>,
      "hold_seconds": <number or null>,
      "rest_between_sets": "<seconds>",
      "equipment": "<equipment needed or 'none'>",
      "instructions": ["<step-by-step instructions>"],
      "modifications": { "easier": "<easier version>", "harder": "<harder version>" },
      "red_flags": ["<when to stop>"]
    }
  ],
  "daily_schedule": {
    "warm_up": ["<warm-up activities>"],
    "main_exercises": ["<exercise names in order>"],
    "cool_down": ["<cool-down activities>"]
  },
  "progression_plan": {
    "week_1_2": "<what to focus on>",
    "week_3_4": "<progression>",
    "week_5_6": "<further progression>"
  },
  "compliance_tips": ["<tips for adherence>"],
  "when_to_contact_therapist": ["<warning signs>"],
  "ai_recommendations": "<overall recommendations>"
}`
      },
      {
        role: 'user',
        content: `Generate a home exercise program for:
Patient: ${patient_name || 'Unknown'}
Condition: ${condition || 'Unknown'}
Injury Type: ${injury_type || 'Unknown'}
Current Phase: ${current_phase || 'Early rehabilitation'}
Pain Level: ${pain_level || 'Unknown'}/10
Functional Goals: ${functional_goals || 'Return to daily activities'}
Available Equipment: ${JSON.stringify(available_equipment || ['None'])}
Time Per Session: ${time_per_session || 30} minutes

Create a complete home exercise program with 6-10 exercises.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const hep = extractJSON(content);

    await persistAIResult(req.user.id, 'generate-hep', patient_id, hep);

    res.json({ success: true, home_exercise_program: hep });
  } catch (err) {
    console.error('AI generate-hep error:', err);
    res.status(500).json({ error: 'Failed to generate home exercise program.', details: err.message });
  }
});

// POST /api/ai/generate-soap-note
router.post('/generate-soap-note', async (req, res) => {
  try {
    const { patient_name, patient_id, condition, visit_type, patient_complaints, observed_findings, treatments_performed, vitals, measurements, exercise_performance, patient_goals } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI that generates professional SOAP notes for clinical documentation. Always respond with valid JSON in this exact format:
{
  "subjective": "<patient's reported symptoms, complaints, and functional status in clinical language>",
  "objective": "<measurable findings, ROM, strength, gait analysis, special tests, vitals>",
  "assessment": "<clinical reasoning, progress assessment, functional limitations, rehab potential>",
  "plan": "<treatment plan going forward, frequency, goals for next visit, referrals>",
  "treatment_provided": "<specific treatments performed during this session>",
  "patient_response": "<how patient responded to treatment>",
  "next_visit_goals": ["<specific measurable goals for next visit>"],
  "cpt_codes_suggested": ["<relevant CPT codes>"],
  "time_spent_minutes": <number>,
  "clinical_notes": "<additional clinical observations>"
}`
      },
      {
        role: 'user',
        content: `Generate a SOAP note for:
Patient: ${patient_name || 'Unknown'}
Condition: ${condition || 'Unknown'}
Visit Type: ${visit_type || 'Follow-up'}
Patient Complaints: ${patient_complaints || 'None reported'}
Observed Findings: ${observed_findings || 'None specified'}
Treatments Performed: ${JSON.stringify(treatments_performed || [])}
Vitals/Measurements: ${JSON.stringify(vitals || {})}
Measurements: ${JSON.stringify(measurements || {})}
Exercise Performance: ${exercise_performance || 'Not assessed'}
Patient Goals: ${patient_goals || 'Not specified'}

Generate a complete, professional SOAP note.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const soapNote = extractJSON(content);

    await persistAIResult(req.user.id, 'generate-soap-note', patient_id, soapNote);

    res.json({ success: true, soap_note: soapNote });
  } catch (err) {
    console.error('AI generate-soap-note error:', err);
    res.status(500).json({ error: 'Failed to generate SOAP note.', details: err.message });
  }
});

// POST /api/ai/analyze-pain
router.post('/analyze-pain', async (req, res) => {
  try {
    const { patient_name, patient_id, pain_history, body_regions, pain_types, triggers, current_medications, functional_limitations } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI that analyzes pain patterns and suggests evidence-based interventions. Always respond with valid JSON in this exact format:
{
  "pain_pattern_analysis": "<overall pain pattern description>",
  "pain_classification": "<nociceptive|neuropathic|nociplastic|mixed>",
  "severity_rating": "<mild|moderate|severe>",
  "chronicity": "<acute|subacute|chronic>",
  "contributing_factors": ["<list of contributing factors>"],
  "red_flags_identified": ["<any red flags requiring medical referral>"],
  "suggested_interventions": [
    {
      "intervention": "<name>",
      "type": "<manual_therapy|exercise|modality|education|behavioral>",
      "rationale": "<why this intervention>",
      "frequency": "<how often>",
      "expected_benefit": "<what improvement to expect>"
    }
  ],
  "pain_management_strategies": ["<self-management strategies>"],
  "functional_goals": ["<realistic functional goals>"],
  "prognosis": "<expected recovery outlook>",
  "referral_recommendations": ["<other specialists to consider>"],
  "notes": "<additional clinical notes>"
}`
      },
      {
        role: 'user',
        content: `Analyze pain patterns for:
Patient: ${patient_name || 'Unknown'}
Pain History: ${JSON.stringify(pain_history || [])}
Body Regions Affected: ${JSON.stringify(body_regions || [])}
Pain Types Reported: ${JSON.stringify(pain_types || [])}
Known Triggers: ${JSON.stringify(triggers || [])}
Current Medications: ${current_medications || 'None reported'}
Functional Limitations: ${functional_limitations || 'Not specified'}

Provide a comprehensive pain analysis with classification and intervention recommendations.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const analysis = extractJSON(content);

    await persistAIResult(req.user.id, 'analyze-pain', patient_id, analysis);

    res.json({ success: true, pain_analysis: analysis });
  } catch (err) {
    console.error('AI analyze-pain error:', err);
    res.status(500).json({ error: 'Failed to analyze pain.', details: err.message });
  }
});

// POST /api/ai/predict-outcomes
router.post('/predict-outcomes', async (req, res) => {
  try {
    const { patient_name, patient_id, condition, age, measure_type, current_score, previous_scores, weeks_in_treatment, compliance_rate, comorbidities } = req.body;

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI that predicts treatment outcomes based on standardized outcome measures and patient data. Always respond with valid JSON in this exact format:
{
  "predicted_outcome": "<full_recovery|significant_improvement|moderate_improvement|minimal_improvement|plateau>",
  "confidence_level": "<high|moderate|low>",
  "predicted_score_4_weeks": <number>,
  "predicted_score_8_weeks": <number>,
  "predicted_score_12_weeks": <number>,
  "trajectory": "<improving|stable|declining>",
  "rate_of_change": "<faster_than_expected|as_expected|slower_than_expected>",
  "factors_favoring_recovery": ["<positive prognostic factors>"],
  "factors_against_recovery": ["<negative prognostic factors>"],
  "recommended_adjustments": ["<treatment modifications to optimize outcomes>"],
  "discharge_readiness": {
    "estimated_weeks_to_discharge": <number>,
    "discharge_criteria_met": ["<criteria already met>"],
    "discharge_criteria_remaining": ["<criteria still needed>"]
  },
  "benchmark_comparison": "<how patient compares to typical recovery for this condition>",
  "notes": "<clinical reasoning summary>"
}`
      },
      {
        role: 'user',
        content: `Predict treatment outcomes for:
Patient: ${patient_name || 'Unknown'}
Age: ${age || 'Unknown'}
Condition: ${condition || 'Unknown'}
Outcome Measure: ${measure_type || 'Unknown'}
Current Score: ${current_score || 'Unknown'}
Previous Scores: ${JSON.stringify(previous_scores || [])}
Weeks in Treatment: ${weeks_in_treatment || 0}
HEP Compliance Rate: ${compliance_rate || 'Unknown'}%
Comorbidities: ${comorbidities || 'None reported'}

Predict treatment outcomes and provide clinical recommendations.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const prediction = extractJSON(content);

    await persistAIResult(req.user.id, 'predict-outcomes', patient_id, prediction);

    res.json({ success: true, outcome_prediction: prediction });
  } catch (err) {
    console.error('AI predict-outcomes error:', err);
    res.status(500).json({ error: 'Failed to predict outcomes.', details: err.message });
  }
});

// POST /api/ai/rom-calculator
router.post('/rom-calculator', async (req, res) => {
  try {
    const { body_part, measured_angle, pain_level, side, patient_id } = req.body;
    if (!body_part || measured_angle === undefined) {
      return res.status(400).json({ error: 'body_part and measured_angle are required.' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI specializing in Range of Motion (ROM) assessment. Respond ONLY with valid JSON in this exact format:
{
  "body_part": "<body part name>",
  "measured_angle": <number>,
  "normal_rom_min": <number>,
  "normal_rom_max": <number>,
  "normal_rom_description": "<e.g. 0-120 degrees of knee flexion>",
  "deficit_percentage": <number 0-100>,
  "status": "<within_normal|mildly_limited|moderately_limited|severely_limited>",
  "clinical_significance": "<description of what this deficit means clinically>",
  "pain_impact": "<how pain level affects interpretation>",
  "exercise_recommendations": [
    {
      "name": "<exercise name>",
      "goal": "<ROM goal this addresses>",
      "description": "<brief description>",
      "frequency": "<how often>",
      "sets_reps": "<sets x reps or hold time>"
    }
  ],
  "stretching_recommendations": ["<specific stretch>"],
  "progression_timeline": "<expected timeline to improve ROM>",
  "precautions": ["<precaution>"],
  "notes": "<additional clinical notes>"
}`
      },
      {
        role: 'user',
        content: `Calculate ROM analysis for:
Body Part: ${body_part}
Side: ${side || 'Not specified'}
Measured Angle: ${measured_angle} degrees
Pain Level During Measurement: ${pain_level !== undefined ? `${pain_level}/10` : 'Not reported'}

Provide normal ROM reference values, deficit percentage, and targeted exercise recommendations.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const romAnalysis = extractJSON(content);

    await persistAIResult(req.user.id, 'rom-calculator', patient_id, romAnalysis);

    res.json({ success: true, rom_analysis: romAnalysis });
  } catch (err) {
    console.error('ROM calculator error:', err);
    res.status(500).json({ error: 'Failed to calculate ROM analysis.', details: err.message });
  }
});

// POST /api/patients/:id/prescribe-exercises  — exposed from patients route but added here
// POST /api/ai/prescribe-exercises
router.post('/prescribe-exercises', async (req, res) => {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required.' });

    // Fetch patient + recent assessments
    const [patientRes, assessmentsRes] = await Promise.all([
      pool.query('SELECT * FROM patients WHERE id = $1', [patient_id]),
      pool.query(
        `SELECT ma.*, e.name as exercise_name FROM movement_assessments ma
         LEFT JOIN exercises e ON ma.exercise_id = e.id
         WHERE ma.patient_id = $1 ORDER BY ma.assessment_date DESC LIMIT 5`,
        [patient_id]
      ),
    ]);

    if (patientRes.rows.length === 0) return res.status(404).json({ error: 'Patient not found.' });
    const patient = patientRes.rows[0];
    const assessments = assessmentsRes.rows;

    // HIPAA audit
    pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, 'ai_prescribe_exercises', 'patient', patient_id, req.ip]
    ).catch(() => {});

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
    "tuesday": ["<exercise names or rest>"],
    "wednesday": ["<exercise names>"],
    "thursday": ["<exercise names or rest>"],
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
Age: ${patient.age || 'Unknown'}
Condition: ${patient.condition || 'Unknown'}
Injury Type: ${patient.injury_type || 'Unknown'}
Status: ${patient.status}

Recent Assessment History (last ${assessments.length}):
${assessments.map((a, i) => `${i + 1}. Exercise: ${a.exercise_name || 'Unknown'}, Form Score: ${a.form_score}/100, Feedback: ${a.ai_feedback || 'None'}`).join('\n') || 'No assessments available'}

Design a complete 6-week personalized exercise prescription with sets, reps, frequency, and progressions.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const prescription = extractJSON(content);

    await persistAIResult(req.user.id, 'prescribe-exercises', patient_id, prescription);

    res.json({ success: true, exercise_prescription: prescription });
  } catch (err) {
    console.error('Exercise prescription error:', err);
    res.status(500).json({ error: 'Failed to generate exercise prescription.', details: err.message });
  }
});

// GET /api/ai/progress-report/:patientId
router.get('/progress-report/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const [patientRes, progressRes, assessmentsRes] = await Promise.all([
      pool.query('SELECT * FROM patients WHERE id = $1', [patientId]),
      pool.query(
        `SELECT * FROM recovery_progress WHERE patient_id = $1 ORDER BY assessment_date ASC`,
        [patientId]
      ),
      pool.query(
        `SELECT ma.form_score, ma.assessment_date, e.name as exercise_name
         FROM movement_assessments ma LEFT JOIN exercises e ON ma.exercise_id = e.id
         WHERE ma.patient_id = $1 ORDER BY ma.assessment_date ASC`,
        [patientId]
      ),
    ]);

    if (patientRes.rows.length === 0) return res.status(404).json({ error: 'Patient not found.' });
    const patient = patientRes.rows[0];
    const progress = progressRes.rows;
    const assessments = assessmentsRes.rows;

    // HIPAA audit
    pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, 'view_progress_report', 'patient', patientId, req.ip]
    ).catch(() => {});

    const messages = [
      {
        role: 'system',
        content: `You are an expert physical therapy AI. Analyze patient progress data and generate a clinical trend analysis and discharge readiness assessment. Respond ONLY with valid JSON in this exact format:
{
  "overall_trend": "<improving|stable|declining|mixed>",
  "progress_summary": "<narrative summary of patient progress>",
  "pain_trend": { "direction": "<decreasing|stable|increasing>", "analysis": "<pain trend analysis>" },
  "mobility_trend": { "direction": "<improving|stable|declining>", "analysis": "<mobility trend analysis>" },
  "strength_trend": { "direction": "<improving|stable|declining>", "analysis": "<strength trend analysis>" },
  "form_score_trend": { "direction": "<improving|stable|declining>", "analysis": "<movement quality trend>" },
  "key_achievements": ["<achievement>"],
  "areas_requiring_attention": ["<area>"],
  "discharge_readiness": {
    "estimated_percentage": <number 0-100>,
    "estimated_weeks_remaining": <number>,
    "discharge_criteria_met": ["<criterion>"],
    "discharge_criteria_pending": ["<criterion>"]
  },
  "treatment_recommendations": ["<recommendation>"],
  "goal_attainment": "<percentage of treatment goals achieved estimate>",
  "clinical_narrative": "<detailed clinical narrative for documentation>"
}`
      },
      {
        role: 'user',
        content: `Generate a progress report for:
Patient: ${patient.name}
Condition: ${patient.condition || 'Unknown'}
Injury Type: ${patient.injury_type || 'Unknown'}

Recovery Progress Timeline (${progress.length} data points):
${progress.map(p => `Date: ${p.assessment_date ? new Date(p.assessment_date).toLocaleDateString() : 'N/A'}, Pain: ${p.pain_level}/10, Mobility: ${p.mobility_score}%, Strength: ${p.strength_score}%`).join('\n') || 'No progress data available'}

Movement Assessment Scores (${assessments.length} assessments):
${assessments.map(a => `Date: ${a.assessment_date ? new Date(a.assessment_date).toLocaleDateString() : 'N/A'}, Exercise: ${a.exercise_name}, Form Score: ${a.form_score}/100`).join('\n') || 'No assessment data available'}

Analyze trends and provide discharge readiness estimate.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const report = extractJSON(content);

    await persistAIResult(req.user.id, 'progress-report', patientId, report);

    res.json({
      success: true,
      patient: { id: patient.id, name: patient.name, condition: patient.condition },
      progress_data: { recovery_progress: progress, movement_assessments: assessments },
      ai_report: report,
    });
  } catch (err) {
    console.error('Progress report error:', err);
    res.status(500).json({ error: 'Failed to generate progress report.', details: err.message });
  }
});

// POST /api/ai/appointment-optimize
// Predict no-shows, suggest overbooking, and surface scheduling slack
router.post('/appointment-optimize', async (req, res) => {
  try {
    const { window_days } = req.body;
    const days = Math.min(parseInt(window_days || 14, 10), 60);

    let upcoming = [];
    try {
      const result = await pool.query(
        `SELECT id, patient_id, therapist_id, appointment_date, appointment_time, type, status
         FROM appointments
         WHERE appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
         ORDER BY appointment_date, appointment_time
         LIMIT 200`
      );
      upcoming = result.rows;
    } catch (_) {}

    let history = [];
    try {
      const result = await pool.query(
        `SELECT patient_id, status, COUNT(*) AS count
         FROM appointments
         WHERE appointment_date >= CURRENT_DATE - INTERVAL '180 days'
         GROUP BY patient_id, status`
      );
      history = result.rows;
    } catch (_) {}

    const upcomingSummary = upcoming.map(a =>
      `id=${a.id} patient=${a.patient_id} therapist=${a.therapist_id} ${a.appointment_date} ${a.appointment_time || ''} type=${a.type || ''} status=${a.status || 'scheduled'}`
    ).join('\n');
    const historySummary = history.map(h => `patient=${h.patient_id} status=${h.status} count=${h.count}`).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are a PT clinic scheduling AI. Predict appointment no-show risk, suggest overbooking, and recommend scheduling actions. Always return valid JSON in this format:
{
  "no_show_risk": [{"appointment_id": 0, "patient_id": 0, "risk_score": 0.0, "reasons": ["string"]}],
  "overbooking_suggestions": [{"date": "YYYY-MM-DD", "slot": "HH:MM", "rationale": "string"}],
  "scheduling_gaps": [{"therapist_id": 0, "date": "YYYY-MM-DD", "slot": "HH:MM"}],
  "outreach_actions": [{"appointment_id": 0, "action": "string", "priority": "low|medium|high"}],
  "summary": "string"
}`
      },
      {
        role: 'user',
        content: `Upcoming appointments (${days} days):\n${upcomingSummary || 'None'}\n\nPast 180-day patient status counts:\n${historySummary || 'None'}\n\nReturn JSON only.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const parsed = extractJSON(content);

    await persistAIResult(req.user.id, 'appointment-optimize', null, parsed);
    res.json({ success: true, window_days: days, appointments_analyzed: upcoming.length, optimization: parsed });
  } catch (err) {
    console.error('appointment-optimize error:', err);
    res.status(500).json({ error: 'Failed to optimize appointments.', details: err.message });
  }
});

// POST /api/ai/patient-dropout-predict
// Flag at-risk patients (likely to drop out of therapy) and suggest engagement
router.post('/patient-dropout-predict', async (req, res) => {
  try {
    let patients = [];
    try {
      const result = await pool.query(
        `SELECT id, name, condition, intake_date, last_visit_date, total_visits, no_show_count, compliance_rate
         FROM patients
         ORDER BY last_visit_date DESC NULLS LAST
         LIMIT 200`
      );
      patients = result.rows;
    } catch (_) {
      try {
        const result = await pool.query('SELECT id, name FROM patients LIMIT 200');
        patients = result.rows;
      } catch (__) {}
    }

    const summary = patients.map(p =>
      `id=${p.id} name=${p.name} condition=${p.condition || ''} intake=${p.intake_date || ''} last=${p.last_visit_date || ''} visits=${p.total_visits || 0} no_shows=${p.no_show_count || 0} compliance=${p.compliance_rate || 'n/a'}`
    ).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are a PT clinic retention AI. Identify patients at risk of dropping out of therapy and recommend engagement strategies. Return valid JSON in this format:
{
  "at_risk_patients": [
    {
      "patient_id": 0,
      "name": "string",
      "risk_level": "low|moderate|high",
      "evidence": ["string"],
      "recommended_outreach": "string",
      "predicted_dropout_window": "string"
    }
  ],
  "cohort_summary": "string",
  "retention_recommendations": ["string"]
}`
      },
      {
        role: 'user',
        content: `Patient roster snapshot:\n${summary || 'None'}\n\nReturn JSON only.`
      }
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const parsed = extractJSON(content);

    await persistAIResult(req.user.id, 'patient-dropout-predict', null, parsed);
    res.json({ success: true, patients_analyzed: patients.length, prediction: parsed });
  } catch (err) {
    console.error('patient-dropout-predict error:', err);
    res.status(500).json({ error: 'Failed to predict patient dropout.', details: err.message });
  }
});

// POST /api/ai/exercise-difficulty-adapt
// Pass-5 backlog: NEEDS-PRODUCT-DECISION — auto-adjust exercise difficulty
// based on patient performance.
//
// PRODUCT-DECISION (default schema): performance is captured per
// home-exercise-program completion as `pain_during_exercise (0-10)`,
// `perceived_exertion (RPE 0-10)`, and `completion_pct (0-100)`.  We do
// NOT enforce a new schema; we read from `home_exercise_programs` and
// any payload provided.  When the table is missing we fall back to the
// `recent_logs` array on the request body so the FE can still render.
router.post('/exercise-difficulty-adapt', async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI provider not configured', missing: 'OPENROUTER_API_KEY' });
    }
    const { patient_id, exercise_id, recent_logs = [] } = req.body || {};

    let hep = [];
    try {
      const r = await pool.query(
        `SELECT id, exercise_id, sets, reps, frequency, completion_pct, last_performed_at
         FROM home_exercise_programs
         WHERE ($1::int IS NULL OR patient_id = $1)
         ORDER BY last_performed_at DESC NULLS LAST LIMIT 50`,
        [patient_id || null]
      );
      hep = r.rows;
    } catch (_) {}

    const messages = [
      {
        role: 'system',
        content: `You are a PT exercise progression AI. Given the patient's recent performance
(pain 0-10, RPE 0-10, completion %), recommend whether to PROGRESS, MAINTAIN, or REGRESS
each exercise with specific dosage changes. Return strict JSON:
{
  "recommendations": [{"exercise_id": 0, "verdict": "progress|maintain|regress",
    "new_sets": N, "new_reps": N, "new_frequency_per_week": N, "reasoning": "string"}],
  "overall_summary": "string",
  "safety_flags": ["string"]
}`,
      },
      {
        role: 'user',
        content: `Patient id: ${patient_id || 'unspecified'}\nExercise id: ${exercise_id || 'all'}\nRecent HEP rows:\n${JSON.stringify(hep, null, 2)}\nClient-supplied logs:\n${JSON.stringify(recent_logs, null, 2)}\n\nReturn JSON only.`,
      },
    ];

    const response = await callOpenRouter(messages);
    const content = response.choices[0].message.content;
    const parsed = extractJSON(content);

    await persistAIResult(req.user.id, 'exercise-difficulty-adapt', patient_id || null, parsed);
    res.json({ success: true, patient_id: patient_id || null, recommendations: parsed });
  } catch (err) {
    console.error('exercise-difficulty-adapt error:', err);
    res.status(500).json({ error: 'Failed to adapt exercise difficulty.', details: err.message });
  }
});

module.exports = router;
