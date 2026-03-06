# 🌐 Network Access - Quick Start

## Access from Any Device on Your Network!

The Al Hilo application is configured to accept connections from any device on your local network.

## 🚀 Quick Start

### 1. Start the Server
```bash
npm start
```

### 2. Find Your Network URL
When the server starts, you'll see:
```
Local:    http://localhost:4200
Network:  http://192.168.X.X:4200  ← Use this on other devices
```

### 3. Connect from Other Devices
- Open a browser on your phone/tablet/other computer
- Make sure it's on the **same Wi-Fi network**
- Enter the Network URL (e.g., `http://192.168.1.100:4200`)
- Login with: `admin@alhilo.com / admin123`

## 🔍 Find Your IP Address Anytime

```bash
npm run network-info
```

## 🔒 Configure Windows Firewall (First Time Only)

### Option 1: Automatic (Recommended)
Double-click: `configure-firewall.bat`
- Click "Yes" when prompted for Administrator
- Wait for confirmation
- Done!

### Option 2: Manual
Run as Administrator:
```powershell
.\configure-firewall.ps1
```

## 📱 Tested Devices

✅ iPhone/iPad (Safari, Chrome)
✅ Android phones/tablets (Chrome)
✅ Other computers (any browser)
✅ Multiple devices simultaneously

## 🎯 Your Network URL

Run this command to see your IP:
```bash
node network-info.js
```

Example output:
```
📱 Access the application from:
   Local:    http://localhost:4200
   Network:  http://192.168.68.106:4200  (Wi-Fi)
```

## 🔐 Test Credentials

Same credentials work on all devices:
- **Admin:** admin@alhilo.com / admin123
- **Receptionist:** receptionist@alhilo.com / receptionist123
- **Seamstress:** seamstress@alhilo.com / seamstress123

## 📋 Troubleshooting

### Can't connect from mobile?

1. ✅ Same network? (Check Wi-Fi name)
2. ✅ Firewall configured? (Run `configure-firewall.bat`)
3. ✅ Server running? (`npm start`)
4. ✅ Correct IP? (Check with `npm run network-info`)

### Still not working?

Check detailed guide: `NETWORK_ACCESS.md`

## 💡 Pro Tips

- 📌 Bookmark the URL on your mobile device
- 🔄 Multiple people can test simultaneously
- 📱 Test responsive design on real devices
- 🌙 Try dark mode on different screens

---

**Network Access Enabled!** Start testing on real devices now! 🎉

For more details, see: `NETWORK_ACCESS.md`
