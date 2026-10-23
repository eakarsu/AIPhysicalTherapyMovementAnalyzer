'use strict';
process.env.JWT_SECRET = process.env.JWT_SECRET && process.env.JWT_SECRET.length>=32 ? process.env.JWT_SECRET : 'wave42-test-secret-at-least-32-chars-long!!';
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = require('../routes/wave42');
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY; process.env.WAVE42_NO_PROVIDER='1';
let server, base, token, token2;
function payload(id){ return ({id, email:`u${id}@x.test`}); }
before(async()=>{
  const app=express(); app.use(express.json()); app.use('/api/wave42', router);
  await new Promise(r=>{ server=app.listen(0,r); }); base=`http://127.0.0.1:${server.address().port}/api/wave42`;
  token=jwt.sign(payload(1), process.env.JWT_SECRET); token2=jwt.sign(payload(2), process.env.JWT_SECRET);
});
after(()=>server && server.close());
async function req(method,path,tok,body){ const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})},body:body?JSON.stringify(body):undefined}); const txt=await r.text(); let j; try{j=JSON.parse(txt)}catch{j=txt} return {status:r.status, body:j, text:txt, headers:r.headers}; }
test('auth required', async()=>{ assert.equal((await req('GET','/tasks')).status, 401); });
test('tasks create/list/update + search/filter', async()=>{
  const c=await req('POST','/tasks',token,{title:'Alpha session prep', status:'todo', priority:'high'}); assert.equal(c.status,201);
  const id=c.body.id;
  const miss=await req('POST','/tasks',token,{}); assert.equal(miss.status,400);
  const list=await req('GET','/tasks?search=session',token); assert.equal(list.body.total,1);
  const filt=await req('GET','/tasks?status=done',token); assert.equal(filt.body.total,0);
  const upd=await req('PUT',`/tasks/${id}`,token,{status:'done'}); assert.equal(upd.body.status,'done');
  const other=await req('PUT',`/tasks/${id}`,token2,{status:'todo'}); assert.equal(other.status,404);
});
test('export csv and json preserve content', async()=>{
  const csv=await req('GET','/export/tasks?format=csv',token); assert.match(csv.text,/id,title/); assert.match(csv.text,/Alpha session prep/);
  const js=await req('GET','/export/tasks?format=json',token); assert.equal(js.body.total,1); assert.equal(js.body.data[0].title,'Alpha session prep');
});
test('domain AI fallback labelled, preserves 0/empty/false', async()=>{
  for(const slug of ["movement-session-summary", "adherence-operations-brief", "session-prep-checklist"]){
    const r=await req('POST',`/ai/${slug}`,token,{tasks:[]});
    assert.equal(r.status,200); assert.equal(r.body.aiGenerated,false); assert.equal(r.body.provider,'deterministic-fallback');
    assert.ok(r.body.sections && typeof r.body.sections==='object'); assert.equal(r.body.sections.Counts.total,0); assert.equal(r.body.sections.Counts.completionRate,0);
  }
});
