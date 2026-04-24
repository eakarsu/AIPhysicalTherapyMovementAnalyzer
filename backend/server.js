const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Auth routes (no JWT required)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// JWT middleware for protected routes
const { authenticateToken } = require('./middleware/auth');

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
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/therapists', authenticateToken, therapistsRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api/messages', authenticateToken, messagesRoutes);
app.use('/api/exercise-videos', authenticateToken, exerciseVideosRoutes);
app.use('/api/pain-assessments', authenticateToken, painAssessmentsRoutes);
app.use('/api/outcome-measures', authenticateToken, outcomeMeasuresRoutes);
app.use('/api/reports', authenticateToken, reportsRoutes);
app.use('/api/waitlist', authenticateToken, waitlistRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
