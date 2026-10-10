import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { validateSearch, normalizeOffer } from '../src/worker.js';
const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0,10);
const query = { origin:'EWR',destination:'GRU',date:day(30),adults:'2',cabinClass:'economy' };
const raw = () => ({ id:'off_123',total_amount:'100.00',total_currency:'USD',expires_at:new Date(Date.now()+3600000).toISOString(),live_mode:false,passengers:[{},{}],owner:{name:'Example Air'},slices:[{duration:'PT8H',segments:[{origin:{iata_code:'EWR'},destination:{iata_code:'GRU'},departing_at:`${day(30)}T12:00:00`,arriving_at:`${day(30)}T22:00:00`,marketing_carrier:{name:'Example Air',iata_code:'EX'},marketing_carrier_flight_number:'101',passengers:[{baggages:[{type:'checked',quantity:1}]}]}]}] });
const req = (path,body,headers={},method='POST') => new Request(`http://localhost${path}`,{method,headers:{Origin:'http://localhost','Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
test('rejects invalid dates, routes, classes and traveler counts',()=>{
 assert.equal(validateSearch(query).adults,2);
 for(const change of [{date:'2027-02-30'},{date:day(-1)},{destination:'EWR'},{origin:'Newark'},{adults:'1.5'},{adults:'10'},{returnDate:day(2)},{cabinClass:'invalid'}]) assert.throws(()=>validateSearch({...query,...change}));
});
test('normalizes total fare, baggage and segments without exposing base price',()=>{
 const f=normalizeOffer(raw(),.085);assert.equal(f.price,108.5);assert.equal(f.passengerCount,2);assert.equal(f.live,false);assert.equal(f.slices[0].segments[0].flight,'EX101');assert.equal(f.slices[0].baggages[0][0][0].quantity,1);assert.equal(f.total_amount,undefined);assert.throws(()=>normalizeOffer({...raw(),total_amount:'bad'},.085));
});
test('lifecycle: search, changed fare, expiry, request, private status and admin access',async()=>{
 const previous=globalThis.fetch;let mode='normal',row,calls=0;
 const env={MODE:'test',MARKUP_RATE:'.085',DUFFEL_API_TOKEN:'duffel_test_fixture',TURNSTILE_SITE_KEY:'1x00000000000000000000AA',TURNSTILE_SECRET_KEY:'test-secret',ADMIN_TOKEN:'a'.repeat(40),DB:{prepare(sql){let values;return {bind(...v){values=v;return this;},async run(){if(sql.startsWith('INSERT'))row={id:values[0],access_hash:values[1],created_at:values[2],mode:values[3],name:values[4],email:values[5],phone:values[6],offer_json:values[8],status:'received'};else if(row&&values[1]===row.id)row.status=values[0];return {meta:{changes:1}};},async first(){return row?.id===values[0]?row:null;},async all(){return {results:row?[row]:[]};}};}}};
 globalThis.fetch=async(url,options)=>{
  if(String(url).includes('siteverify'))return Response.json({success:mode!=='captcha-fail'});
  calls++;assert.equal(options.headers.Authorization,'Bearer duffel_test_fixture');
  if(mode==='provider-fail')return Response.json({error:'secret'},{status:500});
  const o=raw();if(mode==='expired')o.expires_at=new Date(0).toISOString();
  if(String(url).includes('offer_requests')){assert.equal(JSON.parse(options.body).data.passengers.length,2);return Response.json({data:{offers:[o]}});}return Response.json({data:o});
 };
 try{
  let r=await worker.fetch(req('/api/flights/search',{...query,turnstileToken:'ok'}),env);assert.equal(r.status,200);assert.equal((await r.json()).offers[0].price,108.5);
  r=await worker.fetch(req('/api/flights/search',{...query,turnstileToken:'ok'},{Origin:'https://attacker.example'}),env);assert.equal(r.status,403);
  mode='captcha-fail';const before=calls;r=await worker.fetch(req('/api/flights/search',{...query,turnstileToken:'bad'}),env);assert.equal(r.status,403);assert.equal(calls,before);
  mode='normal';const data={name:'Traveler',email:'traveler@example.com',phone:'+1 555 555 1234',consent:true,offerId:'off_123',expectedPrice:108.5,currency:'USD',turnstileToken:'ok'};
  r=await worker.fetch(req('/api/requests',{...data,expectedPrice:1}),env);assert.equal(r.status,409);assert.equal(row,undefined);
  mode='expired';r=await worker.fetch(req('/api/requests',data),env);assert.equal(r.status,409);assert.equal(row,undefined);
  mode='normal';r=await worker.fetch(req('/api/requests',data),env);assert.equal(r.status,201);const created=await r.json();assert.ok(created.accessCode);assert.notEqual(row.access_hash,created.accessCode);assert.match(created.message,/Não é uma reserva confirmada/);
  r=await worker.fetch(req('/api/requests/status',{reference:created.reference,accessCode:'wrong',turnstileToken:'ok'}),env);assert.equal(r.status,404);
  r=await worker.fetch(req('/api/requests/status',{reference:created.reference,accessCode:created.accessCode,turnstileToken:'ok'}),env);const status=await r.json();assert.equal(r.status,200);assert.equal(status.email,undefined);assert.equal(status.name,undefined);assert.equal(status.access_hash,undefined);
  r=await worker.fetch(req('/api/admin/requests',undefined,{},'GET'),env);assert.equal(r.status,401);
  r=await worker.fetch(req('/api/admin/requests',{reference:created.reference,status:'contacted'},{Authorization:`Bearer ${env.ADMIN_TOKEN}`},'PATCH'),env);assert.equal(r.status,200);assert.equal(row.status,'contacted');
  mode='provider-fail';r=await worker.fetch(req('/api/flights/search',{...query,turnstileToken:'ok'}),env);assert.equal(r.status,502);assert.equal((await r.json()).error.includes('secret'),false);
  r=await worker.fetch(req('/api/flights/search',{...query,turnstileToken:'ok'}),{...env,MODE:'live',DUFFEL_LIVE_TOKEN:'duffel_test_fixture'});assert.equal(r.status,503);
 }finally{globalThis.fetch=previous;}
});
test('production refuses test challenge configuration',async()=>{
 const r=await worker.fetch(new Request('https://travel.example/api/flights/search',{method:'POST',headers:{Origin:'https://travel.example','Content-Type':'application/json'},body:JSON.stringify({...query,turnstileToken:'ok'})}),{MODE:'live',TURNSTILE_SECRET_KEY:'x',TURNSTILE_SITE_KEY:'1x00000000000000000000AA'});assert.equal(r.status,503);
});
