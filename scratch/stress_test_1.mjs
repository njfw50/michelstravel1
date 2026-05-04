
import fetch from 'node-fetch';

async function runStressTest1() {
  console.log("🚀 INICIANDO TESTE DE ESTRESSE 1: INJEÇÃO E VALIDAÇÃO DE CONTRATO");
  
  const malformedPayload = {
    siteName: "Michels Travel Hacked",
    mobileLayout: [
      {
        id: "hero",
        enabled: true,
        type: "hero",
        // Campo 'props' com tipo errado e campo proibido 'maliciousScript'
        props: {
          title: "Injected Title",
          maliciousScript: "alert('xss')" 
        },
        // Campo não existente no esquema Zod
        invalidField: "Should be rejected"
      }
    ],
    // Tentativa de injetar campo que não existe na tabela
    hackDatabase: true 
  };

  try {
    const response = await fetch('http://localhost:5000/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(malformedPayload)
    });

    const result = await response.json();
    
    if (response.status === 400) {
      console.log("✅ SUCESSO: O servidor rejeitou o payload malformado (400 Bad Request).");
      console.log("📝 Detalhes do erro Zod:", JSON.stringify(result.details, null, 2));
    } else if (response.status === 401) {
       console.log("ℹ️ INFO: Rejeitado por falta de autenticação (Esperado se não houver cookie).");
    } else {
      console.log("❌ FALHA: O servidor aceitou um payload inválido! Status:", response.status);
    }
  } catch (err) {
    console.log("❌ ERRO NA CONEXÃO:", err.message);
  }
}

runStressTest1();
