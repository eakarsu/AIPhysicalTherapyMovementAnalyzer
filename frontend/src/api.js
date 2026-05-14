import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });

// Patients
export const getPatients = () => api.get('/patients');
export const getPatient = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);

// Exercises
export const getExercises = () => api.get('/exercises');
export const getExercise = (id) => api.get(`/exercises/${id}`);
export const createExercise = (data) => api.post('/exercises', data);
export const updateExercise = (id, data) => api.put(`/exercises/${id}`, data);
export const deleteExercise = (id) => api.delete(`/exercises/${id}`);

// Treatment Plans
export const getTreatmentPlans = () => api.get('/treatment-plans');
export const getTreatmentPlan = (id) => api.get(`/treatment-plans/${id}`);
export const createTreatmentPlan = (data) => api.post('/treatment-plans', data);
export const updateTreatmentPlan = (id, data) => api.put(`/treatment-plans/${id}`, data);
export const deleteTreatmentPlan = (id) => api.delete(`/treatment-plans/${id}`);

// Movement Assessments
export const getMovementAssessments = () => api.get('/movement-assessments');
export const getMovementAssessment = (id) => api.get(`/movement-assessments/${id}`);
export const createMovementAssessment = (data) => api.post('/movement-assessments', data);
export const updateMovementAssessment = (id, data) => api.put(`/movement-assessments/${id}`, data);
export const deleteMovementAssessment = (id) => api.delete(`/movement-assessments/${id}`);

// Recovery Progress
export const getRecoveryProgress = () => api.get('/recovery-progress');
export const getRecoveryProgressItem = (id) => api.get(`/recovery-progress/${id}`);
export const createRecoveryProgress = (data) => api.post('/recovery-progress', data);
export const updateRecoveryProgress = (id, data) => api.put(`/recovery-progress/${id}`, data);
export const deleteRecoveryProgress = (id) => api.delete(`/recovery-progress/${id}`);

// Home Exercise Programs
export const getHomeExercisePrograms = () => api.get('/home-exercise-programs');
export const getHomeExerciseProgram = (id) => api.get(`/home-exercise-programs/${id}`);
export const createHomeExerciseProgram = (data) => api.post('/home-exercise-programs', data);
export const updateHomeExerciseProgram = (id, data) => api.put(`/home-exercise-programs/${id}`, data);
export const deleteHomeExerciseProgram = (id) => api.delete(`/home-exercise-programs/${id}`);

// Appointments
export const getAppointments = () => api.get('/appointments');
export const getAppointment = (id) => api.get(`/appointments/${id}`);
export const createAppointment = (data) => api.post('/appointments', data);
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

// Treatment Notes
export const getTreatmentNotes = () => api.get('/treatment-notes');
export const getTreatmentNote = (id) => api.get(`/treatment-notes/${id}`);
export const createTreatmentNote = (data) => api.post('/treatment-notes', data);
export const updateTreatmentNote = (id, data) => api.put(`/treatment-notes/${id}`, data);
export const deleteTreatmentNote = (id) => api.delete(`/treatment-notes/${id}`);

// Therapists
export const getTherapists = () => api.get('/therapists');
export const getTherapist = (id) => api.get(`/therapists/${id}`);
export const createTherapist = (data) => api.post('/therapists', data);
export const updateTherapist = (id, data) => api.put(`/therapists/${id}`, data);
export const deleteTherapist = (id) => api.delete(`/therapists/${id}`);

// Billing
export const getBilling = () => api.get('/billing');
export const getBillingItem = (id) => api.get(`/billing/${id}`);
export const createBilling = (data) => api.post('/billing', data);
export const updateBilling = (id, data) => api.put(`/billing/${id}`, data);
export const deleteBilling = (id) => api.delete(`/billing/${id}`);

// Messages
export const getMessages = () => api.get('/messages');
export const getMessage = (id) => api.get(`/messages/${id}`);
export const createMessage = (data) => api.post('/messages', data);
export const updateMessage = (id, data) => api.put(`/messages/${id}`, data);
export const deleteMessage = (id) => api.delete(`/messages/${id}`);
export const markMessageRead = (id) => api.put(`/messages/${id}/read`);

