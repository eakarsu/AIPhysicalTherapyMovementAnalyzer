import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { getExerciseVideos, getExerciseVideo, createExerciseVideo, updateExerciseVideo, deleteExerciseVideo, getExercises } from '../api';

const emptyForm = {
  exercise_id: '', title: '', description: '', video_url: '', thumbnail_url: '',
  duration_seconds: '', difficulty_level: 'beginner', body_region: '', instructor_name: '',
};

function ExerciseVideos() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [exercises, setExercises] = useState([]);
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
      const [vidRes, exRes] = await Promise.all([getExerciseVideos(), getExercises()]);
      setItems(Array.isArray(vidRes.data) ? vidRes.data : []);
      setExercises(Array.isArray(exRes.data) ? exRes.data : []);
    } catch { setError('Failed to load exercise videos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleRowClick = async (item) => {
    try { const res = await getExerciseVideo(item.id); setSelectedItem(res.data); } catch { setSelectedItem(item); }
    setShowDetail(true);
  };

  const handleAdd = () => { setFormData({ ...emptyForm }); setEditingId(null); setShowForm(true); };

  const handleEdit = (item) => {
    setFormData({
      exercise_id: item.exercise_id || '', title: item.title || '', description: item.description || '',
      video_url: item.video_url || '', thumbnail_url: item.thumbnail_url || '',
      duration_seconds: item.duration_seconds || '', difficulty_level: item.difficulty_level || 'beginner',
      body_region: item.body_region || '', instructor_name: item.instructor_name || '',
    });
    setEditingId(item.id); setShowDetail(false); setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete video "${item.title}"?`)) return;
    try { await deleteExerciseVideo(item.id); setSuccess('Video deleted'); setShowDetail(false); fetchItems(); }
    catch { setError('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) { setError('Title is required'); return; }
    setFormLoading(true);
    try {
      if (editingId) { await updateExerciseVideo(editingId, formData); setSuccess('Video updated'); }
      else { await createExerciseVideo(formData); setSuccess('Video created'); }
      setShowForm(false); fetchItems();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save'); }
    finally { setFormLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const fmtDuration = (s) => { if (!s) return '0:00'; const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}`; };

  const renderStars = (rating) => {
    const r = Number(rating) || 0;
    return <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(r))}{'☆'.repeat(5 - Math.round(r))} <span style={{ color: '#6b7280', fontSize: '0.85em' }}>{r.toFixed(1)}</span></span>;
  };

  const getDiffBadge = (d) => {
    const cls = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' };
    return <span className={`status-badge ${cls[d] || 'badge-default'}`}>{d}</span>;
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
            <div><button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button><h2>Exercise Videos</h2></div>
            <button className="btn btn-primary" onClick={handleAdd}>+ Add Video</button>
          </div>
          {loading ? <div className="loading-container"><div className="spinner-large"></div></div> : (
            <div className="table-container"><table className="data-table"><thead><tr>
              <th>Title</th><th>Exercise</th><th>Body Region</th><th>Difficulty</th><th>Instructor</th><th>Duration</th><th>Rating</th>
            </tr></thead><tbody>
              {items.length === 0 ? <tr><td colSpan="7" className="table-empty">No exercise videos found.</td></tr> :
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)} className="table-row-clickable">
                    <td><strong>{item.title}</strong></td>
                    <td>{item.exercise_name || '-'}</td><td>{item.body_region}</td>
                    <td>{getDiffBadge(item.difficulty_level)}</td><td>{item.instructor_name}</td>
                    <td>{fmtDuration(item.duration_seconds)}</td><td>{renderStars(item.rating)}</td>
                  </tr>
                ))}
            </tbody></table></div>
          )}

          <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Exercise Video Details" size="large">
            {selectedItem && (
              <div className="detail-view">
                <div className="detail-grid">
                  <div className="detail-field"><label>Title</label><p>{selectedItem.title}</p></div>
                  <div className="detail-field"><label>Exercise</label><p>{selectedItem.exercise_name || '-'}</p></div>
                  <div className="detail-field"><label>Body Region</label><p>{selectedItem.body_region}</p></div>
                  <div className="detail-field"><label>Difficulty</label>{getDiffBadge(selectedItem.difficulty_level)}</div>
                  <div className="detail-field"><label>Instructor</label><p>{selectedItem.instructor_name}</p></div>
                  <div className="detail-field"><label>Duration</label><p>{fmtDuration(selectedItem.duration_seconds)}</p></div>
                  <div className="detail-field"><label>Rating</label>{renderStars(selectedItem.rating)}</div>
                  <div className="detail-field"><label>Views</label><p>{selectedItem.view_count?.toLocaleString() || 0}</p></div>
                  <div className="detail-field detail-full"><label>Description</label><p>{selectedItem.description || 'N/A'}</p></div>
                  <div className="detail-field"><label>Video URL</label><p style={{wordBreak:'break-all'}}>{selectedItem.video_url || 'N/A'}</p></div>
                  <div className="detail-field"><label>Thumbnail URL</label><p style={{wordBreak:'break-all'}}>{selectedItem.thumbnail_url || 'N/A'}</p></div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary" onClick={() => handleEdit(selectedItem)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem)}>Delete</button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Video' : 'Add Video'} size="large">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group form-full"><label>Title *</label><input name="title" value={formData.title} onChange={handleChange} required /></div>
                <div className="form-group"><label>Exercise</label>
                  <select name="exercise_id" value={formData.exercise_id} onChange={handleChange}>
                    <option value="">Select exercise...</option>
                    {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Body Region</label><input name="body_region" value={formData.body_region} onChange={handleChange} /></div>
                <div className="form-group"><label>Difficulty</label>
                  <select name="difficulty_level" value={formData.difficulty_level} onChange={handleChange}>
                    <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group"><label>Instructor</label><input name="instructor_name" value={formData.instructor_name} onChange={handleChange} /></div>
                <div className="form-group"><label>Duration (seconds)</label><input name="duration_seconds" type="number" value={formData.duration_seconds} onChange={handleChange} /></div>
                <div className="form-group"><label>Video URL</label><input name="video_url" value={formData.video_url} onChange={handleChange} /></div>
                <div className="form-group"><label>Thumbnail URL</label><input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} /></div>
                <div className="form-group form-full"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3"></textarea></div>
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

export default ExerciseVideos;
