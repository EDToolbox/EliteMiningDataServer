# Elite Dangerous Mining Data Server - Comprehensive User Guide

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Statistics Endpoints](#statistics-endpoints)
5. [Market Data Endpoints](#market-data-endpoints)
6. [Advanced Usage](#advanced-usage)
7. [Performance Optimization](#performance-optimization)
8. [WebSocket Integration](#websocket-integration)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## 🚀 Introduction

The Elite Dangerous Mining Data Server v2.0 is a comprehensive API server that provides real-time and historical data for Elite Dangerous mining operations, market analysis, and trading route optimization. It integrates multiple data sources including EDDN, Inara, and EDSM to provide the most complete picture of the galaxy's economic landscape.

### Key Features

- **📊 Real-time Statistics**: Comprehensive server and data statistics
- **💹 Market Data Analysis**: Complete commodity pricing and trading routes
- **⛏️ Mining Analytics**: Detailed mining location and profitability data
- **🔌 WebSocket Support**: Real-time updates for dynamic applications
- **🚀 High Performance**: Optimized caching and database indexing
- **📱 RESTful API**: Clean, well-documented REST endpoints
- **🔒 Rate Limiting**: Built-in protection against abuse
- **📈 Analytics**: Advanced trend analysis and predictions

### Data Sources

- **EDDN (Elite Dangerous Data Network)**: Real-time game data via ZeroMQ
- **Inara API**: Community-driven market and station data
- **EDSM API**: System coordinates and exploration data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB 4.4+ running
- Redis (optional, for enhanced caching)
- Internet connection for external API access

### Installation

```bash
# Clone the repository
git clone https://github.com/gOOvER/EliteMiningDataServer.git
cd EliteMiningDataServer

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

### Basic Configuration

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/elitemining
MONGODB_DATABASE=elitemining

# External API Keys (optional but recommended)
INARA_API_KEY=your_inara_api_key
EDSM_API_KEY=your_edsm_api_key

# Caching Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
```

### First API Call

```bash
# Check server health
curl http://localhost:3000/health

# Get global statistics
curl http://localhost:3000/api/stats

# Get commodity data
curl "http://localhost:3000/api/market/commodity/Painite?limit=10"
```

## 📊 API Reference

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Authentication

Currently, the API is open access with rate limiting. Optional API key authentication is available for enhanced rate limits.

```bash
# Optional API key in header
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/stats
```

### Rate Limits

- **Standard endpoints**: 100 requests per 15 minutes per IP
- **Statistics endpoints**: 50 requests per 15 minutes per IP
- **WebSocket connections**: 10 concurrent connections per IP

### Response Format

All endpoints return JSON by default. Some endpoints support CSV export:

```bash
# JSON response (default)
curl "http://localhost:3000/api/stats"

# CSV export
curl "http://localhost:3000/api/stats?format=csv"
```

### Standard Response Structure

```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  },
  "metadata": {
    "source": "cache|database|api",
    "processingTime": 150,
    "timestamp": "2025-11-02T12:00:00.000Z",
    "cacheStatus": "hit|miss|disabled",
    "dataFreshness": "fresh|moderate|stale"
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-11-02T12:00:00.000Z",
  "requestId": "unique-request-id"
}
```

## 📊 Statistics Endpoints

### Global Statistics - `/api/stats`

Returns comprehensive server statistics including systems, stations, commodities, mining data, EDDN performance, API usage, and WebSocket metrics.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeHistory` | boolean | false | Include historical trend data |
| `timeRange` | string | "24h" | Time range: 1h, 6h, 24h, 7d, 30d |
| `format` | string | "json" | Response format: json, csv |

#### Example Request

```bash
curl "http://localhost:3000/api/stats?includeHistory=true&timeRange=7d"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "systems": {
      "total": 50000,
      "withStations": 30000,
      "withMiningData": 15000,
      "averagePopulation": 125000000
    },
    "stations": {
      "total": 75000,
      "withMarketData": 60000,
      "withShipyard": 25000,
      "withOutfitting": 35000
    },
    "commodities": {
      "total": 150,
      "tracked": 120,
      "withPriceData": 100
    },
    "mining": {
      "locations": 5000,
      "hotspots": 2000,
      "uniqueMaterials": 45
    },
    "eddn": {
      "messagesProcessed": 1000000,
      "uptime": 98.5,
      "connectionStatus": "connected"
    },
    "api": {
      "totalRequests": 250000,
      "averageResponseTime": 150,
      "errorRate": 0.5
    },
    "websocket": {
      "activeConnections": 50,
      "totalConnections": 10000,
      "messagesDelivered": 500000
    }
  },
  "metadata": {
    "source": "cache",
    "processingTime": 45,
    "timestamp": "2025-11-02T12:00:00.000Z"
  }
}
```

### EDDN Statistics - `/api/stats/eddn`

Returns detailed EDDN connection and message processing statistics.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeMessageBreakdown` | boolean | true | Include message type breakdown |
| `timeRange` | string | "24h" | Time range: 1h, 6h, 24h, 7d |

#### Example Request

```bash
curl "http://localhost:3000/api/stats/eddn?timeRange=24h"
```

### Mining Statistics - `/api/stats/mining`

Returns comprehensive mining data statistics and analytics.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `commodity` | string | null | Filter by specific commodity |
| `system` | string | null | Filter by system name |
| `includeEfficiency` | boolean | true | Include efficiency analysis |

#### Example Request

```bash
curl "http://localhost:3000/api/stats/mining?commodity=Painite&includeEfficiency=true"
```

### API Usage Statistics - `/api/stats/api-usage`

Returns API usage statistics and performance metrics.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `endpoint` | string | null | Filter by specific endpoint |
| `timeRange` | string | "24h" | Time range for usage data |
| `includePerformance` | boolean | true | Include performance metrics |

### WebSocket Statistics - `/api/stats/websocket`

Returns WebSocket connection statistics and real-time metrics.

#### Example Request

```bash
curl "http://localhost:3000/api/stats/websocket"
```

## 💹 Market Data Endpoints

### Commodity Data - `/api/market/commodity/{commodityId}`

Returns comprehensive market data for a specific commodity.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `commodityId` | string | required | Commodity name (e.g., "Painite") |
| `systemName` | string | null | Filter by system |
| `stationName` | string | null | Filter by station |
| `maxAge` | integer | 24 | Max data age in hours (1-168) |
| `includeHistory` | boolean | false | Include price history |
| `includeTrends` | boolean | false | Include trend analysis |
| `includeInaraData` | boolean | false | Include Inara API data |
| `maxDistance` | integer | 50 | Max distance in LY (1-1000) |
| `sortBy` | string | "profit" | Sort by: profit, price, distance, supply, demand |
| `limit` | integer | 50 | Max results (1-1000) |
| `format` | string | "json" | Response format: json, csv |

#### Example Request

```bash
curl "http://localhost:3000/api/market/commodity/Painite?includeHistory=true&limit=20&sortBy=profit"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "commodity": {
      "id": "Painite",
      "name": "Painite",
      "category": "Minerals",
      "rarity": "rare"
    },
    "filter": {
      "systemName": null,
      "stationName": null,
      "maxAge": 24,
      "maxDistance": 50
    },
    "sources": {
      "eddn": {
        "enabled": true,
        "locations": [
          {
            "systemName": "HIP 21991",
            "stationName": "Atwood Terminal",
            "buyPrice": 0,
            "sellPrice": 680000,
            "supply": 0,
            "demand": 1250,
            "lastUpdated": "2025-11-02T11:30:00.000Z",
            "dataAge": 0.5,
            "distance": 15.2,
            "stationServices": ["Market", "Shipyard", "Outfitting"]
          }
        ],
        "statistics": {
          "averageSellPrice": 650000,
          "priceRange": {
            "min": 500000,
            "max": 750000
          },
          "totalLocations": 45
        }
      }
    },
    "analytics": {
      "priceAnalysis": {
        "currentTrend": "stable",
        "volatility": "low",
        "recommendation": "buy"
      },
      "profitOpportunities": [
        {
          "buyLocation": {
            "systemName": "Mining System",
            "stationName": "Mining Station",
            "buyPrice": 450000
          },
          "sellLocation": {
            "systemName": "HIP 21991",
            "stationName": "Atwood Terminal",
            "sellPrice": 680000
          },
          "profitPerTon": 230000,
          "totalProfit": 23000000,
          "distance": 25.8,
          "riskLevel": "low"
        }
      ]
    }
  },
  "metadata": {
    "totalLocations": 45,
    "dataFreshness": "fresh",
    "processingTime": 180,
    "cacheStatus": "miss",
    "timestamp": "2025-11-02T12:00:00.000Z"
  }
}
```

### Trading Routes - `/api/market/routes`

Calculates optimal trading routes based on ship specifications and preferences.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startSystem` | string | required | Starting system name |
| `jumpRange` | number | 20 | Ship jump range in LY (5-100) |
| `cargoCapacity` | integer | 100 | Cargo capacity in tons (1-1000) |
| `shipSize` | string | "medium" | Ship size: small, medium, large |
| `credits` | integer | 1000000 | Available credits |
| `maxHops` | integer | 3 | Maximum route hops (1-10) |
| `minProfitPerTon` | integer | 500 | Minimum profit per ton |
| `maxRouteTime` | integer | 60 | Max route time in minutes |
| `securityLevel` | string | "any" | Security: high, medium, low, any |
| `stationType` | string | "any" | Station type: planetary, orbital, any |
| `includeRisk` | boolean | true | Include risk assessment |
| `includeVisualization` | boolean | true | Include route visualization |
| `sortBy` | string | "totalProfit" | Sort by: totalProfit, profitPerTon, profitPerHour |
| `limit` | integer | 50 | Max routes (1-100) |

#### Example Request

```bash
curl "http://localhost:3000/api/market/routes?startSystem=Sol&jumpRange=25&cargoCapacity=200&credits=5000000"
```

### Market Trends - `/api/market/trends`

Provides comprehensive market trend analysis and predictions.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `commodity` | string | null | Commodity name or ID |
| `system` | string | null | System name filter |
| `region` | string | null | Region filter |
| `timeRange` | string | "30d" | Analysis time range: 1d, 7d, 30d, 90d, 1y |
| `interval` | string | "daily" | Data interval: hourly, daily, weekly, monthly |
| `includeMovingAverages` | boolean | true | Include moving averages |
| `includeSeasonalAnalysis` | boolean | true | Include seasonal patterns |
| `includeVolatilityAnalysis` | boolean | true | Include volatility indicators |
| `includeRegionalComparison` | boolean | true | Include regional comparisons |
| `includePredictions` | boolean | true | Include predictive analysis |
| `includeVisualization` | boolean | true | Include chart data |
| `limit` | integer | 1000 | Max data points (10-10000) |

#### Example Request

```bash
curl "http://localhost:3000/api/market/trends?commodity=Gold&timeRange=30d&interval=daily"
```

### Station Market Data - `/api/market/station/{system}/{station}`

Returns complete market data for a specific station.

#### Example Request

```bash
curl "http://localhost:3000/api/market/station/Sol/Abraham%20Lincoln?includeProfitOpportunities=true"
```

## 🔧 Advanced Usage

### Caching Strategy

The server implements intelligent multi-tier caching:

1. **In-Memory Cache**: Fast access for frequently requested data
2. **Redis Cache**: Persistent cache across server restarts
3. **Database Cache**: Optimized queries with smart indexing

#### Cache Headers

Monitor cache performance using response headers:

```json
{
  "metadata": {
    "source": "cache",
    "cacheStatus": "hit",
    "processingTime": 15
  }
}
```

### Data Freshness

Data freshness is indicated in responses:

- **fresh**: Data updated within last hour
- **moderate**: Data updated within last 6 hours  
- **stale**: Data older than 6 hours

### Batch Requests

For multiple commodities, use multiple requests with client-side batching:

```bash
# Good: Parallel requests for multiple commodities
curl "http://localhost:3000/api/market/commodity/Painite" &
curl "http://localhost:3000/api/market/commodity/Gold" &
curl "http://localhost:3000/api/market/commodity/Tritium" &
wait
```

### CSV Export

Many endpoints support CSV export for data analysis:

```bash
# Export commodity data as CSV
curl "http://localhost:3000/api/market/commodity/Painite?format=csv" > painite_data.csv

# Export statistics as CSV  
curl "http://localhost:3000/api/stats?format=csv" > server_stats.csv
```

## 🚀 Performance Optimization

### Request Optimization

1. **Use appropriate limits**: Don't request more data than needed
2. **Leverage caching**: Identical requests are cached for 5-30 minutes
3. **Filter data**: Use query parameters to reduce response size
4. **Batch requests**: Use parallel requests for multiple resources

### Example: Optimized Commodity Search

```bash
# Instead of requesting all data
curl "http://localhost:3000/api/market/commodity/Painite"

# Request only what you need
curl "http://localhost:3000/api/market/commodity/Painite?maxAge=12&limit=10&sortBy=profit"
```

### Monitoring Performance

Track API performance using metadata:

```json
{
  "metadata": {
    "processingTime": 150,
    "source": "database",
    "cacheStatus": "miss"
  }
}
```

- **processingTime < 100ms**: Excellent performance
- **processingTime 100-500ms**: Good performance  
- **processingTime > 500ms**: Consider optimization

## 🔌 WebSocket Integration

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = function() {
    console.log('Connected to Elite Mining Data Server');
    
    // Subscribe to mining data updates
    ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'mining'
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received update:', data);
};
```

### Available Channels

- **mining**: Mining data updates
- **eddn**: EDDN message stream
- **market**: Market data updates
- **stats**: Statistics updates

### Message Types

#### Subscription Management

```javascript
// Subscribe to channel
ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'mining'
}));

// Unsubscribe from channel
ws.send(JSON.stringify({
    type: 'unsubscribe', 
    channel: 'mining'
}));

// Ping/pong for connection monitoring
ws.send(JSON.stringify({
    type: 'ping'
}));
```

#### Data Updates

```javascript
// Mining data update
{
    "type": "miningData",
    "data": {
        "systemName": "Borann",
        "bodyName": "Borann A 2",
        "materialRefined": "Low Temperature Diamonds",
        "timestamp": "2025-11-02T12:00:00.000Z"
    },
    "timestamp": "2025-11-02T12:00:00.000Z"
}

// Market data update
{
    "type": "marketData",
    "data": {
        "commodityName": "Painite",
        "systemName": "HIP 21991",
        "stationName": "Atwood Terminal",
        "sellPrice": 680000,
        "timestamp": "2025-11-02T12:00:00.000Z"
    },
    "timestamp": "2025-11-02T12:00:00.000Z"
}
```

## ⚠️ Error Handling

### Common HTTP Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: External service unavailable

### Error Response Format

```json
{
  "success": false,
  "error": "COMMODITY_NOT_FOUND",
  "message": "The specified commodity 'InvalidCommodity' was not found in the database",
  "details": {
    "commodity": "InvalidCommodity",
    "availableCommodities": ["Painite", "Gold", "Tritium"]
  },
  "timestamp": "2025-11-02T12:00:00.000Z",
  "requestId": "req_12345"
}
```

### Retry Logic

Implement exponential backoff for transient errors:

```javascript
async function apiRequestWithRetry(url, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            
            if (response.status === 429) {
                // Rate limited - wait before retry
                const waitTime = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            if (response.status >= 500) {
                // Server error - retry
                if (attempt === maxRetries - 1) throw new Error('Max retries reached');
                continue;
            }
            
            return await response.json();
            
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
        }
    }
}
```

## 💡 Best Practices

### 1. Rate Limiting Compliance

- Respect rate limits (100 requests per 15 minutes)
- Implement client-side rate limiting
- Use appropriate request intervals
- Consider API key for enhanced limits

### 2. Efficient Data Usage

```bash
# Good: Specific, filtered requests
curl "http://localhost:3000/api/market/commodity/Painite?maxAge=6&limit=5&sortBy=profit"

# Avoid: Requesting excessive data
curl "http://localhost:3000/api/market/commodity/Painite?limit=1000&includeHistory=true&includeTrends=true"
```

### 3. Cache-Friendly Requests

- Use consistent parameter ordering
- Avoid unnecessary parameters
- Leverage identical requests for caching

### 4. Error Handling

```javascript
async function handleApiResponse(response) {
    if (!response.ok) {
        const error = await response.json();
        
        switch (response.status) {
            case 429:
                console.log('Rate limited - waiting before retry');
                return null;
            case 404:
                console.log('Resource not found:', error.message);
                return null;
            case 500:
                console.log('Server error - try again later');
                return null;
            default:
                console.error('API Error:', error);
                return null;
        }
    }
    
    return await response.json();
}
```

### 5. WebSocket Best Practices

- Implement connection recovery
- Handle message buffering during disconnects
- Subscribe only to needed channels
- Implement proper error handling

```javascript
class EliteMiningWebSocket {
    constructor(url) {
        this.url = url;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.subscriptions = new Set();
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('Connected to Elite Mining Data Server');
            this.reconnectAttempts = 0;
            
            // Resubscribe to channels
            this.subscriptions.forEach(channel => {
                this.subscribe(channel);
            });
        };
        
        this.ws.onclose = () => {
            console.log('Connection closed');
            this.handleReconnect();
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }
    
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }
    
    subscribe(channel) {
        this.subscriptions.add(channel);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                channel: channel
            }));
        }
    }
    
    unsubscribe(channel) {
        this.subscriptions.delete(channel);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'unsubscribe',
                channel: channel
            }));
        }
    }
    
    handleMessage(data) {
        // Implement your message handling logic
        console.log('Received:', data);
    }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Rate Limiting

**Problem**: Receiving 429 Too Many Requests

**Solution**:
- Reduce request frequency
- Implement exponential backoff
- Consider API key for higher limits
- Cache responses locally

#### 2. Stale Data

**Problem**: Receiving old market data

**Solution**:
- Check `dataFreshness` in response metadata
- Reduce `maxAge` parameter for fresher data
- Consider data source limitations (EDDN updates)

#### 3. Missing Commodity Data

**Problem**: 404 errors for valid commodities

**Solution**:
- Check exact commodity name spelling
- Use proper URL encoding for spaces
- Verify commodity exists in current game version

#### 4. Slow Response Times

**Problem**: High response times (>1000ms)

**Solution**:
- Use smaller `limit` values
- Avoid unnecessary includes (history, trends)
- Check server status via `/health` endpoint
- Consider geographic distance to server

#### 5. WebSocket Connection Issues

**Problem**: WebSocket disconnections or failed connections

**Solution**:
- Implement connection recovery logic
- Check firewall/proxy settings
- Verify WebSocket protocol support
- Monitor connection with ping/pong

### Debugging Tips

#### 1. Check Server Health

```bash
curl http://localhost:3000/health
```

#### 2. Monitor Response Metadata

Look for performance indicators:

```json
{
  "metadata": {
    "processingTime": 250,
    "source": "database",
    "cacheStatus": "miss",
    "dataFreshness": "moderate"
  }
}
```

#### 3. Validate Request Parameters

Use proper parameter validation:

```bash
# Check parameter format
curl "http://localhost:3000/api/market/commodity/Painite?maxAge=invalid"
# Returns: 400 Bad Request with error details
```

#### 4. Enable Verbose Logging

Check server logs for detailed error information:

```bash
# Server logs show request details
2025-11-02 12:00:00 [info]: GET /api/market/commodity/Painite - 200 - 150ms - 192.168.1.100
2025-11-02 12:00:01 [error]: Database query failed: Connection timeout
```

### Getting Help

1. **GitHub Issues**: Report bugs and feature requests
2. **Documentation**: Comprehensive API documentation
3. **Community**: Elite Dangerous community forums
4. **Discord**: Real-time community support

### Performance Monitoring

Monitor your usage with built-in statistics:

```bash
# Check API usage statistics
curl "http://localhost:3000/api/stats/api-usage"

# Monitor server performance
curl "http://localhost:3000/api/stats"
```

## 📚 Additional Resources

- **API Specification**: Complete OpenAPI 3.0 specification in `/docs/api-specification.yaml`
- **Source Code**: Available on GitHub
- **Elite Dangerous**: Official game resources
- **EDDN**: Elite Dangerous Data Network documentation
- **Inara**: Community site and API documentation
- **EDSM**: Elite Dangerous Star Map

---

**Elite Dangerous Mining Data Server v2.0** - Powering the galaxy's mining and trading operations with comprehensive, real-time data analytics.