import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getTreatmentPlans, getTreatmentPlan, createTreatmentPlan, updateTreatmentPlan, deleteTreatmentPlan } from '../api';

const emptyForm = {
  patientId: '', patientName: '', therapistName: '', diagnosis: '', goals: '',
  startDate: '', endDate: '', frequency: '', exercises: '', precautions: '',
  notes: '', status: 'active',
};

function TreatmentPlans() {
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
    try { const res = await getTreatmentPlans(); setItems(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError('Failed to load treatment plans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getTreatmentPlan(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patientId: item.patientId || '', patientName: item.patientName || '', therapistName: item.therapistName || '',
      diagnosis: item.diagnosis || '', goals: item.goals || '',
      startDate: item.startDate ? item.startDate.slice(0, 10) : '',
      endDate: item.endDate ? item.endDate.slice(0, 10) : '',
      frequency: item.frequency || '', exercises: item.exercises || '',
      precautions: item.precautions || '', notes: item.notes || '', status: item.status || 'active',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this treatment plan? This cannot be undone.')) return;
    try { await deleteTreatmentPlan(item._id || item.id); setSuccess('Treatment plan deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.diagnosis) { setError('Patient name and diagnosis are required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateTreatmentPlan(editingId, formData); setSuccess('Treatment plan updated'); }
      else { await createTreatmentPlan(formData); setSuccess('Treatment plan created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (s) => {
    const c = { active: 'badge-success', completed: 'badge-info', cancelled: 'badge-danger', 'on-hold': 'badge-warning' };
    return <span className={`status-badge ${c[s] || 'badge-default'}`}>{s || 'active'}</span>;
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
              <h2>Treatment Plans</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Treatment Plan</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Diagnosis</th><th>Therapist</th><th>Start Date</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="5" className="table-empty">No treatment plans found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patientName || item.patientId}</strong></td>
                      <td>{item.diagnosis}</td>
                      <td>{item.therapistName}</td>
                      <td>{item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Treatment Plan Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patientName || selectedItem.patientId}</p></div>
                  <div className="detail-field"><label>Therapist</label><p>{selectedItem.therapistName || 'N/A'}</p></div>
                  <div className="detail-field"><label>Diagnosis</label><p>{selectedItem.diagnosis}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field"><label>Start Date</label><p>{selectedItem.startDate ? new Date(selectedItem.startDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>End Date</label><p>{selectedItem.endDate ? new Date(selectedItem.endDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Frequency</label><p>{selectedItem.frequency || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Goals</label><p>{selectedItem.goals || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Exercises</label><p>{selectedItem.exercises || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Precautions</label><p>{selectedItem.precautions || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Treatment Plan' : 'Add Treatment Plan'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient Name *</label><input name="patientName" value={formData.patientName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Patient ID</label><input name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                <div className="form-group"><label>Therapist Name</label><input name="therapistName" value={formData.therapistName} onChange={handleChange} /></div>
                <div className="form-group"><label>Diagnosis *</label><input name="diagnosis" value={formData.diagnosis} onChange={handleChange} required /></div>
                <div className="form-group"><label>Start Date</label><input name="startDate" type="date" value={formData.startDate} onChange={handleChange} /></div>
                <div className="form-group"><label>End Date</label><input name="endDate" type="date" value={formData.endDate} onChange={handleChange} /></div>
                <div className="form-group"><label>Frequency</label><input name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g., 3x/week" /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option><option value="completed">Completed</option><option value="on-hold">On Hold</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Goals</label><textarea name="goals" value={formData.goals} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Exercises</label><textarea name="exercises" value={formData.exercises} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Precautions</label><textarea name="precautions" value={formData.precautions} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea></div>
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

export default TreatmentPlans;
