import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getWaitlist, getWaitlistItem, createWaitlistEntry, updateWaitlistEntry, deleteWaitlistEntry, getPatients } from '../api';

const emptyForm = {
  patient_id: '', preferred_therapist: '', preferred_time: '',
  reason: '', priority: 'normal', status: 'waiting', notes: '',
};

function Waitlist() {
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
      const [waitlistRes, patientsRes] = await Promise.all([getWaitlist(), getPatients()]);
      setItems(Array.isArray(waitlistRes.data) ? waitlistRes.data : []);
      setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : []);
    } catch { setError('Failed to load waitlist'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getWaitlistItem(item.id); setSelectedItem(res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patient_id: item.patient_id || '',
      preferred_therapist: item.preferred_therapist || '',
      preferred_time: item.preferred_time || '',
      reason: item.reason || '',
      priority: item.priority || 'normal',
      status: item.status || 'waiting',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Remove from waitlist?')) return;
    try { await deleteWaitlistEntry(item.id); setSuccess('Removed from waitlist'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to remove'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.reason) { setError('Patient and reason are required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateWaitlistEntry(editingId, formData); setSuccess('Waitlist entry updated'); }
      else { await createWaitlistEntry(formData); setSuccess('Added to waitlist'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getPriorityBadge = (p) => {
    const c = { urgent: 'badge-danger', high: 'badge-warning', normal: 'badge-info', low: 'badge-default' };
    return <span className={`status-badge ${c[p] || 'badge-default'}`}>{p}</span>;
  };

  const getStatusBadge = (s) => {
    const c = { waiting: 'badge-info', contacted: 'badge-warning', scheduled: 'badge-success', cancelled: 'badge-danger' };
    return <span className={`status-badge ${c[s] || 'badge-default'}`}>{s}</span>;
  };

  const waitingCount = items.filter(i => i.status === 'waiting').length;
  const urgentCount = items.filter(i => i.priority === 'urgent').length;

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
              <h2>Waitlist</h2>
              <p>{waitingCount} waiting{urgentCount > 0 ? ` | ${urgentCount} urgent` : ''}</p>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add to Waitlist</button>
          </div>

          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Reason</th><th>Preferred Therapist</th><th>Preferred Time</th><th>Priority</th><th>Status</th><th>Requested</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="7" className="table-empty">Waitlist is empty.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patient_name || `Patient #${item.patient_id}`}</strong></td>
                      <td>{item.reason ? item.reason.slice(0, 60) + (item.reason.length > 60 ? '...' : '') : 'N/A'}</td>
                      <td>{item.preferred_therapist || 'Any'}</td>
                      <td>{item.preferred_time || 'Any'}</td>
                      <td>{getPriorityBadge(item.priority)}</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>{item.requested_date ? new Date(item.requested_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Waitlist Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patient_name || `Patient #${selectedItem.patient_id}`}</p></div>
                  <div className="detail-field"><label>Phone</label><p>{selectedItem.phone || 'N/A'}</p></div>
                  <div className="detail-field"><label>Email</label><p>{selectedItem.email || 'N/A'}</p></div>
                  <div className="detail-field"><label>Condition</label><p>{selectedItem.condition || 'N/A'}</p></div>
                  <div className="detail-field"><label>Preferred Therapist</label><p>{selectedItem.preferred_therapist || 'Any'}</p></div>
                  <div className="detail-field"><label>Preferred Time</label><p>{selectedItem.preferred_time || 'Any'}</p></div>
                  <div className="detail-field"><label>Priority</label>{getPriorityBadge(selectedItem.priority)}</div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field detail-full"><label>Reason</label><p>{selectedItem.reason || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Remove</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Waitlist Entry' : 'Add to Waitlist'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Patient *</label>
                  <select name="patient_id" value={formData.patient_id} onChange={handleChange} required>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferred Therapist</label>
                  <select name="preferred_therapist" value={formData.preferred_therapist} onChange={handleChange}>
                    <option value="">Any</option>
                    <option value="Dr. Sarah Mitchell">Dr. Sarah Mitchell</option>
                    <option value="Dr. James Rodriguez">Dr. James Rodriguez</option>
                    <option value="Dr. Emily Chen">Dr. Emily Chen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferred Time</label>
                  <select name="preferred_time" value={formData.preferred_time} onChange={handleChange}>
                    <option value="">Any</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                {editingId && (
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                      <option value="waiting">Waiting</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
                <div className="form-group form-full">
                  <label>Reason *</label>
                  <textarea name="reason" value={formData.reason} onChange={handleChange} rows="2" required></textarea>
                </div>
                <div className="form-group form-full">
                  <label>Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <span className="spinner"></span> : (editingId ? 'Update' : 'Add to Waitlist')}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Waitlist;
