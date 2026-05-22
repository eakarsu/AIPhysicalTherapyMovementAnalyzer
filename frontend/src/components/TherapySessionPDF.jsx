import React, { useEffect, useState } from 'react';

// NON-VIZ 1 — Therapy session PDF (text report; "Download" triggers browser-native print)
export default function TherapySessionPDF() {
  const [patientId, setPatientId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = (id) => {
    setLoading(true);
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || '';
    const q = id ? `?patient_id=${encodeURIComponent(id)}` : '';
    fetch(`/api/custom-views/session-pdf${q}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  const download = () => {
    if (!data) return;
    const blob = new Blob([data.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `therapy-session-${data.patient?.id || 'report'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="therapy-session-pdf" style={{ background: '#0f172a', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
      <h3 style={{ color: '#e5e7eb', margin: '0 0 8px 0', fontSize: 16 }}>Therapy Session PDF (text report)</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="number"
          placeholder="patient id (blank = first)"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '6px 10px', borderRadius: 4, width: 200 }}
        />
        <button onClick={() => load(patientId)} disabled={loading}
          style={{ background: '#2563eb', color: 'white', border: 0, padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? 'Loading…' : 'Generate'}
        </button>
        <button onClick={download} disabled={!data}
          style={{ background: '#059669', color: 'white', border: 0, padding: '6px 14px', borderRadius: 4, cursor: data ? 'pointer' : 'not-allowed' }}>
          Download .txt
        </button>
      </div>
      {error && <div style={{ color: '#f87171', marginBottom: 8 }}>Error: {error}</div>}
      {data && (
        <pre style={{
          background: '#020617', color: '#e5e7eb', padding: 14, borderRadius: 6,
          fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto', margin: 0,
        }}>{data.text}</pre>
      )}
    </div>
  );
}
