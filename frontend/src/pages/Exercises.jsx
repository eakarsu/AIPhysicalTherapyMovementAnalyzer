import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getExercises, getExercise, createExercise, updateExercise, deleteExercise } from '../api';

const emptyForm = {
  name: '', category: '', targetArea: '', difficulty: 'beginner',
  description: '', instructions: '', sets: '', reps: '', duration: '',
  equipment: '', precautions: '', videoUrl: '', status: 'active',
};

function Exercises() {
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
      const res = await getExercises();
      setItems(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setError('Failed to load exercises'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getExercise(item._id || item.id); setSelectedItem(res.data?.data || res.data); }
    catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '', category: item.category || '', targetArea: item.targetArea || '',
      difficulty: item.difficulty || 'beginner', description: item.description || '',
      instructions: item.instructions || '', sets: item.sets || '', reps: item.reps || '',
      duration: item.duration || '', equipment: item.equipment || '', precautions: item.precautions || '',
      videoUrl: item.videoUrl || '', status: item.status || 'active',
    });
    setEditingId(item._id || item.id);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete exercise "${item.name}"? This cannot be undone.`)) return;
    try { await deleteExercise(item._id || item.id); setSuccess('Exercise deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete exercise'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { setError('Exercise name is required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateExercise(editingId, formData); setSuccess('Exercise updated'); }
      else { await createExercise(formData); setSuccess('Exercise created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save exercise'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getDifficultyBadge = (d) => {
    const c = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' };
    return <span className={`status-badge ${c[d] || 'badge-default'}`}>{d || 'beginner'}</span>;
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
              <h2>Exercise Library</h2>
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Exercise</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Category</th><th>Target Area</th><th>Difficulty</th><th>Sets/Reps</th></tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="5" className="table-empty">No exercises found.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item._id || item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                      <td><strong>{item.name}</strong></td>
                      <td>{item.category}</td>
                      <td>{item.targetArea}</td>
                      <td>{getDifficultyBadge(item.difficulty)}</td>
                      <td>{item.sets && item.reps ? `${item.sets}x${item.reps}` : item.duration || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Exercise Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Name</label><p>{selectedItem.name}</p></div>
                  <div className="detail-field"><label>Category</label><p>{selectedItem.category || 'N/A'}</p></div>
                  <div className="detail-field"><label>Target Area</label><p>{selectedItem.targetArea || 'N/A'}</p></div>
                  <div className="detail-field"><label>Difficulty</label>{getDifficultyBadge(selectedItem.difficulty)}</div>
                  <div className="detail-field"><label>Sets</label><p>{selectedItem.sets || 'N/A'}</p></div>
                  <div className="detail-field"><label>Reps</label><p>{selectedItem.reps || 'N/A'}</p></div>
                  <div className="detail-field"><label>Duration</label><p>{selectedItem.duration || 'N/A'}</p></div>
                  <div className="detail-field"><label>Equipment</label><p>{selectedItem.equipment || 'None'}</p></div>
                  <div className="detail-field detail-full"><label>Description</label><p>{selectedItem.description || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Instructions</label><p>{selectedItem.instructions || 'N/A'}</p></div>
                  <div className="detail-field detail-full"><label>Precautions</label><p>{selectedItem.precautions || 'N/A'}</p></div>
                  {selectedItem.videoUrl && <div className="detail-field detail-full"><label>Video URL</label><p><a href={selectedItem.videoUrl} target="_blank" rel="noreferrer">{selectedItem.videoUrl}</a></p></div>}
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Exercise' : 'Add Exercise'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label>Name *</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
                <div className="form-group"><label>Category</label><input name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Strengthening, Stretching" /></div>
                <div className="form-group"><label>Target Area</label><input name="targetArea" value={formData.targetArea} onChange={handleChange} placeholder="e.g., Shoulder, Knee" /></div>
                <div className="form-group"><label>Difficulty</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}>
                    <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group"><label>Sets</label><input name="sets" type="number" value={formData.sets} onChange={handleChange} /></div>
                <div className="form-group"><label>Reps</label><input name="reps" type="number" value={formData.reps} onChange={handleChange} /></div>
                <div className="form-group"><label>Duration</label><input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 30 seconds" /></div>
                <div className="form-group"><label>Equipment</label><input name="equipment" value={formData.equipment} onChange={handleChange} /></div>
                <div className="form-group form-full"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Instructions</label><textarea name="instructions" value={formData.instructions} onChange={handleChange} rows="3"></textarea></div>
                <div className="form-group form-full"><label>Precautions</label><textarea name="precautions" value={formData.precautions} onChange={handleChange} rows="2"></textarea></div>
                <div className="form-group"><label>Video URL</label><input name="videoUrl" value={formData.videoUrl} onChange={handleChange} /></div>
                <div className="form-group"><label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <span className="spinner"></span> : (editingId ? 'Update Exercise' : 'Create Exercise')}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default Exercises;
