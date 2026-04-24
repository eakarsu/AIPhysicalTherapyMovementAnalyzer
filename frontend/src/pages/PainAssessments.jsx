import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getPainAssessments, getPainAssessment, createPainAssessment, updatePainAssessment, deletePainAssessment, getPatients } from '../api';

const emptyForm = {
  patient_id: '', assessment_date: '', body_region: '', pain_level: '',
  pain_type: '', triggers: '', relieving_factors: '', functional_impact: '',
  duration_of_pain: '', notes: '', assessed_by: '',
};

function PainAssessments() {
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
      const [paRes, patRes] = await Promise.all([getPainAssessments(), getPatients()]);
      setItems(Array.isArray(paRes.data) ? paRes.data : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
    } catch { setError('Failed to load pain assessments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getPainAssessment(item.id); setSelectedItem(res.data); } catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patient_id: item.patient_id || '', assessment_date: item.assessment_date ? item.assessment_date.slice(0, 10) : '',
      body_region: item.body_region || '', pain_level: item.pain_level || '',
      pain_type: item.pain_type || '', triggers: item.triggers || '',
      relieving_factors: item.relieving_factors || '', functional_impact: item.functional_impact || '',
      duration_of_pain: item.duration_of_pain || '', notes: item.notes || '', assessed_by: item.assessed_by || '',
    });
    setEditingId(item.id); setShowDetail(false); setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this pain assessment?')) return;
    try { await deletePainAssessment(item.id); setSuccess('Pain assessment deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.pain_level) { setError('Patient and pain level required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updatePainAssessment(editingId, formData); setSuccess('Assessment updated'); }
      else { await createPainAssessment(formData); setSuccess('Assessment created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getPainColor = (level) => {
    const l = Number(level);
    if (l <= 3) return '#059669';
    if (l <= 6) return '#d97706';
    return '#dc2626';
  };

  const renderPainBar = (level) => {
    const l = Number(level) || 0;
    const color = getPainColor(l);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '80px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${l * 10}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }}></div>
        </div>
        <span style={{ fontWeight: 'bold', color }}>{l}/10</span>
      </div>
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
            <div><button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button><h2>Pain Assessments</h2></div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Assessment</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container"><table className="data-table"><thead><tr>
              <th>Patient</th><th>Date</th><th>Body Region</th><th>Pain Level</th><th>Pain Type</th><th>Assessed By</th>
            </tr></thead><tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No pain assessments found.</td></tr> :
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                    <td><strong>{item.patient_name || `Patient #${item.patient_id}`}</strong></td>
                    <td>{item.assessment_date ? new Date(item.assessment_date).toLocaleDateString() : ''}</td>
                    <td>{item.body_region}</td>
                    <td>{renderPainBar(item.pain_level)}</td>
                    <td><span className="status-badge badge-default">{item.pain_type}</span></td>
                    <td>{item.assessed_by}</td>
                  </tr>
                ))}
            </tbody></table></div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Pain Assessment Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patient_name || `Patient #${selectedItem.patient_id}`}</p></div>
                  <div className="detail-field"><label>Assessment Date</label><p>{selectedItem.assessment_date ? new Date(selectedItem.assessment_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Body Region</label><p>{selectedItem.body_region}</p></div>
                  <div className="detail-field"><label>Pain Level</label>{renderPainBar(selectedItem.pain_level)}</div>
                  <div className="detail-field"><label>Pain Type</label><p>{selectedItem.pain_type}</p></div>
                  <div className="detail-field"><label>Duration of Pain</label><p>{selectedItem.duration_of_pain || 'N/A'}</p></div>
                  <div className="detail-field"><label>Assessed By</label><p>{selectedItem.assessed_by}</p></div>
                  <div className="detail-field detail-full"><label>Triggers</label><p>{selectedItem.triggers || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Relieving Factors</label><p>{selectedItem.relieving_factors || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Functional Impact</label><p>{selectedItem.functional_impact || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Assessment' : 'Add Pain Assessment'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient *</label>
                  <select name="patient_id" value={formData.patient_id} onChange={handleChange} required>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Assessment Date</label><input name="assessment_date" type="date" value={formData.assessment_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Body Region</label><input name="body_region" value={formData.body_region} onChange={handleChange} placeholder="e.g., Left Knee - Anterior" /></div>
                <div className="form-group"><label>Pain Level (1-10) *</label>
                  <select name="pain_level" value={formData.pain_level} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Pain Type</label>
                  <select name="pain_type" value={formData.pain_type} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="sharp">Sharp</option><option value="dull">Dull</option><option value="aching">Aching</option>
                    <option value="burning">Burning</option><option value="throbbing">Throbbing</option><option value="stabbing">Stabbing</option>
                  </select>
                </div>
                <div className="form-group"><label>Duration of Pain</label><input name="duration_of_pain" value={formData.duration_of_pain} onChange={handleChange} placeholder="e.g., 3 months" /></div>
                <div className="form-group"><label>Assessed By</label><input name="assessed_by" value={formData.assessed_by} onChange={handleChange} /></div>
                <div className="form-group form-full"><label>Triggers</label><textarea name="triggers" value={formData.triggers} onChange={handleChange} rows="2" placeholder="What makes the pain worse?"></textarea></div>
                <div className="form-group form-full"><label>Relieving Factors</label><textarea name="relieving_factors" value={formData.relieving_factors} onChange={handleChange} rows="2" placeholder="What helps reduce the pain?"></textarea></div>
                <div className="form-group form-full"><label>Functional Impact</label><textarea name="functional_impact" value={formData.functional_impact} onChange={handleChange} rows="2" placeholder="How does pain affect daily activities?"></textarea></div>
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

export default PainAssessments;
