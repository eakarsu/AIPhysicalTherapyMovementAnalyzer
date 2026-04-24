import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getPatientProfile } from '../api';

function PatientProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getPatientProfile(id);
        setData(res.data);
      } catch {
        setError('Failed to load patient profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'treatment', label: 'Treatment Plans' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'notes', label: 'SOAP Notes' },
    { key: 'progress', label: 'Recovery Progress' },
    { key: 'assessments', label: 'Assessments' },
    { key: 'hep', label: 'Home Programs' },
  ];

  const getStatusBadge = (status) => {
    const classes = { active: 'badge-success', 'on-hold': 'badge-warning', discharged: 'badge-info', paused: 'badge-warning', completed: 'badge-success' };
    return <span className={`status-badge ${classes[status] || 'badge-default'}`}>{status}</span>;
  };

  const renderOverview = () => {
    const p = data.patient;
    const latestProgress = data.recoveryProgress[0];
    return (
      <div className="profile-overview">
        <div className="profile-info-grid">
          <div className="profile-info-card">
            <h4>Contact Information</h4>
            <div className="profile-info-rows">
              <div className="profile-info-row"><span>Email</span><span>{p.email || 'N/A'}</span></div>
              <div className="profile-info-row"><span>Phone</span><span>{p.phone || 'N/A'}</span></div>
              <div className="profile-info-row"><span>Date of Birth</span><span>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A'}</span></div>
              <div className="profile-info-row"><span>Insurance</span><span>{p.insurance || 'N/A'}</span></div>
            </div>
          </div>
          <div className="profile-info-card">
            <h4>Clinical Summary</h4>
            <div className="profile-info-rows">
              <div className="profile-info-row"><span>Condition</span><span>{p.condition || 'N/A'}</span></div>
              <div className="profile-info-row"><span>Injury Type</span><span>{p.injury_type || 'N/A'}</span></div>
              <div className="profile-info-row"><span>Status</span>{getStatusBadge(p.status)}</div>
              <div className="profile-info-row"><span>Treatment Plans</span><span>{data.treatmentPlans.length}</span></div>
            </div>
          </div>
          {latestProgress && (
            <div className="profile-info-card">
              <h4>Latest Recovery Metrics</h4>
              <div className="profile-metrics">
                <div className="profile-metric">
                  <div className="profile-metric-value" style={{ color: latestProgress.pain_level > 5 ? '#dc2626' : '#059669' }}>
                    {latestProgress.pain_level}/10
                  </div>
                  <div className="profile-metric-label">Pain Level</div>
                </div>
                <div className="profile-metric">
                  <div className="profile-metric-value" style={{ color: '#2563eb' }}>{latestProgress.mobility_score}%</div>
                  <div className="profile-metric-label">Mobility</div>
                </div>
                <div className="profile-metric">
                  <div className="profile-metric-value" style={{ color: '#7c3aed' }}>{latestProgress.strength_score}%</div>
                  <div className="profile-metric-label">Strength</div>
                </div>
              </div>
              <p className="profile-progress-note">{latestProgress.overall_progress}</p>
            </div>
          )}
        </div>
        <div className="profile-timeline">
          <h4>Recent Activity Timeline</h4>
          <div className="timeline">
            {[
              ...data.appointments.slice(0, 5).map(a => ({
                date: a.appointment_date,
                type: 'appointment',
                title: `${a.type} - ${a.therapist_name}`,
                detail: a.notes || '',
                status: a.status,
              })),
              ...data.treatmentNotes.slice(0, 5).map(n => ({
                date: n.note_date,
                type: 'note',
                title: `SOAP Note - ${n.therapist_name}`,
                detail: n.assessment ? n.assessment.slice(0, 150) : '',
                status: 'completed',
              })),
              ...data.recoveryProgress.slice(0, 3).map(r => ({
                date: r.assessment_date,
                type: 'progress',
                title: 'Recovery Assessment',
                detail: r.overall_progress || '',
                status: 'completed',
              })),
            ]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot timeline-dot-${item.type}`} />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-date">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="timeline-title">{item.title}</div>
                    {item.detail && <p className="timeline-detail">{item.detail}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTreatmentPlans = () => (
    <div className="profile-section-list">
      {data.treatmentPlans.length === 0 ? <p className="empty-msg">No treatment plans found.</p> : data.treatmentPlans.map((tp, i) => (
        <div key={i} className="profile-list-card">
          <div className="profile-list-header">
            <div>
              <h4>{tp.diagnosis}</h4>
              <span className="profile-list-sub">{tp.therapist_name} | {tp.frequency}</span>
            </div>
            {getStatusBadge(tp.status)}
          </div>
          <p>{tp.goals}</p>
          <div className="profile-list-meta">
            <span>{tp.start_date ? new Date(tp.start_date).toLocaleDateString() : ''} - {tp.end_date ? new Date(tp.end_date).toLocaleDateString() : 'Ongoing'}</span>
          </div>
          {tp.notes && <p className="profile-list-notes">{tp.notes}</p>}
        </div>
      ))}
    </div>
  );

  const renderAppointments = () => (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>Date</th><th>Type</th><th>Therapist</th><th>Duration</th><th>Location</th><th>Status</th></tr></thead>
        <tbody>
          {data.appointments.length === 0 ? (
            <tr><td colSpan="6" className="table-empty">No appointments found.</td></tr>
          ) : data.appointments.map((a, i) => (
            <tr key={i}>
              <td>{a.appointment_date ? new Date(a.appointment_date).toLocaleString() : 'N/A'}</td>
              <td><span className={`status-badge ${a.type === 'initial-eval' ? 'badge-purple' : 'badge-info'}`}>{a.type}</span></td>
              <td>{a.therapist_name}</td>
              <td>{a.duration_minutes} min</td>
              <td>{a.location || 'N/A'}</td>
              <td>{getStatusBadge(a.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderNotes = () => (
    <div className="profile-section-list">
      {data.treatmentNotes.length === 0 ? <p className="empty-msg">No treatment notes found.</p> : data.treatmentNotes.map((n, i) => (
        <div key={i} className="profile-list-card">
          <div className="profile-list-header">
            <div>
              <h4>{n.therapist_name} - {n.note_date ? new Date(n.note_date).toLocaleDateString() : ''}</h4>
            </div>
          </div>
          <div className="soap-sections">
            {n.subjective && <div className="soap-section soap-s"><h4>Subjective</h4><p>{n.subjective}</p></div>}
            {n.objective && <div className="soap-section soap-o"><h4>Objective</h4><p>{n.objective}</p></div>}
            {n.assessment && <div className="soap-section soap-a"><h4>Assessment</h4><p>{n.assessment}</p></div>}
            {n.plan && <div className="soap-section soap-p"><h4>Plan</h4><p>{n.plan}</p></div>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderProgress = () => (
    <div className="profile-section-list">
      {data.recoveryProgress.length === 0 ? <p className="empty-msg">No recovery data found.</p> : (
        <>
          <div className="progress-chart">
            <div className="progress-chart-header">
              <span>Pain</span><span>Mobility</span><span>Strength</span>
            </div>
            {data.recoveryProgress.slice().reverse().map((r, i) => (
              <div key={i} className="progress-chart-row">
                <span className="progress-chart-date">{r.assessment_date ? new Date(r.assessment_date).toLocaleDateString() : ''}</span>
                <div className="progress-chart-bars">
                  <div className="progress-chart-bar" style={{ width: `${r.pain_level * 10}%`, background: r.pain_level > 5 ? '#dc2626' : '#059669' }} title={`Pain: ${r.pain_level}/10`} />
                </div>
                <div className="progress-chart-bars">
                  <div className="progress-chart-bar" style={{ width: `${r.mobility_score}%`, background: '#2563eb' }} title={`Mobility: ${r.mobility_score}%`} />
                </div>
                <div className="progress-chart-bars">
                  <div className="progress-chart-bar" style={{ width: `${r.strength_score}%`, background: '#7c3aed' }} title={`Strength: ${r.strength_score}%`} />
                </div>
              </div>
            ))}
          </div>
          {data.recoveryProgress.map((r, i) => (
            <div key={i} className="profile-list-card">
              <div className="profile-list-header">
                <h4>{r.assessment_date ? new Date(r.assessment_date).toLocaleDateString() : ''}</h4>
                <div className="profile-metrics-inline">
                  <span style={{ color: '#dc2626' }}>Pain: {r.pain_level}/10</span>
                  <span style={{ color: '#2563eb' }}>Mobility: {r.mobility_score}%</span>
                  <span style={{ color: '#7c3aed' }}>Strength: {r.strength_score}%</span>
                </div>
              </div>
              <p><strong>{r.overall_progress}</strong></p>
              {r.milestones && <p className="profile-list-notes">Milestones: {r.milestones}</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );

  const renderAssessments = () => (
    <div className="profile-section-list">
      {data.assessments.length === 0 ? <p className="empty-msg">No assessments found.</p> : data.assessments.map((a, i) => (
        <div key={i} className="profile-list-card">
          <div className="profile-list-header">
            <div>
              <h4>{a.exercise_name || 'Exercise'}</h4>
              <span className="profile-list-sub">{a.assessment_date ? new Date(a.assessment_date).toLocaleDateString() : ''}</span>
            </div>
            <div className="form-score-badge" style={{
              background: a.form_score >= 80 ? '#d1fae5' : a.form_score >= 60 ? '#fef3c7' : '#fee2e2',
              color: a.form_score >= 80 ? '#059669' : a.form_score >= 60 ? '#d97706' : '#dc2626',
            }}>
              {a.form_score}/100
            </div>
          </div>
          <p>{a.ai_feedback}</p>
          {a.recommendations && <p className="profile-list-notes">Recommendations: {a.recommendations}</p>}
        </div>
      ))}
    </div>
  );

  const renderHEP = () => (
    <div className="profile-section-list">
      {data.homeExercisePrograms.length === 0 ? <p className="empty-msg">No home programs found.</p> : data.homeExercisePrograms.map((h, i) => {
        const exercises = typeof h.exercises === 'string' ? JSON.parse(h.exercises) : (h.exercises || []);
        return (
          <div key={i} className="profile-list-card">
            <div className="profile-list-header">
              <div>
                <h4>{h.program_name}</h4>
                <span className="profile-list-sub">{h.frequency} | {h.start_date ? new Date(h.start_date).toLocaleDateString() : ''} - {h.end_date ? new Date(h.end_date).toLocaleDateString() : 'Ongoing'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                {getStatusBadge(h.status)}
                <div className="compliance-badge" style={{
                  color: h.compliance_rate >= 80 ? '#059669' : h.compliance_rate >= 50 ? '#d97706' : '#dc2626',
                  marginTop: '0.25rem', fontWeight: 700, fontSize: '0.875rem'
                }}>
                  {h.compliance_rate}% compliance
                </div>
              </div>
            </div>
            <div className="hep-exercise-list">
              {exercises.map((ex, j) => (
                <div key={j} className="hep-exercise-item">
                  <span className="hep-exercise-name">{ex.name}</span>
                  <span className="hep-exercise-detail">
                    {ex.sets && `${ex.sets} sets`} {ex.reps && `x ${ex.reps}`} {ex.hold && `(${ex.hold} hold)`} {ex.duration || ''}
                  </span>
                </div>
              ))}
            </div>
            {h.ai_recommendations && <p className="profile-list-notes">{h.ai_recommendations}</p>}
          </div>
        );
      })}
    </div>
  );

  const tabContent = {
    overview: renderOverview,
    treatment: renderTreatmentPlans,
    appointments: renderAppointments,
    notes: renderNotes,
    progress: renderProgress,
    assessments: renderAssessments,
    hep: renderHEP,
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`main-content ${sidebarOpen ? '' : 'main-content-expanded'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="page-content">
          <div className="page-header">
            <div>
              <button className="btn btn-text" onClick={() => navigate('/patients')}>&larr; Back to Patients</button>
              {data && <h2>{data.patient.name}</h2>}
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner-large"></div></div>
          ) : error ? (
            <div className="alert alert-error">{error}</div>
          ) : data && (
            <>
              <div className="profile-tabs">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    className={`profile-tab ${activeTab === tab.key ? 'profile-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                    {tab.key !== 'overview' && (
                      <span className="profile-tab-count">
                        {tab.key === 'treatment' ? data.treatmentPlans.length :
                         tab.key === 'appointments' ? data.appointments.length :
                         tab.key === 'notes' ? data.treatmentNotes.length :
                         tab.key === 'progress' ? data.recoveryProgress.length :
                         tab.key === 'assessments' ? data.assessments.length :
                         tab.key === 'hep' ? data.homeExercisePrograms.length : 0}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="profile-tab-content">
                {tabContent[activeTab]()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientProfile;
