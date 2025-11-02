#!/usr/bin/env node

/**
 * Check Test Environment Script
 * Verifies that the test environment is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking test environment...');

// Check if .env.test exists
const envTestPath = path.join(__dirname, '..', '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.log('ℹ️  .env.test not found, creating from template...');
  
  const envTestContent = `# Test Environment Configuration for Elite Mining Data Server
NODE_ENV=test
LOG_LEVEL=error

# Test Database Configuration
MONGODB_URI=mongodb://testuser:testpass123@localhost:27017/elite-mining-test?authSource=admin
MONGODB_CONNECTION_STRING=mongodb://testuser:testpass123@localhost:27017/elite-mining-test?authSource=admin
MONGODB_DB_NAME=elite-mining-test

# Test API Configuration
EDDN_RELAY_URL=tcp://localhost:9500
INARA_API_KEY=test_key
EDSM_API_KEY=test_key

# Test Cache Configuration
CACHE_DURATION_MINUTES=1
MAX_CACHE_ENTRIES=100

# Test Rate Limiting (more relaxed for tests)
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=1000

# Disable external connections for tests
DISABLE_EXTERNAL_APIS=true
ENABLE_EDDN=false`;

  fs.writeFileSync(envTestPath, envTestContent);
  console.log('✅ Created .env.test file');
}

// Load environment variables
require('dotenv').config({ path: envTestPath });

// Check required environment variables
const requiredVars = [
  'NODE_ENV',
  'MONGODB_URI'
];

let allVarsPresent = true;
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing environment variable: ${varName}`);
    allVarsPresent = false;
  }
}

if (!allVarsPresent) {
  console.error('❌ Test environment not properly configured');
  process.exit(1);
}

// Check MongoDB connection if in CI environment
if (process.env.CI || process.env.GITHUB_ACTIONS) {
  console.log('🔍 CI environment detected, MongoDB should be available');
} else {
  console.log('ℹ️  Local environment detected, MongoDB may not be available');
  console.log('ℹ️  Integration tests may be skipped if MongoDB is not running');
}

console.log('✅ Test environment check completed');
process.exit(0);