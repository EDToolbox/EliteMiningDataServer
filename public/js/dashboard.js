// Elite Mining Data Server Dashboard JavaScript

class Dashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.isConnected = false;
        this.dataBuffer = {
            dataRate: [],
            sourceDistribution: { eddn: 0, inara: 0, edsm: 0 },
            responseTime: [],
            errorDistribution: { critical: 0, high: 0, medium: 0, low: 0 }
        };
        this.updateInterval = null;
        this.monitoringEnabled = false;
        
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupCharts();
        this.setupEventListeners();
        this.loadInitialData();
        this.startPeriodicUpdates();
    }

    startPeriodicUpdates() {
        // Update dashboard data every 30 seconds
        this.updateInterval = setInterval(() => {
            this.loadMonitoringData();
        }, 30000);
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            this.isConnected = true;
            this.updateConnectionStatus('connected', 'Connected');
            console.log('WebSocket connected');
        };
        
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        this.socket.onclose = () => {
            this.isConnected = false;
            this.updateConnectionStatus('disconnected', 'Disconnected');
            console.log('WebSocket disconnected');
            
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (!this.isConnected) {
                    this.setupWebSocket();
                }
            }, 5000);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error', 'Connection Error');
        };
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'status':
                this.updateSystemStatus(data.payload);
                break;
            case 'dataSource':
                this.updateDataSourceStatus(data.payload);
                break;
            case 'miningData':
                this.addMiningDataRow(data.payload);
                break;
            case 'log':
                this.addLogEntry(data.payload);
                break;
            case 'metrics':
                this.updateMetrics(data.payload);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    updateConnectionStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }

    updateSystemStatus(status) {
        // Update uptime
        document.getElementById('uptime').textContent = this.formatUptime(status.uptime);
        
        // Update memory usage
        const memUsage = ((status.memoryUsage.used / status.memoryUsage.total) * 100).toFixed(1);
        document.getElementById('memoryUsage').textContent = `${memUsage}%`;
        
        // Update CPU usage
        document.getElementById('cpuUsage').textContent = `${status.cpuUsage.toFixed(1)}%`;
        
        // Update connections
        document.getElementById('websocketConnections').textContent = status.connections.websocket;
        document.getElementById('apiConnections').textContent = status.connections.api;
        document.getElementById('databaseConnections').textContent = status.connections.database;
        
        // Update security metrics
        document.getElementById('blockedIPs').textContent = status.security.blockedIPs;
        document.getElementById('threatLevel').textContent = status.security.threatLevel;
        document.getElementById('rateLimits').textContent = status.security.rateLimits;
    }

    updateDataSourceStatus(sources) {
        Object.keys(sources).forEach(sourceName => {
            const source = sources[sourceName];
            const element = document.getElementById(`${sourceName}Status`);
            
            if (element) {
                const statusElement = element.querySelector('.source-status');
                const countElement = element.querySelector('.source-count');
                
                statusElement.textContent = source.status;
                statusElement.className = `source-status ${source.status.toLowerCase()}`;
                countElement.textContent = `${source.messageRate} msg/min`;
                
                // Update chart data
                this.dataBuffer.sourceDistribution[sourceName] = source.totalMessages;
            }
        });
        
        // Update charts with new data
        this.updateCharts();
    }

    updateMetrics(metrics) {
        // Update data rate chart
        const now = new Date();
        this.dataBuffer.dataRate.push({
            time: now.toLocaleTimeString(),
            rate: metrics.dataProcessingRate
        });
        
        // Keep only last 20 data points
        if (this.dataBuffer.dataRate.length > 20) {
            this.dataBuffer.dataRate.shift();
        }
        
        this.updateDataRateChart();
    }

    setupCharts() {
        // Data Rate Chart
        const dataRateCtx = document.getElementById('dataRateChart').getContext('2d');
        this.charts.dataRate = new Chart(dataRateCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Messages/sec',
                    data: [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#b3b3b3' },
                        grid: { color: '#404040' }
                    },
                    y: { 
                        ticks: { color: '#b3b3b3' },
                        grid: { color: '#404040' }
                    }
                }
            }
        });

        // Source Distribution Chart
        const sourceDistCtx = document.getElementById('sourceDistributionChart').getContext('2d');
        this.charts.sourceDistribution = new Chart(sourceDistCtx, {
            type: 'doughnut',
            data: {
                labels: ['EDDN', 'Inara', 'EDSM'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#ff6b00', '#00d4ff', '#28a745'],
                    borderColor: '#2d2d2d',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff' }
                    }
                }
            }
        });
    }

    updateDataRateChart() {
        const chart = this.charts.dataRate;
        chart.data.labels = this.dataBuffer.dataRate.map(d => d.time);
        chart.data.datasets[0].data = this.dataBuffer.dataRate.map(d => d.rate);
        chart.update('none');
    }

    updateCharts() {
        // Update source distribution chart
        const dist = this.dataBuffer.sourceDistribution;
        this.charts.sourceDistribution.data.datasets[0].data = [
            dist.eddn || 0,
            dist.inara || 0,
            dist.edsm || 0
        ];
        this.charts.sourceDistribution.update('none');
    }

    addMiningDataRow(data) {
        const tbody = document.getElementById('miningDataBody');
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${new Date(data.timestamp).toLocaleString()}</td>
            <td>${data.system}</td>
            <td>${data.station}</td>
            <td>${data.commodity}</td>
            <td>${data.price.toLocaleString()} CR</td>
            <td>${data.supply.toLocaleString()}</td>
            <td><span class="source-badge ${data.source.toLowerCase()}">${data.source}</span></td>
        `;
        
        // Add to top of table
        tbody.insertBefore(row, tbody.firstChild);
        
        // Remove oldest rows (keep max 50)
        while (tbody.children.length > 50) {
            tbody.removeChild(tbody.lastChild);
        }
        
        // Highlight new row
        row.style.background = 'rgba(0, 212, 255, 0.2)';
        setTimeout(() => {
            row.style.background = '';
        }, 2000);
    }

    addLogEntry(logData) {
        const container = document.getElementById('logContainer');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const timestamp = new Date(logData.timestamp).toLocaleTimeString();
        
        entry.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-level ${logData.level}">${logData.level.toUpperCase()}</span>
            <span class="log-message">${logData.message}</span>
        `;
        
        // Add to top of log container
        container.insertBefore(entry, container.firstChild);
        
        // Remove old entries (keep max 100)
        while (container.children.length > 100) {
            container.removeChild(container.lastChild);
        }
        
        // Auto-scroll to top for new entries
        container.scrollTop = 0;
    }

    setupEventListeners() {
        // Refresh mining data button
        document.getElementById('refreshMiningData')?.addEventListener('click', () => {
            this.loadMiningData();
        });
        
        // Refresh alerts button
        document.getElementById('refreshAlerts')?.addEventListener('click', () => {
            this.loadAlertsData();
        });

        // Refresh metrics button
        document.getElementById('refreshMetrics')?.addEventListener('click', () => {
            this.loadPerformanceMetrics();
        });

        // Test alert button
        document.getElementById('testAlert')?.addEventListener('click', () => {
            this.testAlert();
        });

        // Metrics time range selector
        document.getElementById('metricsTimeRange')?.addEventListener('change', (e) => {
            this.loadPerformanceMetrics(e.target.value);
        });
        
        // Clear logs button
        document.getElementById('clearLogs')?.addEventListener('click', () => {
            document.getElementById('logContainer').innerHTML = '';
        });
        
        // Log level filter
        document.getElementById('logLevel')?.addEventListener('change', (e) => {
            this.filterLogs(e.target.value);
        });
    }

    async loadInitialData() {
        try {
            // Load initial status
            const statusResponse = await fetch('/api/status');
            const status = await statusResponse.json();
            this.updateSystemStatus(status);
            
            // Load mining data
            await this.loadMiningData();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadMiningData() {
        try {
            const response = await fetch('/api/mining/recent?limit=20');
            const data = await response.json();
            
            const tbody = document.getElementById('miningDataBody');
            tbody.innerHTML = '';
            
            data.forEach(item => this.addMiningDataRow(item));
            
        } catch (error) {
            console.error('Error loading mining data:', error);
        }
    }

    filterLogs(level) {
        const entries = document.querySelectorAll('.log-entry');
        
        entries.forEach(entry => {
            const entryLevel = entry.querySelector('.log-level').textContent.toLowerCase();
            
            if (level === 'all' || entryLevel === level) {
                entry.style.display = 'block';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    formatUptime(uptimeMs) {
        const seconds = Math.floor(uptimeMs / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    async loadMonitoringData() {
        try {
            const response = await fetch('/api/monitoring/dashboard');
            const data = await response.json();
            
            if (data.success) {
                this.monitoringEnabled = true;
                this.updateMonitoringDashboard(data.data);
            } else {
                this.monitoringEnabled = false;
                this.loadBasicData();
            }
        } catch (error) {
            console.error('Error loading monitoring data:', error);
            this.monitoringEnabled = false;
            this.loadBasicData();
        }
    }

    updateMonitoringDashboard(data) {
        // Update overview metrics
        this.updateOverviewMetrics(data.overview);
        
        // Update health status
        this.updateHealthStatus(data.health);
        
        // Update performance metrics
        this.updatePerformanceDisplay(data.performance);
        
        // Update error tracking
        this.updateErrorDisplay(data.errors);
        
        // Update alerts
        this.updateAlertsDisplay(data.alerts);
        
        // Update charts with new data
        this.updateMonitoringCharts(data);
    }

    updateOverviewMetrics(overview) {
        if (document.getElementById('uptime')) {
            document.getElementById('uptime').textContent = overview.uptime || '--';
        }
        if (document.getElementById('healthStatus')) {
            document.getElementById('healthStatus').textContent = overview.systemHealth || '--';
        }
        if (document.getElementById('responseTime')) {
            document.getElementById('responseTime').textContent = 
                overview.averageResponseTime ? `${overview.averageResponseTime}ms` : '--';
        }
        if (document.getElementById('errorRate')) {
            document.getElementById('errorRate').textContent = 
                overview.errorRate ? `${overview.errorRate.toFixed(2)}%` : '--';
        }
        if (document.getElementById('activeAlerts')) {
            document.getElementById('activeAlerts').textContent = overview.activeAlerts || '0';
        }
    }

    updateHealthStatus(health) {
        if (!health || !health.checks) return;
        
        const checks = health.checks;
        const memoryPercent = checks.memory ? checks.memory.details?.heap?.usagePercent : 0;
        const cpuPercent = checks.cpu ? checks.cpu.details?.usage : 0;
        
        if (document.getElementById('memoryUsage')) {
            document.getElementById('memoryUsage').textContent = 
                memoryPercent ? `${memoryPercent.toFixed(1)}%` : '--';
        }
        if (document.getElementById('cpuUsage')) {
            document.getElementById('cpuUsage').textContent = 
                cpuPercent ? `${cpuPercent.toFixed(1)}%` : '--';
        }
    }

    updatePerformanceDisplay(performance) {
        if (!performance || !performance.summary) return;
        
        const summary = performance.summary;
        if (document.getElementById('totalRequests')) {
            document.getElementById('totalRequests').textContent = summary.totalRequests || '0';
        }
        if (document.getElementById('requestsPerSecond')) {
            document.getElementById('requestsPerSecond').textContent = 
                summary.requestsPerSecond ? summary.requestsPerSecond.toFixed(2) : '0';
        }
    }

    updateErrorDisplay(errors) {
        if (!errors || !errors.summary) return;
        
        const summary = errors.summary;
        if (document.getElementById('totalErrors')) {
            document.getElementById('totalErrors').textContent = summary.totalErrors || '0';
        }
        if (document.getElementById('criticalErrors')) {
            document.getElementById('criticalErrors').textContent = summary.criticalErrors || '0';
        }
        if (document.getElementById('uniqueErrors')) {
            document.getElementById('uniqueErrors').textContent = summary.uniqueErrors || '0';
        }
        
        // Calculate error trend
        const errorTrend = summary.errorRate > 1 ? '↑' : summary.errorRate < 0.5 ? '↓' : '→';
        if (document.getElementById('errorTrend')) {
            document.getElementById('errorTrend').textContent = errorTrend;
        }
    }

    updateAlertsDisplay(alerts) {
        if (!alerts) return;
        
        const activeCount = alerts.alerts ? alerts.alerts.length : 0;
        if (document.getElementById('activeAlerts')) {
            document.getElementById('activeAlerts').textContent = activeCount;
        }
        
        // Find highest severity
        const severities = alerts.alerts?.map(a => a.severity) || [];
        const highestSeverity = severities.includes('critical') ? 'Critical' : 
                               severities.includes('warning') ? 'Warning' : 
                               severities.includes('info') ? 'Info' : 'None';
        if (document.getElementById('alertSeverity')) {
            document.getElementById('alertSeverity').textContent = highestSeverity;
        }
        
        // Update alerts container
        this.renderActiveAlerts(alerts.alerts || []);
    }

    renderActiveAlerts(alerts) {
        const container = document.getElementById('alertsContainer');
        if (!container) return;
        
        if (alerts.length === 0) {
            container.innerHTML = '<div class="no-alerts">No active alerts</div>';
            return;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-header">
                    <span class="alert-title">${alert.title || 'Alert'}</span>
                    <span class="alert-severity">${alert.severity}</span>
                    <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-actions">
                    <button class="btn-acknowledge" onclick="dashboard.acknowledgeAlert('${alert.id}')">
                        Acknowledge
                    </button>
                </div>
            </div>
        `).join('');
    }

    async acknowledgeAlert(alertId) {
        try {
            const response = await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.loadAlertsData();
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    }

    async testAlert() {
        try {
            const response = await fetch('/api/monitoring/alerts/test', {
                method: 'POST'
            });
            
            if (response.ok) {
                alert('Test alert sent successfully!');
            }
        } catch (error) {
            console.error('Error sending test alert:', error);
            alert('Error sending test alert');
        }
    }

    async loadAlertsData() {
        try {
            const response = await fetch('/api/monitoring/alerts');
            const data = await response.json();
            this.updateAlertsDisplay(data);
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
    }

    async loadPerformanceMetrics(timeRange = '1h') {
        try {
            const response = await fetch(`/api/monitoring/performance?timeRange=${timeRange}`);
            const data = await response.json();
            this.updatePerformanceDisplay(data);
        } catch (error) {
            console.error('Error loading performance metrics:', error);
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    loadBasicData() {
        // Fallback to original dashboard functionality
        this.loadInitialData();
    }

    updateMonitoringCharts(data) {
        // Update response time chart
        if (this.charts.responseTimeChart && data.performance) {
            // Implementation for response time chart updates
        }

        // Update error distribution chart
        if (this.charts.errorDistributionChart && data.errors) {
            // Implementation for error distribution chart updates
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause updates
        if (window.dashboard && window.dashboard.socket) {
            window.dashboard.socket.close();
        }
    } else {
        // Page is visible, resume updates
        if (window.dashboard && !window.dashboard.isConnected) {
            window.dashboard.setupWebSocket();
        }
    }
});