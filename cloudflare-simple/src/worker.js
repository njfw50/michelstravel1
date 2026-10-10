const STATUS = { received: 'Recebida — aguardando atendimento', contacted: 'Em atendimento pela agência', closed: 'Solicitação encerrada' };
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ApiError(status, message); };
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export function validateSearch(q) {
  const origin = String(q.origin || '').toUpperCase(), destination = String(q.destination || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) fail(400, 'Informe aeroportos diferentes, com códigos de três letras.');
  const today = new Date().toISOString().slice(0, 10);
  const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if (!validDate(q.date) || q.date < today) fail(400, 'Informe uma data de ida válida.');
  if (q.returnDate && (!validDate(q.returnDate) || q.returnDate < q.date)) fail(400, 'A volta deve ser igual ou posterior à ida.');
  const adults = Number(q.adults || 1);
  if (!Number.isInteger(adults) || adults < 1 || adults > 9) fail(400, 'Escolha de um a nove adultos. Para crianças, fale com a agência.');
  const cabin = q.cabinClass || 'economy';
  if (!['economy', 'premium_economy', 'business', 'first'].includes(cabin)) fail(400, 'Classe inválida.');
  return { origin, destination, date: q.date, returnDate: q.returnDate || '', adults, cabin };
}
function rate(env) {
  const n = Number(env.MARKUP_RATE);
  if (!Number.isFinite(n) || n < 0 || n > 1) fail(503, 'Configuração de tarifa pendente.');
  return n;
}
export function normalizeOffer(o, markup) {
  if (!o?.id || !Array.isArray(o.slices) || !o.slices.length || !/^[A-Z]{3}$/.test(o.total_currency || '') || !Number.isFinite(Number(o.total_amount)) || Number(o.total_amount) <= 0) fail(502, 'O fornecedor retornou uma oferta inválida.');
  const slices = o.slices.map(s => {
    if (!s.segments?.length) fail(502, 'Itinerário inválido.');
    return { duration: s.duration, segments: s.segments.map(g => ({ origin: g.origin?.iata_code, destination: g.destination?.iata_code, departure: g.departing_at, arrival: g.arriving_at, airline: g.marketing_carrier?.name || g.operating_carrier?.name, flight: `${g.marketing_carrier?.iata_code || ''}${g.marketing_carrier_flight_number || ''}` })), baggages: s.segments.map(g => (g.passengers || []).map(p => p.baggages || [])) };
  });
  return { id: o.id, price: Math.round(Number(o.total_amount) * (1 + markup) * 100) / 100, currency: o.total_currency, expiresAt: o.expires_at, live: o.live_mode === true, airline: o.owner?.name || slices[0].segments[0].airline, slices, passengerCount: o.passengers?.length || 1, conditions: o.conditions || {} };
}
function token(env) {
  const t = env.MODE === 'live' ? env.DUFFEL_LIVE_TOKEN : env.DUFFEL_API_TOKEN;
  if (!t || !t.startsWith(env.MODE === 'live' ? 'duffel_live_' : 'duffel_test_')) fail(503, 'A busca de voos ainda não foi ativada. Entre em contato com a agência.');
  return t;
}
async function duffel(env, path, data) {
  const response = await fetch(`https://api.duffel.com${path}`, { method: data ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token(env)}`, 'Duffel-Version': 'v2', Accept: 'application/json', 'Content-Type': 'application/json' }, body: data ? JSON.stringify({ data }) : undefined, signal: AbortSignal.timeout(25000) });
  if (!response.ok) {
    if ([404, 410, 422].includes(response.status)) fail(409, 'A oferta não está disponível. Faça uma nova busca.');
    if (response.status === 429) fail(429, 'Muitas consultas. Aguarde um momento e tente novamente.');
    fail(502, 'O fornecedor não respondeu à consulta. Tente novamente mais tarde.');
  }
  return (await response.json()).data;
}
async function readBody(req) {
  if (!req.headers.get('content-type')?.includes('application/json')) fail(415, 'Envie os dados em JSON.');
  const text = await req.text();
  if (text.length > 8192) fail(413, 'Dados acima do limite.');
  try { return JSON.parse(text); } catch { fail(400, 'Dados inválidos.'); }
}
async function protect(req, env, body, action) {
  if (req.headers.get('Origin') !== new URL(req.url).origin) fail(403, 'Origem não autorizada.');
  const local = ['localhost', '127.0.0.1'].includes(new URL(req.url).hostname);
  if (!env.TURNSTILE_SECRET_KEY || (!local && (env.TURNSTILE_SITE_KEY?.startsWith('1x') || env.TURNSTILE_SITE_KEY?.includes('CONFIGURE')))) fail(503, 'Proteção do formulário pendente de configuração.');
  if (typeof body.turnstileToken !== 'string' || body.turnstileToken.length > 2048) fail(400, 'Conclua a verificação de segurança.');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: body.turnstileToken, remoteip: req.headers.get('CF-Connecting-IP') || undefined }), signal: AbortSignal.timeout(10000) });
  const result = await response.json();
  if (!result.success || (!local && (result.hostname !== new URL(req.url).hostname || result.action !== action))) fail(403, 'Verificação expirada. Tente novamente.');
}
const hash = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))).map(x => x.toString(16).padStart(2, '0')).join('');
async function equal(a, b) { return await hash(a || '') === await hash(b || ''); }
function validOffer(o, env) {
  if (!o.expiresAt || Date.parse(o.expiresAt) <= Date.now() + 60000) fail(409, 'A tarifa expirou. Faça uma nova busca.');
  if (o.live !== (env.MODE === 'live')) fail(503, 'Modo da oferta incompatível.');
  return o;
}
async function route(req, env) {
  const url = new URL(req.url), path = url.pathname;
  if (path === '/api/config' && req.method === 'GET') return json({ mode: env.MODE, siteKey: env.TURNSTILE_SITE_KEY, contactEmail: env.CONTACT_EMAIL, searchReady: !!(env.MODE === 'live' ? env.DUFFEL_LIVE_TOKEN : env.DUFFEL_API_TOKEN), requestsReady: !!env.DB });
  if (path === '/api/flights/search' && req.method === 'POST') {
    const b = await readBody(req), q = validateSearch(b);
    await protect(req, env, b, 'search');
    const slices = [{ origin: q.origin, destination: q.destination, departure_date: q.date }];
    if (q.returnDate) slices.push({ origin: q.destination, destination: q.origin, departure_date: q.returnDate });
    const data = await duffel(env, '/air/offer_requests?return_offers=true', { slices, passengers: Array.from({ length: q.adults }, () => ({ type: 'adult' })), cabin_class: q.cabin, supplier_timeout: 15000 });
    const offers = (data.offers || []).filter(o => o.live_mode === (env.MODE === 'live') && Date.parse(o.expires_at) > Date.now() + 60000).map(o => normalizeOffer(o, rate(env)));
    return json({ offers: offers.slice(0, 50), mode: env.MODE });
  }
  if (path === '/api/requests' && req.method === 'POST') {
    const b = await readBody(req);
    if (typeof b.offerId !== 'string' || !/^off_[a-zA-Z0-9]+$/.test(b.offerId)) fail(400, 'Oferta inválida.');
    if (typeof b.name !== 'string' || b.name.trim().length < 2 || b.name.length > 100 || typeof b.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) || b.email.length > 254 || typeof b.phone !== 'string' || !/^[+\d ()-]{7,30}$/.test(b.phone) || b.consent !== true) fail(400, 'Confira nome, e-mail, telefone e consentimento.');
    await protect(req, env, b, 'request');
    if (!env.DB) fail(503, 'Solicitações ainda não foram ativadas.');
    const offer = validOffer(normalizeOffer(await duffel(env, `/air/offers/${encodeURIComponent(b.offerId)}`), rate(env)), env);
    if (Number(b.expectedPrice) !== offer.price || b.currency !== offer.currency) return json({ error: 'O preço mudou. Revise a tarifa atual antes de enviar.', updatedOffer: offer }, 409);
    const id = `MT-${crypto.randomUUID()}`, accessCode = crypto.randomUUID(), now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO reservation_requests (id,access_hash,created_at,mode,name,email,phone,offer_id,offer_json,consent_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id, await hash(accessCode), now, env.MODE, b.name.trim(), b.email.trim().toLowerCase(), b.phone.trim(), offer.id, JSON.stringify(offer), now).run();
    return json({ reference: id, accessCode, status: STATUS.received, mode: env.MODE, message: 'Solicitação registrada. Não é uma reserva confirmada, não garante a tarifa e não houve cobrança.' }, 201);
  }
  if (path === '/api/requests/status' && req.method === 'POST') {
    const b = await readBody(req);
    await protect(req, env, b, 'status');
    if (!env.DB) fail(503, 'Consulta indisponível.');
    if (typeof b.reference !== 'string' || b.reference.length > 50 || typeof b.accessCode !== 'string' || b.accessCode.length > 50) fail(400, 'Informe o protocolo e o código de acesso.');
    const row = await env.DB.prepare('SELECT id,access_hash,status,created_at,mode FROM reservation_requests WHERE id=?').bind(b.reference).first();
    if (!row || !await equal(row.access_hash, await hash(b.accessCode))) fail(404, 'Solicitação não encontrada ou código incorreto.');
    return json({ reference: row.id, status: STATUS[row.status], createdAt: row.created_at, mode: row.mode });
  }
  if (path.startsWith('/api/admin/')) {
    const auth = req.headers.get('Authorization') || '';
    if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32 || !await equal(auth, `Bearer ${env.ADMIN_TOKEN}`)) fail(401, 'Acesso não autorizado.');
    if (!env.DB) fail(503, 'Banco de dados não configurado.');
    if (path === '/api/admin/requests' && req.method === 'GET') {
      const rows = await env.DB.prepare('SELECT id,created_at,status,mode,name,email,phone,offer_json FROM reservation_requests ORDER BY created_at DESC LIMIT 100').all();
      return json({ requests: rows.results });
    }
    if (path === '/api/admin/requests' && req.method === 'PATCH') {
      if (req.headers.get('Origin') !== url.origin) fail(403, 'Origem não autorizada.');
      const b = await readBody(req);
      if (!STATUS[b.status] || typeof b.reference !== 'string' || b.reference.length > 50) fail(400, 'Status inválido.');
      const r = await env.DB.prepare('UPDATE reservation_requests SET status=? WHERE id=?').bind(b.status, b.reference).run();
      if (!r.meta?.changes) fail(404, 'Solicitação não encontrada.');
      return json({ status: STATUS[b.status] });
    }
  }
  if (path.startsWith('/api/')) return json({ error: 'Rota não encontrada.' }, 404);
  return env.ASSETS.fetch(req);
}
export default { async fetch(req, env) { try { return await route(req, env); } catch (err) { return json({ error: err instanceof ApiError ? err.message : 'O serviço está temporariamente indisponível. Tente novamente.' }, err instanceof ApiError ? err.status : 503); } } };
