import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getReportsOverview } from '../api';

function Reports() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getReportsOverview();
        setData(res.data);
      } catch {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ label, value, sub, color }) => (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );

  const ProgressBar = ({ label, value, max, color }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div className="report-progress-row">
        <span className="report-progress-label">{label}</span>
        <div className="report-progress-track">
          <div className="report-progress-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="report-progress-value">{value}</span>
      </div>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          <div className="page-header">
            <div>
              <button className="btn btn-text" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
              <h2>Reports & Analytics</h2>
              <p>Clinic performance overview and key metrics</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner-large"></div></div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : data && (
            <>
              {/* Key Stats Row */}
              <div className="stats-grid">
                <StatCard label="Total Patients" value={data.patients.total} sub={`${data.patients.active} active`} color="#2563eb" />
                <StatCard label="Upcoming Appointments" value={data.appointments.upcoming_week} sub="Next 7 days" color="#059669" />
                <StatCard label="Avg Pain Level" value={`${data.recovery.avg_pain}/10`} sub={`${data.recovery.total_assessments} assessments`} color="#dc2626" />
                <StatCard label="Avg Mobility Score" value={`${data.recovery.avg_mobility}%`} sub="Across all patients" color="#7c3aed" />
                <StatCard label="Avg Strength Score" value={`${data.recovery.avg_strength}%`} sub="Across all patients" color="#d97706" />
                <StatCard label="HEP Compliance" value={`${data.compliance.avg_compliance || 0}%`} sub={`${data.compliance.total_programs || 0} active programs`} color="#0891b2" />
              </div>

              <div className="reports-grid">
                {/* Patient Status Breakdown */}
                <div className="report-card">
                  <h3>Patient Status</h3>
                  <div className="report-card-body">
                    <ProgressBar label="Active" value={parseInt(data.patients.active)} max={parseInt(data.patients.total)} color="#059669" />
                    <ProgressBar label="On Hold" value={parseInt(data.patients.on_hold)} max={parseInt(data.patients.total)} color="#d97706" />
                    <ProgressBar label="Discharged" value={parseInt(data.patients.discharged)} max={parseInt(data.patients.total)} color="#6b7280" />
                  </div>
                </div>

                {/* Appointment Stats */}
                <div className="report-card">
                  <h3>Appointment Overview</h3>
                  <div className="report-card-body">
                    <ProgressBar label="Completed" value={parseInt(data.appointments.completed)} max={parseInt(data.appointments.total)} color="#059669" />
                    <ProgressBar label="Scheduled" value={parseInt(data.appointments.scheduled)} max={parseInt(data.appointments.total)} color="#2563eb" />
                    <ProgressBar label="Cancelled" value={parseInt(data.appointments.cancelled)} max={parseInt(data.appointments.total)} color="#dc2626" />
                    <ProgressBar label="No Show" value={parseInt(data.appointments.no_show)} max={parseInt(data.appointments.total)} color="#d97706" />
                  </div>
                </div>

                {/* Therapist Workload */}
                <div className="report-card">
                  <h3>Therapist Workload</h3>
                  <div className="report-card-body">
                    {data.therapistWorkload.map((t, i) => (
                      <div key={i} className="therapist-workload-row">
                        <div className="therapist-workload-name">{t.therapist_name}</div>
                        <div className="therapist-workload-stats">
                          <span className="status-badge badge-info">{t.upcoming} upcoming</span>
                          <span className="status-badge badge-success">{t.completed} done</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HEP Compliance */}
                <div className="report-card">
                  <h3>HEP Compliance Breakdown</h3>
                  <div className="report-card-body">
                    <ProgressBar label="High (80%+)" value={parseInt(data.compliance.high_compliance || 0)} max={parseInt(data.compliance.total_programs || 1)} color="#059669" />
                    <ProgressBar label="Moderate (50-79%)" value={parseInt(data.compliance.moderate_compliance || 0)} max={parseInt(data.compliance.total_programs || 1)} color="#d97706" />
                    <ProgressBar label="Low (<50%)" value={parseInt(data.compliance.low_compliance || 0)} max={parseInt(data.compliance.total_programs || 1)} color="#dc2626" />
                  </div>
                </div>

                {/* Top Conditions */}
                <div className="report-card">
                  <h3>Top Conditions</h3>
                  <div className="report-card-body">
                    {data.conditions.map((c, i) => (
                      <div key={i} className="condition-row">
                        <span className="condition-name">{c.condition}</span>
                        <span className="condition-count">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appointments by Day */}
                <div className="report-card">
                  <h3>Appointments by Day (Last 30 Days)</h3>
                  <div className="report-card-body">
                    {data.weeklyAppointments.map((d, i) => (
                      <ProgressBar key={i} label={d.day_name} value={parseInt(d.count)} max={Math.max(...data.weeklyAppointments.map(x => parseInt(x.count)))} color="#2563eb" />
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="report-card report-card-wide">
                  <h3>Recent Treatment Notes</h3>
                  <div className="report-card-body">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Patient</th>
                          <th>Therapist</th>
                          <th>Assessment Summary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentActivity.map((a, i) => (
                          <tr key={i}>
                            <td>{a.note_date ? new Date(a.note_date).toLocaleDateString() : 'N/A'}</td>
                            <td><strong>{a.patient_name || 'Unknown'}</strong></td>
                            <td>{a.therapist_name}</td>
                            <td>{a.assessment ? a.assessment.slice(0, 120) + (a.assessment.length > 120 ? '...' : '') : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
