import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment } from '../api';

const emptyForm = {
  patientId: '', patientName: '', therapistName: '', appointmentDate: '',
  appointmentTime: '', duration: '60', type: 'follow-up', location: '',
  reason: '', notes: '', status: 'scheduled',
};

function Appointments() {
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
    try { const res = await getAppointments(); setItems(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getAppointment(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patientId: item.patientId || '', patientName: item.patientName || '',
      therapistName: item.therapistName || '',
      appointmentDate: item.appointmentDate ? item.appointmentDate.slice(0, 10) : '',
      appointmentTime: item.appointmentTime || '', duration: item.duration || '60',
      type: item.type || 'follow-up', location: item.location || '',
      reason: item.reason || '', notes: item.notes || '', status: item.status || 'scheduled',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this appointment?')) return;
    try { await deleteAppointment(item._id || item.id); setSuccess('Appointment deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.appointmentDate) { setError('Patient name and date are required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateAppointment(editingId, formData); setSuccess('Appointment updated'); }
      else { await createAppointment(formData); setSuccess('Appointment created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (s) => {
    const c = { scheduled: 'badge-info', confirmed: 'badge-success', completed: 'badge-success', cancelled: 'badge-danger', 'no-show': 'badge-warning' };
    return <span className={`status-badge ${c[s] || 'badge-default'}`}>{s || 'scheduled'}</span>;
  };

  const getTypeBadge = (t) => {
    const c = { 'initial-eval': 'badge-purple', 'follow-up': 'badge-info', 'reassessment': 'badge-warning', 'discharge': 'badge-default' };
    return <span className={`status-badge ${c[t] || 'badge-default'}`}>{t || 'follow-up'}</span>;
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
              <h2>Appointments</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Appointment</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Type</th><th>Therapist</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="6" className="table-empty">No appointments found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patientName || item.patientId}</strong></td>
                      <td>{item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{item.appointmentTime || 'N/A'}</td>
                      <td>{getTypeBadge(item.type)}</td>
                      <td>{item.therapistName || 'N/A'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Appointment Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patientName}</p></div>
                  <div className="detail-field"><label>Therapist</label><p>{selectedItem.therapistName || 'N/A'}</p></div>
                  <div className="detail-field"><label>Date</label><p>{selectedItem.appointmentDate ? new Date(selectedItem.appointmentDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Time</label><p>{selectedItem.appointmentTime || 'N/A'}</p></div>
                  <div className="detail-field"><label>Duration</label><p>{selectedItem.duration || '60'} min</p></div>
                  <div className="detail-field"><label>Type</label>{getTypeBadge(selectedItem.type)}</div>
                  <div className="detail-field"><label>Location</label><p>{selectedItem.location || 'N/A'}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field detail-full"><label>Reason</label><p>{selectedItem.reason || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Appointment' : 'Add Appointment'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient Name *</label><input name="patientName" value={formData.patientName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Patient ID</label><input name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                <div className="form-group"><label>Therapist Name</label><input name="therapistName" value={formData.therapistName} onChange={handleChange} /></div>
                <div className="form-group"><label>Date *</label><input name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleChange} required /></div>
                <div className="form-group"><label>Time</label><input name="appointmentTime" type="time" value={formData.appointmentTime} onChange={handleChange} /></div>
                <div className="form-group"><label>Duration (min)</label><input name="duration" type="number" value={formData.duration} onChange={handleChange} /></div>
                <div className="form-group"><label>Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="initial-eval">Initial Evaluation</option><option value="follow-up">Follow-up</option><option value="reassessment">Reassessment</option><option value="discharge">Discharge</option>
                  </select>
                </div>
                <div className="form-group"><label>Location</label><input name="location" value={formData.location} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no-show">No Show</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Reason</label><textarea name="reason" value={formData.reason} onChange={handleChange} rows="2"></textarea></div>
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

export default Appointments;
