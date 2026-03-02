const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  testConnection,
} = require("../controllers/userController");

// Test de conexión
router.get("/test", testConnection);

// Rutas de usuarios
router.get("/users", getUsers);
router.post("/users", createUser);

module.exports = router;
