'use strict';
// Wave 42A: authenticated tasks, search/filter, export, domain AI (operational only).
const express = require('express');
const crypto = require('crypto');
const authMod = require('../middleware/auth');
const authenticate = (typeof authMod === 'function') ? authMod : (authMod.authenticateToken || authMod.default);
const router = express.Router();
const store = new Map(); // userId -> tasks[]
function uid(req){ return String(req.user && (req.user.id ?? req.user.userId ?? req.user.email) || 'unknown'); }
function tasksOf(req){ const k=uid(req); if(!store.has(k)) store.set(k,[]); return store.get(k); }
function toCsv(rows){
  const cols=['id','title','description','status','priority','dueDate','createdAt','updatedAt'];
  const esc=v=>{ const s=v==null?'':String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  return [cols.join(','), ...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+'\n';
}
function filterTasks(list,q){
  let out=[...list];
  const search=String(q.search||q.q||'').trim().toLowerCase();
  if(search) out=out.filter(t=>`${t.title} ${t.description||''} ${t.status} ${t.priority}`.toLowerCase().includes(search));
  if(q.status) out=out.filter(t=>t.status===q.status);
  if(q.priority) out=out.filter(t=>t.priority===q.priority);
  return out;
}
async function maybeProvider(summary){
  if(process.env.WAVE42_NO_PROVIDER) return null;
  const key=process.env.OPENROUTER_API_KEY||process.env.OPENAI_API_KEY;
  if(!key) return null;
  try{
    const isOR=!!process.env.OPENROUTER_API_KEY;
    const url=isOR?'https://openrouter.ai/api/v1/chat/completions':'https://api.openai.com/v1/chat/completions';
    const model=process.env.OPENROUTER_MODEL||process.env.OPENAI_MODEL||(isOR?'openai/gpt-4o-mini':'gpt-4o-mini');
    const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),8000);
    const r=await fetch(url,{method:'POST',signal:ctrl.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'system',content:'Operational summary only. No diagnosis or clinical claims.'},{role:'user',content:`Summarise operationally: ${JSON.stringify(summary)}`}],max_tokens:300})});
    clearTimeout(to);
    if(!r.ok) return null;
    const j=await r.json(); const text=j.choices?.[0]?.message?.content;
    if(!text) return null;
    return {aiGenerated:true, provider:isOR?'openrouter':'openai', narrative:text};
  }catch{ return null; }
}
function stats(list){
  const byStatus={todo:0,in_progress:0,done:0};
  const byPriority={low:0,medium:0,high:0};
  for(const t of list){ if(t.status in byStatus) byStatus[t.status]++; else byStatus[t.status]=1; if(t.priority in byPriority) byPriority[t.priority]++; }
  const now=Date.now();
  const overdue=list.filter(t=>t.dueDate && t.status!=='done' && new Date(t.dueDate).getTime()<now);
  const done=list.filter(t=>t.status==='done').length;
  return {total:list.length, byStatus, byPriority, done, completionRate:list.length?Math.round(done/list.length*100):0, overdue:overdue.length, overdueTitles:overdue.map(t=>t.title)};
}
async function aiRespond(req,res,feature,label){
  const input=(req.body && (req.body.tasks||req.body.records)) || tasksOf(req);
  const list=Array.isArray(input)?input:tasksOf(req);
  const s=stats(list);
  const provided=await maybeProvider({feature,...s});
  if(provided) return res.json({aiGenerated:true, provider:provided.provider, feature, label, sections:{'Overview':provided.narrative,'Counts':s,'Flags':s.overdueTitles}, disclaimer:'Operational only — not a diagnosis or treatment recommendation.'});
  const sections={'Overview':`${label}: ${s.done} of ${s.total} tasks done (${s.completionRate}%).`, 'Counts':s, 'Open Items':list.filter(t=>t.status!=='done').map(t=>t.title), 'Flags':s.overdueTitles};
  return res.json({aiGenerated:false, provider:'deterministic-fallback', feature, label, sections, disclaimer:'Operational only — not a diagnosis or treatment recommendation.'});
}
router.use(authenticate);
// Tasks list with search/filter (also main list for this module)
router.get('/tasks',(req,res)=>{ const data=filterTasks(tasksOf(req),req.query); res.json({data,total:data.length,page:1,limit:data.length}); });
router.get('/search',(req,res)=>{ const data=filterTasks(tasksOf(req),req.query); res.json({data,total:data.length}); });
router.post('/tasks',(req,res)=>{
  const title=String(req.body?.title||'').trim();
  if(!title) return res.status(400).json({error:'title is required'});
  const t={id:crypto.randomUUID(), title, description:req.body.description||'', status:req.body.status||'todo', priority:req.body.priority||'medium', dueDate:req.body.dueDate||null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), ownerId:uid(req)};
  tasksOf(req).unshift(t); res.status(201).json(t);
});
router.put('/tasks/:id',(req,res)=>update(req,res));
router.patch('/tasks/:id',(req,res)=>update(req,res));
function update(req,res){
  const t=tasksOf(req).find(x=>String(x.id)===String(req.params.id));
  if(!t) return res.status(404).json({error:'task not found'});
  for(const k of ['title','description','status','priority','dueDate']) if(req.body?.[k]!==undefined) t[k]=req.body[k];
  if(!String(t.title||'').trim()) return res.status(400).json({error:'title is required'});
  t.updatedAt=new Date().toISOString(); res.json(t);
}
function doExport(req,res){
  const fmt=String(req.query.format||'json').toLowerCase();
  const data=filterTasks(tasksOf(req),req.query);
  if(fmt==='csv'){ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="tasks.csv"'); return res.send(toCsv(data)); }
  if(fmt==='json'){ res.setHeader('Content-Type','application/json'); res.setHeader('Content-Disposition','attachment; filename="tasks.json"'); return res.json({data,total:data.length}); }
  return res.status(400).json({error:'format must be csv or json'});
}
router.get('/tasks/export',doExport);
router.get('/export/tasks',doExport);
router.get('/export',doExport);
router.post('/ai/movement-session-summary',(req,res)=>aiRespond(req,res,'movement-session-summary','Movement session summary'));
router.post('/ai/adherence-operations-brief',(req,res)=>aiRespond(req,res,'adherence-operations-brief','Adherence operations brief'));
router.post('/ai/session-prep-checklist',(req,res)=>aiRespond(req,res,'session-prep-checklist','Session prep checklist'));
router._store=store; router._reset=()=>store.clear(); router._filterTasks=filterTasks; router._toCsv=toCsv;
module.exports=router;
