import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getHomeExercisePrograms, getHomeExerciseProgram, createHomeExerciseProgram, updateHomeExerciseProgram, deleteHomeExerciseProgram } from '../api';

const emptyForm = {
  patientId: '', patientName: '', programName: '', startDate: '', endDate: '',
  exercises: '', frequency: '', duration: '', complianceRate: '',
  lastCompleted: '', therapistNotes: '', patientFeedback: '', status: 'active',
};

function HomeExercisePrograms() {
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
    try { const res = await getHomeExercisePrograms(); setItems(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError('Failed to load programs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getHomeExerciseProgram(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patientId: item.patientId || '', patientName: item.patientName || '',
      programName: item.programName || '',
      startDate: item.startDate ? item.startDate.slice(0, 10) : '',
      endDate: item.endDate ? item.endDate.slice(0, 10) : '',
      exercises: item.exercises || '', frequency: item.frequency || '',
      duration: item.duration || '', complianceRate: item.complianceRate || '',
      lastCompleted: item.lastCompleted ? item.lastCompleted.slice(0, 10) : '',
      therapistNotes: item.therapistNotes || '', patientFeedback: item.patientFeedback || '',
      status: item.status || 'active',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this home exercise program?')) return;
    try { await deleteHomeExerciseProgram(item._id || item.id); setSuccess('Program deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.programName) { setError('Patient name and program name are required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateHomeExerciseProgram(editingId, formData); setSuccess('Program updated'); }
      else { await createHomeExerciseProgram(formData); setSuccess('Program created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (s) => {
    const c = { active: 'badge-success', completed: 'badge-info', paused: 'badge-warning', cancelled: 'badge-danger' };
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
              <h2>Home Exercise Programs</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Program</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Program</th><th>Compliance</th><th>Frequency</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="5" className="table-empty">No home exercise programs found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patientName || item.patientId}</strong></td>
                      <td>{item.programName}</td>
                      <td>{item.complianceRate ? `${item.complianceRate}%` : 'N/A'}</td>
                      <td>{item.frequency || 'N/A'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Home Exercise Program Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patientName}</p></div>
                  <div className="detail-field"><label>Program Name</label><p>{selectedItem.programName}</p></div>
                  <div className="detail-field"><label>Start Date</label><p>{selectedItem.startDate ? new Date(selectedItem.startDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>End Date</label><p>{selectedItem.endDate ? new Date(selectedItem.endDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Frequency</label><p>{selectedItem.frequency || 'N/A'}</p></div>
                  <div className="detail-field"><label>Duration</label><p>{selectedItem.duration || 'N/A'}</p></div>
                  <div className="detail-field"><label>Compliance Rate</label><p>{selectedItem.complianceRate ? `${selectedItem.complianceRate}%` : 'N/A'}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field"><label>Last Completed</label><p>{selectedItem.lastCompleted ? new Date(selectedItem.lastCompleted).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Exercises</label><p>{selectedItem.exercises || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Therapist Notes</label><p>{selectedItem.therapistNotes || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Patient Feedback</label><p>{selectedItem.patientFeedback || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Program' : 'Add Program'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient Name *</label><input name="patientName" value={formData.patientName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Patient ID</label><input name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                <div className="form-group"><label>Program Name *</label><input name="programName" value={formData.programName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Frequency</label><input name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g., Daily, 3x/week" /></div>
                <div className="form-group"><label>Start Date</label><input name="startDate" type="date" value={formData.startDate} onChange={handleChange} /></div>
                <div className="form-group"><label>End Date</label><input name="endDate" type="date" value={formData.endDate} onChange={handleChange} /></div>
                <div className="form-group"><label>Duration</label><input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 4 weeks" /></div>
                <div className="form-group"><label>Compliance Rate (%)</label><input name="complianceRate" type="number" min="0" max="100" value={formData.complianceRate} onChange={handleChange} /></div>
                <div className="form-group"><label>Last Completed</label><input name="lastCompleted" type="date" value={formData.lastCompleted} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Exercises</label><textarea name="exercises" value={formData.exercises} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Therapist Notes</label><textarea name="therapistNotes" value={formData.therapistNotes} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Patient Feedback</label><textarea name="patientFeedback" value={formData.patientFeedback} onChange={handleChange} rows="2"></textarea></div>
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

export default HomeExercisePrograms;
