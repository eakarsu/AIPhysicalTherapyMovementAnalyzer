import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {
  getPatients, getExercises, getTreatmentPlans, getMovementAssessments,
  getRecoveryProgress, getHomeExercisePrograms, getAppointments, getTreatmentNotes,
  getTherapists, getBilling, getMessages, getExerciseVideos, getPainAssessments, getOutcomeMeasures,
  getWaitlist,
} from '../api';

const features = [
  { path: '/patients', icon: '👤', title: 'Patients', description: 'Manage patient records and profiles', countKey: 'patients', color: '#2563eb' },
  { path: '/therapists', icon: '🩺', title: 'Therapists', description: 'Manage therapist profiles and schedules', countKey: 'therapists', color: '#7c3aed' },
  { path: '/exercises', icon: '🏋️', title: 'Exercise Library', description: 'Browse and manage therapeutic exercises', countKey: 'exercises', color: '#059669' },
  { path: '/exercise-videos', icon: '🎬', title: 'Exercise Videos', description: 'Video library for exercise demonstrations', countKey: 'videos', color: '#0891b2' },
  { path: '/treatment-plans', icon: '📋', title: 'Treatment Plans', description: 'Create and track treatment protocols', countKey: 'treatmentPlans', color: '#7c3aed' },
  { path: '/movement-assessments', icon: '🎯', title: 'Movement Assessments', description: 'AI-powered exercise form analysis', countKey: 'assessments', color: '#dc2626' },
  { path: '/recovery-progress', icon: '📈', title: 'Recovery Progress', description: 'Track patient recovery milestones', countKey: 'recovery', color: '#d97706' },
  { path: '/home-exercise-programs', icon: '🏠', title: 'Home Exercise Programs', description: 'Monitor home exercise compliance', countKey: 'hep', color: '#0891b2' },
  { path: '/appointments', icon: '📅', title: 'Appointments', description: 'Schedule and manage appointments', countKey: 'appointments', color: '#be185d' },
  { path: '/treatment-notes', icon: '📝', title: 'Treatment Notes', description: 'SOAP notes and documentation', countKey: 'notes', color: '#4338ca' },
  { path: '/pain-assessments', icon: '🔴', title: 'Pain Assessments', description: 'Detailed pain tracking and body mapping', countKey: 'pain', color: '#dc2626' },
  { path: '/outcome-measures', icon: '📊', title: 'Outcome Measures', description: 'Standardized outcome measurement tools', countKey: 'outcomes', color: '#059669' },
  { path: '/billing', icon: '💰', title: 'Billing & Insurance', description: 'Track billing, claims, and payments', countKey: 'billing', color: '#d97706' },
  { path: '/messages', icon: '💬', title: 'Messages', description: 'Patient-therapist communication', countKey: 'messages', color: '#2563eb' },
  { path: '/waitlist', icon: '⏳', title: 'Waitlist', description: 'Manage patient appointment waitlist', countKey: 'waitlist', color: '#be185d' },
  { path: '/reports', icon: '📊', title: 'Reports & Analytics', description: 'Clinic performance metrics and insights', countKey: null, color: '#4338ca' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const results = await Promise.allSettled([
          getPatients(), getExercises(), getTreatmentPlans(), getMovementAssessments(),
          getRecoveryProgress(), getHomeExercisePrograms(), getAppointments(), getTreatmentNotes(),
          getTherapists(), getBilling(), getMessages(), getExerciseVideos(), getPainAssessments(), getOutcomeMeasures(),
          getWaitlist(),
        ]);
        const keys = ['patients', 'exercises', 'treatmentPlans', 'assessments', 'recovery', 'hep', 'appointments', 'notes', 'therapists', 'billing', 'messages', 'videos', 'pain', 'outcomes', 'waitlist'];
        const newCounts = {};
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            const data = result.value.data;
            newCounts[keys[i]] = Array.isArray(data) ? data.length : 0;
          } else {
            newCounts[keys[i]] = 0;
          }
        });
        setCounts(newCounts);
      } catch { /* counts remain empty */ }
    };
    fetchCounts();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          <div className="page-header">
            <h2>Dashboard</h2>
            <p>Welcome to your AI-powered physical therapy management platform</p>
          </div>
          <div className="dashboard-grid">
            {features.map((feature) => (
              <div
                key={feature.path}
                className="dashboard-card"
                onClick={() => navigate(feature.path)}
                style={{ '--card-accent': feature.color }}
              >
                <div className="dashboard-card-icon" style={{ backgroundColor: feature.color + '15', color: feature.color }}>
                  {feature.icon}
                </div>
                <div className="dashboard-card-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <div className="dashboard-card-count" style={{ backgroundColor: feature.color + '15', color: feature.color }}>
                  {counts[feature.countKey] !== undefined ? counts[feature.countKey] : '-'}
                </div>
              </div>
            ))}
            <div
              className="dashboard-card dashboard-card-ai"
              onClick={() => navigate('/ai-analysis')}
              style={{ '--card-accent': '#7c3aed' }}
            >
              <div className="dashboard-card-icon" style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}>
                🤖
              </div>
              <div className="dashboard-card-content">
                <h3>AI Analysis Hub</h3>
                <p>Access all AI-powered analysis tools</p>
              </div>
              <div className="dashboard-card-count" style={{ backgroundColor: '#7c3aed15', color: '#7c3aed' }}>
                8
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
