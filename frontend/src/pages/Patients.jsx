import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getPatientsPaged, getPatient, createPatient, updatePatient, deletePatient } from '../api';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: '', address: '', emergencyContact: '', emergencyPhone: '',
  insuranceProvider: '', insuranceId: '', medicalHistory: '',
  currentCondition: '', status: 'active',
};

function Patients() {
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchItems = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getPatientsPaged(p, limit);
      const d = res.data;
      setItems(Array.isArray(d) ? d : d?.data || []);
      setPage(d?.page || 1);
      setTotalPages(d?.totalPages || 1);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(1); }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); }
  }, [error]);

  const handleRowClick = async (item) => {
    try {
      const res = await getPatient(item._id || item.id);
      setSelectedItem(res.data?.data || res.data);
    } catch {
      setSelectedItem(item);
    }
    setShowDetail(true);
  };

  const handleAdd = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setFormData({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      dateOfBirth: item.dateOfBirth ? item.dateOfBirth.slice(0, 10) : '',
      gender: item.gender || '',
      address: item.address || '',
      emergencyContact: item.emergencyContact || '',
      emergencyPhone: item.emergencyPhone || '',
      insuranceProvider: item.insuranceProvider || '',
      insuranceId: item.insuranceId || '',
      medicalHistory: item.medicalHistory || '',
      currentCondition: item.currentCondition || '',
      status: item.status || 'active',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete patient ${item.firstName} ${item.lastName}? This cannot be undone.`)) return;
    try {
      await deletePatient(item._id || item.id);
      setSuccess('Patient deleted successfully');
      setShowDetail(false);
      fetchItems(page);
    } catch {
      setError('Failed to delete patient');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }
    setFormLoading(true);
    try {
      if (editingId) {
        await updatePatient(editingId, formData);
        setSuccess('Patient updated successfully');
      } else {
        await createPatient(formData);
        setSuccess('Patient created successfully');
      }
      setShowForm(false);
      fetchItems(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save patient');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusBadge = (status) => {
    const classes = { active: 'badge-success', inactive: 'badge-danger', discharged: 'badge-info' };
    return <span className={`status-badge ${classes[status] || 'badge-default'}`}>{status || 'active'}</span>;
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
              <h2>Patients</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Patient</button>
          </div>
          {loading ? (
            <div className="loading-container"><div className="spinner-large"></div></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Condition</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="5" className="table-empty">No patients found. Add your first patient.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.firstName} {item.lastName}</strong></td>
                      <td>{item.email}</td>
                      <td>{item.phone}</td>
                      <td>{item.currentCondition}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => { const p = page - 1; setPage(p); fetchItems(p); }} disabled={page <= 1}>Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-secondary" onClick={() => { const p = page + 1; setPage(p); fetchItems(p); }} disabled={page >= totalPages}>Next</button>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Patient Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>First Name</label><p>{selectedItem.firstName}</p></div>
                  <div className="detail-field"><label>Last Name</label><p>{selectedItem.lastName}</p></div>
                  <div className="detail-field"><label>Email</label><p>{selectedItem.email}</p></div>
                  <div className="detail-field"><label>Phone</label><p>{selectedItem.phone}</p></div>
                  <div className="detail-field"><label>Date of Birth</label><p>{selectedItem.dateOfBirth ? new Date(selectedItem.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Gender</label><p>{selectedItem.gender || 'N/A'}</p></div>
                  <div className="detail-field"><label>Address</label><p>{selectedItem.address || 'N/A'}</p></div>
                  <div className="detail-field"><label>Emergency Contact</label><p>{selectedItem.emergencyContact || 'N/A'}</p></div>
                  <div className="detail-field"><label>Emergency Phone</label><p>{selectedItem.emergencyPhone || 'N/A'}</p></div>
                  <div className="detail-field"><label>Insurance Provider</label><p>{selectedItem.insuranceProvider || 'N/A'}</p></div>
                  <div className="detail-field"><label>Insurance ID</label><p>{selectedItem.insuranceId || 'N/A'}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field detail-full"><label>Medical History</label><p>{selectedItem.medicalHistory || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Current Condition</label><p>{selectedItem.currentCondition || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => navigate(`/patient-profile/${selectedItem.id || selectedItem._id}`)}>View Full Profile</button>
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Patient' : 'Add Patient'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group form-full">
                  <label>Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Emergency Phone</label>
                  <input name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Insurance Provider</label>
                  <input name="insuranceProvider" value={formData.insuranceProvider} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Insurance ID</label>
                  <input name="insuranceId" value={formData.insuranceId} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discharged">Discharged</option>
                  </select>
                </div>
                <div className="form-group form-full">
                  <label>Medical History</label>
                  <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} rows="3"></textarea>
                </div>
                <div className="form-group form-full">
                  <label>Current Condition</label>
                  <textarea name="currentCondition" value={formData.currentCondition} onChange={handleChange} rows="3"></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <span className="spinner"></span> : (editingId ? 'Update Patient' : 'Create Patient')}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Patients;
