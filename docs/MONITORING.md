# 📊 Monitoring System Documentation

## Overview

The Elite Dangerous Mining Data Server includes a comprehensive monitoring system that provides real-time health checks, performance metrics, error tracking, and alerting capabilities. This system ensures high availability and optimal performance of the API server.

## 🏗️ Architecture

### Core Components

1. **Health Check Service** (`src/services/healthCheckService.js`)
   - System health monitoring
   - Component status checks
   - Performance indicators

2. **Performance Metrics Service** (`src/services/performanceMetricsService.js`)
   - Request/response monitoring
   - System resource tracking
   - Performance analytics

3. **Error Tracking Service** (`src/services/errorTrackingService.js`)
   - Error logging and categorization
   - Error pattern analysis
   - Error trend monitoring

4. **Alerting System** (`src/services/alertingSystem.js`)
   - Multi-channel notifications
   - Alert rule management
   - Alert escalation

5. **Monitoring Middleware** (`src/middleware/monitoringMiddleware.js`)
   - Automatic request tracking
   - Error interception
   - Security monitoring

6. **Monitoring Routes** (`src/routes/monitoring.js`)
   - REST API endpoints
   - Dashboard data
   - Management interfaces

## 🚀 Quick Start

### 1. Setup

Run the automated setup script:

```bash
node scripts/setup-monitoring.js
```

This will:
- Create necessary directories
- Install dependencies
- Generate configuration files
- Set up database indexes
- Create utility scripts

### 2. Configuration

Copy the example environment file:

```bash
cp .env.monitoring.example .env.monitoring
```

Edit `.env.monitoring` with your settings:

```bash
# Basic monitoring settings
MONITORING_ENABLED=true
HEALTH_CHECKS_ENABLED=true
PERFORMANCE_METRICS_ENABLED=true
ERROR_TRACKING_ENABLED=true
ALERTING_ENABLED=true

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL_TO=admin@example.com

# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#alerts
```

### 3. Integration

Add monitoring to your Express app:

```javascript
const express = require('express');
const MonitoringMiddleware = require('./src/middleware/monitoringMiddleware');
const monitoringRoutes = require('./src/routes/monitoring');

const app = express();
const monitoring = new MonitoringMiddleware();

// Initialize monitoring
await monitoring.initialize();

// Add monitoring middleware
app.use(monitoring.getAllMiddleware());

// Add monitoring routes
app.use('/monitoring', monitoringRoutes);

// Add error handling middleware (must be last)
app.use(monitoring.getErrorMiddleware());
```

### 4. Testing

Test the monitoring system:

```bash
npm run test:monitoring
```

## 📊 Monitoring Endpoints

### Health Check

```bash
GET /monitoring/health
```

Returns comprehensive system health status:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-02T12:00:00.000Z",
    "uptime": {
      "milliseconds": 3600000,
      "human": "1h 0m 0s"
    },
    "checks": {
      "database": {
        "status": "healthy",
        "message": "MongoDB connected (45ms)",
        "responseTime": 45
      },
      "redis": {
        "status": "healthy",
        "message": "Redis connected (12ms)",
        "responseTime": 12
      },
      "memory": {
        "status": "healthy",
        "message": "Memory usage normal (65.2% heap)",
        "details": {
          "heap": {
            "used": "128.5 MB",
            "total": "196.8 MB",
            "usagePercent": 65.2
          }
        }
      }
    },
    "summary": {
      "total": 8,
      "healthy": 7,
      "degraded": 1,
      "unhealthy": 0
    }
  }
}
```

### Performance Metrics

```bash
GET /monitoring/metrics?timeRange=1h
```

Returns performance metrics and statistics:

```json
{
  "success": true,
  "data": {
    "timeRange": "1h",
    "summary": {
      "totalRequests": 1250,
      "errorRate": 2.4,
      "averageResponseTime": 185,
      "requestsPerSecond": 0.35
    },
    "endpoints": [
      {
        "endpoint": "GET /api/stats",
        "totalRequests": 245,
        "averageResponseTime": 120,
        "errorRate": 1.2,
        "percentiles": {
          "p50": 95,
          "p95": 280,
          "p99": 450
        }
      }
    ],
    "system": {
      "current": {
        "memoryUsedPercent": 68.5,
        "cpuLoadAverage": [0.8, 0.9, 1.1],
        "eventLoopLag": 12.5
      }
    }
  }
}
```

### Error Statistics

```bash
GET /monitoring/errors?timeRange=24h
```

Returns error tracking statistics:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalErrors": 15,
      "uniqueErrors": 8,
      "errorRate": 0.35,
      "criticalErrors": 2
    },
    "breakdown": {
      "bySeverity": {
        "critical": 2,
        "high": 3,
        "medium": 6,
        "low": 4
      },
      "byType": {
        "DATABASE_ERROR": 5,
        "API_ERROR": 4,
        "VALIDATION_ERROR": 6
      }
    },
    "topErrors": [
      {
        "id": "error_abc123",
        "message": "Connection timeout to MongoDB",
        "type": "DATABASE_ERROR",
        "severity": "high",
        "count": 8
      }
    ]
  }
}
```

