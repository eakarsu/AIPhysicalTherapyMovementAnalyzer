import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Exercises from './pages/Exercises';
import TreatmentPlans from './pages/TreatmentPlans';
import MovementAssessments from './pages/MovementAssessments';
import RecoveryProgress from './pages/RecoveryProgress';
import HomeExercisePrograms from './pages/HomeExercisePrograms';
import Appointments from './pages/Appointments';
import TreatmentNotes from './pages/TreatmentNotes';
import AIAnalysis from './pages/AIAnalysis';
import Therapists from './pages/Therapists';
import Billing from './pages/Billing';
import Messages from './pages/Messages';
import ExerciseVideos from './pages/ExerciseVideos';
import PainAssessments from './pages/PainAssessments';
import OutcomeMeasures from './pages/OutcomeMeasures';
import Reports from './pages/Reports';
import PatientProfile from './pages/PatientProfile';
import Waitlist from './pages/Waitlist';
import AIHistory from './pages/AIHistory';
import AuditLog from './pages/AuditLog';
import OutcomeScoreCalculator from './pages/OutcomeScoreCalculator';
import ROMCalculator from './pages/ROMCalculator';
import ExercisePrescription from './pages/ExercisePrescription';
import ProgressChart from './pages/ProgressChart';
import AppointmentOptimize from './pages/AppointmentOptimize';
import PatientDropoutPredict from './pages/PatientDropoutPredict';

// // === Batch 06 Gaps & Frontend Mounts ===
import CFAgenticHepExecutionPage from './pages/CFAgenticHepExecutionPage';
import CFMovementQualityScoringPage from './pages/CFMovementQualityScoringPage';
import CFTelehealthLiveFeedbackPage from './pages/CFTelehealthLiveFeedbackPage';
import CFOutcomePredictionInterventionPage from './pages/CFOutcomePredictionInterventionPage';
import CFPainScienceEducationPage from './pages/CFPainScienceEducationPage';
import GapAppointmentsWithoutAppointmentPage from './pages/GapAppointmentsWithoutAppointmentPage';
import GapPatientsWithoutPatientPage from './pages/GapPatientsWithoutPatientPage';
import GapExercisesWithoutExercisePage from './pages/GapExercisesWithoutExercisePage';
import GapLimitedEhrMedicalRecordsIntegrationOnlyStubPage from './pages/GapLimitedEhrMedicalRecordsIntegrationOnlyStubPage';
import GapNoWearableIntegrationAccelerometerMovementDatPage from './pages/GapNoWearableIntegrationAccelerometerMovementDatPage';
import GapNoRemoteMonitoringTelehealthWithRealPage from './pages/GapNoRemoteMonitoringTelehealthWithRealPage';
import GapLimitedInsuranceBillingAutomationPage from './pages/GapLimitedInsuranceBillingAutomationPage';
import GapNoIntegrationWithFitnessActivityTrackersPage from './pages/GapNoIntegrationWithFitnessActivityTrackersPage';
import GapNoNotificationsModuleGrep0Page from './pages/GapNoNotificationsModuleGrep0Page';
import GapNoWebhooksForReferralEventsPage from './pages/GapNoWebhooksForReferralEventsPage';
import GapLimitedMobileApp1MobileReferenceDespiteHepPage from './pages/GapLimitedMobileApp1MobileReferenceDespiteHepPage';
import CustomViewsPage from './pages/CustomViewsPage';
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
        <Route path="/treatment-plans" element={<ProtectedRoute><TreatmentPlans /></ProtectedRoute>} />
        <Route path="/movement-assessments" element={<ProtectedRoute><MovementAssessments /></ProtectedRoute>} />
        <Route path="/recovery-progress" element={<ProtectedRoute><RecoveryProgress /></ProtectedRoute>} />
        <Route path="/home-exercise-programs" element={<ProtectedRoute><HomeExercisePrograms /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/treatment-notes" element={<ProtectedRoute><TreatmentNotes /></ProtectedRoute>} />
        <Route path="/ai-analysis" element={<ProtectedRoute><AIAnalysis /></ProtectedRoute>} />
        <Route path="/therapists" element={<ProtectedRoute><Therapists /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/exercise-videos" element={<ProtectedRoute><ExerciseVideos /></ProtectedRoute>} />
        <Route path="/pain-assessments" element={<ProtectedRoute><PainAssessments /></ProtectedRoute>} />
        <Route path="/outcome-measures" element={<ProtectedRoute><OutcomeMeasures /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/patient-profile/:id" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
        <Route path="/waitlist" element={<ProtectedRoute><Waitlist /></ProtectedRoute>} />
        <Route path="/ai-history" element={<ProtectedRoute><AIHistory /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
        <Route path="/outcome-score-calculator" element={<ProtectedRoute><OutcomeScoreCalculator /></ProtectedRoute>} />
        <Route path="/rom-calculator" element={<ProtectedRoute><ROMCalculator /></ProtectedRoute>} />
        <Route path="/exercise-prescription" element={<ProtectedRoute><ExercisePrescription /></ProtectedRoute>} />
        <Route path="/progress-chart" element={<ProtectedRoute><ProgressChart /></ProtectedRoute>} />
        <Route path="/appointment-optimize" element={<ProtectedRoute><AppointmentOptimize /></ProtectedRoute>} />
        <Route path="/patient-dropout-predict" element={<ProtectedRoute><PatientDropoutPredict /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-hep-execution" element={<CFAgenticHepExecutionPage />} />
          <Route path="/cf-movement-quality-scoring" element={<CFMovementQualityScoringPage />} />
          <Route path="/cf-telehealth-live-feedback" element={<CFTelehealthLiveFeedbackPage />} />
          <Route path="/cf-outcome-prediction-intervention" element={<CFOutcomePredictionInterventionPage />} />
          <Route path="/cf-pain-science-education" element={<CFPainScienceEducationPage />} />
          <Route path="/gap-appointments-without-appointment" element={<GapAppointmentsWithoutAppointmentPage />} />
          <Route path="/gap-patients-without-patient" element={<GapPatientsWithoutPatientPage />} />
          <Route path="/gap-exercises-without-exercise" element={<GapExercisesWithoutExercisePage />} />
          <Route path="/gap-limited-ehr-medical-records-integration-only-stub" element={<GapLimitedEhrMedicalRecordsIntegrationOnlyStubPage />} />
          <Route path="/gap-no-wearable-integration-accelerometer-movement-dat" element={<GapNoWearableIntegrationAccelerometerMovementDatPage />} />
          <Route path="/gap-no-remote-monitoring-telehealth-with-real" element={<GapNoRemoteMonitoringTelehealthWithRealPage />} />
          <Route path="/gap-limited-insurance-billing-automation" element={<GapLimitedInsuranceBillingAutomationPage />} />
          <Route path="/gap-no-integration-with-fitness-activity-trackers" element={<GapNoIntegrationWithFitnessActivityTrackersPage />} />
          <Route path="/gap-no-notifications-module-grep-0" element={<GapNoNotificationsModuleGrep0Page />} />
          <Route path="/gap-no-webhooks-for-referral-events" element={<GapNoWebhooksForReferralEventsPage />} />
          <Route path="/gap-limited-mobile-app-1-mobile-reference-despite-hep-" element={<GapLimitedMobileApp1MobileReferenceDespiteHepPage />} />
        </Routes>
    </Router>
  );
}

export default App;
