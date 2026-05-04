
import http from 'http';

async function runCrmStressTest() {
  console.log("🚀 INICIANDO TESTE DE ESTRESSE CRM (NATIVO)");
  
  const options = {
    hostname: '127.0.0.1',
    port: 5000,
    headers: {
      'Content-Type': 'application/json',
      'x-stress-test-secret': 'STRESS_INTEGRITY_2026'
    }
  };

  const request = (path, method, body) => {
    return new Promise((resolve, reject) => {
      const req = http.request({ ...options, path, method }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json, ok: res.statusCode < 300 });
          } catch (e) {
            resolve({ status: res.statusCode, data, ok: false, isHtml: data.includes('<!DOCTYPE html>') });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  // 1. Criar cliente
  console.log("1. Criando alvo...");
  const create = await request('/api/admin/customers', 'POST', {
    fullName: "Native Stress Subject",
    email: `native_${Date.now()}@test.com`
  });

  if (!create.ok) {
    console.log(`❌ Falha: Status ${create.status}`);
    if (create.isHtml) console.log("📝 O servidor devolveu HTML (SPA Fallback).");
    else console.log("📝 Erro:", create.data);
    return;
  }

  const targetId = create.data.id;
  console.log(`🎯 Alvo: ${targetId}`);

  // 2. Concorrência
  console.log("2. Bombardeio concorrente (20 requests)...");
  const promises = Array.from({ length: 20 }).map((_, i) => 
    request(`/api/admin/customers/${targetId}`, 'PATCH', { notes: `Test ${i}` })
  );
  
  const results = await Promise.all(promises);
  console.log(`📊 Sucessos: ${results.filter(r => r.ok).length}/20`);

  // 3. Payload Gigante
  console.log("3. Payload gigante (50KB)...");
  const huge = await request(`/api/admin/customers/${targetId}`, 'PATCH', { notes: 'A'.repeat(50000) });
  console.log(`📊 Status: ${huge.status}`);

  console.log("🏁 TESTE FINALIZADO.");
}

runCrmStressTest();
