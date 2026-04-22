import pg from 'pg';
const { Pool } = pg;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const password = "MichelsOregon2026#"; // SENHA PURA
const host = "aws-1-us-west-2.pooler.supabase.com";
const user = "postgres.qimueiztpjeqhuleitei";

async function forceTest() {
  console.log("=== TESTE DE FORÇA BRUTA (SEM URL) ===\n");
  
  const pool = new Pool({
    user: user,
    password: password,
    host: host,
    port: 6543,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log(`Tentando conectar em ${host} como ${user}...`);
    const res = await pool.query("SELECT NOW()");
    console.log("--- SUCESSO ABSOLUTO! ---");
    console.log("Banco respondeu:", res.rows[0].now);
  } catch (err: any) {
    console.error("--- FALHA ---");
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

forceTest();