### Active Alerts

```bash
GET /monitoring/alerts
```

Returns current alerts and statistics:

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert_xyz789",
        "title": "High Error Rate",
        "message": "Error rate is 6.2 errors/minute (threshold: 5)",
        "severity": "warning",
        "status": "active",
        "timestamp": "2025-11-02T11:45:00.000Z"
      }
    ],
    "statistics": {
      "total": 25,
      "active": 3,
      "resolved": 22,
      "bySeverity": {
        "critical": 1,
        "warning": 2
      }
    }
  }
}
```

### Monitoring Dashboard

```bash
GET /monitoring/dashboard
```

Returns comprehensive dashboard data:

```json
{
  "success": true,
  "data": {
    "overview": {
      "systemHealth": "healthy",
      "activeAlerts": 2,
      "errorRate": 1.8,
      "averageResponseTime": 165,
      "uptime": "2d 14h 30m"
    },
    "health": { "..." },
    "performance": { "..." },
    "errors": { "..." },
    "alerts": { "..." }
  }
}
```

## 🔧 Configuration

### Environment Variables

The monitoring system uses environment variables for configuration. Key settings include:

#### General Settings
```bash
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=60000           # 1 minute
PERFORMANCE_COLLECTION_INTERVAL=30000 # 30 seconds
ERROR_RETENTION_DAYS=7
ALERT_RETENTION_DAYS=30
```

#### Performance Thresholds
```bash
RESPONSE_TIME_THRESHOLD=1000          # milliseconds
ERROR_RATE_THRESHOLD=5                # errors per minute
MEMORY_USAGE_THRESHOLD=85             # percentage
CPU_USAGE_THRESHOLD=80                # percentage
```

#### Notification Channels
```bash
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=your-password
ALERT_EMAIL_TO=admin@example.com

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#alerts

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Generic Webhook
WEBHOOK_URL=https://your-webhook.com/alerts
```

### Alert Rules

Alert rules are defined in the AlertingSystem and can be customized:

```javascript
{
  id: 'high_error_rate',
  name: 'High Error Rate',
  condition: (metrics) => metrics.errorRate > 5,
  severity: 'warning',
  channels: ['email', 'slack'],
  cooldown: 600000 // 10 minutes
}
```

## 🔔 Notification Channels

### Email Notifications

Configure SMTP settings to receive email alerts:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Email templates are stored in `templates/emails/` and can be customized.

### Slack Integration

Set up a Slack webhook to receive alerts in your Slack workspace:

1. Create a Slack app and webhook
2. Configure the webhook URL:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
   SLACK_CHANNEL=#alerts
   ```

### Discord Integration

Similar to Slack, configure a Discord webhook:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

### Custom Webhooks

For integration with other systems, configure a generic webhook:

```bash
WEBHOOK_URL=https://your-system.com/alerts
WEBHOOK_AUTH=Bearer your-token
```

### SMS Notifications (Twilio)

For critical alerts, configure SMS notifications:

```bash
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM=+1234567890
TWILIO_TO=+1234567890
```

## 📈 Performance Monitoring

### Metrics Collected

