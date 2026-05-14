import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/patients', icon: '👤', label: 'Patients' },
  { path: '/therapists', icon: '🩺', label: 'Therapists' },
  { path: '/exercises', icon: '🏋️', label: 'Exercise Library' },
  { path: '/exercise-videos', icon: '🎬', label: 'Exercise Videos' },
  { path: '/treatment-plans', icon: '📋', label: 'Treatment Plans' },
  { path: '/movement-assessments', icon: '🎯', label: 'Assessments' },
  { path: '/recovery-progress', icon: '📈', label: 'Recovery Progress' },
  { path: '/home-exercise-programs', icon: '🏠', label: 'Home Programs' },
  { path: '/appointments', icon: '📅', label: 'Appointments' },
  { path: '/treatment-notes', icon: '📝', label: 'Treatment Notes' },
  { path: '/pain-assessments', icon: '🔴', label: 'Pain Assessments' },
  { path: '/outcome-measures', icon: '📊', label: 'Outcome Measures' },
  { path: '/billing', icon: '💰', label: 'Billing' },
  { path: '/messages', icon: '💬', label: 'Messages' },
  { path: '/waitlist', icon: '⏳', label: 'Waitlist' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  // === Batch 06 Gaps & Frontend Mounts ===
  { path: '/cf-agentic-hep-execution', label: 'Agentic HEP execution', icon: '✨' },
  { path: '/cf-movement-quality-scoring', label: 'Movement quality scoring', icon: '✨' },
  { path: '/cf-telehealth-live-feedback', label: 'Telehealth live feedback', icon: '✨' },
  { path: '/cf-outcome-prediction-intervention', label: 'Outcome prediction + intervention', icon: '✨' },
  { path: '/cf-pain-science-education', label: 'Pain science education', icon: '✨' },
  { path: '/gap-appointments-without-appointment', label: 'Appointments without `/appointment', icon: '✨' },
  { path: '/gap-patients-without-patient', label: 'Patients without `/patient', icon: '✨' },
  { path: '/gap-exercises-without-exercise', label: 'Exercises without `/exercise', icon: '✨' },
  { path: '/gap-limited-ehr-medical-records-integration-only-stub', label: 'Limited EHR/medical records integration (only stub)', icon: '✨' },
  { path: '/gap-no-wearable-integration-accelerometer-movement-dat', label: 'No wearable integration (accelerometer movement data)', icon: '✨' },
  { path: '/gap-no-remote-monitoring-telehealth-with-real', label: 'No remote monitoring (telehealth with real', icon: '✨' },
  { path: '/gap-limited-insurance-billing-automation', label: 'Limited insurance billing automation', icon: '✨' },
  { path: '/gap-no-integration-with-fitness-activity-trackers', label: 'No integration with fitness/activity trackers', icon: '✨' },
  { path: '/gap-no-notifications-module-grep-0', label: 'No notifications module (grep 0)', icon: '✨' },
  { path: '/gap-no-webhooks-for-referral-events', label: 'No webhooks for referral events', icon: '✨' },
  { path: '/gap-limited-mobile-app-1-mobile-reference-despite-hep-', label: 'Limited mobile app (1 mobile reference) despite HEP delivery domain', icon: '✨' }
];

function Sidebar({ isOpen, onToggle }) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">AI Tools</div>
          <NavLink
            to="/ai-analysis"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">🤖</span>
            <span className="sidebar-link-label">AI Analysis</span>
          </NavLink>
          <NavLink
            to="/ai-history"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">📜</span>
            <span className="sidebar-link-label">AI History</span>
          </NavLink>
          <NavLink
            to="/outcome-score-calculator"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">🧮</span>
            <span className="sidebar-link-label">Score Calculator</span>
          </NavLink>
          <NavLink
            to="/audit-log"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">🔒</span>
            <span className="sidebar-link-label">HIPAA Audit Log</span>
          </NavLink>
          <NavLink
            to="/rom-calculator"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">📐</span>
            <span className="sidebar-link-label">ROM Calculator</span>
          </NavLink>
          <NavLink
            to="/exercise-prescription"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">💊</span>
            <span className="sidebar-link-label">Exercise Prescription</span>
          </NavLink>
          <NavLink
            to="/progress-chart"
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon">📊</span>
            <span className="sidebar-link-label">Progress Report</span>
          </NavLink>
        </div>
      </nav>
      <button className="sidebar-collapse-btn" onClick={onToggle}>
        {isOpen ? '◀' : '▶'}
      </button>
    </aside>
  );
}

export default Sidebar;
