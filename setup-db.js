const pool = require("./config/database");

async function setupDatabase() {
  try {
    console.log("🔍 Verificando conexión a la base de datos...");

    // Test conexión
    const testResult = await pool.query("SELECT NOW()");
    console.log("✅ Conexión exitosa:", testResult.rows[0]);

    console.log("\n🔍 Verificando si existe la tabla users...");

    // Verificar si existe la tabla users
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("❌ La tabla users no existe. Creándola...");

      // Crear tabla users
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
        );
      `);

      console.log("✅ Tabla users creada exitosamente");

      // Insertar algunos datos de prueba
      console.log("📝 Insertando datos de prueba...");
      await pool.query(`
        INSERT INTO users (username, email, password) VALUES
        ('admin', 'admin@example.com', 'password123'),
        ('john_doe', 'john@example.com', 'password456'),
        ('jane_smith', 'jane@example.com', 'password789');
      `);

      console.log("✅ Datos de prueba insertados");
    } else {
      console.log("✅ La tabla users ya existe");

      // Mostrar usuarios existentes
      const users = await pool.query("SELECT COUNT(*) as count FROM users");
      console.log(`📊 Total de usuarios: ${users.rows[0].count}`);
    }

    console.log("\n🎉 Base de datos configurada correctamente!");
  } catch (error) {
    console.error("❌ Error configurando base de datos:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
    process.exit();
  }
}

setupDatabase();
