import request from 'supertest';
import app from '../app';

// Mock the database connection
jest.mock('../database/connection', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({
      release: jest.fn()
    }),
    end: jest.fn()
  },
  connectDB: jest.fn(),
  closeDB: jest.fn()
}));

jest.mock('../database/init', () => ({
  initializeDatabase: jest.fn()
}));

describe('Swagger Integration', () => {
  describe('GET /api-docs', () => {
    it('should serve Swagger UI', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('RevelAi Health API Documentation');
    });

    it('should redirect /api-docs to /api-docs/', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(301);

      expect(response.headers.location).toBe('/api-docs/');
    });
  });

  describe('OpenAPI Specification', () => {
    it('should serve OpenAPI JSON spec', async () => {
      // Swagger UI typically serves the spec at /api-docs/swagger.json
      // But we can also test our configuration directly
      const { specs } = require('../config/swagger');
      
      expect(specs).toBeDefined();
      expect(specs.openapi).toBe('3.0.0');
      expect(specs.info.title).toBe('RevelAi Health - Patient Care Journey API');
      expect(specs.info.version).toBe('1.0.0');
    });

    it('should have all required components', async () => {
      const { specs } = require('../config/swagger');
      
      // Check that all our schemas are defined
      expect(specs.components.schemas).toHaveProperty('Journey');
      expect(specs.components.schemas).toHaveProperty('MessageNode');
      expect(specs.components.schemas).toHaveProperty('DelayNode');
      expect(specs.components.schemas).toHaveProperty('ConditionalNode');
      expect(specs.components.schemas).toHaveProperty('PatientContext');
      expect(specs.components.schemas).toHaveProperty('JourneyRun');
      expect(specs.components.schemas).toHaveProperty('Error');
      expect(specs.components.schemas).toHaveProperty('HealthStatus');
    });

    it('should have proper tags defined', async () => {
      const { specs } = require('../config/swagger');
      
      const tagNames = specs.tags.map((tag: any) => tag.name);
      expect(tagNames).toContain('Journeys');
      expect(tagNames).toContain('Execution');
      expect(tagNames).toContain('Health');
    });
  });
});