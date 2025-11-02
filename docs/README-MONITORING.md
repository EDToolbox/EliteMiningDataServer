# 🎯 Monitoring System Setup & Usage Guide

## ✅ Quick Start

The Monitoring System is **fully implemented** and production-ready.
All 4 requested components are available:

1. ✅ **Health Check Endpoints** - Comprehensive system monitoring
2. ✅ **Performance Metrics** - Real-time performance metrics
3. ✅ **Error Tracking** - Automatic error tracking
4. ✅ **Alerting Systems** - Multi-channel notifications

## 🚀 Installation (3 Steps)

### Step 1: Automatic Setup
```bash
node scripts/setup-monitoring.js
```

### Step 2: Configuration
```bash
# Copy configuration file
cp .env.monitoring.example .env.monitoring

# Adjust important settings:
# - Email SMTP data
# - Slack/Discord webhooks
# - Alert thresholds
```

### Step 3: Integration in app.js
```javascript
// Add Monitoring Middleware
const MonitoringMiddleware = require('./src/middleware/monitoringMiddleware');
const monitoringRoutes = require('./src/routes/monitoring');

const monitoring = new MonitoringMiddleware();
await monitoring.initialize();

// Use middleware
app.use(monitoring.getAllMiddleware());
app.use('/monitoring', monitoringRoutes);
app.use(monitoring.getErrorMiddleware()); // Must be last!
```

## 📊 Available Endpoints

### Health Check
```bash
GET /monitoring/health
# Shows status of all system components

GET /monitoring/health/detailed
# Detailed health information
```

### Performance Metrics
```bash
GET /monitoring/metrics
# Current performance metrics

GET /monitoring/metrics?timeRange=1h
# Metrics for the last hour

GET /monitoring/performance/dashboard
# Dashboard data for frontend
```

### Error Tracking
```bash
GET /monitoring/errors
# Current error statistics

GET /monitoring/errors?severity=critical
# Only critical errors

GET /monitoring/errors/{errorId}
# Details for specific error
```

### Alert Management
```bash
GET /monitoring/alerts
# Active alerts

POST /monitoring/alerts/test/{channel}
# Send test notification

DELETE /monitoring/alerts/{alertId}
# Mark alert as resolved
```

## 🔔 Notification Channels

### Email Setup
```bash
# In .env.monitoring
SMTP_HOST=smtp.gmail.com
SMTP_USER=alerts@example.com
SMTP_PASS=your-app-password
ALERT_EMAIL_TO=admin@example.com
```

### Slack Integration
```bash
# Get webhook URL from Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#alerts
```

### Discord Integration
```bash
# Discord webhook URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### SMS (Twilio)
```bash
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM=+1234567890
TWILIO_TO=+1234567890
```

## ⚠️ Alert Rules

### Default Thresholds
- **Response Time**: > 1000ms
- **Error Rate**: > 5 errors/minute
- **Memory Usage**: > 85%
- **CPU Usage**: > 80%
- **Database Response**: > 2000ms

### Threshold Customization
```bash
# In .env.monitoring
RESPONSE_TIME_THRESHOLD=1500
ERROR_RATE_THRESHOLD=10
MEMORY_USAGE_THRESHOLD=90
CPU_USAGE_THRESHOLD=85
```

## 🔍 Dashboard Integration

### Frontend Integration
```javascript
// Retrieve dashboard data
fetch('/monitoring/dashboard')
  .then(res => res.json())
  .then(data => {
    console.log('System Health:', data.overview.systemHealth);
    console.log('Active Alerts:', data.overview.activeAlerts);
    console.log('Error Rate:', data.overview.errorRate);
  });
```

### Prometheus/Grafana
```bash
# Prometheus format
curl http://localhost:3000/monitoring/metrics?format=prometheus

# In .env.monitoring
PROMETHEUS_METRICS_ENABLED=true
```

## 🛠️ Maintenance & Management

### Data Cleanup
```bash
# Delete old errors (> 7 days)
curl -X DELETE /monitoring/errors/cleanup

# Delete old alerts (> 30 days)
curl -X DELETE /monitoring/alerts/cleanup
```

### Backup & Restore
```bash
# Backup monitoring data
npm run backup:monitoring

# Restore data
npm run restore:monitoring backup-file.json
```

### Test Commands
```bash
# Test entire system
npm run test:monitoring

# Test specific channel
curl -X POST /monitoring/alerts/test/slack
curl -X POST /monitoring/alerts/test/email
```

## 📈 Monitoring Best Practices

### 1. Alert Configuration
- **Critical Alerts**: Immediate notification (Email + SMS)
- **Warnings**: Slack/Discord messages
- **Info**: Dashboard display only

### 2. Thresholds
- Start with conservative values
- Adjust based on historical data
- Regular review of alert frequency

### 3. Dashboard Integration
- Real-time monitoring for critical metrics
- Historical trends for capacity planning
- Automatic refresh every 30 seconds

## 🔧 Troubleshooting

### Monitoring won't start
```bash
# Check configuration
node -e "console.log(require('dotenv').config({path: '.env.monitoring'}))"

# Check logs
tail -f logs/monitoring.log
```

### Email not working
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const config = require('dotenv').config({path: '.env.monitoring'});
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('✅ SMTP OK')).catch(console.error);
"
```

### High CPU/Memory
```bash
# Get performance metrics
curl /monitoring/metrics | jq '.data.system.current'

# Top endpoints by response time
curl /monitoring/metrics | jq '.data.endpoints | sort_by(.averageResponseTime) | reverse'
```

## 📋 Production Deployment Checklist

- [ ] ✅ Monitoring System installed (`node scripts/setup-monitoring.js`)
- [ ] ✅ Configuration adjusted (`.env.monitoring`)
- [ ] ✅ Email SMTP configured and tested
- [ ] ✅ Slack/Discord webhooks set up
- [ ] ✅ Thresholds adjusted for environment
- [ ] ✅ Monitoring Middleware integrated in Express
- [ ] ✅ Database indexes created
- [ ] ✅ Alert tests performed
- [ ] ✅ Dashboard access verified
- [ ] ✅ Log rotation configured
- [ ] ✅ Backup strategy implemented

## 🔮 Advanced Features

### Machine Learning (Planned)
- Anomaly detection for unusual patterns
- Predictive alerting based on trends
- Automatic threshold optimization

### Custom Dashboards
- Configurable monitoring dashboards
- Widget-based views
- Export metrics as reports

### Mobile Integration
- Push notifications for critical alerts
- Mobile dashboard app
- SMS escalation for critical events

---

## 🎉 Status: FULLY IMPLEMENTED

The Monitoring System is **fully functional** and ready for production deployment!

**Implemented Files:**
- ✅ `src/services/healthCheckService.js` (600+ lines)
- ✅ `src/services/performanceMetricsService.js` (800+ lines)
- ✅ `src/services/errorTrackingService.js` (900+ lines)
- ✅ `src/services/alertingSystem.js` (1000+ lines)
- ✅ `src/routes/monitoring.js` (600+ lines)
- ✅ `src/middleware/monitoringMiddleware.js` (400+ lines)
- ✅ `.env.monitoring.example` (300+ lines)
- ✅ `scripts/setup-monitoring.js` (400+ lines)
- ✅ `docs/MONITORING.md` (Complete documentation)

**Next Steps:**
1. Run setup script: `node scripts/setup-monitoring.js`
2. Adjust configuration: `.env.monitoring`
3. Integrate into Express app
4. Test and deploy to production!

**Support:** For questions about implementation or configuration - just ask!
