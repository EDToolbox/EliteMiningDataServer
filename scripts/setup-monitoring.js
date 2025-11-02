/**
 * Monitoring System Setup Script
 * Initializes and configures the complete monitoring infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class MonitoringSetup {
  constructor() {
    this.baseDir = process.cwd();
    this.setupLog = [];
  }

  /**
   * Run complete monitoring setup
   */
  async setupMonitoring() {
    console.log('🚀 Setting up Elite Dangerous Mining Data Server Monitoring System...\n');
    
    try {
      await this.checkPrerequisites();
      await this.createDirectories();
      await this.installDependencies();
      await this.createConfigFiles();
      await this.setupDatabaseIndexes();
      await this.verifySetup();
      
      console.log('\n✅ Monitoring system setup completed successfully!');
      console.log('\n📋 Setup Summary:');
      this.setupLog.forEach(log => console.log(`   ${log}`));
      
      console.log('\n🔧 Next Steps:');
      console.log('   1. Review and update .env.monitoring with your configuration');
      console.log('   2. Configure notification channels (email, Slack, webhooks)');
      console.log('   3. Adjust alert thresholds for your environment');
      console.log('   4. Test notification channels: npm run test:monitoring');
      console.log('   5. Start the server: npm start');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check system prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    this.log(`✓ Node.js ${nodeVersion} is compatible`);

    // Check package.json exists
    try {
      await fs.access(path.join(this.baseDir, 'package.json'));
      this.log('✓ package.json found');
    } catch (error) {
      throw new Error('package.json not found. Run this script from the project root.');
    }

    // Check if MongoDB is accessible (if configured)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elitemining';
    this.log(`✓ MongoDB URI configured: ${mongoUri}`);

    console.log('✅ Prerequisites check passed\n');
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    console.log('📁 Creating directories...');
    
    const directories = [
      'logs',
      'logs/errors',
      'logs/monitoring',
      'backups',
      'backups/monitoring',
      'config',
      'templates',
      'templates/emails',
      'src/services',
      'src/middleware',
      'src/routes',
      'test/monitoring'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.baseDir, dir);
      try {
        await fs.mkdir(fullPath, { recursive: true });
        this.log(`✓ Created directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw new Error(`Failed to create directory ${dir}: ${error.message}`);
        }
        this.log(`✓ Directory exists: ${dir}`);
      }
    }

    console.log('✅ Directories created\n');
  }

  /**
   * Install required dependencies
   */
  async installDependencies() {
    console.log('📦 Installing monitoring dependencies...');
    
    const dependencies = [
      'nodemailer',
      'node-fetch',
      'winston',
      'winston-daily-rotate-file'
    ];

    const devDependencies = [
      'jest',
      'supertest'
    ];

    // Check which dependencies are already installed
    let packageJson;
    try {
      const packageData = await fs.readFile(path.join(this.baseDir, 'package.json'), 'utf8');
      packageJson = JSON.parse(packageData);
    } catch (error) {
      throw new Error('Failed to read package.json');
    }

    const existingDeps = Object.keys(packageJson.dependencies || {});
    const existingDevDeps = Object.keys(packageJson.devDependencies || {});
    
    const missingDeps = dependencies.filter(dep => !existingDeps.includes(dep));
    const missingDevDeps = devDependencies.filter(dep => !existingDevDeps.includes(dep));

    if (missingDeps.length > 0) {
      console.log(`Installing production dependencies: ${missingDeps.join(', ')}`);
      await this.runNpmCommand('install', missingDeps);
      this.log(`✓ Installed production dependencies: ${missingDeps.join(', ')}`);
    } else {
      this.log('✓ All production dependencies already installed');
    }

    if (missingDevDeps.length > 0) {
      console.log(`Installing development dependencies: ${missingDevDeps.join(', ')}`);
      await this.runNpmCommand('install', [...missingDevDeps, '--save-dev']);
      this.log(`✓ Installed development dependencies: ${missingDevDeps.join(', ')}`);
    } else {
      this.log('✓ All development dependencies already installed');
    }

    console.log('✅ Dependencies installed\n');
  }

  /**
   * Create configuration files
   */
  async createConfigFiles() {
    console.log('⚙️ Creating configuration files...');

    // Create monitoring configuration if it doesn't exist
    const monitoringEnvPath = path.join(this.baseDir, '.env.monitoring');
    const monitoringExamplePath = path.join(this.baseDir, '.env.monitoring.example');
    
    try {
      await fs.access(monitoringEnvPath);
      this.log('✓ .env.monitoring already exists');
    } catch (error) {
      try {
        await fs.copyFile(monitoringExamplePath, monitoringEnvPath);
        this.log('✓ Created .env.monitoring from example');
      } catch (copyError) {
        this.log('⚠️ Could not create .env.monitoring (example file not found)');
      }
    }

    // Create email templates
    await this.createEmailTemplates();

    // Create monitoring scripts
    await this.createMonitoringScripts();

    // Update package.json with monitoring scripts
    await this.updatePackageJsonScripts();

    console.log('✅ Configuration files created\n');
  }

  /**
   * Create email templates
   */
  async createEmailTemplates() {
    const templatesDir = path.join(this.baseDir, 'templates', 'emails');
    
    const alertTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .alert-header { background-color: {{severityColor}}; color: white; padding: 20px; margin-bottom: 20px; }
        .alert-content { padding: 20px; border-left: 5px solid {{severityColor}}; }
        .alert-details { background-color: #f5f5f5; padding: 15px; margin: 10px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="alert-header">
        <h2>{{title}}</h2>
        <p>Severity: {{severity}}</p>
    </div>
    <div class="alert-content">
        <p><strong>Message:</strong> {{message}}</p>
        <div class="alert-details">
            <p><strong>Alert ID:</strong> {{alertId}}</p>
            <p><strong>Time:</strong> {{timestamp}}</p>
            <p><strong>Source:</strong> {{source}}</p>
            {{#if data}}
            <p><strong>Additional Data:</strong></p>
            <pre>{{data}}</pre>
            {{/if}}
        </div>
    </div>
    <div class="footer">
        <p>Elite Dangerous Mining Data Server - Monitoring System</p>
        <p>This is an automated alert. Please do not reply to this email.</p>
    </div>
</body>
</html>`;

    await fs.writeFile(path.join(templatesDir, 'alert.html'), alertTemplate);
    this.log('✓ Created email alert template');
  }

  /**
   * Create monitoring utility scripts
   */
  async createMonitoringScripts() {
    const scriptsDir = path.join(this.baseDir, 'scripts');
    await fs.mkdir(scriptsDir, { recursive: true });

    // Test monitoring script
    const testScript = `#!/usr/bin/env node
/**
 * Test monitoring system components
 */

const MonitoringMiddleware = require('../src/middleware/monitoringMiddleware');
const HealthCheckService = require('../src/services/healthCheckService');
const PerformanceMetricsService = require('../src/services/performanceMetricsService');
const ErrorTrackingService = require('../src/services/errorTrackingService');
const AlertingSystem = require('../src/services/alertingSystem');

async function testMonitoring() {
  console.log('🧪 Testing monitoring system components...\\n');
  
  try {
    // Test health check
    console.log('Testing health check service...');
    const healthCheck = new HealthCheckService();
    const health = await healthCheck.performHealthCheck();
    console.log(\`✅ Health check: \${health.status}\\n\`);
    
    // Test performance metrics
    console.log('Testing performance metrics...');
    const metrics = new PerformanceMetricsService();
    metrics.startCollection();
    metrics.recordRequest('/test', 'GET', 200, 150, 1024);
    const report = metrics.getPerformanceReport();
    console.log(\`✅ Performance metrics: \${report.summary.totalRequests} requests tracked\\n\`);
    
    // Test error tracking
    console.log('Testing error tracking...');
    const errorTracking = new ErrorTrackingService();
    await errorTracking.initialize();
    const errorId = await errorTracking.trackError(new Error('Test error'), { type: 'TEST_ERROR' });
    console.log(\`✅ Error tracking: Error \${errorId} logged\\n\`);
    
    // Test alerting
    console.log('Testing alerting system...');
    const alerting = new AlertingSystem();
    await alerting.initialize();
    const alertId = await alerting.triggerAlert({
      title: 'Test Alert',
      message: 'This is a test alert',
      severity: 'info',
      channels: ['console']
    });
    console.log(\`✅ Alerting: Alert \${alertId} triggered\\n\`);
    
    console.log('🎉 All monitoring components working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMonitoring();`;

    await fs.writeFile(path.join(scriptsDir, 'test-monitoring.js'), testScript);
    await fs.chmod(path.join(scriptsDir, 'test-monitoring.js'), '755');
    this.log('✓ Created monitoring test script');

    // Backup script
    const backupScript = `#!/usr/bin/env node
/**
 * Backup monitoring data
 */

const fs = require('fs').promises;
const path = require('path');

async function backupMonitoringData() {
  console.log('💾 Backing up monitoring data...');
  
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = path.join(process.cwd(), 'backups', 'monitoring', timestamp);
  
  await fs.mkdir(backupDir, { recursive: true });
  
  // Backup logs
  const logsDir = path.join(process.cwd(), 'logs');
  const backupLogsDir = path.join(backupDir, 'logs');
  await fs.mkdir(backupLogsDir, { recursive: true });
  
  try {
    const logFiles = await fs.readdir(logsDir);
    for (const file of logFiles) {
      if (file.endsWith('.log')) {
        await fs.copyFile(
          path.join(logsDir, file),
          path.join(backupLogsDir, file)
        );
      }
    }
    console.log(\`✅ Backed up \${logFiles.length} log files\`);
  } catch (error) {
    console.log('⚠️ No log files to backup');
  }
  
  console.log(\`✅ Backup completed: \${backupDir}\`);
}

backupMonitoringData().catch(console.error);`;

    await fs.writeFile(path.join(scriptsDir, 'backup-monitoring.js'), backupScript);
    await fs.chmod(path.join(scriptsDir, 'backup-monitoring.js'), '755');
    this.log('✓ Created monitoring backup script');
  }

  /**
   * Update package.json with monitoring scripts
   */
  async updatePackageJsonScripts() {
    const packageJsonPath = path.join(this.baseDir, 'package.json');
    const packageData = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageData);

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    const monitoringScripts = {
      'test:monitoring': 'node scripts/test-monitoring.js',
      'backup:monitoring': 'node scripts/backup-monitoring.js',
      'monitor:health': 'curl http://localhost:3000/monitoring/health',
      'monitor:metrics': 'curl http://localhost:3000/monitoring/metrics',
      'monitor:alerts': 'curl http://localhost:3000/monitoring/alerts'
    };

    let scriptsAdded = 0;
    for (const [script, command] of Object.entries(monitoringScripts)) {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
        scriptsAdded++;
      }
    }

    if (scriptsAdded > 0) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      this.log(`✓ Added ${scriptsAdded} monitoring scripts to package.json`);
    } else {
      this.log('✓ Monitoring scripts already exist in package.json');
    }
  }

  /**
   * Setup database indexes for monitoring
   */
  async setupDatabaseIndexes() {
    console.log('🗄️ Setting up database indexes...');

    const indexScript = `
const { MongoClient } = require('mongodb');

async function createMonitoringIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elitemining';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Error tracking indexes
    await db.collection('errors').createIndex({ timestamp: -1 });
    await db.collection('errors').createIndex({ type: 1, severity: 1 });
    await db.collection('errors').createIndex({ resolved: 1 });
    
    // Performance metrics indexes
    await db.collection('performance_metrics').createIndex({ timestamp: -1 });
    await db.collection('performance_metrics').createIndex({ endpoint: 1, method: 1 });
    
    // Alert indexes
    await db.collection('alerts').createIndex({ timestamp: -1 });
    await db.collection('alerts').createIndex({ status: 1, severity: 1 });
    
    console.log('✅ Database indexes created for monitoring');
    
  } catch (error) {
    console.log('⚠️ Could not create database indexes:', error.message);
  } finally {
    await client.close();
  }
}

createMonitoringIndexes();`;

    const indexScriptPath = path.join(this.baseDir, 'scripts', 'setup-monitoring-indexes.js');
    await fs.writeFile(indexScriptPath, indexScript);
    this.log('✓ Created database index setup script');

    console.log('✅ Database setup completed\n');
  }

  /**
   * Verify monitoring setup
   */
  async verifySetup() {
    console.log('🔍 Verifying monitoring setup...');

    const requiredFiles = [
      'src/services/healthCheckService.js',
      'src/services/performanceMetricsService.js',
      'src/services/errorTrackingService.js',
      'src/services/alertingSystem.js',
      'src/middleware/monitoringMiddleware.js',
      'src/routes/monitoring.js'
    ];

    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(this.baseDir, file));
        this.log(`✓ Found: ${file}`);
      } catch (error) {
        throw new Error(`Missing required file: ${file}`);
      }
    }

    // Verify configuration files
    const configFiles = [
      '.env.monitoring.example',
      'templates/emails/alert.html',
      'scripts/test-monitoring.js',
      'scripts/backup-monitoring.js'
    ];

    for (const file of configFiles) {
      try {
        await fs.access(path.join(this.baseDir, file));
        this.log(`✓ Found: ${file}`);
      } catch (error) {
        this.log(`⚠️ Optional file missing: ${file}`);
      }
    }

    console.log('✅ Setup verification completed\n');
  }

  /**
   * Run npm command
   */
  async runNpmCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', [command, ...args], {
        cwd: this.baseDir,
        stdio: 'pipe'
      });

      let output = '';
      npm.stdout.on('data', (data) => {
        output += data.toString();
      });

      npm.stderr.on('data', (data) => {
        output += data.toString();
      });

      npm.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`npm ${command} failed with code ${code}: ${output}`));
        }
      });
    });
  }

  /**
   * Log setup progress
   */
  log(message) {
    this.setupLog.push(message);
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.setupMonitoring();
}

module.exports = MonitoringSetup;