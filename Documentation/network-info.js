#!/usr/bin/env node

/**
 * Al Hilo Frontend - Network Access Helper
 * Displays all network interfaces to help you connect from other devices
 */

const os = require('os');
const { execSync } = require('child_process');

console.log('\n🌐 Al Hilo Frontend - Network Configuration\n');
console.log('============================================\n');

// Get network interfaces
const interfaces = os.networkInterfaces();
const addresses = [];

Object.keys(interfaces).forEach(interfaceName => {
  interfaces[interfaceName].forEach(iface => {
    // Skip internal and non-IPv4 addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push({
        name: interfaceName,
        address: iface.address
      });
    }
  });
});

console.log('📱 Access the application from:\n');

// Local access
console.log('   Local:    http://localhost:4200');
console.log('             http://127.0.0.1:4200\n');

// Network access
if (addresses.length > 0) {
  console.log('   Network:');
  addresses.forEach(addr => {
    console.log(`             http://${addr.address}:4200  (${addr.name})`);
  });
  console.log('');
} else {
  console.log('   ⚠️  No network interfaces found\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Instructions:\n');
console.log('   1. Make sure your device is on the same network');
console.log('   2. Use any of the Network URLs above');
console.log('   3. Ensure firewall allows port 4200\n');

console.log('🔒 Test Credentials:\n');
console.log('   Admin:        admin@alhilo.com / admin123');
console.log('   Receptionist: receptionist@alhilo.com / receptionist123');
console.log('   Seamstress:   seamstress@alhilo.com / seamstress123\n');

console.log('🚀 To start the server:\n');
console.log('   npm start\n');
console.log('============================================\n');
