import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Michel50anos@db.qimueiztpjeqhuleitei.supabase.co:5432/postgres";

async function stabilizeDatabase() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("[Stabilization] Connected to Supabase Sovereign Cluster.");

        // Law 10: Ensure Site Settings Schema Integrity
        console.log("[Stabilization] Hardening site_settings table...");
        
        await client.query(`
            ALTER TABLE site_settings 
            ADD COLUMN IF NOT EXISTS mobile_app_test_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS mobile_app_production_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS mobile_consumer_release JSONB,
            ADD COLUMN IF NOT EXISTS mobile_admin_release JSONB,
            ADD COLUMN IF NOT EXISTS promotional_banner TEXT DEFAULT 'Ofertas Exclusivas Mobile - 15% OFF',
            ADD COLUMN IF NOT EXISTS mobile_layout JSONB DEFAULT '[]'::jsonb;
        `);

        // Ensure at least one settings row exists
        const checkRes = await client.query("SELECT count(*) FROM site_settings");
        if (parseInt(checkRes.rows[0].count) === 0) {
            console.log("[Stabilization] Seeding initial canonical settings...");
            await client.query(`
                INSERT INTO site_settings (site_name, hero_title, hero_subtitle)
                VALUES ('Michels Travel', 'Para onde deseja viajar?', 'Bem-vindo novamente. Visão atualizada');
            `);
        }

        console.log("[Stabilization] Database hardened successfully.");
    } catch (err) {
        console.error("[Stabilization] FAILED:", err.message);
    } finally {
        await client.end();
        process.exit();
    }
}

stabilizeDatabase();
