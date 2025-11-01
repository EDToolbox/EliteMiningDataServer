const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./services/logger');
const MongoService = require('./services/mongoService');
const EDDNClient = require('./clients/eddnClient');
const InaraClient = require('../clients/inaraClient');
const EDSMClient = require('../clients/edsmClient');

const miningRoutes = require('../routes/mining');
const systemRoutes = require('../routes/systems');
const commodityRoutes = require('../routes/commodities');
const statusRoutes = require('../routes/status');

class Server {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.database = null;
    this.eddnClient = null;
    this.inaraClient = null;
    this.edsmClient = null;
    
    this.wsClients = new Set();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    // Security and compression
    this.app.use(helmet());
    this.app.use(compression());
    
    // CORS
    this.app.use(cors({
      origin: this.config.allowedOrigins || '*',
      credentials: true
    }));
    
    // Request logging
    this.app.use(morgan('combined', {
      stream: { write: message => logger.info(message.trim()) }
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Rate limiting would be added here in production
    // this.app.use(rateLimit({ ... }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/mining', miningRoutes);
    this.app.use('/api/systems', systemRoutes);
    this.app.use('/api/commodities', commodityRoutes);
    this.app.use('/api/status', statusRoutes);
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
    
    // Error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      logger.info(`WebSocket client connected from ${req.socket.remoteAddress}`);
      this.wsClients.add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Elite Mining Data Server',
        timestamp: new Date().toISOString()
      }));
      
      // Setup heartbeat
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          logger.warn('Invalid WebSocket message:', error.message);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.wsClients.delete(ws);
      });
      
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.wsClients.delete(ws);
      });
    });
    
    // Heartbeat interval
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          logger.info('Terminating inactive WebSocket client');
          ws.terminate();
          this.wsClients.delete(ws);
          return;
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.wsHeartbeatInterval || 30000);
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        ws.subscriptions = ws.subscriptions || new Set();
        if (data.channel) {
          ws.subscriptions.add(data.channel);
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel,
            timestamp: new Date().toISOString()
          }));
        }
        break;
        
      case 'unsubscribe':
        if (ws.subscriptions && data.channel) {
          ws.subscriptions.delete(data.channel);
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            channel: data.channel,
            timestamp: new Date().toISOString()
          }));
        }
        break;
        
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
        
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  broadcastToWebSocketClients(data, channel = null) {
    const message = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    this.wsClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        // If channel specified, only send to subscribed clients
        if (channel && ws.subscriptions && !ws.subscriptions.has(channel)) {
          return;
        }
        
        try {
          ws.send(message);
        } catch (error) {
          logger.error('Failed to send WebSocket message:', error);
          this.wsClients.delete(ws);
        }
      } else {
        this.wsClients.delete(ws);
      }
    });
  }

  async initialize() {
    try {
      // Initialize database
      this.database = new MongoService(this.config.database);
      await this.database.initialize();
      
      // Make database available to routes
      this.app.locals.database = this.database;
      
      // Initialize API clients
      if (this.config.inara?.apiKey) {
        this.inaraClient = new InaraClient(this.config.inara);
        this.app.locals.inaraClient = this.inaraClient;
      }
      
      if (this.config.edsm) {
        this.edsmClient = new EDSMClient(this.config.edsm);
        this.app.locals.edsmClient = this.edsmClient;
      }
      
      // Initialize EDDN client
      this.eddnClient = new EDDNClient(this.config.eddn);
      this.setupEDDNEventHandlers();
      
      // Start EDDN connection
      this.eddnClient.connect().catch(error => {
        logger.error('Failed to connect to EDDN:', error);
      });
      
      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Server initialization failed:', error);
      throw error;
    }
  }

  setupEDDNEventHandlers() {
    this.eddnClient.on('miningData', (data) => {
      this.processMiningData(data);
      this.broadcastToWebSocketClients({
        type: 'miningData',
        data: data
      }, 'mining');
    });
    
    this.eddnClient.on('data', (data) => {
      this.broadcastToWebSocketClients({
        type: 'eddnData',
        data: data
      }, 'eddn');
    });
  }

  async processMiningData(data) {
    try {
      const schema = data.$schemaRef;
      const message = data.message;
      
      if (schema.includes('commodity')) {
        await this.processCommodityData(message);
      } else if (schema.includes('journal')) {
        await this.processJournalData(message);
      }
    } catch (error) {
      logger.error('Error processing mining data:', error);
    }
  }

  async processCommodityData(message) {
    // Process commodity market data from EDDN
    if (message.commodities) {
      for (const commodity of message.commodities) {
        await this.database.insertCommodityPrice({
          commodityName: commodity.name,
          commodityId: commodity.id,
          stationName: message.stationName,
          systemName: message.systemName,
          buyPrice: commodity.buyPrice,
          sellPrice: commodity.sellPrice,
          supply: commodity.stock,
          demand: commodity.demand,
          source: 'eddn'
        });
      }
    }
  }

  async processJournalData(message) {
    const event = message.event;
    
    if (event === 'MiningRefined') {
      await this.database.insertMiningReport({
        commanderName: null, // EDDN anonymizes this
        systemName: message.StarSystem,
        bodyName: message.Body,
        materialRefined: message.Type,
        amount: 1,
        source: 'eddn'
      });
    }
  }

  async start() {
    const port = this.config.port || 3000;
    
    return new Promise((resolve, reject) => {
      this.server.listen(port, (err) => {
        if (err) {
          reject(err);
        } else {
          logger.info(`Server started on port ${port}`);
          logger.info(`WebSocket server ready for connections`);
          resolve();
        }
      });
    });
  }

  async stop() {
    logger.info('Shutting down server...');
    
    // Close WebSocket connections
    this.wss.clients.forEach((ws) => {
      ws.close();
    });
    
    // Disconnect EDDN
    if (this.eddnClient) {
      this.eddnClient.disconnect();
    }
    
    // Close database
    if (this.database) {
      await this.database.close();
    }
    
    // Close HTTP server
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('Server stopped');
        resolve();
      });
    });
  }
}

module.exports = Server;