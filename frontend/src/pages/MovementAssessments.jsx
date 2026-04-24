import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getMovementAssessments, getMovementAssessment, createMovementAssessment, updateMovementAssessment, deleteMovementAssessment } from '../api';

const emptyForm = {
  patientId: '', patientName: '', exerciseName: '', assessmentDate: '',
  therapistName: '', overallScore: '', formScore: '', rangeOfMotion: '',
  painLevel: '', compensationPatterns: '', findings: '', recommendations: '',
  status: 'completed',
};

function MovementAssessments() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
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
    try { const res = await getMovementAssessments(); setItems(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError('Failed to load assessments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getMovementAssessment(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patientId: item.patientId || '', patientName: item.patientName || '',
      exerciseName: item.exerciseName || '',
      assessmentDate: item.assessmentDate ? item.assessmentDate.slice(0, 10) : '',
      therapistName: item.therapistName || '', overallScore: item.overallScore || '',
      formScore: item.formScore || '', rangeOfMotion: item.rangeOfMotion || '',
      painLevel: item.painLevel || '', compensationPatterns: item.compensationPatterns || '',
      findings: item.findings || '', recommendations: item.recommendations || '',
      status: item.status || 'completed',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this assessment?')) return;
    try { await deleteMovementAssessment(item._id || item.id); setSuccess('Assessment deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.exerciseName) { setError('Patient name and exercise are required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateMovementAssessment(editingId, formData); setSuccess('Assessment updated'); }
      else { await createMovementAssessment(formData); setSuccess('Assessment created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getScoreColor = (score) => {
    const n = Number(score);
    if (n >= 80) return 'badge-success';
    if (n >= 60) return 'badge-warning';
    return 'badge-danger';
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
              <button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
              <h2>Movement Assessments</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Assessment</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Exercise</th><th>Score</th><th>Pain Level</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="6" className="table-empty">No assessments found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patientName || item.patientId}</strong></td>
                      <td>{item.exerciseName}</td>
                      <td><span className={`status-badge ${getScoreColor(item.overallScore)}`}>{item.overallScore || 'N/A'}</span></td>
                      <td>{item.painLevel || 'N/A'}/10</td>
                      <td>{item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString() : 'N/A'}</td>
                      <td><span className="status-badge badge-info">{item.status || 'completed'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Assessment Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patientName}</p></div>
                  <div className="detail-field"><label>Exercise</label><p>{selectedItem.exerciseName}</p></div>
                  <div className="detail-field"><label>Therapist</label><p>{selectedItem.therapistName || 'N/A'}</p></div>
                  <div className="detail-field"><label>Date</label><p>{selectedItem.assessmentDate ? new Date(selectedItem.assessmentDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Overall Score</label><p><span className={`status-badge ${getScoreColor(selectedItem.overallScore)}`}>{selectedItem.overallScore || 'N/A'}</span></p></div>
                  <div className="detail-field"><label>Form Score</label><p>{selectedItem.formScore || 'N/A'}</p></div>
                  <div className="detail-field"><label>Range of Motion</label><p>{selectedItem.rangeOfMotion || 'N/A'}</p></div>
                  <div className="detail-field"><label>Pain Level</label><p>{selectedItem.painLevel || 'N/A'}/10</p></div>
                  <div className="detail-field detail-full"><label>Compensation Patterns</label><p>{selectedItem.compensationPatterns || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Findings</label><p>{selectedItem.findings || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Recommendations</label><p>{selectedItem.recommendations || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Assessment' : 'Add Assessment'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient Name *</label><input name="patientName" value={formData.patientName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Patient ID</label><input name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                <div className="form-group"><label>Exercise Name *</label><input name="exerciseName" value={formData.exerciseName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Therapist</label><input name="therapistName" value={formData.therapistName} onChange={handleChange} /></div>
                <div className="form-group"><label>Assessment Date</label><input name="assessmentDate" type="date" value={formData.assessmentDate} onChange={handleChange} /></div>
                <div className="form-group"><label>Overall Score (0-100)</label><input name="overallScore" type="number" min="0" max="100" value={formData.overallScore} onChange={handleChange} /></div>
                <div className="form-group"><label>Form Score (0-100)</label><input name="formScore" type="number" min="0" max="100" value={formData.formScore} onChange={handleChange} /></div>
                <div className="form-group"><label>Range of Motion</label><input name="rangeOfMotion" value={formData.rangeOfMotion} onChange={handleChange} /></div>
                <div className="form-group"><label>Pain Level (0-10)</label><input name="painLevel" type="number" min="0" max="10" value={formData.painLevel} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="completed">Completed</option><option value="in-progress">In Progress</option><option value="pending">Pending</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Compensation Patterns</label><textarea name="compensationPatterns" value={formData.compensationPatterns} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Findings</label><textarea name="findings" value={formData.findings} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Recommendations</label><textarea name="recommendations" value={formData.recommendations} onChange={handleChange} rows="3"></textarea></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <span className="spinner"></span> : (editingId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default MovementAssessments;
