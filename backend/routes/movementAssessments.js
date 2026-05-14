const express = require('express');
const router = express.Router();
const pool = require('../db');
const path = require('path');
const fs = require('fs');
const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

let multer;
try { multer = require('multer'); } catch (e) { multer = null; }

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

let upload = null;
if (multer) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  });
  upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video and image files are allowed'));
      }
    },
  });
}

async function callOpenRouterVision(imageBase64, mimeType, prompt) {
  const body = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    temperature: 0.3,
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
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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
            if (parsed.error) reject(new Error(parsed.error.message || 'OpenRouter API error'));
            else resolve(parsed);
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
  try { return JSON.parse(content); } catch {}
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) { try { return JSON.parse(match[1].trim()); } catch {} }
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch {} }
  return { raw_response: content };
}

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

// GET /api/movement-assessments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ma.*, p.name as patient_name, e.name as exercise_name
       FROM movement_assessments ma
       LEFT JOIN patients p ON ma.patient_id = p.id
       LEFT JOIN exercises e ON ma.exercise_id = e.id
       ORDER BY ma.assessment_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching movement assessments:', err);
    res.status(500).json({ error: 'Failed to fetch movement assessments.' });
  }
});

// GET /api/movement-assessments/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ma.*, p.name as patient_name, e.name as exercise_name
       FROM movement_assessments ma
       LEFT JOIN patients p ON ma.patient_id = p.id
       LEFT JOIN exercises e ON ma.exercise_id = e.id
       WHERE ma.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement assessment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching movement assessment:', err);
    res.status(500).json({ error: 'Failed to fetch movement assessment.' });
  }
});

// POST /api/movement-assessments
router.post('/', async (req, res) => {
  try {
    const { patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url } = req.body;
    const result = await pool.query(
      `INSERT INTO movement_assessments (patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, exercise_id, assessment_date, form_score, ai_feedback, JSON.stringify(joint_angles), movement_quality, recommendations, video_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating movement assessment:', err);
    res.status(500).json({ error: 'Failed to create movement assessment.' });
  }
});

// PUT /api/movement-assessments/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, exercise_id, assessment_date, form_score, ai_feedback, joint_angles, movement_quality, recommendations, video_url } = req.body;
    const result = await pool.query(
      `UPDATE movement_assessments SET patient_id=$1, exercise_id=$2, assessment_date=$3, form_score=$4,
       ai_feedback=$5, joint_angles=$6, movement_quality=$7, recommendations=$8, video_url=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [patient_id, exercise_id, assessment_date, form_score, ai_feedback, JSON.stringify(joint_angles), movement_quality, recommendations, video_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement assessment not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating movement assessment:', err);
    res.status(500).json({ error: 'Failed to update movement assessment.' });
  }
});

// DELETE /api/movement-assessments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM movement_assessments WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movement assessment not found.' });
    }
    res.json({ message: 'Movement assessment deleted successfully.', assessment: result.rows[0] });
  } catch (err) {
    console.error('Error deleting movement assessment:', err);
    res.status(500).json({ error: 'Failed to delete movement assessment.' });
  }
});

// POST /api/movement-assessments/:id/upload-video
router.post('/:id/upload-video', async (req, res) => {
  if (!upload) return res.status(501).json({ error: 'File upload not available (multer not installed)' });
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);

    await pool.query(
      `UPDATE movement_assessments SET video_url = $1, updated_at = NOW() WHERE id = $2`,
      [relativePath, req.params.id]
    ).catch(() => {});

    // HIPAA audit
    pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id || null, 'upload_assessment_file', 'movement_assessment', req.params.id, req.ip]
    ).catch(() => {});

    res.json({ success: true, file_path: relativePath, message: 'File uploaded successfully' });
  });
});

// POST /api/movement-assessments/:id/analyze-visual
router.post('/:id/analyze-visual', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movement_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });

    const assessment = result.rows[0];
    if (!assessment.video_url) return res.status(400).json({ error: 'No image/video uploaded for this assessment. Use upload-video first.' });

    const filePath = path.join(__dirname, '..', assessment.video_url);
    if (!fs.existsSync(filePath)) return res.status(400).json({ error: 'Uploaded file not found on disk' });

    const ext = path.extname(filePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
    if (!isImage) {
      return res.status(400).json({ error: 'Visual analysis requires an image file (jpg, png, webp). Video analysis is not yet supported via vision API.' });
    }

    const imageBuffer = fs.readFileSync(filePath);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp' };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const prompt = `You are an expert physical therapy movement analyst. Analyze this image for posture, movement quality, and potential injury risk. Respond ONLY with valid JSON in this exact format:
{
  "posture_assessment": "<description of observed posture>",
  "posture_score": <number 0-100>,
  "alignment_issues": ["<issue>"],
  "movement_quality": "<excellent|good|fair|poor>",
  "visible_compensations": ["<compensation>"],
  "injury_risk_areas": ["<risk area>"],
  "positive_findings": ["<good finding>"],
  "corrective_recommendations": ["<recommendation>"],
  "exercise_modifications": ["<modification>"],
  "overall_assessment": "<summary>"
}`;

    const aiResponse = await callOpenRouterVision(imageBase64, mimeType, prompt);
    const content = aiResponse.choices[0].message.content;
    const analysis = extractJSON(content);

    await persistAIResult(req.user?.id, 'analyze-visual', assessment.patient_id, analysis);

    await pool.query(
      `UPDATE movement_assessments SET ai_analysis = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(analysis), req.params.id]
    ).catch(() => {});

    res.json({ success: true, visual_analysis: analysis });
  } catch (err) {
    console.error('Visual analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze visual', details: err.message });
  }
});

module.exports = router;
