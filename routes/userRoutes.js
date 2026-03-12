const express = require("express");
const router = express.Router();

console.log("[ROUTES] userRoutes module loaded");

const {
  getUsers,
  getExpenses,
  getTrips,
  createUser,
  testConnection,
} = require("../controllers/userController");

console.log("[ROUTES] imported handlers", {
  getUsers: typeof getUsers,
  getExpenses: typeof getExpenses,
  getTrips: typeof getTrips,
  createUser: typeof createUser,
  testConnection: typeof testConnection,
});

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test database connection
 *     description: Verifies that the database connection is working properly
 *     tags:
 *       - Test
 *     responses:
 *       200:
 *         description: Database connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Database connection failed
 */
router.get("/test", testConnection);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve paginated list of users
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 */
router.get("/users", getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with username and email
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: User already exists
 *       422:
 *         description: Validation error
 */
router.post("/users", createUser);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses
 *     description: Retrieve paginated list of expenses, optionally filtered by travelId
 *     tags:
 *       - Expenses
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of expenses per page
 *       - in: query
 *         name: travelId
 *         schema:
 *           type: string
 *         description: Filter expenses by travel ID
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     expenses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Expense'
 *                     pagination:
 *                       type: object
 */
router.get("/expenses", getExpenses);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     description: Retrieve paginated list of trips
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of trips per page
 *     responses:
 *       200:
 *         description: Trips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Trip'
 *                     pagination:
 *                       type: object
 */
router.get("/trips", getTrips);

module.exports = router;
