import React,{useState,useEffect}from'react';import Header from'../components/Header';import Sidebar from'../components/Sidebar';import{getPatients,aiPrescribeExercises}from'../api';
export default function ExercisePrescription(){const[sidebarOpen,setSidebarOpen]=useState(true);const[patients,setPatients]=useState([]);const[sel,setSel]=useState('');const[loading,setLoading]=useState(false);const[result,setResult]=useState(null);const[error,setError]=useState('');
useEffect(()=>{getPatients().then(r=>{const d=r.data;setPatients(Array.isArray(d)?d:d?.data||[]);}).catch(()=>{});},[]);
const go=async(e)=>{e.preventDefault();if(!sel){setError('Select patient');return;}setLoading(true);setError('');setResult(null);try{const r=await aiPrescribeExercises(sel);setResult(r.data.exercise_prescription);}catch(err){setError(err.response?.data?.error||'Failed');}setLoading(false);};
const catColor={strength:'#dc2626',flexibility:'#059669',balance:'#d97706',endurance:'#2563eb',neuromuscular:'#7c3aed'};
return(<div className="app-layout"><Sidebar isOpen={sidebarOpen} onToggle={()=>setSidebarOpen(!sidebarOpen)}/><div className={`main-content ${sidebarOpen?'':'main-content-expanded'}`}><Header onToggleSidebar={()=>setSidebarOpen(!sidebarOpen)}/><div className="page-content">
<div className="page-header"><h2>AI Exercise Prescription</h2></div>
{error&&<div className="alert alert-error">{error}</div>}
<div className="card" style={{maxWidth:480,marginBottom:24}}><div className="card-header"><h3>Generate Prescription</h3></div><div className="card-body">
<form onSubmit={go}><div className="form-group"><label>Patient *</label>
<select value={sel} onChange={e=>setSel(e.target.value)} required><option value="">Choose...</option>{patients.map(p=><option key={p.id} value={p.id}>{p.name} — {p.condition||''}</option>)}</select></div>
<button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'Generating...':'Generate Prescription'}</button></form></div></div>
{loading&&<div className="loading-container"><div className="spinner-large"></div></div>}
{result&&<div>
<div className="card" style={{marginBottom:20}}><div className="card-header"><h3>{result.program_name}</h3><span style={{color:'#6366f1',fontSize:13}}>{result.estimated_program_duration_weeks} weeks</span></div>
{result.rationale&&<div className="card-body"><p style={{color:'#94a3b8'}}>{result.rationale}</p></div>}</div>
{result.exercises?.length>0&&<div className="card" style={{marginBottom:20}}><div className="card-header"><h3>Exercises ({result.exercises.length})</h3></div><div className="card-body">
{result.exercises.map((ex,i)=><div key={i} style={{padding:16,background:'#1e293b',borderRadius:8,marginBottom:12}}>
<div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
<strong style={{color:'#e2e8f0'}}>{ex.name}{ex.category&&<span style={{marginLeft:8,color:catColor[ex.category]||'#6366f1',fontSize:12}}>({ex.category})</span>}</strong>
<span style={{color:'#6366f1',fontWeight:700}}>{ex.sets&&`${ex.sets}×${ex.reps||'?'}`}{ex.hold_seconds&&` ${ex.hold_seconds}s`}</span></div>
<div style={{fontSize:12,color:'#94a3b8',marginBottom:8}}>{ex.frequency_per_week}×/week · {ex.rest_seconds}s rest · {ex.equipment||'No equipment'}</div>
{ex.instructions?.length>0&&<ol style={{paddingLeft:18,color:'#94a3b8',fontSize:13}}>{ex.instructions.map((s,j)=><li key={j}>{s}</li>)}</ol>}
{ex.rationale&&<p style={{color:'#6366f1',fontSize:12,marginTop:8,fontStyle:'italic'}}>{ex.rationale}</p>}
{ex.progressions?.length>0&&<div style={{marginTop:8,padding:8,background:'#0f172a',borderRadius:6}}><strong style={{color:'#059669',fontSize:12}}>Progressions: </strong><span style={{color:'#94a3b8',fontSize:12}}>{ex.progressions.join(' → ')}</span></div>}
</div>)}</div></div>}
{result.weekly_schedule&&<div className="card" style={{marginBottom:20}}><div className="card-header"><h3>Weekly Schedule</h3></div><div className="card-body">
<div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:8}}>{['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=>(
<div key={d} style={{textAlign:'center'}}><div style={{color:'#6366f1',fontSize:11,textTransform:'capitalize',marginBottom:6}}>{d.slice(0,3)}</div>
<div style={{background:'#1e293b',borderRadius:8,padding:8,minHeight:60,fontSize:11,color:'#94a3b8'}}>
{Array.isArray(result.weekly_schedule[d])?result.weekly_schedule[d].join(', '):result.weekly_schedule[d]||'Rest'}</div></div>))}</div></div></div>}
{result.red_flags?.length>0&&<div className="card" style={{borderColor:'#dc2626'}}><div className="card-header"><h3 style={{color:'#dc2626'}}>Red Flags</h3></div><div className="card-body">{result.red_flags.map((rf,i)=><div key={i} style={{color:'#fca5a5',fontSize:13,marginBottom:6}}>⚠ {rf}</div>)}</div></div>}
</div>}
</div></div></div>);}
