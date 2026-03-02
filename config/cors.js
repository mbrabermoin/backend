const corsOptions = {
  origin: [
    "http://localhost:3000", // React default
    "http://localhost:5173", // Vite default
    "http://localhost:4200", // Angular default
    "http://localhost:8080", // Vue default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4200",
    "http://127.0.0.1:8080",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

module.exports = corsOptions;
