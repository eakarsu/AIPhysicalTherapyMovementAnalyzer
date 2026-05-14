import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getAuditLogs } from '../api';

function AuditLog() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getAuditLogs(p, limit);
      const d = res.data;
      setItems(d.data || []);
      setPage(d.page || 1);
      setTotalPages(d.totalPages || 1);
      setTotal(d.total || 0);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const handlePage = (p) => { setPage(p); fetchLogs(p); };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          {error && <div className="toast toast-error">{error}</div>}
          <div className="page-header">
            <div>
              <button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
              <h2>HIPAA Audit Log</h2>
              <p style={{ color: '#6b7280', marginTop: 4 }}>Patient view history — {total} total records</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner-large"></div></div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity Type</th>
                      <th>Entity ID</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan="7" className="table-empty">No audit records found.</td></tr>
                    ) : items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.user_name || `User #${item.user_id}` || '—'}</td>
                        <td><span className="status-badge badge-info">{item.action}</span></td>
                        <td>{item.entity_type}</td>
                        <td>{item.entity_id}</td>
                        <td>{item.ip_address}</td>
                        <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-secondary" onClick={() => handlePage(page - 1)} disabled={page <= 1}>Prev</button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>Page {page} of {totalPages}</span>
                  <button className="btn btn-secondary" onClick={() => handlePage(page + 1)} disabled={page >= totalPages}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLog;
