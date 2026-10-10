const $ = s => document.querySelector(s); let token = '';
const node = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
async function call(method = 'GET', body) {
  const r = await fetch('/api/admin/requests', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const b = await r.json(); if (!r.ok) throw new Error(b.error); return b;
}
async function load() {
  const b = await call(); $('#list').replaceChildren(); $('#message').textContent = `${b.requests.length} solicitações mais recentes. Atualize esta página para consultar novos pedidos.`;
  for (const r of b.requests) {
    const card = node('article', ''), o = JSON.parse(r.offer_json);
    card.append(node('h2', r.name), node('p', `${r.id} · ${new Date(r.created_at).toLocaleString('pt-BR')} · ${r.mode}`), node('p', `${r.email} · ${r.phone}`), node('p', `${o.airline} · ${o.price} ${o.currency} · ${o.passengerCount} adulto(s)`));
    for (const s of o.slices) for (const g of s.segments) card.append(node('p', `${g.origin} → ${g.destination} · ${g.departure} · ${g.flight}`));
    const select = document.createElement('select'); select.setAttribute('aria-label', `Status de ${r.name}`);
    for (const [value, text] of [['received', 'Recebida'], ['contacted', 'Em atendimento'], ['closed', 'Encerrada']]) { const option = node('option', text); option.value = value; select.append(option); } select.value = r.status;
    const save = node('button', 'Salvar status'); save.addEventListener('click', async () => { save.disabled = true; try { await call('PATCH', { reference: r.id, status: select.value }); $('#message').textContent = 'Status atualizado.'; } catch (e) { $('#message').textContent = e.message; } finally { save.disabled = false; } }); card.append(select, save); $('#list').append(card);
  }
}
$('#login').addEventListener('submit', async e => { e.preventDefault(); token = $('#key').value; $('#key').value = ''; try { await load(); } catch (e) { $('#list').replaceChildren(); $('#message').textContent = e.message; token = ''; } });
$('#logout').addEventListener('click', () => { token = ''; $('#key').value = ''; $('#list').replaceChildren(); $('#message').textContent = 'Sessão encerrada.'; });
