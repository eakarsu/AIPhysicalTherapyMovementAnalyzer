import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getOutcomeMeasures, getOutcomeMeasure, createOutcomeMeasure, updateOutcomeMeasure, deleteOutcomeMeasure, getPatients, getOutcomeMeasureTemplates, submitPatientAssessment, getOutcomeTrend } from '../api';

const emptyForm = {
  patient_id: '', measure_type: '', score: '', max_score: '', assessment_date: '',
  assessed_by: '', interpretation: '', previous_score: '', notes: '',
};

const measureTypes = ['DASH', 'ODI', 'NDI', 'LEFS', 'VAS', 'SF-36', 'BERG', 'TUG', 'FIM', 'KOOS', 'PROMIS'];

function OutcomeMeasures() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'assessment' | 'templates'
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showTrend, setShowTrend] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Assessment form state
  const [assessForm, setAssessForm] = useState({ patient_id: '', instrument: 'oswestry', responses: [], assessed_by: '', notes: '' });
  const [assessResponses, setAssessResponses] = useState(Array(10).fill(''));
  const [assessResult, setAssessResult] = useState(null);
  const [assessLoading, setAssessLoading] = useState(false);

  const instrumentConfigs = {
    oswestry: { label: 'Oswestry Disability Index (ODI)', questions: 10, range: [0, 5], hint: 'Each question: 0 (no disability) to 5 (maximum disability)' },
    ndi: { label: 'Neck Disability Index (NDI)', questions: 10, range: [0, 5], hint: 'Each question: 0 (no disability) to 5 (maximum disability)' },
    dash: { label: 'DASH Outcome Measure', questions: 30, range: [1, 5], hint: 'Each item: 1 (no difficulty) to 5 (unable to do)' },
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [omRes, patRes, tplRes] = await Promise.all([getOutcomeMeasures(), getPatients(), getOutcomeMeasureTemplates()]);
      setItems(Array.isArray(omRes.data) ? omRes.data : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      setTemplates(Array.isArray(tplRes.data) ? tplRes.data : []);
    } catch { setError('Failed to load outcome measures'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  // Update response array length when instrument changes
  useEffect(() => {
    const cfg = instrumentConfigs[assessForm.instrument];
    if (cfg) setAssessResponses(Array(cfg.questions).fill(''));
    setAssessResult(null);
  }, [assessForm.instrument]);

  const handleRowClick = async (item) => {
    try { const res = await getOutcomeMeasure(item.id); setSelectedItem(res.data); } catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patient_id: item.patient_id || '', measure_type: item.measure_type || '',
      score: item.score || '', max_score: item.max_score || '',
      assessment_date: item.assessment_date ? item.assessment_date.slice(0, 10) : '',
      assessed_by: item.assessed_by || '', interpretation: item.interpretation || '',
      previous_score: item.previous_score || '', notes: item.notes || '',
    });
    setEditingId(item.id); setShowDetail(false); setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this outcome measure?')) return;
    try { await deleteOutcomeMeasure(item.id); setSuccess('Outcome measure deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.measure_type || !formData.score) { setError('Patient, measure type, and score required'); return; }
    setFormLoading(true);
    try {
      const data = { ...formData };
      if (data.score && data.max_score) data.percentage = ((data.score / data.max_score) * 100).toFixed(1);
      if (data.previous_score && data.score) data.change_from_previous = data.score - data.previous_score;
      if (editingId) { await updateOutcomeMeasure(editingId, data); setSuccess('Outcome measure updated'); }
      else { await createOutcomeMeasure(data); setSuccess('Outcome measure created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAssessSubmit = async (e) => {
    e.preventDefault();
    if (!assessForm.patient_id) { setError('Select a patient'); return; }
    const cfg = instrumentConfigs[assessForm.instrument];
    const nums = assessResponses.map(Number);
    if (nums.some(n => isNaN(n) || n < cfg.range[0] || n > cfg.range[1])) {
      setError(`All responses must be between ${cfg.range[0]} and ${cfg.range[1]}`);
      return;
    }
    setAssessLoading(true);
    setError('');
    setAssessResult(null);
    try {
      const res = await submitPatientAssessment({
        patient_id: assessForm.patient_id,
        instrument: assessForm.instrument,
        responses: nums,
        assessed_by: assessForm.assessed_by,
        notes: assessForm.notes,
      });
      setAssessResult(res.data);
      setSuccess('Assessment recorded successfully');
      fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit assessment'); }
    finally { setAssessLoading(false); }
  };

  const handleViewTrend = async (patientId) => {
    try {
      const res = await getOutcomeTrend(patientId);
      setTrendData(res.data);
      setShowTrend(true);
    } catch { setError('Failed to load trend data'); }
  };

  const renderPercentBar = (pct, inverse = false) => {
    const p = Number(pct) || 0;
    let color;
    if (inverse) color = p >= 75 ? '#dc2626' : p >= 50 ? '#d97706' : '#059669';
    else color = p >= 75 ? '#059669' : p >= 50 ? '#d97706' : '#dc2626';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '80px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(p, 100)}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }}></div>
        </div>
        <span style={{ fontWeight: 'bold', color }}>{p.toFixed(1)}%</span>
      </div>
    );
  };

  const renderChange = (change) => {
    const c = Number(change);
    if (isNaN(c) || c === 0) return <span style={{ color: '#6b7280' }}>--</span>;
    const isPositive = c > 0;
    return (
      <span style={{ fontWeight: 'bold', color: isPositive ? '#059669' : '#dc2626' }}>
        {isPositive ? '▲' : '▼'} {Math.abs(c).toFixed(1)}
      </span>
    );
  };

  const scoreColor = (pct) => pct >= 75 ? '#dc2626' : pct >= 50 ? '#d97706' : '#059669';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          {success && <div className="toast toast-success">{success}</div>}
          {error && <div className="toast toast-error">{error}</div>}
          <div className="page-header">
            <div><button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button><h2>Outcome Measures</h2></div>
            {activeTab === 'records' && <button className="btn btn-primary" onClick={handleAdd}>+ Add Measure</button>}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #334155', paddingBottom: 0 }}>
            {[['records', 'Records'], ['assessment', 'Patient Assessment'], ['templates', 'Templates']].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  color: activeTab === key ? '#3b82f6' : '#94a3b8',
                  borderBottom: activeTab === key ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: -1 }}>
                {label}
              </button>
            ))}
          </div>

          {/* RECORDS TAB */}
          {activeTab === 'records' && (
            loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
              <div className="table-container"><table className="data-table"><thead><tr>
                <th>Patient</th><th>Measure</th><th>Score</th><th>Disability %</th><th>Date</th><th>Change</th><th>Interpretation</th>
              </tr></thead><tbody>
                {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No outcome measures found.</td></tr> :
                  items.map((item) => (
                    <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patient_name || `Patient #${item.patient_id}`}</strong></td>
                      <td><span className="status-badge badge-info">{item.measure_type}</span></td>
                      <td>{item.score}{item.max_score ? `/${item.max_score}` : ''}</td>
                      <td>{item.percentage != null ? renderPercentBar(item.percentage, true) : '--'}</td>
                      <td>{item.assessment_date ? new Date(item.assessment_date).toLocaleDateString() : ''}</td>
                      <td>{renderChange(item.change_from_previous)}</td>
                      <td style={{ fontSize: 13, color: '#94a3b8' }}>{item.interpretation || '--'}</td>
                    </tr>
                  ))}
              </tbody></table></div>
            )
          )}

          {/* PATIENT ASSESSMENT TAB */}
          {activeTab === 'assessment' && (
            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24 }}>
              <div className="card">
                <div className="card-header"><h3>Run Standardized Assessment</h3></div>
                <div className="card-body">
                  <form onSubmit={handleAssessSubmit}>
                    <div className="form-group">
                      <label>Patient *</label>
                      <select value={assessForm.patient_id} onChange={e => setAssessForm({ ...assessForm, patient_id: e.target.value })} required>
                        <option value="">Select patient...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Instrument *</label>
                      <select value={assessForm.instrument} onChange={e => setAssessForm({ ...assessForm, instrument: e.target.value })}>
                        {Object.entries(instrumentConfigs).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ padding: '10px', background: '#1e293b', borderRadius: 8, marginBottom: 16 }}>
                      <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{instrumentConfigs[assessForm.instrument]?.hint}</p>
                    </div>

                    {/* Response inputs */}
                    <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 16 }}>
                      {assessResponses.map((val, i) => {
                        const cfg = instrumentConfigs[assessForm.instrument];
                        return (
                          <div key={i} className="form-group" style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 13 }}>Q{i + 1} ({cfg.range[0]}–{cfg.range[1]})</label>
                            <input type="number" min={cfg.range[0]} max={cfg.range[1]} step="1"
                              value={val}
                              onChange={e => { const arr = [...assessResponses]; arr[i] = e.target.value; setAssessResponses(arr); }}
                              placeholder={`${cfg.range[0]}-${cfg.range[1]}`} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="form-group">
                      <label>Assessed By</label>
                      <input value={assessForm.assessed_by} onChange={e => setAssessForm({ ...assessForm, assessed_by: e.target.value })} placeholder="Therapist name" />
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <textarea rows="2" value={assessForm.notes} onChange={e => setAssessForm({ ...assessForm, notes: e.target.value })} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={assessLoading}>
                      {assessLoading ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  </form>
                </div>
              </div>

              <div>
                {assessLoading && <div className="loading-container"><div className="spinner-large"></div></div>}
                {assessResult && (
                  <div className="card">
                    <div className="card-header"><h3>Assessment Results</h3></div>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                        <div style={{ textAlign: 'center', padding: 16, background: '#1e293b', borderRadius: 8 }}>
                          <div style={{ fontSize: 36, fontWeight: 700, color: '#3b82f6' }}>{assessResult.score?.raw_score ?? '--'}</div>
                          <div style={{ color: '#94a3b8', fontSize: 13 }}>Raw Score</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 16, background: '#1e293b', borderRadius: 8 }}>
                          <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor(assessResult.score?.percentage) }}>
                            {assessResult.score?.percentage ?? '--'}%
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: 13 }}>Disability %</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 16, background: '#1e293b', borderRadius: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{assessResult.score?.interpretation ?? '--'}</div>
                          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Interpretation</div>
                        </div>
                      </div>

                      {assessResult.saved && (
                        <div style={{ padding: 12, background: '#0f172a', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                          <strong style={{ color: '#059669' }}>Saved to records</strong>
                          <span style={{ color: '#94a3b8', marginLeft: 8 }}>ID: {assessResult.saved.id} | {new Date(assessResult.saved.assessment_date).toLocaleDateString()}</span>
                          <button className="btn btn-secondary" style={{ marginLeft: 12, padding: '4px 10px', fontSize: 12 }}
                            onClick={() => handleViewTrend(assessResult.saved.patient_id)}>
                            View Trend
                          </button>
                        </div>
                      )}

                      <div style={{ background: '#1e293b', borderRadius: 8, padding: 16 }}>
                        <h4 style={{ color: '#e2e8f0', marginBottom: 12 }}>Instrument: {assessResult.instrument?.toUpperCase()}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                          <span style={{ color: '#94a3b8', fontSize: 14 }}>Disability Level:</span>
                          <div style={{ flex: 1 }}>
                            {renderPercentBar(assessResult.score?.percentage, true)}
                          </div>
                        </div>
                        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                          Score {assessResult.score?.raw_score} out of {assessResult.score?.max_score} maximum points.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!assessResult && !assessLoading && (
                  <div className="empty-state">
                    <div style={{ fontSize: 48 }}>📊</div>
                    <h3>Standardized Assessment</h3>
                    <p>Fill in responses for Oswestry, NDI, or DASH and submit to get scored results saved to patient records.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div>
              <div className="table-container">
                <table className="data-table"><thead><tr>
                  <th>Name</th><th>Abbreviation</th><th>Scale</th><th>Description</th><th>Scoring</th>
                </tr></thead><tbody>
                  {templates.length === 0 ? <tr><td colSpan="5" className="table-empty">No templates found.</td></tr> :
                    templates.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td><span className="status-badge badge-info">{t.abbreviation}</span></td>
                        <td>{t.scale}</td>
                        <td style={{ fontSize: 13, color: '#94a3b8', maxWidth: 280 }}>{t.description}</td>
                        <td style={{ fontSize: 12, color: '#64748b', maxWidth: 200 }}>{t.scoring_instructions}</td>
                      </tr>
                    ))}
                </tbody></table>
              </div>
            </div>
          )}

          {/* RECORD DETAIL MODAL */}
          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Outcome Measure Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patient_name || `Patient #${selectedItem.patient_id}`}</p></div>
                  <div className="detail-field"><label>Measure Type</label><p><span className="status-badge badge-info">{selectedItem.measure_type}</span></p></div>
                  <div className="detail-field"><label>Score</label><p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{selectedItem.score} / {selectedItem.max_score}</p></div>
                  <div className="detail-field"><label>Disability %</label>{renderPercentBar(selectedItem.percentage, true)}</div>
                  <div className="detail-field"><label>Previous Score</label><p>{selectedItem.previous_score || 'N/A'}</p></div>
                  <div className="detail-field"><label>Change</label>{renderChange(selectedItem.change_from_previous)}</div>
                  <div className="detail-field"><label>Assessment Date</label><p>{selectedItem.assessment_date ? new Date(selectedItem.assessment_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Assessed By</label><p>{selectedItem.assessed_by}</p></div>
                  <div className="detail-field detail-full"><label>Interpretation</label><p>{selectedItem.interpretation || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => handleViewTrend(selectedItem.patient_id)}>View Patient Trend</button>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          {/* TREND MODAL */}
          <Modal isOpen={showTrend} onClose={() => setShowTrend(false)} title="Outcome Measure Trends" size="large">
            {trendData && (
              <div>
                {Object.keys(trendData.trend || {}).length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No trend data available for this patient.</p>
                ) : (
                  Object.entries(trendData.trend).map(([instrument, records]) => (
                    <div key={instrument} style={{ marginBottom: 24 }}>
                      <h4 style={{ color: '#3b82f6', marginBottom: 12 }}>{instrument}</h4>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {records.map((r, i) => (
                          <div key={i} style={{ padding: '10px 14px', background: '#1e293b', borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(r.percentage) }}>{r.percentage}%</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(r.date).toLocaleDateString()}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.interpretation}</div>
                          </div>
                        ))}
                      </div>
                      {records.length > 1 && (
                        <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                          {records[records.length - 1].percentage < records[0].percentage
                            ? <span style={{ color: '#059669' }}>Improving: {(records[0].percentage - records[records.length - 1].percentage).toFixed(1)}% reduction in disability</span>
                            : <span style={{ color: '#dc2626' }}>Worsening: {(records[records.length - 1].percentage - records[0].percentage).toFixed(1)}% increase in disability</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </Modal>

          {/* ADD/EDIT FORM MODAL */}
          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Measure' : 'Add Outcome Measure'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient *</label>
                  <select name="patient_id" value={formData.patient_id} onChange={handleChange} required>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Measure Type *</label>
                  <select name="measure_type" value={formData.measure_type} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {measureTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Score *</label><input name="score" type="number" step="0.01" value={formData.score} onChange={handleChange} required /></div>
                <div className="form-group"><label>Max Score</label><input name="max_score" type="number" step="0.01" value={formData.max_score} onChange={handleChange} /></div>
                <div className="form-group"><label>Previous Score</label><input name="previous_score" type="number" step="0.01" value={formData.previous_score} onChange={handleChange} /></div>
                <div className="form-group"><label>Assessment Date</label><input name="assessment_date" type="date" value={formData.assessment_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Assessed By</label><input name="assessed_by" value={formData.assessed_by} onChange={handleChange} /></div>
                <div className="form-group form-full"><label>Interpretation</label><textarea name="interpretation" value={formData.interpretation} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? <span className="spinner"></span> : (editingId ? 'Update' : 'Create')}</button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default OutcomeMeasures;
