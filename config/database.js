const { Pool } = require("pg");
const dns = require("dns");

// Render can fail reaching IPv6-only resolved addresses; prefer IPv4 first.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

let pool;
let currentConnectionLabel = null;

const getPoolerUrl = () =>
  process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL_POOLER || process.env.POOLER_DATABASE_URL;

const isIpv6ReachabilityError = (err) => {
  if (!err || !err.message) return false;
  return err.message.includes("ENETUNREACH");
};

const attachPoolListeners = (targetPool, label) => {
  targetPool.on("connect", () => {
    console.log(`✅ Conexión establecida con PostgreSQL (${label})`);
  });

  targetPool.on("error", (err) => {
    console.error(`❌ Error inesperado en el Pool de base de datos (${label}):`, err.message);
  });
};

const createProductionPool = (connectionString, label) => {
  const createdPool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
    family: 4,
  });
  attachPoolListeners(createdPool, label);
  return createdPool;
};

/**
 * Inicializa el pool de conexiones. 
 * Si ya existe, devuelve la instancia actual (Singleton).
 */
const initPool = () => {
  if (pool) return pool;

  // Si estamos en Render, DATABASE_URL estará definida
  if (process.env.DATABASE_URL) {
    const poolerUrl = getPoolerUrl();
    if (poolerUrl) {
      console.log("[DB] Producción detectada: Usando Pooler URL (IPv4 recomendado)");
      currentConnectionLabel = "pooler-url";
      pool = createProductionPool(poolerUrl, currentConnectionLabel);
    } else {
      console.log("[DB] Producción detectada: Usando DATABASE_URL");
      currentConnectionLabel = "database-url";
      pool = createProductionPool(process.env.DATABASE_URL, currentConnectionLabel);
    }
  } else {
    // Configuración para tu entorno Local
    console.log("[DB] Entorno local detectado: Usando variables PG");
    pool = new Pool({
      user: process.env.PGUSER || "admin",
      host: process.env.PGHOST || "localhost",
      database: process.env.PGDATABASE || "appdb",
      password: process.env.PGPASSWORD || "admin",
      port: parseInt(process.env.PGPORT, 10) || 5432,
    });
    currentConnectionLabel = "local-pg-vars";
    attachPoolListeners(pool, currentConnectionLabel);
  }

  return pool;
};

module.exports = {
  /**
   * Ejecuta una consulta usando el pool unificado.
   */
  query: async (text, params) => {
    let p = initPool();
    try {
      return await p.query(text, params);
    } catch (error) {
      const poolerUrl = getPoolerUrl();
      const canRetryWithPooler =
        process.env.DATABASE_URL &&
        poolerUrl &&
        currentConnectionLabel === "database-url" &&
        isIpv6ReachabilityError(error);

      if (!canRetryWithPooler) {
        if (
          process.env.DATABASE_URL &&
          !poolerUrl &&
          isIpv6ReachabilityError(error)
        ) {
          error.message = `${error.message}. Configura SUPABASE_POOLER_URL (o DATABASE_URL_POOLER) con el Connection Pooling de Supabase (host pooler + puerto 6543).`;
        }
        throw error;
      }

      console.warn("[DB] DATABASE_URL falló por red. Reintentando con Pooler URL...");
      try {
        await pool.end();
      } catch (endError) {
        console.warn("[DB] No se pudo cerrar pool previo antes del fallback:", endError.message);
      }

      currentConnectionLabel = "pooler-url";
      pool = createProductionPool(poolerUrl, currentConnectionLabel);
      p = pool;
      return await p.query(text, params);
    }
  },
  /**
   * Devuelve el pool por si se necesita para transacciones o clientes manuales.
   */
  getPool: () => initPool()
};