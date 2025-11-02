#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  const serverPath = path.join(distPath, 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log('❌ Bundle not found. Run "npm run build" first.');
    return;
  }
  
  const stats = fs.statSync(serverPath);
  const size = stats.size;
  
  console.log('\n📦 Bundle Size Analysis');
  console.log('========================');
  console.log(`📁 File: dist/server.js`);
  console.log(`📏 Size: ${formatBytes(size)}`);
  console.log(`🔢 Raw bytes: ${size.toLocaleString()} bytes`);
  
  // Kategorisierung der Bundle-Größe
  let sizeCategory;
  if (size < 1024 * 1024) { // < 1MB
    sizeCategory = '🟢 Small';
  } else if (size < 5 * 1024 * 1024) { // < 5MB
    sizeCategory = '🟡 Medium';
  } else if (size < 10 * 1024 * 1024) { // < 10MB
    sizeCategory = '🟠 Large';
  } else {
    sizeCategory = '🔴 Very Large';
  }
  
  console.log(`📊 Category: ${sizeCategory}`);
  
  // Optimierungsempfehlungen
  console.log('\n💡 Optimization Tips:');
  if (size > 5 * 1024 * 1024) {
    console.log('  • Consider code splitting for large bundles');
    console.log('  • Review large dependencies in package.json');
    console.log('  • Use webpack externals for Node.js native modules');
  } else if (size > 1024 * 1024) {
    console.log('  • Good size for a Node.js server bundle');
    console.log('  • Monitor dependencies to prevent bloat');
  } else {
    console.log('  • Excellent bundle size! 🎉');
  }
  
  console.log('\n📊 For detailed analysis, run: npm run build:analyze');
  console.log('📄 Report location: dist/bundle-report.html\n');
}

if (require.main === module) {
  analyzeBundleSize();
}

module.exports = { analyzeBundleSize, formatBytes };