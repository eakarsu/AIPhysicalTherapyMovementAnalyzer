import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ROMTrendChart from '../components/ROMTrendChart';
import BodyRegionHeatmap from '../components/BodyRegionHeatmap';
import TherapySessionPDF from '../components/TherapySessionPDF';
import ExerciseProtocolRulesEditor from '../components/ExerciseProtocolRulesEditor';

export default function CustomViewsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: 24, color: '#e5e7eb' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Therapy Views</h1>
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>
            Synthesized clinical views for physical therapy movement analysis:
            ROM trend, body region heatmap, session report, and protocol-rule editor.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
            <div data-testid="viz-1-wrap"><ROMTrendChart /></div>
            <div data-testid="viz-2-wrap"><BodyRegionHeatmap /></div>
            <div data-testid="nonviz-1-wrap"><TherapySessionPDF /></div>
            <div data-testid="nonviz-2-wrap"><ExerciseProtocolRulesEditor /></div>
          </div>
        </main>
      </div>
    </div>
  );
}