// Exercise Videos
export const getExerciseVideos = () => api.get('/exercise-videos');
export const getExerciseVideo = (id) => api.get(`/exercise-videos/${id}`);
export const createExerciseVideo = (data) => api.post('/exercise-videos', data);
export const updateExerciseVideo = (id, data) => api.put(`/exercise-videos/${id}`, data);
export const deleteExerciseVideo = (id) => api.delete(`/exercise-videos/${id}`);

// Pain Assessments
export const getPainAssessments = () => api.get('/pain-assessments');
export const getPainAssessment = (id) => api.get(`/pain-assessments/${id}`);
export const createPainAssessment = (data) => api.post('/pain-assessments', data);
export const updatePainAssessment = (id, data) => api.put(`/pain-assessments/${id}`, data);
export const deletePainAssessment = (id) => api.delete(`/pain-assessments/${id}`);

// Outcome Measures
export const getOutcomeMeasures = () => api.get('/outcome-measures');
export const getOutcomeMeasure = (id) => api.get(`/outcome-measures/${id}`);
export const createOutcomeMeasure = (data) => api.post('/outcome-measures', data);
export const updateOutcomeMeasure = (id, data) => api.put(`/outcome-measures/${id}`, data);
export const deleteOutcomeMeasure = (id) => api.delete(`/outcome-measures/${id}`);

// Reports
export const getReportsOverview = () => api.get('/reports/overview');

// Waitlist
export const getWaitlist = () => api.get('/waitlist');
export const getWaitlistItem = (id) => api.get(`/waitlist/${id}`);
export const createWaitlistEntry = (data) => api.post('/waitlist', data);
export const updateWaitlistEntry = (id, data) => api.put(`/waitlist/${id}`, data);
export const deleteWaitlistEntry = (id) => api.delete(`/waitlist/${id}`);

// Patient Profile
export const getPatientProfile = (id) => api.get(`/patients/${id}/profile`);

// Patient Search
export const searchPatients = (q) => api.get(`/patients/search?q=${encodeURIComponent(q)}`);

// AI Endpoints
export const aiAnalyzeMovement = (data) => api.post('/ai/analyze-movement', data);
export const aiGenerateTreatmentPlan = (data) => api.post('/ai/generate-treatment-plan', data);
export const aiAssessRecovery = (data) => api.post('/ai/assess-recovery', data);
export const aiRecommendExercises = (data) => api.post('/ai/recommend-exercises', data);
export const aiGenerateHEP = (data) => api.post('/ai/generate-hep', data);
export const aiGenerateSOAPNote = (data) => api.post('/ai/generate-soap-note', data);
export const aiAnalyzePain = (data) => api.post('/ai/analyze-pain', data);
export const aiPredictOutcomes = (data) => api.post('/ai/predict-outcomes', data);
export const getAIHistory = (page = 1, limit = 20) => api.get(`/ai/history?page=${page}&limit=${limit}`);
export const getAuditLogs = (page = 1, limit = 20) => api.get(`/ai/audit-logs?page=${page}&limit=${limit}`);

// Outcome Measure Scoring
export const scoreOutcomeMeasure = (data) => api.post('/outcome-measures/score', data);
export const getOutcomeTrend = (patientId) => api.get(`/outcome-measures/patient/${patientId}/trend`);
export const getOutcomeMeasureTemplates = () => api.get('/outcome-measures/templates');
export const createOutcomeMeasureTemplate = (data) => api.post('/outcome-measures/templates', data);
export const submitPatientAssessment = (data) => api.post('/outcome-measures/patient-assessment', data);

// Paginated list endpoints
export const getPatientsPaged = (page = 1, limit = 20) => api.get(`/patients?page=${page}&limit=${limit}`);
export const getAppointmentsPaged = (page = 1, limit = 20) => api.get(`/appointments?page=${page}&limit=${limit}`);
export const getTreatmentPlansPaged = (page = 1, limit = 20) => api.get(`/treatment-plans?page=${page}&limit=${limit}`);

// New AI endpoints
export const aiRomCalculator = (data) => api.post('/ai/rom-calculator', data);
export const aiPrescribeExercises = (patientId) => api.post(`/patients/${patientId}/prescribe-exercises`, {});
export const aiProgressReport = (patientId) => api.get(`/ai/progress-report/${patientId}`);

// Video/Image upload
export const uploadAssessmentVideo = (assessmentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/movement-assessments/${assessmentId}/upload-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const analyzeAssessmentVisual = (assessmentId) =>
  api.post(`/movement-assessments/${assessmentId}/analyze-visual`);

export default api;