- **Request Metrics**: Response times, status codes, throughput
- **System Metrics**: Memory usage, CPU load, disk space
- **Database Metrics**: Connection status, query performance
- **Cache Metrics**: Hit rates, memory usage
- **Error Metrics**: Error rates, types, patterns

### Performance Thresholds

Default thresholds can be adjusted:

```bash
RESPONSE_TIME_THRESHOLD=1000    # Alert if avg response > 1s
ERROR_RATE_THRESHOLD=5          # Alert if > 5 errors/minute
MEMORY_USAGE_THRESHOLD=85       # Alert if memory > 85%
CPU_USAGE_THRESHOLD=80          # Alert if CPU > 80%
```

### Metrics Export

Metrics can be exported in multiple formats:

- **JSON**: Default API response format
- **Prometheus**: For Prometheus/Grafana integration
- **CSV**: For data analysis

```bash
# Prometheus format
curl http://localhost:3000/monitoring/metrics?format=prometheus

# CSV export
curl http://localhost:3000/monitoring/metrics?format=csv
```

## 🚨 Error Tracking

### Error Categories

Errors are automatically categorized:

- **DATABASE_ERROR**: Database connection/query issues
- **API_ERROR**: External API failures
- **VALIDATION_ERROR**: Input validation failures
- **AUTHENTICATION_ERROR**: Auth/permission issues
- **TIMEOUT_ERROR**: Request timeouts
- **NETWORK_ERROR**: Network connectivity issues

### Error Severity Levels

- **Critical**: System-breaking errors requiring immediate attention
- **High**: Significant errors affecting functionality
- **Medium**: Important errors that should be addressed
- **Low**: Minor errors or warnings

### Error Analysis

The system provides:

- **Error Patterns**: Identify recurring error patterns
- **Error Trends**: Track error frequency over time
- **Error Grouping**: Group similar errors together
- **Error Context**: Capture request context for debugging

## 🔍 Health Checks

### Health Check Components

- **Database**: MongoDB connection and performance
- **Cache**: Redis connection and memory usage
- **External APIs**: EDSM, Inara API availability
- **File System**: Disk space and accessibility
- **Memory**: Heap and system memory usage
- **CPU**: Load average and utilization
- **Network**: External service connectivity

### Health Status Levels

- **Healthy**: All systems operating normally
- **Degraded**: Some non-critical issues detected
- **Unhealthy**: Critical issues requiring attention

### Health Check Scheduling

Health checks run automatically at configurable intervals:

```bash
HEALTH_CHECK_INTERVAL=60000  # Every minute
```

## 🔐 Security Monitoring

### Security Features

- **Suspicious Pattern Detection**: SQL injection, XSS attempts
- **Failed Authentication Tracking**: Monitor auth failures
- **Rate Limit Monitoring**: Track rate limit violations
- **IP Monitoring**: Detect suspicious IP patterns

### Security Alerts

Security incidents trigger immediate alerts:

- **SECURITY_ALERT**: Suspicious request patterns
- **AUTH_FAILURE**: Failed authentication attempts
- **RATE_LIMIT_VIOLATION**: Excessive request rates

## 🛠️ Management Commands

### Testing

```bash
# Test entire monitoring system
npm run test:monitoring

# Test specific notification channel
curl -X POST http://localhost:3000/monitoring/alerts/test/slack
```

### Maintenance

```bash
# Backup monitoring data
npm run backup:monitoring

# View current health status
npm run monitor:health

# View performance metrics
npm run monitor:metrics

# View active alerts
npm run monitor:alerts
```

### Database Maintenance

```bash
# Setup monitoring database indexes
node scripts/setup-monitoring-indexes.js

# Clear old error data (older than 7 days)
curl -X DELETE http://localhost:3000/monitoring/errors/cleanup

# Clear old alerts (older than 30 days)
curl -X DELETE http://localhost:3000/monitoring/alerts/cleanup
```

## 🔄 Integration with External Tools

### Prometheus/Grafana

Export metrics for Prometheus:

```bash
# Enable Prometheus metrics
PROMETHEUS_METRICS_ENABLED=true
PROMETHEUS_METRICS_PATH=/metrics

# Scrape endpoint
curl http://localhost:3000/metrics
```

