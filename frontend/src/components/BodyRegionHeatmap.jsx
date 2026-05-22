import React, { useEffect, useState } from 'react';

// VIZ 2 — Body region heatmap (region x exercise grid colored by avg form_score)
export default function BodyRegionHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || '';
    fetch('/api/custom-views/region-heatmap', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#9ca3af' }}>Loading heatmap…</div>;
  if (error) return <div style={{ color: '#f87171' }}>Error: {error}</div>;
  if (!data || !data.cells || data.cells.length === 0) return <div style={{ color: '#9ca3af' }}>No heatmap data.</div>;

  const cellMap = new Map(data.cells.map((c) => [`${c.region}|${c.exercise}`, c]));
  const scoreColor = (s) => {
    if (s == null) return '#1f2937';
    // 0 = red, 50 = amber, 100 = green
    const t = Math.max(0, Math.min(100, s)) / 100;
    const r = Math.round(220 * (1 - t) + 34 * t);
    const g = Math.round(80 * (1 - t) + 197 * t);
    const b = Math.round(80 * (1 - t) + 94 * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="body-region-heatmap" style={{ background: '#0f172a', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
      <h3 style={{ color: '#e5e7eb', margin: '0 0 8px 0', fontSize: 16 }}>Body Region × Exercise Heatmap (avg form score)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: 6, color: '#9ca3af', textAlign: 'left', position: 'sticky', left: 0, background: '#0f172a' }}>Region \\ Exercise</th>
              {data.exercises.map((x) => (
                <th key={x} style={{ padding: 6, color: '#cbd5e1', writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: 120, whiteSpace: 'nowrap' }}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.regions.map((r) => (
              <tr key={r}>
                <td style={{ padding: 6, color: '#e5e7eb', fontWeight: 600, position: 'sticky', left: 0, background: '#0f172a' }}>{r}</td>
                {data.exercises.map((x) => {
                  const c = cellMap.get(`${r}|${x}`);
                  return (
                    <td
                      key={x}
                      title={c ? `${r} / ${x}: ${c.score} (n=${c.n})` : 'no data'}
                      style={{
                        width: 44, height: 28, textAlign: 'center', background: scoreColor(c ? c.score : null),
                        color: c && c.score >= 50 ? '#0f172a' : '#f3f4f6', fontWeight: 600, borderRadius: 3,
                      }}
                    >
                      {c ? c.score : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9ca3af' }}>
        <span>Low</span>
        <span style={{ width: 120, height: 10, background: 'linear-gradient(90deg, rgb(220,80,80), rgb(127,138,87), rgb(34,197,94))', borderRadius: 2 }} />
        <span>High</span>
        {data.source && <span style={{ marginLeft: 12 }}>(source: {data.source})</span>}
      </div>
    </div>
  );
}
