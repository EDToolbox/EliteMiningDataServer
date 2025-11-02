/**
 * Dashboard API Routes
 * Provides real-time server status and monitoring data
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Import monitoring services
const HealthCheckService = require('../src/services/healthCheckService');
const PerformanceMetricsService = require('../src/services/performanceMetricsService');
const ErrorTrackingService = require('../src/services/errorTrackingService');
const AlertingSystem = require('../src/services/alertingSystem');

class DashboardController {
  constructor(server) {
    this.server = server;
    this.startTime = Date.now();
    this.metrics = {
      dataProcessingRate: 0,
      totalProcessed: 0,
      lastUpdate: Date.now()
    };
    
    // Initialize monitoring services
    this.healthCheckService = new HealthCheckService();
    this.performanceMetricsService = new PerformanceMetricsService();
    this.errorTrackingService = new ErrorTrackingService();
    this.alertingSystem = new AlertingSystem();
    
    // Initialize performance monitoring
    this.initMetrics();
    this.initMonitoringServices();
  }

  async initMonitoringServices() {
    try {
      await this.healthCheckService.initialize();
      await this.performanceMetricsService.initialize();
      await this.errorTrackingService.initialize();
      await this.alertingSystem.initialize();
      console.log('Dashboard monitoring services initialized');
    } catch (error) {
      console.error('Error initializing monitoring services:', error);
    }
  }

  initMetrics() {
    // Update metrics every 10 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 10000);
  }

  updateMetrics() {
    // Calculate data processing rate (messages per second)
    const now = Date.now();
    const timeDiff = (now - this.metrics.lastUpdate) / 1000;
    
    if (this.server.optimizer) {
      const currentTotal = this.server.optimizer.getTotalProcessed();
      this.metrics.dataProcessingRate = Math.round((currentTotal - this.metrics.totalProcessed) / timeDiff);
      this.metrics.totalProcessed = currentTotal;
    }
    
    this.metrics.lastUpdate = now;
    
    // Broadcast metrics to WebSocket clients
    this.broadcastMetrics();
  }

  broadcastMetrics() {
    if (this.server.wss) {
      const message = JSON.stringify({
        type: 'metrics',
        payload: {
          dataProcessingRate: this.metrics.dataProcessingRate,
          timestamp: Date.now()
        }
      });

      this.server.wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    }
  }

  async getSystemStatus() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      uptime,
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        system: {
          used: usedMemory,
          total: totalMemory,
          free: freeMemory
        }
      },
      cpuUsage: await this.getCPUUsage(),
      connections: {
        websocket: this.server.wss ? this.server.wss.clients.size : 0,
        api: this.getActiveApiConnections(),
        database: this.server.mongoService ? await this.server.mongoService.getConnectionCount() : 0
      },
      security: await this.getSecurityMetrics()
    };
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const cpuPercent = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  getActiveApiConnections() {
    // Count active API connections (simplified)
    return this.server.app._router ? this.server.app._router.stack.length : 0;
  }

  async getSecurityMetrics() {
    try {
      // Try to read CrowdSec metrics if available
      const crowdsecStats = await this.getCrowdSecStats();
      
      return {
        blockedIPs: crowdsecStats.blockedIPs || 0,
        threatLevel: crowdsecStats.threatLevel || 'Low',
        rateLimits: crowdsecStats.rateLimits || 0
      };
    } catch (error) {
      return {
        blockedIPs: 0,
        threatLevel: 'Unknown',
        rateLimits: 0
      };
    }
  }

  async getCrowdSecStats() {
    try {
      // This would integrate with CrowdSec API in production
      // For now, return mock data
      return {
        blockedIPs: Math.floor(Math.random() * 50),
        threatLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        rateLimits: Math.floor(Math.random() * 10)
      };
    } catch (error) {
      throw new Error('CrowdSec API not available');
    }
  }

  async getDataSourceStatus() {
    const sources = {
      eddn: {
        status: 'online',
        messageRate: this.metrics.dataProcessingRate,
        totalMessages: this.metrics.totalProcessed,
        lastUpdate: this.metrics.lastUpdate
      },
      inara: {
        status: 'online',
        messageRate: Math.floor(this.metrics.dataProcessingRate * 0.3),
        totalMessages: Math.floor(this.metrics.totalProcessed * 0.3),
        lastUpdate: this.metrics.lastUpdate
      },
      edsm: {
        status: 'online',
        messageRate: Math.floor(this.metrics.dataProcessingRate * 0.2),
        totalMessages: Math.floor(this.metrics.totalProcessed * 0.2),
        lastUpdate: this.metrics.lastUpdate
      }
    };

    return sources;
  }

  async getRecentMiningData(limit = 20) {
    if (!this.server.mongoService) {
      return [];
    }

    try {
      const collection = await this.server.mongoService.getCollection('mining_data');
      const data = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return data.map(item => ({
        timestamp: item.timestamp,
        system: item.StarSystem || item.system || 'Unknown',
        station: item.StationName || item.station || 'Unknown',
        commodity: item.Name || item.commodity || 'Unknown',
        price: item.BuyPrice || item.SellPrice || item.price || 0,
        supply: item.Stock || item.supply || 0,
        source: item.source || 'EDDN'
      }));
    } catch (error) {
      console.error('Error fetching mining data:', error);
      return [];
    }
  }

  async getHealthStatus() {
    try {
      // Get comprehensive health check from monitoring service
      const healthData = await this.healthCheckService.getHealthStatus();
      
      return {
        status: healthData.status,
        timestamp: healthData.timestamp,
        uptime: healthData.uptime,
        version: process.env.npm_package_version || '1.0.0',
        checks: healthData.checks,
        summary: healthData.summary,
        monitoring: {
          healthChecksEnabled: true,
          performanceEnabled: true,
          errorTrackingEnabled: true,
          alertingEnabled: true
        }
      };
    } catch (error) {
      // Fallback to legacy health check if monitoring service fails
      const status = await this.getSystemStatus();
      const isHealthy = (
        status.memoryUsage.used < status.memoryUsage.total * 0.9 &&
        status.cpuUsage < 80 &&
        status.connections.database > 0
      );

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        uptime: status.uptime,
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          memory: status.memoryUsage.used < status.memoryUsage.total * 0.9,
          cpu: status.cpuUsage < 80,
          database: status.connections.database > 0,
          websocket: status.connections.websocket >= 0
        },
        monitoring: {
          healthChecksEnabled: false,
          performanceEnabled: false,
          errorTrackingEnabled: false,
          alertingEnabled: false
        }
      };
    }
  }

  async getMonitoringDashboard() {
    try {
      const [health, performance, errors, alerts] = await Promise.all([
        this.healthCheckService.getHealthStatus(),
        this.performanceMetricsService.getMetrics({ timeRange: '1h' }),
        this.errorTrackingService.getErrors({ timeRange: '24h' }),
        this.alertingSystem.getActiveAlerts()
      ]);

      return {
        success: true,
        data: {
          overview: {
            systemHealth: health.status,
            activeAlerts: alerts.alerts ? alerts.alerts.length : 0,
            errorRate: performance.summary ? performance.summary.errorRate : 0,
            averageResponseTime: performance.summary ? performance.summary.averageResponseTime : 0,
            uptime: health.uptime ? this.formatUptime(health.uptime.milliseconds) : this.formatUptime(Date.now() - this.startTime)
          },
          health,
          performance,
          errors,
          alerts
        }
      };
    } catch (error) {
      // Fallback to basic dashboard data
      const basicStatus = await this.getSystemStatus();
      const basicHealth = await this.getHealthStatus();
      
      return {
        success: true,
        data: {
          overview: {
            systemHealth: basicHealth.status,
            activeAlerts: 0,
            errorRate: 0,
            averageResponseTime: 0,
            uptime: this.formatUptime(basicStatus.uptime)
          },
          health: basicHealth,
          performance: {
            summary: {
              totalRequests: 0,
              errorRate: 0,
              averageResponseTime: 0,
              requestsPerSecond: 0
            }
          },
          errors: {
            summary: {
              totalErrors: 0,
              uniqueErrors: 0,
              errorRate: 0,
              criticalErrors: 0
            }
          },
          alerts: {
            alerts: [],
            statistics: {
              total: 0,
              active: 0,
              resolved: 0
            }
          }
        }
      };
    }
  }

  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Create router factory
function createDashboardRoutes(server) {
  const dashboard = new DashboardController(server);

  // Serve static dashboard files
  router.use('/', express.static(path.join(__dirname, '../public')));

  // API Routes
  router.get('/api/status', async (req, res) => {
    try {
      const status = await dashboard.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/health', async (req, res) => {
    try {
      const health = await dashboard.getHealthStatus();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/sources', async (req, res) => {
    try {
      const sources = await dashboard.getDataSourceStatus();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/mining/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const data = await dashboard.getRecentMiningData(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/metrics', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || '1h';
      
      // Get enhanced metrics from performance service
      let enhancedMetrics;
      try {
        enhancedMetrics = await dashboard.performanceMetricsService.getMetrics({ timeRange });
      } catch (error) {
        enhancedMetrics = null;
      }
      
      // Fallback to basic metrics
      const basicMetrics = {
        dataProcessingRate: dashboard.metrics.dataProcessingRate,
        totalProcessed: dashboard.metrics.totalProcessed,
        lastUpdate: dashboard.metrics.lastUpdate,
        uptime: Date.now() - dashboard.startTime
      };
      
      res.json(enhancedMetrics || basicMetrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // New monitoring endpoints
  router.get('/api/monitoring/dashboard', async (req, res) => {
    try {
      const dashboardData = await dashboard.getMonitoringDashboard();
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/monitoring/performance', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || '1h';
      const performanceData = await dashboard.performanceMetricsService.getMetrics({ timeRange });
      res.json(performanceData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/monitoring/errors', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || '24h';
      const severity = req.query.severity;
      const errorData = await dashboard.errorTrackingService.getErrors({ timeRange, severity });
      res.json(errorData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/monitoring/alerts', async (req, res) => {
    try {
      const alertData = await dashboard.alertingSystem.getActiveAlerts();
      res.json(alertData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/monitoring/alerts/:alertId/acknowledge', async (req, res) => {
    try {
      const { alertId } = req.params;
      const result = await dashboard.alertingSystem.acknowledgeAlert(alertId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket endpoint for real-time updates
  router.get('/ws', (req, res) => {
    res.status(400).json({ error: 'WebSocket endpoint - use WS protocol' });
  });

  // Store dashboard instance for WebSocket broadcasting
  router.dashboard = dashboard;

  return router;
}

module.exports = createDashboardRoutes;