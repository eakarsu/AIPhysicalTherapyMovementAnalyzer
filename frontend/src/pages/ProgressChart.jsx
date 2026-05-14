import React,{useState,useEffect}from'react';import Header from'../components/Header';import Sidebar from'../components/Sidebar';import{getPatients,aiProgressReport}from'../api';
export default function ProgressChart(){const[sidebarOpen,setSidebarOpen]=useState(true);const[patients,setPatients]=useState([]);const[sel,setSel]=useState('');const[loading,setLoading]=useState(false);const[result,setResult]=useState(null);const[error,setError]=useState('');
useEffect(()=>{getPatients().then(r=>{const d=r.data;setPatients(Array.isArray(d)?d:d?.data||[]);}).catch(()=>{});},[]);
const go=async()=>{if(!sel){setError('Select patient');return;}setLoading(true);setError('');setResult(null);try{const r=await aiProgressReport(sel);setResult(r.data);}catch(e){setError(e.response?.data?.error||'Failed');}setLoading(false);};
const prog=result?.progress_data?.recovery_progress||[];const asm=result?.progress_data?.movement_assessments||[];const rp=result?.ai_report;
return(<div className="app-layout"><Sidebar isOpen={sidebarOpen} onToggle={()=>setSidebarOpen(!sidebarOpen)}/><div className={`main-content ${sidebarOpen?'':'main-content-expanded'}`}><Header onToggleSidebar={()=>setSidebarOpen(!sidebarOpen)}/><div className="page-content">
<div className="page-header"><h2>Progress Chart & AI Report</h2></div>
{error&&<div className="alert alert-error">{error}</div>}
<div style={{display:'flex',gap:16,marginBottom:24,alignItems:'flex-end'}}>
<div className="form-group" style={{flex:1,marginBottom:0}}><label>Patient</label>
<select value={sel} onChange={e=>setSel(e.target.value)}><option value="">Choose...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
<button className="btn btn-primary" onClick={go} disabled={loading}>{loading?'Generating...':'Generate Report'}</button></div>
{loading&&<div className="loading-container"><div className="spinner-large"></div></div>}
{result&&<div>
{prog.length>0&&<div className="card" style={{marginBottom:24}}><div className="card-header"><h3>Recovery Progress ({prog.length} records)</h3></div><div className="card-body">
<div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Date</th><th>Pain</th><th>Mobility%</th><th>Strength%</th></tr></thead><tbody>{prog.map((p,i)=><tr key={i}><td>{p.assessment_date?new Date(p.assessment_date).toLocaleDateString():'-'}</td><td style={{color:p.pain_level>5?'#dc2626':'#059669'}}>{p.pain_level}/10</td><td style={{color:'#2563eb'}}>{p.mobility_score}%</td><td style={{color:'#7c3aed'}}>{p.strength_score}%</td></tr>)}</tbody></table></div>
</div></div>}
{asm.length>0&&<div className="card" style={{marginBottom:24}}><div className="card-header"><h3>Movement Scores ({asm.length} assessments)</h3></div><div className="card-body">
<div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Date</th><th>Exercise</th><th>Form Score</th></tr></thead><tbody>{asm.map((a,i)=><tr key={i}><td>{a.assessment_date?new Date(a.assessment_date).toLocaleDateString():'-'}</td><td>{a.exercise_name||'-'}</td><td style={{color:a.form_score>=80?'#059669':a.form_score>=60?'#d97706':'#dc2626'}}>{a.form_score}/100</td></tr>)}</tbody></table></div>
</div></div>}
{rp&&<div className="card"><div className="card-header"><h3>AI Clinical Report — {rp.overall_trend}</h3></div><div className="card-body">
{rp.progress_summary&&<p style={{color:'#94a3b8',marginBottom:16}}>{rp.progress_summary}</p>}
{rp.discharge_readiness&&<div style={{padding:16,background:'#1e293b',borderRadius:8,marginBottom:16}}><strong style={{color:'#e2e8f0'}}>Discharge Readiness: {rp.discharge_readiness.estimated_percentage}% — Est. {rp.discharge_readiness.estimated_weeks_remaining} weeks remaining</strong>
{rp.discharge_readiness.discharge_criteria_met?.map((c,i)=><div key={i} style={{color:'#059669',fontSize:13,marginTop:4}}>✅ {c}</div>)}
{rp.discharge_readiness.discharge_criteria_pending?.map((c,i)=><div key={i} style={{color:'#d97706',fontSize:13,marginTop:4}}>⏳ {c}</div>)}</div>}
{rp.treatment_recommendations?.length>0&&<div><strong style={{color:'#e2e8f0',fontSize:13}}>Recommendations:</strong>{rp.treatment_recommendations.map((r,i)=><div key={i} style={{color:'#94a3b8',fontSize:13,marginTop:6}}>{i+1}. {r}</div>)}</div>}
{rp.clinical_narrative&&<div style={{marginTop:16,padding:12,background:'#0f172a',borderRadius:8}}><strong style={{color:'#e2e8f0',fontSize:13}}>Clinical Narrative:</strong><p style={{color:'#94a3b8',marginTop:6,fontSize:13}}>{rp.clinical_narrative}</p></div>}
</div></div>}
</div>}
</div></div></div>);}
