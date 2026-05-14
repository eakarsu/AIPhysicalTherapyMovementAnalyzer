import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { scoreOutcomeMeasure, getOutcomeTrend, getPatients } from '../api';

const INSTRUMENTS = {
  oswestry: {
    label: 'Oswestry Disability Index (ODI)',
    questions: [
      'Pain Intensity (0=no pain, 5=worst imaginable)',
      'Personal Care (0=no limitation, 5=cannot manage)',
      'Lifting (0=no pain, 5=cannot lift)',
      'Walking (0=no limitation, 5=cannot walk)',
      'Sitting (0=no limitation, 5=cannot sit)',
      'Standing (0=no limitation, 5=cannot stand)',
      'Sleeping (0=not disturbed, 5=pain prevents sleep)',
      'Sex Life (0=no limitation, 5=minimal/none)',
      'Social Life (0=no limitation, 5=absent due to pain)',
      'Travelling (0=no limitation, 5=cannot travel)',
    ],
    range: [0, 5],
    count: 10,
  },
  ndi: {
    label: 'Neck Disability Index (NDI)',
    questions: [
      'Pain Intensity (0=no pain, 5=worst imaginable)',
      'Personal Care (0=full self-care, 5=cannot manage)',
      'Lifting (0=full lifting, 5=cannot lift)',
      'Reading (0=as long as want, 5=cannot read)',
      'Headaches (0=none, 5=constant and severe)',
      'Concentration (0=fully concentrate, 5=cannot concentrate)',
      'Work (0=much as want, 5=cannot do any)',
      'Driving (0=no limitation, 5=cannot drive)',
      'Sleeping (0=no limitation, 5=cannot sleep)',
      'Recreation (0=full engagement, 5=none due to pain)',
    ],
    range: [0, 5],
    count: 10,
  },
  dash: {
    label: 'DASH (Disabilities of the Arm, Shoulder and Hand)',
    questions: Array.from({ length: 30 }, (_, i) => `Item ${i + 1} (1=no difficulty, 5=unable)`),
    range: [1, 5],
    count: 30,
  },
};

function OutcomeScoreCalculator() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [instrument, setInstrument] = useState('oswestry');
  const [responses, setResponses] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState([]);
  const [result, setResult] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const cfg = INSTRUMENTS[instrument];
    setResponses(Array(cfg.count).fill(cfg.range[0]));
    setResult(null);
  }, [instrument]);

  useEffect(() => {
    getPatients().then(r => {
      const d = r.data;
      setPatients(Array.isArray(d) ? d : d?.data || []);
    }).catch(() => {});
  }, []);

  const handleResponse = (idx, val) => {
    const cfg = INSTRUMENTS[instrument];
    const clamped = Math.min(cfg.range[1], Math.max(cfg.range[0], Number(val)));
    const updated = [...responses];
    updated[idx] = clamped;
    setResponses(updated);
  };

  const handleScore = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scoreOutcomeMeasure({
        instrument,
        responses,
        patient_id: patientId || undefined,
      });
      setResult(res.data.score);
      setSuccess('Score calculated' + (patientId ? ' and saved to patient record' : ''));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate score');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrend = async () => {
    if (!patientId) { setError('Select a patient to view trend'); return; }
    setTrendLoading(true);
    try {
      const res = await getOutcomeTrend(patientId);
      setTrend(res.data.trend);
    } catch (err) {
      setError('Failed to load trend data');
    } finally {
      setTrendLoading(false);
    }
  };

  const cfg = INSTRUMENTS[instrument];
  const pct = result?.percentage;

  const getColor = (p) => {
    if (p === undefined || p === null) return '#6b7280';
    if (p <= 20) return '#059669';
    if (p <= 40) return '#16a34a';
    if (p <= 60) return '#d97706';
    if (p <= 80) return '#ea580c';
    return '#dc2626';
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          {success && <div className="toast toast-success">{success}</div>}
          {error && <div className="toast toast-error">{error}</div>}

          <div className="page-header">
            <div>
              <button className="btn btn-text" onClick={() => navigate('/outcome-measures')}>&larr; Back to Outcome Measures</button>
              <h2>Outcome Score Calculator</h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1100 }}>
            {/* Left: Form */}
            <div className="card" style={{ padding: 24 }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label><strong>Instrument</strong></label>
                <select value={instrument} onChange={e => setInstrument(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
                  {Object.entries(INSTRUMENTS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label><strong>Patient (optional — saves to record)</strong></label>
                <select value={patientId} onChange={e => setPatientId(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
                  <option value="">— Select patient —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
                {cfg.questions.map((q, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 13, color: '#374151' }}>
                      {idx + 1}. {q}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <input
                        type="range"
                        min={cfg.range[0]}
                        max={cfg.range[1]}
                        value={responses[idx] || cfg.range[0]}
                        onChange={e => handleResponse(idx, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold' }}>
                        {responses[idx] || cfg.range[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={handleScore} disabled={loading}>
                  {loading ? 'Calculating...' : 'Calculate Score'}
                </button>
                {patientId && (
                  <button className="btn btn-secondary" onClick={handleViewTrend} disabled={trendLoading}>
                    {trendLoading ? 'Loading...' : 'View Score Trend'}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Result */}
            <div>
              {result && (
                <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                  <h3 style={{ marginBottom: 16 }}>Score Result</h3>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 64, fontWeight: 'bold', color: getColor(pct) }}>
                      {pct}%
                    </div>
                    <div style={{ fontSize: 16, color: getColor(pct), marginTop: 4 }}>
                      {result.interpretation}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      Raw: {result.raw_score} / {result.max_score}
                    </div>
                  </div>
                  <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: '100%',
                      background: getColor(pct),
                      borderRadius: 6,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )}

              {trend && (
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ marginBottom: 16 }}>Score Trend</h3>
                  {Object.entries(trend).map(([measureType, scores]) => (
                    <div key={measureType} style={{ marginBottom: 20 }}>
                      <h4 style={{ marginBottom: 8 }}>{measureType}</h4>
                      {scores.length === 0 ? (
                        <p style={{ color: '#6b7280' }}>No data</p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Score</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>%</th>
                              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Interpretation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scores.map((s, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '4px 8px' }}>{new Date(s.date).toLocaleDateString()}</td>
                                <td style={{ padding: '4px 8px' }}>{s.score}/{s.max_score}</td>
                                <td style={{ padding: '4px 8px', fontWeight: 'bold', color: getColor(s.percentage) }}>{s.percentage}%</td>
                                <td style={{ padding: '4px 8px', color: '#6b7280' }}>{s.interpretation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutcomeScoreCalculator;
