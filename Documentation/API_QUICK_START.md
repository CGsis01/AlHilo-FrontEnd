# API Integration Quick Start

Quick guide to get the Angular frontend connected to your FastAPI backend.

## ⚡ Quick Setup (5 minutes)

### Step 1: Configure Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',  // Your FastAPI URL
  enableMockData: false  // false = use real API, true = use mock data
};
```

### Step 2: Start Your Backend

```bash
# Ensure your FastAPI backend is running
cd ../backend  # or wherever your Python backend is
uvicorn main:app --reload --port 8000
```

### Step 3: Test Connection

```bash
# Start Angular dev server
npm run start

# Open browser to http://localhost:4200
# Try to login - it will call your backend API
```

## 🎯 Test Your API

### Manual Test with curl

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alhilo.com","password":"admin123"}'
```

**Get Users (with token):**
```bash
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Login to the app
4. Watch the API calls:
   - `POST /api/v1/auth/login`
   - `GET /api/v1/users`
   - `GET /api/v1/repairs`
   - etc.

## 🔄 Switch Between Mock and Real API

### Use Mock Data (No Backend Required)

```typescript
// environment.ts
enableMockData: true
```

All data comes from mock services. Perfect for:
- Frontend development without backend
- UI testing
- Demo mode

### Use Real API

```typescript
// environment.ts
enableMockData: false
apiUrl: 'http://localhost:8000/api/v1'
```

All data comes from your FastAPI backend.

## 📋 Checklist for Backend

Your FastAPI backend must implement these endpoints:

### Authentication ✓
- [ ] `POST /api/v1/auth/login`
- [ ] `POST /api/v1/auth/logout`
- [ ] `POST /api/v1/auth/refresh`
- [ ] `GET /api/v1/auth/me`

### Users ✓
- [ ] `GET /api/v1/users`
- [ ] `GET /api/v1/users/{id}`
- [ ] `POST /api/v1/users`
- [ ] `PUT /api/v1/users/{id}`
- [ ] `DELETE /api/v1/users/{id}`

### Clients ✓
- [ ] `GET /api/v1/clients`
- [ ] `GET /api/v1/clients/{id}`
- [ ] `GET /api/v1/clients/search/phone?phone={phone}`
- [ ] `POST /api/v1/clients`
- [ ] `PUT /api/v1/clients/{id}`
- [ ] `DELETE /api/v1/clients/{id}`

### Repairs ✓
- [ ] `GET /api/v1/repairs`
- [ ] `GET /api/v1/repairs/{id}`
- [ ] `POST /api/v1/repairs`
- [ ] `PUT /api/v1/repairs/{id}`
- [ ] `DELETE /api/v1/repairs/{id}`
- [ ] `POST /api/v1/repairs/{id}/status`
- [ ] `POST /api/v1/repairs/{id}/assign`
- [ ] `GET /api/v1/repairs/stats`

See [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) for complete details.

## 🔐 Authentication Flow

1. **User logs in:**
   - Frontend sends email/password to `/auth/login`
   - Backend returns user + tokens
   - Frontend stores tokens in localStorage

2. **Authenticated requests:**
   - Frontend adds `Authorization: Bearer {token}` header
   - Backend validates token
   - Backend returns data

3. **Token refresh:**
   - When access token expires (401 error)
   - Frontend automatically calls `/auth/refresh`
   - Gets new access token
   - Retries original request

4. **Logout:**
   - Frontend calls `/auth/logout`
   - Clears tokens from localStorage
   - Redirects to login page

## 📊 Example: Get Repairs

### In Your Component

```typescript
import { Component, OnInit } from '@angular/core';
import { RepairRepository } from '../../data/repositories/repair.repository';
import { Repair, RepairStatus } from '../../core/models/repair.model';

export class RepairsComponent implements OnInit {
  repairs: Repair[] = [];
  
  constructor(private repairRepository: RepairRepository) {}
  
  ngOnInit() {
    // Get all pending repairs
    this.repairRepository.getByStatus(RepairStatus.PENDING).subscribe({
      next: (repairs) => {
        this.repairs = repairs;
      },
      error: (error) => {
        console.error('Error loading repairs:', error);
      }
    });
  }
}
```

### What Happens

1. Component calls `repairRepository.getByStatus()`
2. Repository checks `environment.enableMockData`:
   - If `true` → calls `MockRepairService`
   - If `false` → calls `RepairApiService`
3. `RepairApiService` calls `/api/v1/repairs?status=Pendiente`
4. Auth interceptor adds JWT token to request
5. Backend validates token and returns data
6. Response automatically mapped to `Repair[]` model

## 🚨 Common Issues

### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix:** Add CORS middleware in FastAPI:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 401 Unauthorized
```
HttpErrorResponse: 401 Unauthorized
```

**Possible causes:**
- Invalid credentials
- Expired token
- Missing Authorization header
- Backend not validating token correctly

**Fix:**
- Check token in localStorage (DevTools → Application → Local Storage)
- Verify token format: `Bearer eyJ...`
- Check backend JWT validation

### Connection Refused
```
HttpErrorResponse: 0 Unknown Error
```

**Fix:**
- Ensure FastAPI is running: `uvicorn main:app --reload --port 8000`
- Check `apiUrl` in environment matches backend port
- Check firewall/antivirus not blocking

### Wrong Data Format
```
Cannot read property 'id' of undefined
```

**Fix:**
- Check backend response matches expected format
- See [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) for exact response formats
- Ensure snake_case (backend) properly maps to camelCase (frontend)

## 🔧 Debugging Tips

### Enable API Logging

In components:
```typescript
this.repairApiService.getAll().subscribe({
  next: (data) => console.log('API Response:', data),
  error: (error) => console.error('API Error:', error)
});
```

### Check Network Traffic

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR
4. Click on request to see:
   - Request URL
   - Request headers (check Authorization)
   - Request payload
   - Response headers
   - Response data

### Test Individual Services

```typescript
// In browser console
import { RepairApiService } from './app/core/services/repair-api.service';

// Manually test service
const service = injector.get(RepairApiService);
service.getAll().subscribe(console.log);
```

## 📚 Next Steps

1. ✅ Configure environment
2. ✅ Start backend
3. ✅ Test login
4. ✅ Verify API calls in DevTools
5. 📖 Read [FASTAPI_INTEGRATION.md](FASTAPI_INTEGRATION.md) for complete guide
6. 📖 Read [API_ENDPOINTS_REFERENCE.md](API_ENDPOINTS_REFERENCE.md) for all endpoints
7. 🔨 Implement backend endpoints
8. 🧪 Test each endpoint
9. 🚀 Deploy to production

## 💡 Pro Tips

1. **Start with mock data** while developing UI, then switch to real API
2. **Use browser DevTools** Network tab to debug API issues
3. **Check backend logs** for server-side errors
4. **Test with Postman** or curl before integrating
5. **Keep environments in sync** between frontend and backend

## 📞 Support

- Frontend Issues: Check Angular console for errors
- Backend Issues: Check FastAPI logs
- API Issues: Use browser DevTools Network tab
- CORS Issues: Check FastAPI CORS configuration

---

**Happy coding! 🎉**
