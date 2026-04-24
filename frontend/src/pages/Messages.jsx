import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getMessages, getMessage, createMessage, updateMessage, deleteMessage, markMessageRead, getPatients } from '../api';

const emptyForm = {
  patient_id: '', sender_type: 'therapist', subject: '', body: '',
  priority: 'normal', category: 'general',
};

function Messages() {
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
      const [msgRes, patRes] = await Promise.all([getMessages(), getPatients()]);
      setItems(Array.isArray(msgRes.data) ? msgRes.data : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
    } catch { setError('Failed to load messages'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try {
      const res = await getMessage(item.id);
      setSelectedItem(res.data);
      if (!item.is_read) { await markMessageRead(item.id); fetchItems(); }
    } catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patient_id: item.patient_id || '', sender_type: item.sender_type || 'therapist',
      subject: item.subject || '', body: item.body || '',
      priority: item.priority || 'normal', category: item.category || 'general',
    });
    setEditingId(item.id); setShowDetail(false); setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this message?')) return;
    try { await deleteMessage(item.id); setSuccess('Message deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.body) { setError('Subject and body required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateMessage(editingId, formData); setSuccess('Message updated'); }
      else { await createMessage(formData); setSuccess('Message sent'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getPriorityBadge = (p) => {
    const cls = { urgent: 'badge-danger', high: 'badge-warning', normal: 'badge-info', low: 'badge-default' };
    return <span className={`status-badge ${cls[p] || 'badge-default'}`}>{p}</span>;
  };

  const getCategoryBadge = (c) => <span className="status-badge badge-info">{c}</span>;

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          {success && <div className="toast toast-success">{success}</div>}
          {error && <div className="toast toast-error">{error}</div>}
          <div className="page-header">
            <div><button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button><h2>Messages</h2></div>
            <button className="btn btn-primary" onClick={handleAdd}>+ New Message</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container"><table className="data-table"><thead><tr>
              <th></th><th>Patient</th><th>Subject</th><th>From</th><th>Priority</th><th>Category</th><th>Date</th>
            </tr></thead><tbody>
              {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No messages found.</td></tr> :
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable" style={!item.is_read ? {fontWeight:'bold',backgroundColor:'#eff6ff'} : {}}>
                    <td>{!item.is_read && <span style={{color:'#2563eb',fontSize:'10px'}}>&#9679;</span>}</td>
                    <td>{item.patient_name || `Patient #${item.patient_id}`}</td>
                    <td><strong>{item.subject}</strong></td>
                    <td>{item.sender_type}</td>
                    <td>{getPriorityBadge(item.priority)}</td>
                    <td>{getCategoryBadge(item.category)}</td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
            </tbody></table></div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Message Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patient_name || `Patient #${selectedItem.patient_id}`}</p></div>
                  <div className="detail-field"><label>Sender Type</label><p>{selectedItem.sender_type}</p></div>
                  <div className="detail-field"><label>Priority</label>{getPriorityBadge(selectedItem.priority)}</div>
                  <div className="detail-field"><label>Category</label>{getCategoryBadge(selectedItem.category)}</div>
                  <div className="detail-field"><label>Read</label><p>{selectedItem.is_read ? 'Yes' : 'No'}</p></div>
                  <div className="detail-field"><label>Date</label><p>{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Subject</label><p style={{fontWeight:'bold',fontSize:'1.1em'}}>{selectedItem.subject}</p></div>
                  <div className="detail-field detail-full"><label>Message</label><p style={{whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{selectedItem.body}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Message' : 'New Message'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient</label>
                  <select name="patient_id" value={formData.patient_id} onChange={handleChange}>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Sender Type</label>
                  <select name="sender_type" value={formData.sender_type} onChange={handleChange}>
                    <option value="therapist">Therapist</option><option value="patient">Patient</option><option value="system">System</option>
                  </select>
                </div>
                <div className="form-group"><label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group"><label>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="general">General</option><option value="appointment">Appointment</option><option value="exercise">Exercise</option>
                    <option value="billing">Billing</option><option value="progress">Progress</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Subject *</label><input name="subject" value={formData.subject} onChange={handleChange} required /></div>
                <div className="form-group form-full"><label>Message *</label><textarea name="body" value={formData.body} onChange={handleChange} rows="5" required></textarea></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>{formLoading ? <span className="spinner"></span> : (editingId ? 'Update' : 'Send')}</button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Messages;
