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
        </div>
      </nav>
      <button className="sidebar-collapse-btn" onClick={onToggle}>
        {isOpen ? '◀' : '▶'}
      </button>
    </aside>
  );
}

export default Sidebar;
