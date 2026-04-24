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
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