### New Relic

Configure New Relic integration:

```bash
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=EliteMining-DataServer
```

### Datadog

Configure Datadog integration:

```bash
DATADOG_API_KEY=your-api-key
DATADOG_APP_KEY=your-app-key
```

## 🐛 Troubleshooting

### Common Issues

#### Monitoring Not Starting

Check configuration:
```bash
# Verify environment variables
node -e "console.log(process.env.MONITORING_ENABLED)"

# Check log files
tail -f logs/monitoring.log
```

#### Email Notifications Not Working

Verify SMTP configuration:
```bash
# Test email settings
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

#### High Memory Usage

Monitor memory patterns:
```bash
# Check memory metrics
curl http://localhost:3000/monitoring/metrics | jq '.data.system.current'

# Review error logs
grep -i "memory" logs/errors/*.log
```

#### Database Connection Issues

Check database health:
```bash
# Database health check
curl http://localhost:3000/monitoring/health | jq '.data.checks.database'

# Connection test
mongosh $MONGODB_URI --eval "db.runCommand('ping')"
```

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
MONITORING_DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### Log Analysis

Check monitoring logs:

```bash
# View recent monitoring logs
tail -f logs/monitoring.log

# Search for specific errors
grep -r "ERROR" logs/

# Monitor real-time requests
tail -f logs/requests.log
```

## 📚 API Reference

### Authentication

All monitoring endpoints require proper authentication in production:

```bash
# Using API key
curl -H "X-API-Key: your-api-key" http://localhost:3000/monitoring/health

# Using basic auth
curl -u username:password http://localhost:3000/monitoring/health
```

### Rate Limiting

Monitoring endpoints have specific rate limits:

- Health checks: 60 requests per minute
- Metrics: 30 requests per minute
- Alerts: 20 requests per minute

### Response Formats

All endpoints support multiple response formats:

```bash
# JSON (default)
curl http://localhost:3000/monitoring/metrics

# CSV export
curl http://localhost:3000/monitoring/metrics?format=csv

# Prometheus format
curl http://localhost:3000/monitoring/metrics?format=prometheus
```

### Error Codes

Common HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## 📖 Best Practices

### Configuration Management

1. **Environment Variables**: Use environment variables for all configuration
2. **Secrets Management**: Never commit sensitive data to version control
3. **Configuration Validation**: Validate configuration on startup
4. **Documentation**: Document all configuration options

### Alert Management

1. **Alert Fatigue**: Avoid too many low-priority alerts
2. **Escalation**: Set up proper alert escalation procedures
3. **Acknowledgment**: Always acknowledge and resolve alerts
4. **Testing**: Regularly test notification channels

### Performance Optimization

1. **Efficient Queries**: Optimize database queries for metrics
2. **Caching**: Use appropriate caching strategies
3. **Sampling**: Sample high-volume metrics when necessary
4. **Retention**: Set appropriate data retention policies

### Security

1. **Access Control**: Restrict access to monitoring endpoints
2. **Data Sanitization**: Sanitize sensitive data in logs
3. **Audit Logging**: Log all administrative actions
4. **Regular Updates**: Keep monitoring dependencies updated

## 🚀 Future Enhancements

### Planned Features

1. **Machine Learning**: Anomaly detection using ML algorithms
2. **Custom Dashboards**: User-configurable monitoring dashboards
3. **Mobile Alerts**: Push notifications for mobile devices
4. **Advanced Analytics**: Deeper insights into system behavior
5. **Multi-Instance**: Support for monitoring multiple server instances

### Integration Roadmap

1. **Kubernetes**: Helm charts for Kubernetes deployment
2. **Docker**: Enhanced Docker support with health checks
3. **Cloud Services**: Native cloud monitoring integrations
4. **Third-party Tools**: Additional monitoring tool integrations

---

For more information, see:
- [Setup Guide](monitoring-setup.md)
- [Configuration Reference](monitoring-configuration.md)
- [API Documentation](../api-specification.yaml)
- [Troubleshooting Guide](monitoring-troubleshooting.md)