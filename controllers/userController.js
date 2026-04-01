const pool = require("../config/database");
const {
  sendSuccess,
  sendError,
  sendValidationError,
} = require("../utils/response");

const getTrips = async (req, res) => {
  console.log('[DEBUG] getTrips called');
  try {
    const { page, limit } = req.query;

    let params = [];
    let hasLimit = limit !== undefined;
    let pageNum = 1;
    let limitNum;

    if (hasLimit) {
      pageNum = Number.parseInt(page, 10) || 1;
      limitNum = Number.parseInt(limit, 10);

      if (!Number.isInteger(limitNum) || limitNum <= 0) {
        return sendValidationError(res, ["limit must be a positive integer"]);
      }

      if (!Number.isInteger(pageNum) || pageNum <= 0) {
        return sendValidationError(res, ["page must be a positive integer"]);
      }
    }

    const tableResult = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'trips'
         AND table_schema NOT IN ('pg_catalog', 'information_schema')
       ORDER BY CASE WHEN table_schema = 'public' THEN 0 ELSE 1 END, table_schema
       LIMIT 1`,
    );

    if (tableResult.rows.length === 0) {
      return sendError(res, "Trips table does not exist", 500);
    }

    const tableSchema = tableResult.rows[0].table_schema;

    const columnsResult = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'trips'
       ORDER BY ordinal_position`,
      [tableSchema],
    );

    if (columnsResult.rows.length === 0) {
      return sendError(res, "Trips table has no readable columns", 500);
    }

    const columns = new Set(columnsResult.rows.map((row) => row.column_name));
    const pickColumn = (...candidates) => candidates.find((candidate) => columns.has(candidate));

    const idColumn = pickColumn("id");
    const destinyColumn = pickColumn("destiny", "destination", "travelDescription", "description");
    const monthColumn = pickColumn("month", "mes");
    const yearColumn = pickColumn("year", "anio");
    const exchangeColumn = pickColumn(
      "dolarExchange",
      "dollarExchange",
      "exchange",
      "usdExchange",
      "cambio",
      "cambioDolar",
    );

    const selectedColumns = [];
    if (idColumn) selectedColumns.push(`${idColumn} AS id`);
    if (destinyColumn) selectedColumns.push(`${destinyColumn} AS destiny`);
    if (monthColumn) selectedColumns.push(`${monthColumn} AS month`);
    if (yearColumn) selectedColumns.push(`${yearColumn} AS year`);
    if (exchangeColumn) selectedColumns.push(`${exchangeColumn} AS "dolarExchange"`);

    const quoteIdent = (value) => `"${value.replace(/"/g, '""')}"`;
    const tableRef = `${quoteIdent(tableSchema)}.${quoteIdent("trips")}`;
    const selectClause = selectedColumns.length > 0 ? selectedColumns.join(", ") : "*";
    const orderByColumn = idColumn || columnsResult.rows[0].column_name;

    let query = `SELECT ${selectClause} FROM ${tableRef} ORDER BY ${quoteIdent(orderByColumn)} ASC`;

    if (hasLimit) {
      const offset = (pageNum - 1) * limitNum;
      query += " LIMIT $1 OFFSET $2";
      params = [limitNum, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableRef}`);
    const totalTrips = Number.parseInt(countResult.rows[0].count);

    let responseData = {
      trips: result.rows,
    };
    
    if (hasLimit) {
      const totalPages = Math.ceil(totalTrips / limitNum);
      responseData.pagination = {
        currentPage: pageNum,
        totalPages,
        totalTrips,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      };
    } else {
      responseData.totalTrips = totalTrips;
    }

    sendSuccess(res, responseData, "Trips retrieved successfully");
  } catch (error) {
    sendError(res, "Error fetching trips", 500, error.message);
  }
};

const getExpenses = async (req, res) => {
  console.log('[DEBUG] getExpenses called');
  try {
    const { page, limit, travelId } = req.query;
    let hasLimit = limit !== undefined;

    let query = "SELECT id, type, amount, responsible, paymentMethod, travelId, travelDescription, exchange, date FROM expenses";
    let countQuery = "SELECT COUNT(*) FROM expenses";
    let params = [];
    let countParams = [];
    let paramIndex = 1;

    if (travelId) {
      query += " WHERE travelId = $" + paramIndex;
      countQuery += " WHERE travelId = $1";
      params.push(travelId);
      countParams.push(travelId);
      paramIndex++;
    }

    query += " ORDER BY id ASC";
    
    if (hasLimit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      query += " LIMIT $" + paramIndex + " OFFSET $" + (paramIndex + 1);
      params.push(limitNum, offset);
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const totalExpenses = Number.parseInt(countResult.rows[0].count);

    let responseData = {
      expenses: result.rows,
    };
    
    if (hasLimit) {
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page) || 1;
      const totalPages = Math.ceil(totalExpenses / limitNum);
      responseData.pagination = {
        currentPage: pageNum,
        totalPages,
        totalExpenses,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      };
    } else {
      responseData.totalExpenses = totalExpenses;
    }

    sendSuccess(res, responseData, "Expenses retrieved successfully");
  } catch (error) {
    sendError(res, "Error fetching expenses", 500, error.message);
  }
};

const getUsers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    let hasLimit = limit !== undefined;
    
    let query = "SELECT id, username, email FROM users ORDER BY id ASC";
    let params = [];
    
    if (hasLimit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      query += " LIMIT $1 OFFSET $2";
      params = [limitNum, offset];
    }

    const result = await pool.query(query, params);
    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = Number.parseInt(countResult.rows[0].count);

    let responseData = {
      users: result.rows,
    };
    
    if (hasLimit) {
      const limitNum = parseInt(limit);
      const pageNum = parseInt(page) || 1;
      const totalPages = Math.ceil(totalUsers / limitNum);
      responseData.pagination = {
        currentPage: pageNum,
        totalPages,
        totalUsers,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      };
    } else {
      responseData.totalUsers = totalUsers;
    }

    sendSuccess(res, responseData, "Users retrieved successfully");
  } catch (error) {
    sendError(res, "Error fetching users", 500, error.message);
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    const errors = [];
    if (!username || username.trim().length < 3) {
      errors.push("Username must be at least 3 characters long");
    }
    if (!email?.includes("@")) {
      errors.push("Valid email is required");
    }

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email.toLowerCase(), username.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return sendError(res, "User with this email or username already exists", 409);
    }

    const result = await pool.query(
      `INSERT INTO users (username, email) 
       VALUES ($1, $2) 
       RETURNING id, username, email`,
      [username.trim(), email.toLowerCase()],
    );

    const newUser = result.rows[0];

    sendSuccess(res, newUser, "User created successfully", 201);
  } catch (error) {
    sendError(res, "Error creating user", 500, error.message);
  }
};

const testConnection = async (req, res) => {
  try {
    // useful debug info
    const configDebug = {
      user: pool.options.user,
      host: pool.options.host,
      database: pool.options.database,
      port: pool.options.port,
      envPGPORT: process.env.PGPORT,
    };
    console.log("[DB DEBUG] using config:", configDebug);

    const result = await pool.query("SELECT NOW()");
    sendSuccess(res, { ...configDebug, now: result.rows }, "Database connection successful");
  } catch (error) {
    // return config + original error message so we can debug easily
    const configDebug = {
      user: pool.options.user,
      host: pool.options.host,
      database: pool.options.database,
      port: pool.options.port,
      envPGPORT: process.env.PGPORT,
    };
    console.error("[DB DEBUG ERROR]", error.message, configDebug);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      config: configDebug,
    });
  }
};

module.exports = {
  getUsers,
  getExpenses,
  getTrips,
  createUser,
  testConnection,
};
