import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getRecoveryProgress, getRecoveryProgressItem, createRecoveryProgress, updateRecoveryProgress, deleteRecoveryProgress } from '../api';

const emptyForm = {
  patientId: '', patientName: '', assessmentDate: '', weekNumber: '',
  painLevel: '', mobilityScore: '', strengthScore: '', functionalScore: '',
  overallProgress: '', goalsAchieved: '', goalsPending: '',
  therapistNotes: '', nextMilestone: '', status: 'on-track',
};

function RecoveryProgressPage() {
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
    try { const res = await getRecoveryProgress(); setItems(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError('Failed to load recovery progress'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getRecoveryProgressItem(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patientId: item.patientId || '', patientName: item.patientName || '',
      assessmentDate: item.assessmentDate ? item.assessmentDate.slice(0, 10) : '',
      weekNumber: item.weekNumber || '', painLevel: item.painLevel || '',
      mobilityScore: item.mobilityScore || '', strengthScore: item.strengthScore || '',
      functionalScore: item.functionalScore || '', overallProgress: item.overallProgress || '',
      goalsAchieved: item.goalsAchieved || '', goalsPending: item.goalsPending || '',
      therapistNotes: item.therapistNotes || '', nextMilestone: item.nextMilestone || '',
      status: item.status || 'on-track',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this progress record?')) return;
    try { await deleteRecoveryProgress(item._id || item.id); setSuccess('Record deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName) { setError('Patient name is required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateRecoveryProgress(editingId, formData); setSuccess('Progress updated'); }
      else { await createRecoveryProgress(formData); setSuccess('Progress created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (s) => {
    const c = { 'on-track': 'badge-success', 'behind': 'badge-danger', 'ahead': 'badge-info', 'at-risk': 'badge-warning' };
    return <span className={`status-badge ${c[s] || 'badge-default'}`}>{s || 'on-track'}</span>;
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
              <h2>Recovery Progress</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Progress Record</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Week</th><th>Overall Progress</th><th>Pain Level</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="6" className="table-empty">No recovery progress records found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patientName || item.patientId}</strong></td>
                      <td>Week {item.weekNumber || 'N/A'}</td>
                      <td>{item.overallProgress || 'N/A'}%</td>
                      <td>{item.painLevel || 'N/A'}/10</td>
                      <td>{item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Recovery Progress Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patientName}</p></div>
                  <div className="detail-field"><label>Week Number</label><p>{selectedItem.weekNumber || 'N/A'}</p></div>
                  <div className="detail-field"><label>Assessment Date</label><p>{selectedItem.assessmentDate ? new Date(selectedItem.assessmentDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field"><label>Pain Level</label><p>{selectedItem.painLevel || 'N/A'}/10</p></div>
                  <div className="detail-field"><label>Mobility Score</label><p>{selectedItem.mobilityScore || 'N/A'}</p></div>
                  <div className="detail-field"><label>Strength Score</label><p>{selectedItem.strengthScore || 'N/A'}</p></div>
                  <div className="detail-field"><label>Functional Score</label><p>{selectedItem.functionalScore || 'N/A'}</p></div>
                  <div className="detail-field"><label>Overall Progress</label><p>{selectedItem.overallProgress || 'N/A'}%</p></div>
                  <div className="detail-field"><label>Next Milestone</label><p>{selectedItem.nextMilestone || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Goals Achieved</label><p>{selectedItem.goalsAchieved || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Goals Pending</label><p>{selectedItem.goalsPending || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Therapist Notes</label><p>{selectedItem.therapistNotes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Progress' : 'Add Progress Record'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient Name *</label><input name="patientName" value={formData.patientName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Patient ID</label><input name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                <div className="form-group"><label>Assessment Date</label><input name="assessmentDate" type="date" value={formData.assessmentDate} onChange={handleChange} /></div>
                <div className="form-group"><label>Week Number</label><input name="weekNumber" type="number" value={formData.weekNumber} onChange={handleChange} /></div>
                <div className="form-group"><label>Pain Level (0-10)</label><input name="painLevel" type="number" min="0" max="10" value={formData.painLevel} onChange={handleChange} /></div>
                <div className="form-group"><label>Mobility Score (0-100)</label><input name="mobilityScore" type="number" min="0" max="100" value={formData.mobilityScore} onChange={handleChange} /></div>
                <div className="form-group"><label>Strength Score (0-100)</label><input name="strengthScore" type="number" min="0" max="100" value={formData.strengthScore} onChange={handleChange} /></div>
                <div className="form-group"><label>Functional Score (0-100)</label><input name="functionalScore" type="number" min="0" max="100" value={formData.functionalScore} onChange={handleChange} /></div>
                <div className="form-group"><label>Overall Progress (%)</label><input name="overallProgress" type="number" min="0" max="100" value={formData.overallProgress} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="on-track">On Track</option><option value="ahead">Ahead</option><option value="behind">Behind</option><option value="at-risk">At Risk</option>
                  </select>
                </div>
                <div className="form-group"><label>Next Milestone</label><input name="nextMilestone" value={formData.nextMilestone} onChange={handleChange} /></div>
                <div className="form-group form-full"><label>Goals Achieved</label><textarea name="goalsAchieved" value={formData.goalsAchieved} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Goals Pending</label><textarea name="goalsPending" value={formData.goalsPending} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Therapist Notes</label><textarea name="therapistNotes" value={formData.therapistNotes} onChange={handleChange} rows="3"></textarea></div>
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

export default RecoveryProgressPage;
