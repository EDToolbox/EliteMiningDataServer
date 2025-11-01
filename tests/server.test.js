const request = require('supertest');
const { startServer } = require('../src/index');

describe('Elite Mining Data Server', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Start server for testing
    const serverInstance = await startServer();
    server = serverInstance.server;
    app = serverInstance.app;
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Health Endpoints', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('GET /api/status should return server status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);
      
      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('dataSources');
    });
  });

  describe('API Endpoints', () => {
    test('GET /api/status/endpoints should return API documentation', async () => {
      const response = await request(app)
        .get('/api/status/endpoints')
        .expect(200);
      
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('websocket');
    });

    test('GET /api/mining/stats should return mining statistics', async () => {
      const response = await request(app)
        .get('/api/mining/stats')
        .expect(200);
      
      expect(response.body).toHaveProperty('statistics');
    });
  });

  describe('Error Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });
  });
});