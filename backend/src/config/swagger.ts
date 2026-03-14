import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

// Resolve API doc sources from this file's location so Swagger works when cwd is repo root (e.g. Vercel)
const thisDir = __dirname;
const routesDir = path.join(thisDir, '..', 'routes');
const ext = thisDir.includes(path.sep + 'dist' + path.sep) ? 'js' : 'ts';
const apisGlob = path.join(routesDir, `*.${ext}`);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Akshaya Dairy Management System API',
      version: '1.0.0',
      description: 'API documentation for Akshaya Dairy Milk Collection & Management System',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
      {
        url: '/',
        description: 'Current host (Vercel / production)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token (without Bearer prefix)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [apisGlob],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Akshaya Dairy API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  }));
};

