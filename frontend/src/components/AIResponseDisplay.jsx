import React from 'react';

function AIResponseDisplay({ response }) {
  if (!response) return null;

  const renderValue = (value, depth = 0) => {
    if (value === null || value === undefined) return <span className="ai-value-null">N/A</span>;
    if (typeof value === 'boolean') return <span className={`ai-badge ${value ? 'badge-success' : 'badge-danger'}`}>{value ? 'Yes' : 'No'}</span>;
    if (typeof value === 'number') return <span className="ai-value-number">{value}</span>;
    if (typeof value === 'string') {
      if (value.toLowerCase().includes('high') || value.toLowerCase().includes('severe')) {
        return <span className="ai-badge badge-danger">{value}</span>;
      }
      if (value.toLowerCase().includes('medium') || value.toLowerCase().includes('moderate')) {
        return <span className="ai-badge badge-warning">{value}</span>;
      }
      if (value.toLowerCase().includes('low') || value.toLowerCase().includes('mild') || value.toLowerCase().includes('good') || value.toLowerCase().includes('excellent')) {
        return <span className="ai-badge badge-success">{value}</span>;
      }
      return <span className="ai-value-string">{value}</span>;
    }
    if (Array.isArray(value)) {
      return (
        <div className="ai-array">
          {value.map((item, i) => (
            <div key={i} className="ai-array-item">
              {typeof item === 'object' ? renderObject(item, depth + 1) : (
                <span className="ai-list-item">
                  <span className="ai-list-bullet">&#9679;</span> {renderValue(item, depth + 1)}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }
    if (typeof value === 'object') {
      return renderObject(value, depth + 1);
    }
    return <span>{String(value)}</span>;
  };

  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  const getSectionIcon = (key) => {
    const lower = key.toLowerCase();
    if (lower.includes('exercise') || lower.includes('workout')) return '🏋️';
    if (lower.includes('recommend')) return '💡';
    if (lower.includes('warning') || lower.includes('risk') || lower.includes('precaution')) return '⚠️';
    if (lower.includes('progress') || lower.includes('recovery') || lower.includes('improvement')) return '📈';
    if (lower.includes('score') || lower.includes('rating') || lower.includes('grade')) return '⭐';
    if (lower.includes('note') || lower.includes('comment') || lower.includes('observation')) return '📝';
    if (lower.includes('goal') || lower.includes('target') || lower.includes('objective')) return '🎯';
    if (lower.includes('patient') || lower.includes('name')) return '👤';
    if (lower.includes('plan') || lower.includes('protocol')) return '📋';
    if (lower.includes('date') || lower.includes('time') || lower.includes('schedule')) return '📅';
    if (lower.includes('pain') || lower.includes('symptom')) return '🩺';
    if (lower.includes('strength') || lower.includes('mobility')) return '💪';
    return '📌';
  };

  const renderProgressBar = (value) => {
    const num = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(num) || num < 0 || num > 100) return null;
    const color = num >= 75 ? '#059669' : num >= 50 ? '#d97706' : '#dc2626';
    return (
      <div className="ai-progress-container">
        <div className="ai-progress-bar" style={{ width: `${num}%`, backgroundColor: color }}></div>
        <span className="ai-progress-label">{num}%</span>
      </div>
    );
  };

  const renderObject = (obj, depth = 0) => {
    if (!obj || typeof obj !== 'object') return renderValue(obj, depth);

    return (
      <div className={`ai-section ${depth > 0 ? 'ai-section-nested' : ''}`}>
        {Object.entries(obj).map(([key, value]) => {
          const isScore = key.toLowerCase().includes('score') || key.toLowerCase().includes('percentage') || key.toLowerCase().includes('progress');
          const isScoreNum = isScore && typeof value === 'number' && value >= 0 && value <= 100;

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return (
              <div key={key} className="ai-card">
                <div className="ai-card-header">
                  <span className="ai-card-icon">{getSectionIcon(key)}</span>
                  <h4>{formatKey(key)}</h4>
                </div>
                <div className="ai-card-body">
                  {renderObject(value, depth + 1)}
                </div>
              </div>
            );
          }

          if (Array.isArray(value)) {
            return (
              <div key={key} className="ai-card">
                <div className="ai-card-header">
                  <span className="ai-card-icon">{getSectionIcon(key)}</span>
                  <h4>{formatKey(key)}</h4>
                  <span className="ai-count-badge">{value.length}</span>
                </div>
                <div className="ai-card-body">
                  {renderValue(value, depth)}
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="ai-field">
              <span className="ai-field-label">{formatKey(key)}</span>
              <span className="ai-field-value">
                {isScoreNum && renderProgressBar(value)}
                {renderValue(value, depth)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTextResponse = (text) => {
    const lines = text.split('\n');
    return (
      <div className="ai-text-response">
        {lines.map((line, i) => {
          if (!line.trim()) return <br key={i} />;
          if (line.startsWith('# ')) return <h2 key={i} className="ai-text-h2">{line.slice(2)}</h2>;
          if (line.startsWith('## ')) return <h3 key={i} className="ai-text-h3">{line.slice(3)}</h3>;
          if (line.startsWith('### ')) return <h4 key={i} className="ai-text-h4">{line.slice(4)}</h4>;
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return <div key={i} className="ai-list-item"><span className="ai-list-bullet">&#9679;</span> {line.slice(2)}</div>;
          }
          if (/^\d+\.\s/.test(line)) {
            return <div key={i} className="ai-list-item"><span className="ai-list-number">{line.match(/^\d+/)[0]}.</span> {line.replace(/^\d+\.\s/, '')}</div>;
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i}><strong>{line.slice(2, -2)}</strong></p>;
          }
          return <p key={i}>{line}</p>;
        })}
      </div>
    );
  };

  let data = response;
  if (typeof response === 'string') {
    try {
      data = JSON.parse(response);
    } catch {
      return (
        <div className="ai-response-container">
          {renderTextResponse(response)}
        </div>
      );
    }
  }

  if (data && data.data) {
    data = data.data;
  }

  return (
    <div className="ai-response-container">
      <div className="ai-response-header">
        <span className="ai-response-icon">🤖</span>
        <h3>AI Analysis Results</h3>
      </div>
      {renderObject(data)}
    </div>
  );
}

export default AIResponseDisplay;
