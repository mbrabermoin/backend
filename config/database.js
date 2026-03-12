const { Pool } = require("pg");

// build base configuration from env (except port)
const baseConfig = {
  user: process.env.PGUSER || "admin",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "appdb",
  password: process.env.PGPASSWORD || "admin",
};

let pool;

async function createPoolWithPort(port) {
  const p = new Pool({ ...baseConfig, port });
  // quick sanity check
  await p.query("SELECT 1");
  return p;
}

async function initPool() {
  if (process.env.PGPORT) {
    const port = parseInt(process.env.PGPORT, 10);
    console.log(`[DB] PGPORT defined, using port ${port}`);
    pool = await createPoolWithPort(port);
  } else {
    // try default ports in order
    const portsToTry = [5432, 5433];
    for (const port of portsToTry) {
      try {
        console.log(`[DB] attempting connection on port ${port}`);
        pool = await createPoolWithPort(port);
        console.log(`[DB] connected using port ${port}`);
        break;
      } catch (err) {
        console.warn(`[DB] port ${port} failed: ${err.message}`);
        // swallow and continue
      }
    }
    if (!pool) {
      console.error("[DB] could not connect on any known port");
      //process.exit(1);
    }
  }

  pool.on("connect", () => {
    console.log("✅ Connected to PostgreSQL database");
  });

  pool.on("error", (err) => {
    console.error("❌ Database error:", err.message);
    // Don't exit on error - just log it
  });
}

const getPool = async () => {
  if (!pool) {
    await initPool();
  }
  return pool;
};

module.exports = {
  query: async (text, params) => {
    const p = await getPool(); 
    return p.query(text, params);
  },
  getPool // Por si necesitas el objeto pool completo en otro lado
};