import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getTreatmentNotes, getTreatmentNote, createTreatmentNote, updateTreatmentNote, deleteTreatmentNote } from '../api';

const emptyForm = {
  patientId: '', patientName: '', therapistName: '', sessionDate: '',
  noteType: 'SOAP', subjective: '', objective: '', assessment: '',
  plan: '', goals: '', interventions: '', duration: '', status: 'draft',
};

function TreatmentNotes() {
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
    try { const res = await getTreatmentNotes(); setItems(Array.isArray(res.data) ? res.data : res.data?.data || []); }
    catch { setError('Failed to load treatment notes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getTreatmentNote(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      patientId: item.patientId || '', patientName: item.patientName || '',
      therapistName: item.therapistName || '',
      sessionDate: item.sessionDate ? item.sessionDate.slice(0, 10) : '',
      noteType: item.noteType || 'SOAP', subjective: item.subjective || '',
      objective: item.objective || '', assessment: item.assessment || '',
      plan: item.plan || '', goals: item.goals || '',
      interventions: item.interventions || '', duration: item.duration || '',
      status: item.status || 'draft',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this treatment note?')) return;
    try { await deleteTreatmentNote(item._id || item.id); setSuccess('Note deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName) { setError('Patient name is required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateTreatmentNote(editingId, formData); setSuccess('Note updated'); }
      else { await createTreatmentNote(formData); setSuccess('Note created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getStatusBadge = (s) => {
    const c = { draft: 'badge-warning', finalized: 'badge-success', signed: 'badge-info', amended: 'badge-purple' };
    return <span className={`status-badge ${c[s] || 'badge-default'}`}>{s || 'draft'}</span>;
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
              <h2>Treatment Notes</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Note</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Type</th><th>Therapist</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="5" className="table-empty">No treatment notes found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.patientName || item.patientId}</strong></td>
                      <td><span className="status-badge badge-default">{item.noteType || 'SOAP'}</span></td>
                      <td>{item.therapistName || 'N/A'}</td>
                      <td>{item.sessionDate ? new Date(item.sessionDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Treatment Note Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Patient</label><p>{selectedItem.patientName}</p></div>
                  <div className="detail-field"><label>Therapist</label><p>{selectedItem.therapistName || 'N/A'}</p></div>
                  <div className="detail-field"><label>Session Date</label><p>{selectedItem.sessionDate ? new Date(selectedItem.sessionDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div className="detail-field"><label>Note Type</label><p>{selectedItem.noteType || 'SOAP'}</p></div>
                  <div className="detail-field"><label>Duration</label><p>{selectedItem.duration || 'N/A'} min</p></div>
                  <div className="detail-field"><label>Status</label>{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div className="soap-sections">
                  <div className="soap-section soap-s"><h4>S - Subjective</h4><p>{selectedItem.subjective || 'N/A'}</p></div>
                  <div className="soap-section soap-o"><h4>O - Objective</h4><p>{selectedItem.objective || 'N/A'}</p></div>
                  <div className="soap-section soap-a"><h4>A - Assessment</h4><p>{selectedItem.assessment || 'N/A'}</p></div>
                  <div className="soap-section soap-p"><h4>P - Plan</h4><p>{selectedItem.plan || 'N/A'}</p></div>
                </div>
                <div className="detail-grid" style={{ marginTop: '1rem' }}>
                  <div className="detail-field detail-full"><label>Goals</label><p>{selectedItem.goals || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Interventions</label><p>{selectedItem.interventions || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Note' : 'Add Treatment Note'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Patient Name *</label><input name="patientName" value={formData.patientName} onChange={handleChange} required /></div>
                <div className="form-group"><label>Patient ID</label><input name="patientId" value={formData.patientId} onChange={handleChange} /></div>
                <div className="form-group"><label>Therapist Name</label><input name="therapistName" value={formData.therapistName} onChange={handleChange} /></div>
                <div className="form-group"><label>Session Date</label><input name="sessionDate" type="date" value={formData.sessionDate} onChange={handleChange} /></div>
                <div className="form-group"><label>Note Type</label>
                  <select name="noteType" value={formData.noteType} onChange={handleChange}>
                    <option value="SOAP">SOAP</option><option value="Progress">Progress Note</option><option value="Initial">Initial Evaluation</option><option value="Discharge">Discharge Summary</option>
                  </select>
                </div>
                <div className="form-group"><label>Duration (min)</label><input name="duration" type="number" value={formData.duration} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="draft">Draft</option><option value="finalized">Finalized</option><option value="signed">Signed</option><option value="amended">Amended</option>
                  </select>
                </div>
                <div className="form-group form-full"><label>Subjective</label><textarea name="subjective" value={formData.subjective} onChange={handleChange} rows="3" placeholder="Patient's reported symptoms, complaints, and history"></textarea></div>
                <div className="form-group form-full"><label>Objective</label><textarea name="objective" value={formData.objective} onChange={handleChange} rows="3" placeholder="Measurable findings, ROM, strength, gait observations"></textarea></div>
                <div className="form-group form-full"><label>Assessment</label><textarea name="assessment" value={formData.assessment} onChange={handleChange} rows="3" placeholder="Clinical impression and interpretation of findings"></textarea></div>
                <div className="form-group form-full"><label>Plan</label><textarea name="plan" value={formData.plan} onChange={handleChange} rows="3" placeholder="Treatment plan, goals, frequency, next visit"></textarea></div>
                <div className="form-group form-full"><label>Goals</label><textarea name="goals" value={formData.goals} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group form-full"><label>Interventions</label><textarea name="interventions" value={formData.interventions} onChange={handleChange} rows="2"></textarea></div>
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

export default TreatmentNotes;
