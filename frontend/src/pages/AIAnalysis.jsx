import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import AIResponseDisplay from '../components/AIResponseDisplay';
import {
  aiAnalyzeMovement, aiGenerateTreatmentPlan, aiAssessRecovery,
  aiRecommendExercises, aiGenerateHEP, aiGenerateSOAPNote,
  aiAnalyzePain, aiPredictOutcomes,
} from '../api';

const aiFeatures = [
  {
    id: 'analyze-movement',
    icon: '🎯',
    title: 'Analyze Movement Form',
    description: 'AI-powered analysis of patient exercise form and technique',
    color: '#dc2626',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'exerciseName', label: 'Exercise Name', required: true },
      { name: 'bodyRegion', label: 'Body Region', placeholder: 'e.g., Shoulder, Knee, Lower Back' },
      { name: 'movementDescription', label: 'Movement Description', type: 'textarea', placeholder: 'Describe the movement being performed' },
      { name: 'observedIssues', label: 'Observed Issues', type: 'textarea', placeholder: 'Any compensation patterns or form issues noticed' },
      { name: 'painLevel', label: 'Pain Level (0-10)', type: 'number' },
      { name: 'rangeOfMotion', label: 'Range of Motion', placeholder: 'e.g., 0-120 degrees' },
    ],
    apiFn: aiAnalyzeMovement,
  },
  {
    id: 'generate-treatment-plan',
    icon: '📋',
    title: 'Generate Treatment Plan',
    description: 'AI-generated comprehensive treatment protocol',
    color: '#7c3aed',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'diagnosis', label: 'Diagnosis/Condition', required: true, placeholder: 'e.g., ACL tear, Rotator cuff injury' },
      { name: 'severity', label: 'Severity', type: 'select', options: ['mild', 'moderate', 'severe'] },
      { name: 'surgeryDate', label: 'Surgery Date (if applicable)', type: 'date' },
      { name: 'medicalHistory', label: 'Medical History', type: 'textarea' },
      { name: 'goals', label: 'Patient Goals', type: 'textarea', placeholder: 'e.g., Return to sport, pain-free daily activities' },
      { name: 'frequency', label: 'Preferred Frequency', placeholder: 'e.g., 3x/week' },
    ],
    apiFn: aiGenerateTreatmentPlan,
  },
  {
    id: 'assess-recovery',
    icon: '📈',
    title: 'Assess Recovery',
    description: 'AI assessment of patient recovery trajectory',
    color: '#059669',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'condition', label: 'Condition', required: true },
      { name: 'weeksSinceOnset', label: 'Weeks Since Onset/Surgery', type: 'number' },
      { name: 'currentPainLevel', label: 'Current Pain Level (0-10)', type: 'number' },
      { name: 'initialPainLevel', label: 'Initial Pain Level (0-10)', type: 'number' },
      { name: 'currentROM', label: 'Current Range of Motion', placeholder: 'e.g., Flexion: 130 degrees' },
      { name: 'strengthLevel', label: 'Strength Level', type: 'select', options: ['1/5', '2/5', '3/5', '4/5', '5/5'] },
      { name: 'functionalAbilities', label: 'Current Functional Abilities', type: 'textarea' },
      { name: 'complianceRate', label: 'HEP Compliance Rate (%)', type: 'number' },
    ],
    apiFn: aiAssessRecovery,
  },
  {
    id: 'recommend-exercises',
    icon: '🏋️',
    title: 'Recommend Exercises',
    description: 'AI-recommended therapeutic exercises for specific conditions',
    color: '#2563eb',
    fields: [
      { name: 'condition', label: 'Condition/Injury', required: true, placeholder: 'e.g., Frozen shoulder, Post-TKR' },
      { name: 'phase', label: 'Rehabilitation Phase', type: 'select', options: ['acute', 'subacute', 'chronic', 'post-surgical-early', 'post-surgical-late', 'maintenance'] },
      { name: 'painLevel', label: 'Current Pain Level (0-10)', type: 'number' },
      { name: 'restrictions', label: 'Restrictions/Precautions', type: 'textarea', placeholder: 'e.g., No weight-bearing, avoid overhead' },
      { name: 'equipment', label: 'Available Equipment', placeholder: 'e.g., Theraband, dumbbells, foam roller' },
      { name: 'fitnessLevel', label: 'Fitness Level', type: 'select', options: ['sedentary', 'low', 'moderate', 'active', 'athletic'] },
      { name: 'goals', label: 'Goals', type: 'textarea' },
    ],
    apiFn: aiRecommendExercises,
  },
  {
    id: 'generate-hep',
    icon: '🏠',
    title: 'Generate HEP',
    description: 'AI-generated home exercise program tailored to the patient',
    color: '#0891b2',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'condition', label: 'Condition', required: true },
      { name: 'phase', label: 'Rehabilitation Phase', type: 'select', options: ['acute', 'subacute', 'chronic', 'maintenance'] },
      { name: 'frequency', label: 'Program Frequency', placeholder: 'e.g., Daily, 5x/week' },
      { name: 'duration', label: 'Program Duration', placeholder: 'e.g., 4 weeks' },
      { name: 'painLevel', label: 'Pain Level (0-10)', type: 'number' },
      { name: 'restrictions', label: 'Restrictions', type: 'textarea' },
      { name: 'goals', label: 'Patient Goals', type: 'textarea' },
      { name: 'homeEquipment', label: 'Equipment at Home', placeholder: 'e.g., Theraband, foam roller' },
    ],
    apiFn: aiGenerateHEP,
  },
  {
    id: 'generate-soap',
    icon: '📝',
    title: 'Generate SOAP Note',
    description: 'AI-generated SOAP documentation from session information',
    color: '#4338ca',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'sessionDate', label: 'Session Date', type: 'date' },
      { name: 'diagnosis', label: 'Diagnosis', required: true },
      { name: 'patientComplaints', label: 'Patient Complaints/Symptoms', type: 'textarea', required: true, placeholder: 'What the patient reports' },
      { name: 'vitalSigns', label: 'Vital Signs/Measurements', type: 'textarea', placeholder: 'ROM, strength, pain levels observed' },
      { name: 'treatmentPerformed', label: 'Treatment Performed', type: 'textarea', required: true, placeholder: 'Exercises, modalities, manual therapy' },
      { name: 'patientResponse', label: 'Patient Response to Treatment', type: 'textarea' },
      { name: 'sessionDuration', label: 'Session Duration (min)', type: 'number' },
    ],
    apiFn: aiGenerateSOAPNote,
  },
  {
    id: 'analyze-pain',
    icon: '🩺',
    title: 'Analyze Pain Patterns',
    description: 'AI analysis of pain patterns with intervention recommendations',
    color: '#dc2626',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'bodyRegions', label: 'Body Regions Affected', required: true, placeholder: 'e.g., Low back, Right leg' },
      { name: 'painTypes', label: 'Pain Types Reported', placeholder: 'e.g., Burning, Aching, Sharp' },
      { name: 'triggers', label: 'Known Triggers', type: 'textarea', placeholder: 'What activities or positions worsen pain?' },
      { name: 'painHistory', label: 'Pain History', type: 'textarea', placeholder: 'Duration, progression, past treatments' },
      { name: 'currentMedications', label: 'Current Medications', placeholder: 'List current pain medications' },
      { name: 'functionalLimitations', label: 'Functional Limitations', type: 'textarea', placeholder: 'How does pain affect daily activities?' },
    ],
    apiFn: aiAnalyzePain,
  },
  {
    id: 'predict-outcomes',
    icon: '📊',
    title: 'Predict Treatment Outcomes',
    description: 'AI-predicted treatment outcomes based on patient data',
    color: '#059669',
    fields: [
      { name: 'patientName', label: 'Patient Name', required: true },
      { name: 'condition', label: 'Condition', required: true },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'measureType', label: 'Outcome Measure', type: 'select', options: ['DASH', 'ODI', 'LEFS', 'NDI', 'VAS', 'SF-36', 'BERG', 'TUG', 'FIM'] },
      { name: 'currentScore', label: 'Current Score', type: 'number', required: true },
      { name: 'previousScores', label: 'Previous Scores', placeholder: 'e.g., 22, 35, 45 (comma-separated)' },
      { name: 'weeksInTreatment', label: 'Weeks in Treatment', type: 'number' },
      { name: 'complianceRate', label: 'HEP Compliance (%)', type: 'number' },
      { name: 'comorbidities', label: 'Comorbidities', type: 'textarea', placeholder: 'e.g., Diabetes, Hypertension' },
    ],
    apiFn: aiPredictOutcomes,
  },
];

