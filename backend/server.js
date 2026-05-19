const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Fail hard if JWT_SECRET not set
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth routes (no JWT required)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// JWT middleware for protected routes
const { authenticateToken } = require('./middleware/auth');
const { aiRateLimiter } = require('./middleware/rateLimiter');

// Protected routes
const patientsRoutes = require('./routes/patients');
const exercisesRoutes = require('./routes/exercises');
const treatmentPlansRoutes = require('./routes/treatmentPlans');
const movementAssessmentsRoutes = require('./routes/movementAssessments');
const recoveryProgressRoutes = require('./routes/recoveryProgress');
const homeExerciseProgramsRoutes = require('./routes/homeExercisePrograms');
const appointmentsRoutes = require('./routes/appointments');
const treatmentNotesRoutes = require('./routes/treatmentNotes');
const aiRoutes = require('./routes/ai');
const therapistsRoutes = require('./routes/therapists');
const billingRoutes = require('./routes/billing');
const messagesRoutes = require('./routes/messages');
const exerciseVideosRoutes = require('./routes/exerciseVideos');
const painAssessmentsRoutes = require('./routes/painAssessments');
const outcomeMeasuresRoutes = require('./routes/outcomeMeasures');
const reportsRoutes = require('./routes/reports');
const waitlistRoutes = require('./routes/waitlist');

app.use('/api/patients', authenticateToken, patientsRoutes);
app.use('/api/exercises', authenticateToken, exercisesRoutes);
app.use('/api/treatment-plans', authenticateToken, treatmentPlansRoutes);
app.use('/api/movement-assessments', authenticateToken, movementAssessmentsRoutes);
app.use('/api/recovery-progress', authenticateToken, recoveryProgressRoutes);
app.use('/api/home-exercise-programs', authenticateToken, homeExerciseProgramsRoutes);
app.use('/api/appointments', authenticateToken, appointmentsRoutes);
app.use('/api/treatment-notes', authenticateToken, treatmentNotesRoutes);
app.use('/api/ai', authenticateToken, aiRateLimiter, aiRoutes);
app.use('/api/therapists', authenticateToken, therapistsRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api/messages', authenticateToken, messagesRoutes);
app.use('/api/exercise-videos', authenticateToken, exerciseVideosRoutes);
app.use('/api/pain-assessments', authenticateToken, painAssessmentsRoutes);
app.use('/api/outcome-measures', authenticateToken, outcomeMeasuresRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/waitlist', authenticateToken, waitlistRoutes);
// Pass-5 backlog: NEEDS-CREDS integrations (EHR/wearables/claims/telehealth) and content library
app.use('/api/integrations', authenticateToken, require('./routes/integrations'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Custom Views (Therapy Views) — mounted BEFORE any 404/catch-all ===
app.use('/api/custom-views', require('./routes/customViews'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});


// === Custom Feature Mounts (batch_06) ===
app.use('/api/cf-agentic-hep-execution', require('./routes/customFeat01_AgenticHepExecution'));
app.use('/api/cf-movement-quality-scoring', require('./routes/customFeat02_MovementQualityScoring'));
app.use('/api/cf-telehealth-live-feedback', require('./routes/customFeat03_TelehealthLiveFeedback'));
app.use('/api/cf-outcome-prediction-intervention', require('./routes/customFeat04_OutcomePredictionIntervention'));
app.use('/api/cf-pain-science-education', require('./routes/customFeat05_PainScienceEducation'));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-appointments-without-appointment', require('./routes/gapFeat_appointments_without_appointment'));
app.use('/api/gap-patients-without-patient', require('./routes/gapFeat_patients_without_patient'));
app.use('/api/gap-exercises-without-exercise', require('./routes/gapFeat_exercises_without_exercise'));
app.use('/api/gap-limited-ehr-medical-records-integration-only-stub', require('./routes/gapFeat_limited_ehr_medical_records_integration_only_stub'));
app.use('/api/gap-no-wearable-integration-accelerometer-movement-dat', require('./routes/gapFeat_no_wearable_integration_accelerometer_movement_dat'));
app.use('/api/gap-no-remote-monitoring-telehealth-with-real', require('./routes/gapFeat_no_remote_monitoring_telehealth_with_real'));
app.use('/api/gap-limited-insurance-billing-automation', require('./routes/gapFeat_limited_insurance_billing_automation'));
app.use('/api/gap-no-integration-with-fitness-activity-trackers', require('./routes/gapFeat_no_integration_with_fitness_activity_trackers'));
app.use('/api/gap-no-notifications-module-grep-0', require('./routes/gapFeat_no_notifications_module_grep_0'));
app.use('/api/gap-no-webhooks-for-referral-events', require('./routes/gapFeat_no_webhooks_for_referral_events'));
app.use('/api/gap-limited-mobile-app-1-mobile-reference-despite-hep-', require('./routes/gapFeat_limited_mobile_app_1_mobile_reference_despite_hep_'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
