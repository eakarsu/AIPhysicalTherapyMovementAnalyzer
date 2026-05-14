import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function AppointmentOptimize() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await api.post('/ai/appointment-optimize', {});
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to optimize');
    }
    setLoading(false);
  };

  const data = result?.parsed || result;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          <div className="page-header"><h2>Appointment Optimization</h2></div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <p style={{ color: '#94a3b8', marginBottom: 16 }}>Analyze upcoming appointments and 180-day status history for no-show risk, overbooking suggestions, and outreach actions.</p>
              <button className="btn btn-primary" onClick={run} disabled={loading}>
                {loading ? 'Analyzing...' : 'Run Optimization'}
              </button>
            </div>
          </div>

          {loading && <div className="loading-container"><div className="spinner-large"></div></div>}

          {data && (
            <div>
              {Array.isArray(data.no_show_risks) && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header"><h3>No-Show Risks</h3></div>
                  <div className="card-body">
                    {data.no_show_risks.map((r, i) => (
                      <div key={i} style={{ padding: 12, background: '#1e293b', borderRadius: 8, marginBottom: 10 }}>
                        <strong style={{ color: '#e2e8f0' }}>{r.patient_name || r.patient_id || `Risk ${i + 1}`}</strong>
                        {r.risk_score !== undefined && <span style={{ float: 'right', color: '#dc2626' }}>{r.risk_score}</span>}
                        {r.reason && <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{r.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(data.scheduling_gaps) && data.scheduling_gaps.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header"><h3>Scheduling Gaps</h3></div>
                  <div className="card-body">
                    <ul style={{ paddingLeft: 20, color: '#94a3b8' }}>
                      {data.scheduling_gaps.map((g, i) => <li key={i}>{typeof g === 'string' ? g : JSON.stringify(g)}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {Array.isArray(data.outreach_actions) && data.outreach_actions.length > 0 && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header"><h3>Outreach Actions</h3></div>
                  <div className="card-body">
                    <ul style={{ paddingLeft: 20, color: '#94a3b8' }}>
                      {data.outreach_actions.map((a, i) => <li key={i}>{typeof a === 'string' ? a : JSON.stringify(a)}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {result?.content && !data?.no_show_risks && (
                <div className="card"><div className="card-body">
                  <pre style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', fontSize: 13 }}>{result.content}</pre>
                </div></div>
              )}
            </div>
          )}

          {!data && !loading && !error && (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>📅</div>
              <h3>Appointment Optimization</h3>
              <p>Click run to analyze upcoming appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
