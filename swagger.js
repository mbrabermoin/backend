const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Expense Tracker API',
      version: '1.0.0',
      description: 'API para gestionar gastos de viajes',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
          },
        },
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            type: { type: 'string' },
            amount: { type: 'number' },
            responsible: { type: 'string' },
            paymentMethod: { type: 'string' },
            travelId: { type: 'string' },
            travelDescription: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
          },
        },
        Trip: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            destiny: { type: 'string' },
            dolarPesosExchange: { type: 'number' },
            dolarRealExchange: { type: 'number' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
