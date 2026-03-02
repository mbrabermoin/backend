const express = require("express");
const cors = require("cors");
const corsOptions = require("./config/cors");
const corsMiddleware = require("./middleware/corsMiddleware");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(corsMiddleware);

// Routes
app.use("/api", userRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
});
