import React, { useEffect, useState } from 'react';

// NON-VIZ 2 — Exercise Protocol Rules Editor (full CRUD)
const REGIONS = ['Shoulder', 'Knee', 'Lumbar', 'Cervical', 'Ankle', 'Hip', 'Wrist', 'General'];
const PHASES = ['Acute (0-6w)', 'Subacute (6-12w)', 'Maintenance', 'Return-to-sport'];
const INTENSITIES = ['Low', 'Moderate', 'High'];

function authHeaders() {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || '';
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function ExerciseProtocolRulesEditor() {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ body_region: 'Shoulder', condition: '', phase: 'Acute (0-6w)', frequency: 'Daily', max_intensity: 'Low', notes: '', enabled: true });
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    fetch('/api/custom-views/protocol-rules', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setRules(d.rules || []))
      .catch((e) => setError(e.message || String(e)));
  };
  useEffect(load, []);

  const reset = () => {
    setEditingId(null);
    setForm({ body_region: 'Shoulder', condition: '', phase: 'Acute (0-6w)', frequency: 'Daily', max_intensity: 'Low', notes: '', enabled: true });
  };

  const submit = async () => {
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/custom-views/protocol-rules/${editingId}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(`update failed (${res.status})`);
      } else {
        const res = await fetch('/api/custom-views/protocol-rules', {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(`create failed (${res.status})`);
      }
      reset(); load();
    } catch (e) { setError(e.message || String(e)); }
  };

  const edit = (r) => { setEditingId(r.id); setForm({ ...r }); };
  const remove = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/custom-views/protocol-rules/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error(`delete failed (${res.status})`);
      if (editingId === id) reset();
      load();
    } catch (e) { setError(e.message || String(e)); }
  };

  const input = (k, type = 'text') => (
    <input
      type={type} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '6px 8px', borderRadius: 4, width: '100%' }}
    />
  );
  const select = (k, opts) => (
    <select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '6px 8px', borderRadius: 4, width: '100%' }}>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div data-testid="protocol-rules-editor" style={{ background: '#0f172a', padding: 16, borderRadius: 8, border: '1px solid #1f2937' }}>
      <h3 style={{ color: '#e5e7eb', margin: '0 0 10px 0', fontSize: 16 }}>Exercise Protocol Rules Editor</h3>
      {error && <div style={{ color: '#f87171', marginBottom: 8 }}>Error: {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
        <div><label style={{ color: '#9ca3af', fontSize: 11 }}>Body region</label>{select('body_region', REGIONS)}</div>
        <div><label style={{ color: '#9ca3af', fontSize: 11 }}>Condition</label>{input('condition')}</div>
        <div><label style={{ color: '#9ca3af', fontSize: 11 }}>Phase</label>{select('phase', PHASES)}</div>
        <div><label style={{ color: '#9ca3af', fontSize: 11 }}>Frequency</label>{input('frequency')}</div>
        <div><label style={{ color: '#9ca3af', fontSize: 11 }}>Max intensity</label>{select('max_intensity', INTENSITIES)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
          <input id="rule-enabled" type="checkbox" checked={!!form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          <label htmlFor="rule-enabled" style={{ color: '#cbd5e1', fontSize: 13 }}>Enabled</label>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ color: '#9ca3af', fontSize: 11 }}>Notes</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2} style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '6px 8px', borderRadius: 4, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={submit} style={{ background: editingId ? '#d97706' : '#2563eb', color: 'white', border: 0, padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>
          {editingId ? 'Update rule' : 'Add rule'}
        </button>
        {editingId && <button onClick={reset} style={{ background: '#374151', color: 'white', border: 0, padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: '#e5e7eb' }}>
        <thead>
          <tr style={{ background: '#020617' }}>
            {['Region', 'Condition', 'Phase', 'Freq', 'Max', 'On', 'Notes', ''].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: 6, color: '#9ca3af', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.length === 0 && (
            <tr><td colSpan={8} style={{ padding: 10, color: '#6b7280', textAlign: 'center' }}>No rules yet</td></tr>
          )}
          {rules.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #1f2937' }}>
              <td style={{ padding: 6 }}>{r.body_region}</td>
              <td style={{ padding: 6 }}>{r.condition}</td>
              <td style={{ padding: 6 }}>{r.phase}</td>
              <td style={{ padding: 6 }}>{r.frequency}</td>
              <td style={{ padding: 6 }}>{r.max_intensity}</td>
              <td style={{ padding: 6 }}>{r.enabled ? 'yes' : 'no'}</td>
              <td style={{ padding: 6, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</td>
              <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
                <button onClick={() => edit(r)} style={{ background: '#1f2937', color: '#cbd5e1', border: '1px solid #374151', padding: '3px 8px', borderRadius: 3, marginRight: 4, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => remove(r.id)} style={{ background: '#7f1d1d', color: '#fee2e2', border: 0, padding: '3px 8px', borderRadius: 3, cursor: 'pointer' }}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
