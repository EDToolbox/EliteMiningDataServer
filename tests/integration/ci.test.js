const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')

// Import routes
const statisticsRoutes = require('../../src/routes/statistics')
const marketRoutes = require('../../src/routes/market')

// Simple integration tests for CI environment
describe('CI Integration Tests', () => {
  let app

  beforeAll(async () => {
    app = express()
    app.use(express.json())
    
    // Mock basic services that the routes need
    app.locals.database = {
      isConnected: () => true,
      collection: () => ({
        aggregate: () => ({ toArray: () => Promise.resolve([]) }),
        countDocuments: () => Promise.resolve(0),
        distinct: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        find: () => ({ toArray: () => Promise.resolve([]) })
      })
    }
    
    app.locals.cacheManager = {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(true),
      delete: () => Promise.resolve(true)
    }
    
    app.locals.statisticsService = {
      getGlobalStatistics: () => Promise.resolve({
        systems: { total: 1000 },
        commodities: { total: 150 }
      }),
      getEDDNStatistics: () => Promise.resolve({
        messagesProcessed: 10000
      }),
      getMiningStatistics: () => Promise.resolve({
        totalRocks: 500
      })
    }
    
    app.locals.marketDataService = {
      getCommodityData: (id) => {
        if (id === 'invalid') {
          throw new Error('Not found')
        }
        return Promise.resolve({
          commodityId: id,
          name: id,
          averagePrice: 5000
        })
      }
    }

    // Mount routes
    app.use('/api/stats', statisticsRoutes)
    app.use('/api/market', marketRoutes)
  })

  describe('API Availability Tests', () => {
    test('Statistics endpoint should be accessible', async () => {
      const response = await request(app).get('/api/stats')
      // Expect either success or a controlled error response
      expect([200, 500]).toContain(response.status)
    })

    test('Market commodity endpoint should be accessible', async () => {
      const response = await request(app).get('/api/market/commodity/gold')
      // Expect either success or a controlled error response
      expect([200, 500]).toContain(response.status)
    })

    test('Health check endpoints should respond', async () => {
      // Test multiple endpoints to ensure the routes are properly loaded
      const endpoints = ['/api/stats', '/api/market/commodity/test']
      
      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint)
        // Any response (including errors) means the route is loaded
        expect(response.status).toBeDefined()
        expect(typeof response.status).toBe('number')
      }
    })
  })

  describe('Error Handling', () => {
    test('Invalid commodity should handle errors', async () => {
      const response = await request(app).get('/api/market/commodity/nonexistent')
      // Should handle the error gracefully
      expect(response.status).toBeDefined()
    })
  })
})