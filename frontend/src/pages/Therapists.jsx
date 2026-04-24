import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getTherapists, getTherapist, createTherapist, updateTherapist, deleteTherapist } from '../api';

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', specialization: '',
  license_number: '', years_experience: '', certifications: '', bio: '',
  status: 'active', hire_date: '',
};

function Therapists() {
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
    try {
      const res = await getTherapists();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch { setError('Failed to load therapists'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getTherapist(item.id); setSelectedItem(res.data); } catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      first_name: item.first_name || '', last_name: item.last_name || '', email: item.email || '',
      phone: item.phone || '', specialization: item.specialization || '', license_number: item.license_number || '',
      years_experience: item.years_experience || '', certifications: item.certifications || '', bio: item.bio || '',
      status: item.status || 'active', hire_date: item.hire_date ? item.hire_date.slice(0, 10) : '',
    });
    setEditingId(item.id); setShowDetail(false); setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete therapist ${item.first_name} ${item.last_name}?`)) return;
    try { await deleteTherapist(item.id); setSuccess('Therapist deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete therapist'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) { setError('First and last name required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateTherapist(editingId, formData); setSuccess('Therapist updated'); }
      else { await createTherapist(formData); setSuccess('Therapist created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (status) => {
    const cls = { active: 'badge-success', 'on-leave': 'badge-warning', inactive: 'badge-danger' };
    return <span className={`status-badge ${cls[status] || 'badge-default'}`}>{status}</span>;
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
              <h2>Therapists</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Therapist</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container"><table className="data-table"><thead><tr>
              <th>Name</th><th>Email</th><th>Specialization</th><th>License #</th><th>Experience</th><th>Status</th>
            </tr></thead><tbody>
              {items.length === 0 ? <tr><td colSpan="6" className="table-empty">No therapists found.</td></tr> :
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                    <td><strong>{item.first_name} {item.last_name}</strong></td>
                    <td>{item.email}</td><td>{item.specialization}</td>
                    <td>{item.license_number}</td><td>{item.years_experience} yrs</td>
                    <td>{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
            </tbody></table></div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Therapist Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>First Name</label><p>{selectedItem.first_name}</p></div>
                  <div className="detail-field"><label>Last Name</label><p>{selectedItem.last_name}</p></div>
                  <div className="detail-field"><label>Email</label><p>{selectedItem.email}</p></div>
                  <div className="detail-field"><label>Phone</label><p>{selectedItem.phone}</p></div>
                  <div className="detail-field"><label>Specialization</label><p>{selectedItem.specialization}</p></div>
                  <div className="detail-field"><label>License Number</label><p>{selectedItem.license_number}</p></div>
                  <div className="detail-field"><label>Years Experience</label><p>{selectedItem.years_experience}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field"><label>Hire Date</label><p>{selectedItem.hire_date ? new Date(selectedItem.hire_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Certifications</label><p>{selectedItem.certifications || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Bio</label><p>{selectedItem.bio || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Therapist' : 'Add Therapist'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>First Name *</label><input name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Last Name *</label><input name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} /></div>
                <div className="form-group"><label>Phone</label><input name="phone" value={formData.phone} onChange={handleChange} /></div>
                <div className="form-group"><label>Specialization</label><input name="specialization" value={formData.specialization} onChange={handleChange} /></div>
                <div className="form-group"><label>License Number</label><input name="license_number" value={formData.license_number} onChange={handleChange} /></div>
                <div className="form-group"><label>Years Experience</label><input name="years_experience" type="number" value={formData.years_experience} onChange={handleChange} /></div>
                <div className="form-group"><label>Hire Date</label><input name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option><option value="on-leave">On Leave</option><option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Certifications</label><textarea name="certifications" value={formData.certifications} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Bio</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows="3"></textarea></div>
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

export default Therapists;
