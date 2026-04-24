const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

async function callOpenRouter(messages) {
  const body = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  });

  const url = new URL('https://openrouter.ai/api/v1/chat/completions');

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
            if (parsed.error) {
              reject(new Error(parsed.error.message || 'OpenRouter API error'));
            } else {
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
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return { raw_response: content };
      }
    }
    return { raw_response: content };
  }
}

// POST /api/ai/analyze-movement
router.post('/analyze-movement', async (req, res) => {
  try {
    const { exercise_name, patient_name, joint_angles, movement_description, pain_reported } = req.body;

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

    res.json({ success: true, analysis });
  } catch (err) {
    console.error('AI analyze-movement error:', err);
    res.status(500).json({ error: 'Failed to analyze movement.', details: err.message });
  }
});

// POST /api/ai/generate-treatment-plan
router.post('/generate-treatment-plan', async (req, res) => {
  try {
    const { patient_name, age, condition, injury_type, pain_level, mobility_score, medical_history, goals } = req.body;

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

    res.json({ success: true, treatment_plan: plan });
  } catch (err) {
    console.error('AI generate-treatment-plan error:', err);
    res.status(500).json({ error: 'Failed to generate treatment plan.', details: err.message });
  }
});

// POST /api/ai/assess-recovery
router.post('/assess-recovery', async (req, res) => {
  try {
    const { patient_name, condition, injury_type, weeks_in_treatment, pain_history, mobility_history, strength_history, current_exercises, compliance_rate } = req.body;

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

    res.json({ success: true, recovery_assessment: assessment });
  } catch (err) {
    console.error('AI assess-recovery error:', err);
    res.status(500).json({ error: 'Failed to assess recovery.', details: err.message });
  }
});

// POST /api/ai/recommend-exercises
router.post('/recommend-exercises', async (req, res) => {
  try {
    const { condition, injury_type, pain_level, mobility_score, strength_score, phase, equipment_available, contraindications } = req.body;

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

    res.json({ success: true, exercise_recommendations: recommendations });
  } catch (err) {
    console.error('AI recommend-exercises error:', err);
    res.status(500).json({ error: 'Failed to recommend exercises.', details: err.message });
  }
});

// POST /api/ai/generate-hep
router.post('/generate-hep', async (req, res) => {
  try {
    const { patient_name, condition, injury_type, current_phase, pain_level, functional_goals, available_equipment, time_per_session } = req.body;

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

    res.json({ success: true, home_exercise_program: hep });
  } catch (err) {
    console.error('AI generate-hep error:', err);
    res.status(500).json({ error: 'Failed to generate home exercise program.', details: err.message });
  }
});

// POST /api/ai/generate-soap-note
router.post('/generate-soap-note', async (req, res) => {
  try {
    const { patient_name, condition, visit_type, patient_complaints, observed_findings, treatments_performed, vitals, measurements, exercise_performance, patient_goals } = req.body;

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

    res.json({ success: true, soap_note: soapNote });
  } catch (err) {
    console.error('AI generate-soap-note error:', err);
    res.status(500).json({ error: 'Failed to generate SOAP note.', details: err.message });
  }
});

// POST /api/ai/analyze-pain
router.post('/analyze-pain', async (req, res) => {
  try {
    const { patient_name, pain_history, body_regions, pain_types, triggers, current_medications, functional_limitations } = req.body;

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

    res.json({ success: true, pain_analysis: analysis });
  } catch (err) {
    console.error('AI analyze-pain error:', err);
    res.status(500).json({ error: 'Failed to analyze pain.', details: err.message });
  }
});

// POST /api/ai/predict-outcomes
router.post('/predict-outcomes', async (req, res) => {
  try {
    const { patient_name, condition, age, measure_type, current_score, previous_scores, weeks_in_treatment, compliance_rate, comorbidities } = req.body;

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

    res.json({ success: true, outcome_prediction: prediction });
  } catch (err) {
    console.error('AI predict-outcomes error:', err);
    res.status(500).json({ error: 'Failed to predict outcomes.', details: err.message });
  }
});

module.exports = router;