function AIAnalysis() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFeature, setActiveFeature] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenFeature = (feature) => {
    setActiveFeature(feature);
    setFormData({});
    setAiResponse(null);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeFeature) return;

    const requiredFields = activeFeature.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        setError(`${field.label} is required`);
        return;
      }
    }

    setAiLoading(true);
    setError('');
    setAiResponse(null);

    try {
      const res = await activeFeature.apiFn(formData);
      setAiResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      required: field.required,
      placeholder: field.placeholder || '',
    };

    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows="3"></textarea>;
    }
    if (field.type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'number') {
      return <input type="number" {...commonProps} />;
    }
    if (field.type === 'date') {
      return <input type="date" {...commonProps} />;
    }
    return <input type="text" {...commonProps} />;
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
              <h2>AI Analysis Hub</h2>
              <p>Leverage AI to enhance your clinical decision-making</p>
            </div>
          </div>

          <div className="ai-hub-grid">
            {aiFeatures.map((feature) => (
              <div
                key={feature.id}
                className="ai-hub-card"
                onClick={() => handleOpenFeature(feature)}
                style={{ '--card-accent': feature.color }}
              >
                <div className="ai-hub-card-icon" style={{ backgroundColor: feature.color + '15', color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button className="btn btn-sm" style={{ backgroundColor: feature.color, color: '#fff' }}>
                  Launch
                </button>
              </div>
            ))}
          </div>

          <Modal
            isOpen={!!activeFeature}
            onClose={() => { setActiveFeature(null); setAiResponse(null); setError(''); }}
            title={activeFeature?.title || ''}
            size="large"
          >
            {activeFeature && (
              <div className="ai-feature-content">
                {!aiResponse && (
                  <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="alert alert-error">{error}</div>}
                    <div className="form-grid">
                      {activeFeature.fields.map((field) => (
                        <div key={field.name} className={`form-group ${field.type === 'textarea' ? 'form-full' : ''}`}>
                          <label>{field.label} {field.required && '*'}</label>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => { setActiveFeature(null); setError(''); }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={aiLoading}>
                        {aiLoading ? (
                          <span className="ai-loading-text">
                            <span className="spinner"></span> Analyzing...
                          </span>
                        ) : (
                          <span>Run AI Analysis</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {aiLoading && (
                  <div className="ai-loading-overlay">
                    <div className="ai-loading-spinner">
                      <div className="spinner-large"></div>
                      <p>AI is analyzing your data...</p>
                      <p className="ai-loading-sub">This may take a few moments</p>
                    </div>
                  </div>
                )}

                {aiResponse && !aiLoading && (
                  <div className="ai-result-container">
                    <AIResponseDisplay response={aiResponse} />
                    <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                      <button className="btn btn-secondary" onClick={() => { setAiResponse(null); setError(''); }}>
                        Run Again
                      </button>
                      <button className="btn btn-primary" onClick={() => { setActiveFeature(null); setAiResponse(null); setError(''); }}>
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}

export default AIAnalysis;
