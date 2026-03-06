#!/usr/bin/env node

/**
 * Al Hilo Frontend - Quick Start Script
 * This script helps you get started with the application quickly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('\n🧵 Al Hilo Frontend - Quick Start\n');
console.log('================================\n');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...\n');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Error installing dependencies');
    process.exit(1);
  }
}

// Display network information
console.log('🌐 Network Access Information:\n');

const interfaces = os.networkInterfaces();
const addresses = [];

Object.keys(interfaces).forEach(interfaceName => {
  interfaces[interfaceName].forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push({
        name: interfaceName,
        address: iface.address
      });
    }
  });
});

console.log('📱 You can access the application from:\n');
console.log('   Local:    http://localhost:4200');

if (addresses.length > 0) {
  console.log('\n   Network (other devices):');
  addresses.forEach(addr => {
    console.log(`             http://${addr.address}:4200`);
  });
}

console.log('\n🔐 Test Credentials:');
console.log('   admin@alhilo.com / admin123\n');

// Start the development server
console.log('🚀 Starting development server...\n');
console.log('Press Ctrl+C to stop the server\n');
console.log('================================\n');

try {
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error starting server');
  process.exit(1);
}
