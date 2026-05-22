import React, { useEffect, useState } from 'react';

// VIZ 1 — Range-of-Motion trend chart (multi-series line, SVG, no deps)
export default function ROMTrendChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  useEffect(() => {
    setLoading(true);
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || '';
    fetch(`/api/custom-views/rom-trend?days=${days}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div style={{ color: '#9ca3af' }}>Loading ROM trend…</div>;
  if (error) return <div style={{ color: '#f87171' }}>Error: {error}</div>;
  if (!data || !data.series || data.series.length === 0) return <div style={{ color: '#9ca3af' }}>No ROM data.</div>;

  const W = 720, H = 280, PAD = 40;
  const weeks = data.weeks || [];
  const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#f87171', '#22d3ee'];
  const xFor = (i) => PAD + (weeks.length > 1 ? (i * (W - PAD * 2)) / (weeks.length - 1) : (W - PAD * 2) / 2);
  const yFor = (v) => H - PAD - (Math.max(0, Math.min(100, v)) / 100) * (H - PAD * 2);

  return (
    <div data-testid="rom-trend-chart" style={{ background: '#0f172a', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ color: '#e5e7eb', margin: 0, fontSize: 16 }}>Range-of-Motion Trend (avg form score / week)</h3>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))} style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '4px 8px', borderRadius: 4 }}>
          <option value={30}>30d</option>
          <option value={90}>90d</option>
          <option value={180}>180d</option>
          <option value={365}>365d</option>
        </select>
      </div>
      <svg width={W} height={H} style={{ background: '#020617', borderRadius: 6, display: 'block' }}>
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={PAD} y1={yFor(g)} x2={W - PAD} y2={yFor(g)} stroke="#1f2937" strokeWidth={1} />
            <text x={8} y={yFor(g) + 4} fill="#6b7280" fontSize={10}>{g}</text>
          </g>
        ))}
        {data.series.map((s, i) => {
          const pts = s.points.map((p, idx) => p.score == null ? null : `${xFor(idx)},${yFor(p.score)}`).filter(Boolean).join(' ');
          return (
            <g key={s.region}>
              <polyline fill="none" stroke={colors[i % colors.length]} strokeWidth={2} points={pts} />
              {s.points.map((p, idx) => p.score != null && (
                <circle key={idx} cx={xFor(idx)} cy={yFor(p.score)} r={3} fill={colors[i % colors.length]} />
              ))}
            </g>
          );
        })}
        {weeks.map((w, i) => i % Math.max(1, Math.floor(weeks.length / 6)) === 0 && (
          <text key={w} x={xFor(i)} y={H - 12} fill="#6b7280" fontSize={9} textAnchor="middle">{w.slice(5)}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        {data.series.map((s, i) => (
          <span key={s.region} style={{ color: '#cbd5e1', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: colors[i % colors.length], display: 'inline-block', borderRadius: 2 }} />
            {s.region}
          </span>
        ))}
        {data.synthesized && <span style={{ color: '#fbbf24', fontSize: 11 }}>(synthesized)</span>}
      </div>
    </div>
  );
}
