const { Pool } = require("pg");

let pool;

/**
 * Inicializa el pool de conexiones. 
 * Si ya existe, devuelve la instancia actual (Singleton).
 */
const initPool = () => {
  if (pool) return pool;

  // Si estamos en Render, DATABASE_URL estará definida
  if (process.env.DATABASE_URL) {
    console.log("[DB] Producción detectada: Usando DATABASE_URL");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Requerido para Supabase en Render
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
    });
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
  }

  // Manejadores de eventos del Pool
  pool.on("connect", () => {
    console.log("✅ Conexión establecida con PostgreSQL");
  });

  pool.on("error", (err) => {
    console.error("❌ Error inesperado en el Pool de base de datos:", err.message);
  });

  return pool;
};

module.exports = {
  /**
   * Ejecuta una consulta usando el pool unificado.
   */
  query: async (text, params) => {
    const p = initPool();
    return p.query(text, params);
  },
  /**
   * Devuelve el pool por si se necesita para transacciones o clientes manuales.
   */
  getPool: () => initPool()
};