import pg from 'pg';
const { Pool } = pg;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const password = "MichelsOregon2026%23";
const projectRef = "qimueiztpjeqhuleitei";

const variations = [
  {
    name: "POOLER (OREGON - AWS 1)",
    url: `postgresql://postgres.${projectRef}:${password}@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
  },
  {
    name: "DIRECT (OREGON - IPV4/IPV6)",
    url: `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`
  }
];

async function runTests() {
  console.log("=== INICIANDO HARD ATTACK DE CONEXÃO ===\n");

  for (const test of variations) {
    console.log(`Testando: ${test.name}...`);
    const pool = new Pool({ 
      connectionString: test.url, 
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      const start = Date.now();
      const res = await pool.query("SELECT NOW()");
      console.log(`✅ SUCESSO! Tempo: ${Date.now() - start}ms | Banco diz: ${res.rows[0].now}`);
    } catch (err: any) {
      console.error(`❌ FALHA: ${err.message}`);
      if (err.message.includes("ECIRCUITBREAKER")) {
        console.log("   -> DICA: O Supabase bloqueou temporariamente (Circuit Breaker).");
      }
    } finally {
      await pool.end();
    }
    console.log("------------------------------------------");
  }
}

runTests();
