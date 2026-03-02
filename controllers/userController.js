const pool = require("../config/database");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/response");

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT id, name, email FROM users ORDER BY id ASC LIMIT $1 OFFSET $2",
      [limit, offset],
    );

    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = Number.parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);

    const responseData = {
      users: result.rows,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    sendSuccess(res, responseData, "Users retrieved successfully");
  } catch (error) {
    sendError(res, "Error fetching users", 500, error.message);
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    const errors = [];
    if (!name || name.trim().length < 3) {
      errors.push("Name must be at least 3 characters long");
    }
    if (!email?.includes("@")) {
      errors.push("Valid email is required");
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR name = $2",
      [email.toLowerCase(), name.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return sendError(res, "User with this email or name already exists", 409);
    }

    const result = await pool.query(
      `INSERT INTO users (name, email) 
       VALUES ($1, $2) 
       RETURNING id, name, email`,
      [name.trim(), email.toLowerCase()],
    );

    const newUser = result.rows[0];

    sendSuccess(res, newUser, "User created successfully", 201);
  } catch (error) {
    sendError(res, "Error creating user", 500, error.message);
  }
};

const testConnection = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    sendSuccess(res, result.rows, "Database connection successful");
  } catch (error) {
    sendError(res, "Database connection failed", 500, error.message);
  }
};

module.exports = {
  getUsers,
  createUser,
  testConnection,
};
