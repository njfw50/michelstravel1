const $ = s => document.querySelector(s);
let config, offers = [], selected, widget, busy = false;
const searchForm = $('#search-form'), requestForm = $('#request-form'), dialog = $('#request-dialog');
const money = (n, c) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: c }).format(n);
const show = (target, text, error = false) => { target.textContent = text; target.className = error ? 'error' : ''; };
const node = (tag, text, className) => { const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; return el; };
async function api(path, data) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  let body; try { body = await response.json(); } catch { throw new Error('O serviço não respondeu. Tente novamente.'); }
  if (!response.ok) { const e = new Error(body.error || 'Não foi possível concluir.'); e.body = body; throw e; }
  return body;
}
async function captcha(action, container) {
  if (!config?.siteKey) throw new Error('O formulário ainda não foi ativado.');
  for (let i = 0; !window.turnstile && i < 100; i++) await new Promise(r => setTimeout(r, 100));
  if (!window.turnstile) throw new Error('Não foi possível carregar a verificação. Confira sua conexão.');
  if (widget !== undefined) window.turnstile.remove(widget);
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, value) => { if (done) return; done = true; clearTimeout(timer); fn(value); };
    const timer = setTimeout(() => finish(reject, new Error('Verificação expirada. Tente novamente.')), 120000);
    widget = window.turnstile.render(container, { sitekey: config.siteKey, action, callback: token => finish(resolve, token), 'error-callback': () => finish(reject, new Error('Falha na verificação. Tente novamente.')), 'expired-callback': () => finish(reject, new Error('Verificação expirada.')) });
  });
}
function cleanupCaptcha() { if (widget !== undefined && window.turnstile) { window.turnstile.remove(widget); widget = undefined; } }
function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
searchForm.date.min = localDate(); searchForm.returnDate.min = localDate();
searchForm.date.addEventListener('change', () => { searchForm.returnDate.min = searchForm.date.value; });
searchForm.addEventListener('change', () => { const one = searchForm.querySelector('[name=trip]:checked').value === 'one'; $('#return-label').hidden = one; searchForm.returnDate.disabled = one; searchForm.returnDate.required = !one; });
searchForm.addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return; busy = true; const button = searchForm.querySelector('button'); button.disabled = true;
  offers = []; $('#results').hidden = true; $('#offers').replaceChildren();
  show($('#feedback'), 'Verificando segurança. A busca pode levar alguns segundos.');
  try { const data = Object.fromEntries(new FormData(searchForm)); data.origin = data.origin.toUpperCase(); data.destination = data.destination.toUpperCase(); data.turnstileToken = await captcha('search', '#captcha'); const result = await api('/api/flights/search', data); offers = result.offers; renderOffers(); show($('#feedback'), offers.length ? `${offers.length} opções encontradas.` : 'Não encontramos ofertas nesta consulta. Tente outras datas ou fale com a agência.'); }
  catch (err) { show($('#feedback'), err.message, true); } finally { button.disabled = false; busy = false; cleanupCaptcha(); }
});
function renderOffers() {
  const mode = $('#sort').value;
  const stops = f => f.slices.reduce((n, s) => n + s.segments.length - 1, 0);
  const ordered = [...offers].sort((a, b) => mode === 'stops' ? stops(a) - stops(b) : a.currency.localeCompare(b.currency) || a.price - b.price);
  $('#offers').replaceChildren(); $('#results').hidden = !ordered.length;
  for (const f of ordered) {
    const card = node('article', '', 'offer'), info = node('div', ''), price = node('div', '', 'price-side');
    info.append(node('h3', f.airline || 'Voo disponível'));
    f.slices.forEach((s, i) => {
      const first = s.segments[0], last = s.segments.at(-1), leg = node('div', '', 'leg');
      leg.append(node('div', `${first.origin} → ${last.destination}`, 'route-line'), node('p', `${i === 0 ? 'Ida' : 'Volta'} · ${first.departure.replace('T', ' ')} → ${last.arrival.replace('T', ' ')} (horários locais)`), node('p', `${s.segments.length - 1 === 0 ? 'Direto' : `${s.segments.length - 1} conexão(ões)`} · ${s.duration || 'Duração informada nos trechos'}`)); info.append(leg);
    });
    const details = node('details', ''); details.append(node('summary', 'Trechos, bagagem e regras'));
    f.slices.forEach((s, i) => {
      details.append(node('p', i === 0 ? 'IDA' : 'VOLTA'));
      s.segments.forEach((g, j) => {
        details.append(node('p', `${g.airline} ${g.flight} · ${g.origin} → ${g.destination} · ${g.departure.replace('T', ' ')} → ${g.arrival.replace('T', ' ')}`));
        const bags = s.baggages[j];
        if (!bags.length) details.append(node('p', 'Bagagem não informada pelo fornecedor. Confirme com a agência.'));
        else bags.forEach((b, k) => details.append(node('p', `Viajante ${k + 1}: ${b.length ? b.map(x => `${x.quantity} ${x.type === 'checked' ? 'mala(s) despachada(s)' : x.type === 'carry_on' ? 'bagagem(ns) de mão' : x.type}`).join(', ') : 'bagagem não informada'}. Peso e medidas devem ser confirmados.`)));
      });
    });
    for (const [key, label] of [['change_before_departure', 'Alteração antes da partida'], ['refund_before_departure', 'Reembolso antes da partida']]) {
      const c = f.conditions[key]; details.append(node('p', `${label}: ${c ? c.allowed ? `permitido${c.penalty_amount ? `, multa ${money(Number(c.penalty_amount), c.penalty_currency)}` : '; confirme taxas e condições com a agência'}` : 'não permitido' : 'não informado; confirme com a agência'}.`));
    }
    info.append(details); price.append(node('p', money(f.price, f.currency), 'price'), node('small', `Total · ${f.passengerCount} adulto(s)`));
    const button = node('button', 'Solicitar reserva →', 'primary'); button.type = 'button'; button.addEventListener('click', () => openRequest(f)); price.append(button); card.append(info, price); $('#offers').append(card);
  }
}
$('#sort').addEventListener('change', renderOffers);
function openRequest(f) {
  selected = f; requestForm.reset(); show($('#request-feedback'), '');
  $('#selected-summary').textContent = `${f.slices[0].segments[0].origin} → ${f.slices[0].segments.at(-1).destination} · ${money(f.price, f.currency)} total${f.live ? '' : ' · SIMULAÇÃO'}`;
  dialog.showModal();
}
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', cleanupCaptcha);
requestForm.addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return; busy = true; const button = requestForm.querySelector('button[type=submit]'); button.disabled = true;
  show($('#request-feedback'), 'Conferindo a tarifa e registrando sua solicitação…');
  try {
    const data = Object.fromEntries(new FormData(requestForm)); data.consent = requestForm.consent.checked; data.offerId = selected.id; data.expectedPrice = selected.price; data.currency = selected.currency; data.turnstileToken = await captcha('request', '#request-captcha');
    const result = await api('/api/requests', data); dialog.close();
    const box = node('div', '', 'confirmation'); box.tabIndex = -1;
    box.append(node('h3', result.mode === 'live' ? 'Solicitação recebida' : 'Solicitação de teste recebida'), node('p', result.message), node('p', 'Protocolo'), node('code', result.reference), node('p', 'Código de acesso — guarde em lugar seguro'), node('code', result.accessCode), node('p', 'A agência consultará esta solicitação no painel de atendimento. Para urgências, fale diretamente por e-mail. Não há prazo de atendimento garantido.'));
    $('#feedback').replaceChildren(box); box.focus(); box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const download = node('button', 'Guardar protocolo', 'secondary'); download.type = 'button'; download.addEventListener('click', () => { const a = document.createElement('a'), url = URL.createObjectURL(new Blob([`Michel's Travel — Opção Eficiente\n${result.message}\nProtocolo: ${result.reference}\nCódigo de acesso: ${result.accessCode}\nStatus: ${result.status}\nModo: ${result.mode}\n`], { type: 'text/plain' })); a.href = url; a.download = `${result.reference}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }); box.append(download);
    selected = null;
  } catch (err) {
    if (err.body?.updatedOffer) { selected = err.body.updatedOffer; $('#selected-summary').textContent = `Novo total: ${money(selected.price, selected.currency)}. Revise e envie novamente se concordar.`; }
    show($('#request-feedback'), err.message, true);
  } finally { button.disabled = false; busy = false; cleanupCaptcha(); }
});
$('#tracking-form').addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return; busy = true; const form = e.target, button = form.querySelector('button'); button.disabled = true;
  show($('#tracking-result'), 'Consultando…');
  try { const data = Object.fromEntries(new FormData(form)); data.turnstileToken = await captcha('status', '#tracking-captcha'); const r = await api('/api/requests/status', data); show($('#tracking-result'), `${r.status}${r.mode === 'test' ? ' · SIMULAÇÃO' : ''} · Recebida em ${new Date(r.createdAt).toLocaleString('pt-BR')}`); }
  catch (err) { show($('#tracking-result'), err.message, true); } finally { button.disabled = false; busy = false; cleanupCaptcha(); }
});
fetch('/api/config').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(c => {
  config = c;
  if (c.mode !== 'live') { $('#mode').hidden = false; $('#mode').textContent = 'MODO DE TESTE — os voos e as solicitações são simulações. Nenhuma passagem será emitida.'; }
  if (!c.searchReady) { $('#mode').hidden = false; $('#mode').textContent += ' A busca está aguardando ativação. Entre em contato com a agência.'; }
}).catch(() => show($('#feedback'), 'A busca está temporariamente indisponível. Fale com a agência.', true));
