import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getBilling, getBillingItem, createBilling, updateBilling, deleteBilling, getPatients } from '../api';

const emptyForm = {
  patient_id: '', insurance_provider: '', policy_number: '', claim_number: '',
  service_date: '', service_type: '', cpt_code: '', diagnosis_code: '',
  amount: '', paid_amount: '', status: 'pending', notes: '',
};

function Billing() {
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
      const [billRes, patRes] = await Promise.all([getBilling(), getPatients()]);
      setItems(Array.isArray(billRes.data) ? billRes.data : []);
      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
    } catch { setError('Failed to load billing records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getBillingItem(item.id); setSelectedItem(res.data); } catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patient_id: item.patient_id || '', insurance_provider: item.insurance_provider || '',
      policy_number: item.policy_number || '', claim_number: item.claim_number || '',
      service_date: item.service_date ? item.service_date.slice(0, 10) : '', service_type: item.service_type || '',
      cpt_code: item.cpt_code || '', diagnosis_code: item.diagnosis_code || '',
      amount: item.amount || '', paid_amount: item.paid_amount || '', status: item.status || 'pending', notes: item.notes || '',
    });
    setEditingId(item.id); setShowDetail(false); setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this billing record?')) return;
    try { await deleteBilling(item.id); setSuccess('Billing record deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) { setError('Patient is required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateBilling(editingId, formData); setSuccess('Billing updated'); }
      else { await createBilling(formData); setSuccess('Billing created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (status) => {
    const cls = { pending: 'badge-warning', submitted: 'badge-info', approved: 'badge-success', denied: 'badge-danger', paid: 'badge-success' };
    return <span className={`status-badge ${cls[status] || 'badge-default'}`}>{status}</span>;
  };

  const fmt = (v) => v != null ? `$${Number(v).toFixed(2)}` : '$0.00';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          {success && <div className="toast toast-success">{success}</div>}
          {error && <div className="toast toast-error">{error}</div>}
          <div className="page-header">
            <div><button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button><h2>Billing & Insurance</h2></div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Billing Record</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container"><table className="data-table"><thead><tr>
              <th>Patient</th><th>Insurance</th><th>Claim #</th><th>Service Date</th><th>CPT</th><th>Amount</th><th>Paid</th><th>Status</th>
            </tr></thead><tbody>
              {items.length === 0 ? <tr><td colSpan="8" className="table-empty">No billing records found.</td></tr> :
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                    <td><strong>{item.patient_name || `Patient #${item.patient_id}`}</strong></td>
                    <td>{item.insurance_provider}</td><td>{item.claim_number}</td>
                    <td>{item.service_date ? new Date(item.service_date).toLocaleDateString() : ''}</td>
                    <td>{item.cpt_code}</td><td>{fmt(item.amount)}</td><td>{fmt(item.paid_amount)}</td>
                    <td>{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
            </tbody></table></div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Billing Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patient_name || `Patient #${selectedItem.patient_id}`}</p></div>
                  <div className="detail-field"><label>Insurance Provider</label><p>{selectedItem.insurance_provider}</p></div>
                  <div className="detail-field"><label>Policy Number</label><p>{selectedItem.policy_number}</p></div>
                  <div className="detail-field"><label>Claim Number</label><p>{selectedItem.claim_number}</p></div>
                  <div className="detail-field"><label>Service Date</label><p>{selectedItem.service_date ? new Date(selectedItem.service_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Service Type</label><p>{selectedItem.service_type}</p></div>
                  <div className="detail-field"><label>CPT Code</label><p>{selectedItem.cpt_code}</p></div>
                  <div className="detail-field"><label>Diagnosis Code</label><p>{selectedItem.diagnosis_code}</p></div>
                  <div className="detail-field"><label>Amount</label><p style={{fontWeight:'bold',color:'#2563eb'}}>{fmt(selectedItem.amount)}</p></div>
                  <div className="detail-field"><label>Paid Amount</label><p style={{fontWeight:'bold',color:'#059669'}}>{fmt(selectedItem.paid_amount)}</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                  <div className="detail-field detail-full"><label>Notes</label><p>{selectedItem.notes || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Billing' : 'Add Billing Record'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient *</label>
                  <select name="patient_id" value={formData.patient_id} onChange={handleChange} required>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Insurance Provider</label><input name="insurance_provider" value={formData.insurance_provider} onChange={handleChange} /></div>
                <div className="form-group"><label>Policy Number</label><input name="policy_number" value={formData.policy_number} onChange={handleChange} /></div>
                <div className="form-group"><label>Claim Number</label><input name="claim_number" value={formData.claim_number} onChange={handleChange} /></div>
                <div className="form-group"><label>Service Date</label><input name="service_date" type="date" value={formData.service_date} onChange={handleChange} /></div>
                <div className="form-group"><label>Service Type</label><input name="service_type" value={formData.service_type} onChange={handleChange} /></div>
                <div className="form-group"><label>CPT Code</label><input name="cpt_code" value={formData.cpt_code} onChange={handleChange} /></div>
                <div className="form-group"><label>Diagnosis Code</label><input name="diagnosis_code" value={formData.diagnosis_code} onChange={handleChange} /></div>
                <div className="form-group"><label>Amount ($)</label><input name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} /></div>
                <div className="form-group"><label>Paid Amount ($)</label><input name="paid_amount" type="number" step="0.01" value={formData.paid_amount} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="pending">Pending</option><option value="submitted">Submitted</option>
                    <option value="approved">Approved</option><option value="denied">Denied</option><option value="paid">Paid</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea></div>
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

export default Billing;
