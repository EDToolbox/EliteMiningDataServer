const request = require('supertest');
const express = require('express');

// Import routes
const statisticsRoutes = require('../src/routes/statistics');
const marketRoutes = require('../src/routes/market');

describe('Elite Dangerous Mining Data Server - Complete Integration Tests', () => {
  let app;
  let mockServices;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock services for testing
    mockServices = {
      database: {
        isConnected: () => true,
        aggregate: jest.fn(),
        find: jest.fn(),
        insertOne: jest.fn(),
        updateOne: jest.fn()
      },
      cacheManager: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
      },
      marketDataService: {
        getCommodityData: jest.fn(),
        getCommodityPriceHistory: jest.fn(),
        getSystemCoordinates: jest.fn()
      },
      statisticsService: {
        getGlobalStatistics: jest.fn(),
        getEDDNStatistics: jest.fn(),
        getMiningStatistics: jest.fn(),
        getAPIUsageStatistics: jest.fn(),
        getWebSocketStatistics: jest.fn()
      },
      inaraApiService: {
        getCommodityPrices: jest.fn(),
        getSystemInfo: jest.fn()
      },
      edsmApiService: {
        getSystemInfo: jest.fn(),
        getSystemBodies: jest.fn()
      },
      rateLimitService: {
        checkLimit: jest.fn(),
        incrementCounter: jest.fn()
      },
      errorHandlingService: {
        executeWithErrorHandling: jest.fn()
      }
    };

    // Make services available to routes
    Object.keys(mockServices).forEach(serviceName => {
      app.locals[serviceName] = mockServices[serviceName];
    });

    // Mount routes
    app.use('/api/stats', statisticsRoutes);
    app.use('/api/market', marketRoutes);
  });

  describe('Statistics Routes Integration Tests', () => {
    describe('GET /api/stats - Global Statistics', () => {
      it('should return comprehensive global statistics', async () => {
        // Mock service responses
        mockServices.statisticsService.getGlobalStatistics.mockResolvedValue({
          systems: { total: 50000, withStations: 30000 },
          stations: { total: 75000, withMarketData: 60000 },
          commodities: { total: 150, tracked: 120 },
          mining: { locations: 5000, hotspots: 2000 },
          eddn: { messagesProcessed: 1000000, uptime: 98.5 },
          api: { totalRequests: 250000, averageResponseTime: 150 },
          websocket: { activeConnections: 50, totalConnections: 10000 }
        });

        const response = await request(app)
          .get('/api/stats')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('systems');
        expect(response.body.data).toHaveProperty('stations');
        expect(response.body.data).toHaveProperty('commodities');
        expect(response.body.data).toHaveProperty('mining');
        expect(response.body.data.systems.total).toBe(50000);
      });

      it('should handle service errors gracefully', async () => {
        mockServices.statisticsService.getGlobalStatistics.mockRejectedValue(
          new Error('Database connection failed')
        );

        const response = await request(app)
          .get('/api/stats')
          .expect(500);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/stats/eddn - EDDN Statistics', () => {
      it('should return comprehensive EDDN statistics', async () => {
        mockServices.statisticsService.getEDDNStatistics.mockResolvedValue({
          connection: {
            status: 'connected',
            uptime: 3600000,
            reconnections: 2
          },
          messages: {
            total: 1000000,
            byType: {
              commodity: 600000,
              journal: 300000,
              outfitting: 100000
            }
          },
          performance: {
            averageLatency: 50,
            messagesPerSecond: 150
          }
        });

        const response = await request(app)
          .get('/api/stats/eddn')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('connection');
        expect(response.body.data).toHaveProperty('messages');
        expect(response.body.data).toHaveProperty('performance');
        expect(response.body.data.connection.status).toBe('connected');
      });
    });

    describe('GET /api/stats/mining - Mining Statistics', () => {
      it('should return detailed mining statistics', async () => {
        mockServices.statisticsService.getMiningStatistics.mockResolvedValue({
          locations: {
            total: 5000,
            byType: {
              asteroidBelts: 2000,
              planetRings: 2500,
              hotspots: 500
            }
          },
          commodities: {
            distribution: {
              'Void Opals': 15,
              'Low Temperature Diamonds': 12,
              'Painite': 10
            }
          },
          profitability: {
            topLocations: [],
            averageProfitPerHour: 50000000
          }
        });

        const response = await request(app)
          .get('/api/stats/mining')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('locations');
        expect(response.body.data).toHaveProperty('commodities');
        expect(response.body.data).toHaveProperty('profitability');
      });
    });

    describe('GET /api/stats/api-usage - API Usage Statistics', () => {
      it('should return API usage statistics', async () => {
        mockServices.statisticsService.getAPIUsageStatistics.mockResolvedValue({
          requests: {
            total: 250000,
            byEndpoint: {
              '/api/market/commodity': 100000,
              '/api/stats': 50000,
              '/api/systems': 75000
            }
          },
          performance: {
            averageResponseTime: 150,
            slowestEndpoints: []
          },
          errors: {
            total: 1000,
            byStatus: {
              '404': 600,
              '500': 300,
              '503': 100
            }
          }
        });

        const response = await request(app)
          .get('/api/stats/api-usage')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('requests');
        expect(response.body.data).toHaveProperty('performance');
        expect(response.body.data).toHaveProperty('errors');
      });
    });

    describe('GET /api/stats/websocket - WebSocket Statistics', () => {
      it('should return WebSocket statistics', async () => {
        mockServices.statisticsService.getWebSocketStatistics.mockResolvedValue({
          connections: {
            active: 50,
            total: 10000,
            peak: 150
          },
          messages: {
            sent: 500000,
            deliveryRate: 99.8
          },
          bandwidth: {
            totalBytes: 50000000,
            averagePerConnection: 1000000
          }
        });

        const response = await request(app)
          .get('/api/stats/websocket')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('connections');
        expect(response.body.data).toHaveProperty('messages');
        expect(response.body.data).toHaveProperty('bandwidth');
      });
    });
  });

  describe('Market Routes Integration Tests', () => {
    describe('GET /api/market/commodity/:commodityId', () => {
      it('should return comprehensive commodity data', async () => {
        mockServices.marketDataService.getCommodityData.mockResolvedValue({
          locations: [
            {
              systemName: 'Sol',
              stationName: 'Abraham Lincoln',
              buyPrice: 5000,
              sellPrice: 5200,
              supply: 1000,
              demand: 500,
              lastUpdated: new Date()
            }
          ],
          statistics: {
            averageBuyPrice: 5000,
            averageSellPrice: 5200,
            totalLocations: 1
          }
        });

        const response = await request(app)
          .get('/api/market/commodity/Painite')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('commodity');
        expect(response.body.data).toHaveProperty('sources');
        expect(response.body.data).toHaveProperty('analytics');
        expect(response.body.data.commodity.id).toBe('Painite');
      });

      it('should handle missing commodity gracefully', async () => {
        mockServices.marketDataService.getCommodityData.mockResolvedValue({
          locations: [],
          statistics: {},
          totalLocations: 0
        });

        const response = await request(app)
          .get('/api/market/commodity/NonExistentCommodity')
          .expect(404);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/market/routes', () => {
      it('should return trading routes with valid start system', async () => {
        mockServices.edsmApiService.getSystemInfo.mockResolvedValue({
          name: 'Sol',
          coords: { x: 0, y: 0, z: 0 }
        });

        mockServices.marketDataService.getSystemCoordinates.mockResolvedValue({
          name: 'Sol',
          coords: { x: 0, y: 0, z: 0 }
        });

        const response = await request(app)
          .get('/api/market/routes')
          .query({
            startSystem: 'Sol',
            jumpRange: 20,
            cargoCapacity: 100
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('routes');
        expect(response.body.data).toHaveProperty('startSystem');
      });

      it('should reject request without start system', async () => {
        const response = await request(app)
          .get('/api/market/routes')
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Missing required parameter');
      });
    });

    describe('GET /api/market/trends', () => {
      it('should return market trend analysis', async () => {
        const response = await request(app)
          .get('/api/market/trends')
          .query({
            commodity: 'Painite',
            timeRange: '30d',
            interval: 'daily'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('trends');
        expect(response.body.data).toHaveProperty('analytics');
      });

      it('should validate time range parameter', async () => {
        const response = await request(app)
          .get('/api/market/trends')
          .query({
            commodity: 'Painite',
            timeRange: 'invalid',
            interval: 'daily'
          })
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Invalid time range');
      });
    });

    describe('GET /api/market/station/:system/:station', () => {
      it('should return station market data', async () => {
        const response = await request(app)
          .get('/api/market/station/Sol/Abraham%20Lincoln')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('station');
        expect(response.body.data).toHaveProperty('market');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database unavailability', async () => {
      app.locals.database = null;

      const response = await request(app)
        .get('/api/stats')
        .expect(503);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle cache service unavailability gracefully', async () => {
      app.locals.cacheManager = null;

      mockServices.statisticsService.getGlobalStatistics.mockResolvedValue({
        systems: { total: 50000 }
      });

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should handle external API service failures', async () => {
      mockServices.edsmApiService.getSystemInfo.mockRejectedValue(
        new Error('EDSM API unavailable')
      );

      const response = await request(app)
        .get('/api/market/routes')
        .query({ startSystem: 'Sol' })
        .expect(503);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Performance and Caching', () => {
    it('should utilize cache for repeated requests', async () => {
      const cachedData = {
        systems: { total: 50000 },
        timestamp: new Date()
      };

      mockServices.cacheManager.get.mockResolvedValue(cachedData);

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.data).toEqual(cachedData);
      expect(response.body.metadata.source).toBe('cache');
      expect(mockServices.statisticsService.getGlobalStatistics).not.toHaveBeenCalled();
    });

    it('should measure response times', async () => {
      mockServices.statisticsService.getGlobalStatistics.mockResolvedValue({
        systems: { total: 50000 }
      });

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('processingTime');
      expect(typeof response.body.metadata.processingTime).toBe('number');
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/market/commodity/Painite')
        .query({
          maxAge: 'invalid',
          limit: 'not-a-number'
        })
        .expect(200); // Should still work with defaults

      expect(response.body).toHaveProperty('success', true);
    });

    it('should sanitize user input', async () => {
      const response = await request(app)
        .get('/api/market/station/Sol<script>/Abraham%20Lincoln')
        .expect(200);

      // Should handle malicious input gracefully
      expect(response.body).toBeDefined();
    });
  });
});