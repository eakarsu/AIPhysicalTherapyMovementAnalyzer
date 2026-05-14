import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import api from '../api';

export default function PatientDropoutPredict() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await api.post('/ai/patient-dropout-predict', {});
      setResult(r.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to predict');
    }
    setLoading(false);
  };

  const data = result?.parsed || result;
  const atRisk = (data && (data.at_risk_patients || data.at_risk || [])) || [];

  const riskColor = (lvl) => ({
    high: '#dc2626', medium: '#d97706', low: '#059669',
  }[lvl] || '#94a3b8');

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          <div className="page-header"><h2>Patient Dropout Prediction</h2></div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <p style={{ color: '#94a3b8', marginBottom: 16 }}>Identify at-risk patients (visits, no-shows, compliance) with engagement recommendations.</p>
              <button className="btn btn-primary" onClick={run} disabled={loading}>
                {loading ? 'Predicting...' : 'Run Prediction'}
              </button>
            </div>
          </div>

          {loading && <div className="loading-container"><div className="spinner-large"></div></div>}

          {atRisk.length > 0 && (
            <div className="card">
              <div className="card-header"><h3>At-Risk Patients</h3></div>
              <div className="card-body">
                {atRisk.map((p, i) => (
                  <div key={i} style={{ padding: 12, background: '#1e293b', borderRadius: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#e2e8f0' }}>{p.patient_name || p.patient_id || `Patient ${i + 1}`}</strong>
                      <span style={{ color: riskColor(p.risk_level), fontWeight: 700, fontSize: 13 }}>{(p.risk_level || '').toUpperCase()}</span>
                    </div>
                    {p.reason && <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{p.reason}</p>}
                    {p.recommendation && <p style={{ color: '#3b82f6', fontSize: 12, marginTop: 4 }}>Action: {p.recommendation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.content && atRisk.length === 0 && !loading && (
            <div className="card"><div className="card-body">
              <pre style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', fontSize: 13 }}>{result.content}</pre>
            </div></div>
          )}

          {!result && !loading && !error && (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>📉</div>
              <h3>Patient Dropout Prediction</h3>
              <p>Run prediction to identify at-risk patients</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
