// integrations.js — pass-5 backlog implementation for AIPhysicalTherapyMovementAnalyzer.
//
// NEEDS-CREDS routes: EHR (FHIR), wearable, claims clearinghouse, telehealth.
// All gate on env vars and return 503 + `missing: <ENV>` when unset.
//
// Required environment variables for full integration:
//   EHR / FHIR:
//     FHIR_BASE_URL, FHIR_CLIENT_ID, FHIR_CLIENT_SECRET
//   Wearables:
//     APPLE_HEALTH_CLIENT_ID, APPLE_HEALTH_CLIENT_SECRET (or)
//     FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET
//   Claims clearinghouse (e.g. Change Healthcare, Availity):
//     CLAIMS_CLEARINGHOUSE_URL, CLAIMS_CLEARINGHOUSE_API_KEY
//   Telehealth (e.g. Twilio Video, Zoom):
//     TELEHEALTH_PROVIDER_API_KEY, TELEHEALTH_PROVIDER_API_SECRET
const express = require('express');
const router = express.Router();
const pool = require('../db');

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ehr_sync_log (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER,
      direction VARCHAR(16) NOT NULL,
      resource_type VARCHAR(64),
      status VARCHAR(32) NOT NULL DEFAULT 'queued',
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wearable_observations (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER,
      provider VARCHAR(32) NOT NULL,
      metric VARCHAR(64) NOT NULL,
      value NUMERIC,
      unit VARCHAR(32),
      recorded_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS claims_submissions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER,
      cpt_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
      icd_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
      total_amount NUMERIC,
      status VARCHAR(32) NOT NULL DEFAULT 'prepared',
      external_id VARCHAR(128),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telehealth_sessions (
      id SERIAL PRIMARY KEY,
      appointment_id INTEGER,
      patient_id INTEGER,
      therapist_id INTEGER,
      provider VARCHAR(32),
      external_session_id VARCHAR(128),
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pain_education_content (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      url TEXT,
      duration_minutes INTEGER,
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      summary TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}
ensureTables().catch(() => {});

// GET /api/integrations/_/status — capability discovery (auth via parent middleware)
router.get('/_/status', (req, res) => {
  const ehr_missing = ['FHIR_BASE_URL', 'FHIR_CLIENT_ID', 'FHIR_CLIENT_SECRET'].filter(e => !process.env[e]);
  const apple_missing = ['APPLE_HEALTH_CLIENT_ID', 'APPLE_HEALTH_CLIENT_SECRET'].filter(e => !process.env[e]);
  const fitbit_missing = ['FITBIT_CLIENT_ID', 'FITBIT_CLIENT_SECRET'].filter(e => !process.env[e]);
  const claims_missing = ['CLAIMS_CLEARINGHOUSE_URL', 'CLAIMS_CLEARINGHOUSE_API_KEY'].filter(e => !process.env[e]);
  const tele_missing = ['TELEHEALTH_PROVIDER_API_KEY', 'TELEHEALTH_PROVIDER_API_SECRET'].filter(e => !process.env[e]);
  res.json({
    ehr_fhir: { configured: !ehr_missing.length, missing: ehr_missing },
    wearables: {
      apple_health: { configured: !apple_missing.length, missing: apple_missing },
      fitbit: { configured: !fitbit_missing.length, missing: fitbit_missing },
    },
    claims: { configured: !claims_missing.length, missing: claims_missing },
    telehealth: { configured: !tele_missing.length, missing: tele_missing },
  });
});

// POST /api/integrations/ehr/sync
router.post('/ehr/sync', async (req, res) => {
  const missing = ['FHIR_BASE_URL', 'FHIR_CLIENT_ID', 'FHIR_CLIENT_SECRET'].filter(e => !process.env[e]);
  if (missing.length) return res.status(503).json({ error: 'EHR/FHIR not configured', missing });
  const { patient_id, resource_type = 'Patient', direction = 'pull' } = req.body || {};
  try {
    const r = await pool.query(
      `INSERT INTO ehr_sync_log (patient_id, direction, resource_type, status, details)
       VALUES ($1,$2,$3,'queued',$4)
       RETURNING id, patient_id, direction, resource_type, status, created_at`,
      [patient_id || null, direction, resource_type, JSON.stringify({ note: 'Stub: real FHIR call deferred to delivery worker' })]
    );
    res.status(202).json({ success: true, sync: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/integrations/wearable/sync
router.post('/wearable/sync', async (req, res) => {
  const { provider, patient_id } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider required (apple_health|fitbit)' });
  let missing = [];
  if (provider === 'apple_health') missing = ['APPLE_HEALTH_CLIENT_ID', 'APPLE_HEALTH_CLIENT_SECRET'].filter(e => !process.env[e]);
  else if (provider === 'fitbit') missing = ['FITBIT_CLIENT_ID', 'FITBIT_CLIENT_SECRET'].filter(e => !process.env[e]);
  else return res.status(400).json({ error: 'provider must be apple_health|fitbit' });
  if (missing.length) return res.status(503).json({ error: `${provider} not configured`, missing });
  res.status(202).json({
    success: true,
    note: 'Stub: credentials present; outbound sync deferred to delivery worker.',
    queued_for: { provider, patient_id: patient_id || null, at: new Date().toISOString() },
  });
});

// POST /api/integrations/claims/submit
router.post('/claims/submit', async (req, res) => {
  const missing = ['CLAIMS_CLEARINGHOUSE_URL', 'CLAIMS_CLEARINGHOUSE_API_KEY'].filter(e => !process.env[e]);
  if (missing.length) return res.status(503).json({ error: 'Claims clearinghouse not configured', missing });
  const { patient_id, cpt_codes = [], icd_codes = [], total_amount } = req.body || {};
  if (!Array.isArray(cpt_codes) || !cpt_codes.length) {
    return res.status(400).json({ error: 'cpt_codes required (non-empty array)' });
  }
  try {
    const r = await pool.query(
      `INSERT INTO claims_submissions (patient_id, cpt_codes, icd_codes, total_amount, status)
       VALUES ($1,$2,$3,$4,'prepared')
       RETURNING id, patient_id, cpt_codes, icd_codes, total_amount, status, created_at`,
      [patient_id || null, cpt_codes, icd_codes, total_amount || null]
    );
    res.status(202).json({ success: true, submission: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/integrations/telehealth/session
// PRODUCT-DECISION: telehealth provider abstracted — payload compatible with
// Twilio Video / Zoom / Daily by using `provider` discriminator.  Real-time
// movement feedback is explicitly out of scope; this is room provisioning only.
router.post('/telehealth/session', async (req, res) => {
  const missing = ['TELEHEALTH_PROVIDER_API_KEY', 'TELEHEALTH_PROVIDER_API_SECRET'].filter(e => !process.env[e]);
  if (missing.length) return res.status(503).json({ error: 'Telehealth not configured', missing });
  const { appointment_id, patient_id, therapist_id, provider = 'twilio_video' } = req.body || {};
  try {
    const r = await pool.query(
      `INSERT INTO telehealth_sessions (appointment_id, patient_id, therapist_id, provider, status)
       VALUES ($1,$2,$3,$4,'pending')
       RETURNING id, appointment_id, patient_id, therapist_id, provider, status, created_at`,
      [appointment_id || null, patient_id || null, therapist_id || null, provider]
    );
    res.status(202).json({ success: true, session: r.rows[0], note: 'Stub: real provider room creation deferred.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/integrations/content/pain-education
// PRODUCT-DECISION: content library kept in DB (`pain_education_content`)
// rather than a CMS, with seedable rows.  No upload pipeline yet.
router.get('/content/pain-education', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, title, url, duration_minutes, tags, summary, created_at
       FROM pain_education_content ORDER BY created_at DESC LIMIT 200`
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/content/pain-education', async (req, res) => {
  const { title, url, duration_minutes, tags, summary } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const r = await pool.query(
      `INSERT INTO pain_education_content (title, url, duration_minutes, tags, summary)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, url || null, duration_minutes || null, Array.isArray(tags) ? tags : [], summary || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
