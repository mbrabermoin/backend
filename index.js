require('dotenv').config();
const { setupDatabase } = require("./setup-db");
const { importSheet } = require("./importSheet"); 
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");
const corsOptions = require("./config/cors");
const corsMiddleware = require("./middleware/corsMiddleware");
const userRoutes = require("./routes/userRoutes");

const app = express();

let isImporting = false;

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(corsMiddleware);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Import function
app.post("/admin/sync-sheets", async (req, res) => {
    if (isImporting) {
        return res.status(429).json({ 
            success: false, 
            message: "Synchronization already in progress. Please try again later." 
        });
    }

    isImporting = true;
    try {
        console.log("🔄 Initiating sheet synchronization...");
        await importSheet();
        res.json({ 
            success: true, 
            message: "¡Success! 🚀" 
        });
    } catch (error) {
        console.error("❌ Error in synchronization:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Error in sheet synchronization", 
            error: error.message 
        });
    } finally {
        isImporting = false;
    }
});

// Routes
app.use("/api", userRoutes);

// debug helper for printing routes
function logRoutes() {
  if (!(app._router && app._router.stack)) return;
  const routes = [];
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .map((m) => m.toUpperCase())
        .join(",");
      routes.push(`${methods} ${layer.route.path}`);
    } else if (layer.name === "router" && layer.handle && layer.handle.stack) {
      layer.handle.stack.forEach((r) => {
        if (r.route) {
          const methods = Object.keys(r.route.methods)
            .map((m) => m.toUpperCase())
            .join(",");
          routes.push(`${methods} ${layer.regexp} -> ${r.route.path}`);
        }
      });
    }
  });
  console.log("[STARTUP] registered routes:", routes);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Backend API",
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 3001;

async function startApp() {
    console.log("⏳ Initiating startup sequence...");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Immortal Server running on port ${PORT}`);
    });

    setupDatabase().catch(err => {
        console.log("⚠️ DB failed!");
    });
}

startApp();