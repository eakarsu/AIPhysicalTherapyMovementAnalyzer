import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getOutcomeMeasures, getOutcomeMeasure, createOutcomeMeasure, updateOutcomeMeasure, deleteOutcomeMeasure, getPatients } from '../api';

const emptyForm = {
  patient_id: '', measure_type: '', score: '', max_score: '', assessment_date: '',
  assessed_by: '', interpretation: '', previous_score: '', notes: '',
};

const measureTypes = ['DASH', 'ODI', 'LEFS', 'NDI', 'VAS', 'SF-36', 'BERG', 'TUG', 'FIM'];

function OutcomeMeasures() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [omRes, patRes] = await Promise.all([getOutcomeMeasures(), getPatients()]);
      setItems(Array.isArray(omRes.data) ? omRes.data : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
    } catch { setError('Failed to load outcome measures'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

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

  const renderPercentBar = (pct) => {
    const p = Number(pct) || 0;
    const color = p >= 75 ? '#059669' : p >= 50 ? '#d97706' : '#dc2626';
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
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Measure</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container"><table className="data-table"><thead><tr>
              <th>Patient</th><th>Measure</th><th>Score</th><th>Percentage</th><th>Date</th><th>Change</th><th>Assessed By</th>
            </tr></thead><tbody>
              {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No outcome measures found.</td></tr> :
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                    <td><strong>{item.patient_name || `Patient #${item.patient_id}`}</strong></td>
                    <td><span className="status-badge badge-info">{item.measure_type}</span></td>
                    <td>{item.score}/{item.max_score}</td>
                    <td>{renderPercentBar(item.percentage)}</td>
                    <td>{item.assessment_date ? new Date(item.assessment_date).toLocaleDateString() : ''}</td>
                    <td>{renderChange(item.change_from_previous)}</td>
                    <td>{item.assessed_by}</td>
                  </tr>
                ))}
            </tbody></table></div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Outcome Measure Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patient_name || `Patient #${selectedItem.patient_id}`}</p></div>
                  <div className="detail-field"><label>Measure Type</label><p><span className="status-badge badge-info">{selectedItem.measure_type}</span></p></div>
                  <div className="detail-field"><label>Score</label><p style={{fontWeight:'bold',fontSize:'1.2em'}}>{selectedItem.score} / {selectedItem.max_score}</p></div>
                  <div className="detail-field"><label>Percentage</label>{renderPercentBar(selectedItem.percentage)}</div>
                  <div className="detail-field"><label>Previous Score</label><p>{selectedItem.previous_score || 'N/A'}</p></div>
                  <div className="detail-field"><label>Change</label>{renderChange(selectedItem.change_from_previous)}</div>
                  <div className="detail-field"><label>Assessment Date</label><p>{selectedItem.assessment_date ? new Date(selectedItem.assessment_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Assessed By</label><p>{selectedItem.assessed_by}</p></div>
                  <div className="detail-field detail-full"><label>Interpretation</label><p>{selectedItem.interpretation || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

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
