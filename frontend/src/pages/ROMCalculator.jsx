import React,{useState}from'react';import Header from'../components/Header';import Sidebar from'../components/Sidebar';import{aiRomCalculator}from'../api';
const PARTS=['Cervical Spine','Thoracic Spine','Lumbar Spine','Shoulder - Flexion','Shoulder - Abduction','Shoulder - Internal Rotation','Shoulder - External Rotation','Elbow - Flexion','Wrist - Flexion','Wrist - Extension','Hip - Flexion','Hip - Abduction','Hip - Internal Rotation','Hip - External Rotation','Knee - Flexion','Ankle - Dorsiflexion','Ankle - Plantarflexion'];
export default function ROMCalculator(){const[sidebarOpen,setSidebarOpen]=useState(true);const[form,setForm]=useState({body_part:'',measured_angle:'',pain_level:'',side:'bilateral'});const[loading,setLoading]=useState(false);const[result,setResult]=useState(null);const[error,setError]=useState('');
const change=e=>setForm({...form,[e.target.name]:e.target.value});
const go=async e=>{e.preventDefault();if(!form.body_part||!form.measured_angle){setError('Body part and angle required');return;}
setLoading(true);setError('');setResult(null);try{const r=await aiRomCalculator({body_part:form.body_part,measured_angle:parseFloat(form.measured_angle),pain_level:form.pain_level?parseFloat(form.pain_level):undefined,side:form.side});setResult(r.data.rom_analysis);}catch(e){setError(e.response?.data?.error||'Failed');}setLoading(false);};
const statusColor={within_normal:'#059669',mildly_limited:'#d97706',moderately_limited:'#ea580c',severely_limited:'#dc2626'};
return(<div className="app-layout"><Sidebar isOpen={sidebarOpen} onToggle={()=>setSidebarOpen(!sidebarOpen)}/><div className={`main-content ${sidebarOpen?'':'main-content-expanded'}`}><Header onToggleSidebar={()=>setSidebarOpen(!sidebarOpen)}/><div className="page-content">
<div className="page-header"><h2>ROM Calculator</h2></div>
{error&&<div className="alert alert-error">{error}</div>}
<div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:24,alignItems:'start'}}>
<div className="card"><div className="card-header"><h3>Measurement Input</h3></div><div className="card-body">
<form onSubmit={go}>
<div className="form-group"><label>Body Part *</label><select name="body_part" value={form.body_part} onChange={change} required><option value="">Select...</option>{PARTS.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
<div className="form-group"><label>Side</label><select name="side" value={form.side} onChange={change}><option value="bilateral">Bilateral</option><option value="left">Left</option><option value="right">Right</option></select></div>
<div className="form-group"><label>Angle (degrees) *</label><input type="number" name="measured_angle" value={form.measured_angle} onChange={change} min="0" max="360" step="0.5" placeholder="e.g. 110" required/></div>
<div className="form-group"><label>Pain Level (0-10)</label><input type="number" name="pain_level" value={form.pain_level} onChange={change} min="0" max="10" step="0.5" placeholder="e.g. 3"/></div>
<button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'Calculating...':'Calculate ROM'}</button>
</form></div></div>
<div>{loading&&<div className="loading-container"><div className="spinner-large"></div></div>}
{result&&<div>
<div className="card" style={{marginBottom:20}}><div className="card-header"><h3>Results</h3>{result.status&&<span style={{color:statusColor[result.status]||'#94a3b8',fontWeight:700,fontSize:13}}>{result.status.replace(/_/g,' ')}</span>}</div>
<div className="card-body"><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
<div style={{textAlign:'center',padding:16,background:'#1e293b',borderRadius:8}}><div style={{fontSize:32,fontWeight:700,color:'#3b82f6'}}>{result.measured_angle}°</div><div style={{color:'#94a3b8',fontSize:13}}>Measured</div></div>
<div style={{textAlign:'center',padding:16,background:'#1e293b',borderRadius:8}}><div style={{fontSize:18,fontWeight:700,color:'#059669'}}>{result.normal_rom_min}°–{result.normal_rom_max}°</div><div style={{color:'#94a3b8',fontSize:13}}>Normal Range</div></div>
<div style={{textAlign:'center',padding:16,background:'#1e293b',borderRadius:8}}><div style={{fontSize:32,fontWeight:700,color:result.deficit_percentage>30?'#dc2626':result.deficit_percentage>15?'#d97706':'#059669'}}>{result.deficit_percentage}%</div><div style={{color:'#94a3b8',fontSize:13}}>Deficit</div></div>
</div>
{result.clinical_significance&&<p style={{color:'#94a3b8',marginBottom:12}}>{result.clinical_significance}</p>}
{result.precautions?.length>0&&<div style={{padding:12,background:'#fef3c720',border:'1px solid #d97706',borderRadius:8}}><strong style={{color:'#d97706',fontSize:13}}>Precautions: </strong><span style={{color:'#94a3b8',fontSize:13}}>{result.precautions.join('; ')}</span></div>}
</div></div>
{result.exercise_recommendations?.length>0&&<div className="card" style={{marginBottom:20}}><div className="card-header"><h3>Exercise Recommendations</h3></div><div className="card-body">
{result.exercise_recommendations.map((ex,i)=><div key={i} style={{padding:12,background:'#1e293b',borderRadius:8,marginBottom:10}}>
<div style={{display:'flex',justifyContent:'space-between'}}><strong style={{color:'#e2e8f0'}}>{ex.name}</strong><span style={{color:'#94a3b8',fontSize:12}}>{ex.sets_reps}</span></div>
{ex.description&&<p style={{color:'#94a3b8',fontSize:13,marginTop:4}}>{ex.description}</p>}
{ex.frequency&&<p style={{color:'#64748b',fontSize:12,marginTop:2}}>Frequency: {ex.frequency}</p>}</div>)}
</div></div>}
{result.stretching_recommendations?.length>0&&<div className="card"><div className="card-header"><h3>Stretching</h3></div><div className="card-body"><ul style={{paddingLeft:20,color:'#94a3b8',fontSize:14}}>{result.stretching_recommendations.map((s,i)=><li key={i} style={{marginBottom:6}}>{s}</li>)}</ul>{result.progression_timeline&&<p style={{color:'#94a3b8',fontSize:13,marginTop:12}}>Timeline: {result.progression_timeline}</p>}</div></div>}
</div>}
{!result&&!loading&&<div className="empty-state"><div style={{fontSize:48}}>📐</div><h3>ROM Calculator</h3><p>Enter a body part and angle to analyze range of motion</p></div>}
</div></div>
</div></div></div>);}
