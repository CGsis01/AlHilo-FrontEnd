# FastAPI Backend Integration

This document explains the API integration layer for the AL HILO Angular frontend to connect with a Python FastAPI backend.

## 📋 Overview

The frontend has been structured with a complete API service layer that can seamlessly switch between mock data (for development) and real FastAPI backend integration.

## 🏗️ Architecture

### Service Layers

```
┌─────────────────────────────────────────────────────┐
│              Angular Components                      │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│            Use Cases / Business Logic                │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│               Repositories                           │
│  (Abstraction layer - switches between mock/real)   │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────┴────────┐         ┌────────┴─────────┐
│  Mock Services │         │   API Services   │
│  (Development) │         │  (Production)    │
└────────────────┘         └──────────────────┘
                                    │
                           ┌────────┴────────┐
                           │  HTTP Client    │
                           │  + Interceptors │
                           └─────────────────┘
                                    │
                           ┌────────┴────────┐
                           │  FastAPI Backend│
                           └─────────────────┘
```

## 📁 File Structure

```
src/app/
├── core/
│   ├── services/
│   │   ├── api.service.ts              # Base HTTP service
│   │   ├── auth.service.ts             # Authentication service
│   │   ├── auth-api.service.ts         # Auth API endpoints
│   │   ├── user-api.service.ts         # User API endpoints
│   │   ├── client-api.service.ts       # Client API endpoints
│   │   ├── repair-api.service.ts       # Repair API endpoints
│   │   ├── mock-auth.service.ts        # Mock auth (dev)
│   │   ├── mock-user.service.ts        # Mock users (dev)
│   │   ├── mock-client.service.ts      # Mock clients (dev)
│   │   └── mock-repair.service.ts      # Mock repairs (dev)
│   ├── interceptors/
│   │   └── auth.interceptor.ts         # JWT token interceptor
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── client.model.ts
│   │   └── repair.model.ts
│   └── interfaces/
│       ├── api-response.interface.ts
│       └── repository.interface.ts
├── data/
│   └── repositories/
│       ├── user.repository.ts          # User data access
│       ├── client.repository.ts        # Client data access
│       └── repair.repository.ts        # Repair data access
└── environments/
    ├── environment.ts                  # Dev config
    └── environment.prod.ts             # Prod config
```

## ⚙️ Configuration

### Environment Setup

**Development (`environment.ts`):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',  // FastAPI URL
  apiTimeout: 30000,
  tokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  userKey: 'currentUser',
  enableMockData: false  // Set to true to use mock data
};
```

**Production (`environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.alhilo.com/api/v1',  // Your production API
  apiTimeout: 30000,
  tokenKey: 'accessToken',
  refreshTokenKey: 'refreshToken',
  userKey: 'currentUser',
  enableMockData: false
};
```

### Switching Between Mock and Real API

Set `enableMockData: true` in environment to use mock services for development:
```typescript
enableMockData: true   // Uses mock data (no backend needed)
enableMockData: false  // Uses real FastAPI backend
```

## 🔐 Authentication

### Login Flow

```typescript
// Component
this.authService.login(email, password).subscribe({
  next: (response) => {
    // User logged in, tokens stored
    this.router.navigate(['/dashboard']);
  },
  error: (error) => {
    // Handle login error
  }
});
```

### Auth Service

The `AuthService` manages:
- Login/Logout
- Token storage and refresh
- Current user state
- Role-based access control

### Auth Interceptor

Automatically:
- Adds JWT token to requests
- Handles 401 errors
- Refreshes expired tokens
- Redirects to login on auth failure

### Token Storage

Tokens are stored in `localStorage`:
- `accessToken` - JWT access token
- `refreshToken` - Refresh token for renewing access
- `currentUser` - User profile data

## 📡 API Services

### AuthApiService

**Endpoints:**
- `POST /auth/login` - Login with credentials
- `POST /auth/register` - Register new user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### UserApiService

**Endpoints:**
- `GET /users` - Get all users (with filters)
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `PATCH /users/{id}` - Partial update
- `DELETE /users/{id}` - Delete user
- `POST /users/{id}/activate` - Activate user
- `POST /users/{id}/deactivate` - Deactivate user

**Examples:**
```typescript
// Get all users
this.userApiService.getAll().subscribe(users => {
  console.log(users);
});

// Get users by role
this.userApiService.getByRole(UserRole.SEAMSTRESS).subscribe(seamstresses => {
  console.log(seamstresses);
});

// Create user
const newUser = {
  name: 'Juan Pérez',
  email: 'juan@example.com',
  password: 'secure123',
  role: UserRole.RECEPTIONIST
};
this.userApiService.create(newUser).subscribe(user => {
  console.log('User created:', user);
});
```

### ClientApiService

**Endpoints:**
- `GET /clients` - Get all clients
- `GET /clients/{id}` - Get client by ID
- `GET /clients/search/phone?phone={phone}` - Search by phone
- `GET /clients/search/name?name={name}` - Search by name
- `POST /clients` - Create client
- `PUT /clients/{id}` - Update client
- `PATCH /clients/{id}` - Partial update
- `DELETE /clients/{id}` - Delete client
- `GET /clients/{id}/repairs` - Get client's repair history
- `GET /clients/birthdays/upcoming?days=30` - Upcoming birthdays

**Examples:**
```typescript
// Search client by phone
this.clientApiService.searchByPhone('5551234567').subscribe(client => {
  if (client) {
    console.log('Client found:', client);
  }
});

// Create client
const newClient = {
  full_name: 'María López',
  address: 'Calle Principal 123',
  personal_phone: '5551234567',
  contact_phone: '5559876543',
  email: 'maria@example.com'
};
this.clientApiService.create(newClient).subscribe(client => {
  console.log('Client created:', client);
});
```

### RepairApiService

**Endpoints:**
- `GET /repairs` - Get all repairs (with filters)
- `GET /repairs/{id}` - Get repair by ID
- `POST /repairs` - Create repair
- `PUT /repairs/{id}` - Update repair
- `PATCH /repairs/{id}` - Partial update
- `DELETE /repairs/{id}` - Delete repair
- `POST /repairs/{id}/status` - Update status
- `POST /repairs/{id}/assign` - Assign to seamstress
- `GET /repairs/stats` - Get statistics
- `GET /repairs/{id}/history` - Get status history
- `GET /repairs/overdue` - Get overdue repairs
- `GET /repairs/due-today` - Get repairs due today
- `GET /repairs/reports` - Get report data

**Examples:**
```typescript
// Get all pending repairs
this.repairApiService.getByStatus(RepairStatus.PENDING).subscribe(repairs => {
  console.log('Pending repairs:', repairs);
});

// Create repair
const newRepair = {
  customer_name: 'Ana García',
  customer_phone: '5551234567',
  garment_type: 'Pantalón',
  repair_type: RepairType.HEM,
  description: 'Dobladillo de pantalón',
  estimated_price: 150,
  received_date: new Date().toISOString(),
  estimated_delivery_date: new Date(Date.now() + 3*24*60*60*1000).toISOString()
};
this.repairApiService.create(newRepair).subscribe(repair => {
  console.log('Repair created:', repair);
});

// Assign to seamstress
this.repairApiService.assignToSeamstress(repairId, seamstressId).subscribe(repair => {
  console.log('Repair assigned:', repair);
});

// Get statistics
this.repairApiService.getStats().subscribe(stats => {
  console.log('Stats:', stats);
  // { total: 100, pending: 20, in_progress: 30, ... }
});
```

## 📊 Data Transfer Objects (DTOs)

### Field Naming Convention

**Frontend (TypeScript):** camelCase
```typescript
customerName, customerPhone, estimatedPrice
```

**Backend (FastAPI/Python):** snake_case
```python
customer_name, customer_phone, estimated_price
```

The API services handle the conversion automatically.

### Example Mappings

**User:**
- Frontend: `isActive` → Backend: `is_active`
- Frontend: `createdAt` → Backend: `created_at`
- Frontend: `updatedAt` → Backend: `updated_at`

**Client:**
- Frontend: `fullName` → Backend: `full_name`
- Frontend: `personalPhone` → Backend: `personal_phone`
- Frontend: `contactPhone` → Backend: `contact_phone`
- Frontend: `birthDate` → Backend: `birth_date`

**Repair:**
- Frontend: `customerName` → Backend: `customer_name`
- Frontend: `customerPhone` → Backend: `customer_phone`
- Frontend: `garmentType` → Backend: `garment_type`
- Frontend: `repairType` → Backend: `repair_type`
- Frontend: `estimatedPrice` → Backend: `estimated_price`
- Frontend: `finalPrice` → Backend: `final_price`
- Frontend: `assignedTo.id` → Backend: `assigned_to_id`
- Frontend: `createdBy.id` → Backend: `created_by_id`
- Frontend: `receivedDate` → Backend: `received_date`
- Frontend: `estimatedDeliveryDate` → Backend: `estimated_delivery_date`
- Frontend: `actualDeliveryDate` → Backend: `actual_delivery_date`

## 🔄 Repository Pattern

Repositories provide an abstraction layer that automatically switches between mock and real API:

```typescript
@Injectable()
export class UserRepository {
  private useMockData = environment.enableMockData;

  constructor(
    private mockUserService: MockUserService,
    private userApiService: UserApiService
  ) {}

  getAll(): Observable<User[]> {
    return this.useMockData
      ? this.mockUserService.getAll()
      : this.userApiService.getAll();
  }
}
```

**Benefits:**
- Components don't need to know about API implementation
- Easy to switch between mock and real data
- Simplified testing
- Consistent interface

## 🛡️ Error Handling

### API Service

The base `ApiService` handles all HTTP errors:

```typescript
private handleError(error: any): Observable<never> {
  let errorMessage = 'An error occurred';
  
  if (error.error instanceof ErrorEvent) {
    // Client-side error
    errorMessage = `Error: ${error.error.message}`;
  } else {
    // Server-side error
    const apiError = error.error as ApiError;
    errorMessage = apiError?.error?.message || 
                   `Error Code: ${error.status}\nMessage: ${error.message}`;
  }

  console.error(errorMessage);
  return throwError(() => new Error(errorMessage));
}
```

### In Components

```typescript
this.repairApiService.create(repairData).subscribe({
  next: (repair) => {
    this.showSuccess('Repair created successfully');
  },
  error: (error) => {
    this.showError(error.message);
  }
});
```

## 🔒 Security

### CORS Configuration

Your FastAPI backend must allow requests from the Angular app:

```python
# FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Token Security

- Tokens stored in `localStorage` (consider `httpOnly` cookies for production)
- Tokens auto-refresh before expiration
- Automatic logout on token failure
- HTTPS required in production

## 🧪 Testing

### Development Mode (Mock Data)

```typescript
// environment.ts
enableMockData: true
```

No backend required. All data comes from mock services.

### Integration Testing

```typescript
// environment.ts
enableMockData: false
apiUrl: 'http://localhost:8000/api/v1'
```

Requires FastAPI backend running.

### Production

```typescript
// environment.prod.ts
enableMockData: false
apiUrl: 'https://api.alhilo.com/api/v1'
```

## 📝 FastAPI Backend Expected Responses

### Authentication Response
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Administrador",
    "is_active": true,
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  },
  "token": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

### Users List Response
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Administrador",
    "is_active": true,
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  }
]
```

### Paginated Response
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

## 🚀 Getting Started

1. **Configure environment:**
   ```typescript
   // environment.ts
   apiUrl: 'http://localhost:8000/api/v1'
   enableMockData: false
   ```

2. **Start FastAPI backend:**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

3. **Start Angular app:**
   ```bash
   npm run start
   ```

4. **Test authentication:**
   - Navigate to `/login`
   - Use credentials from your database
   - Check browser DevTools Network tab for API calls

## 🐛 Troubleshooting

### CORS Errors
- Ensure FastAPI has CORS middleware configured
- Check `allow_origins` includes your frontend URL

### 401 Unauthorized
- Check token in localStorage
- Verify token format in requests (Bearer token)
- Check token expiration

### Connection Refused
- Verify FastAPI is running on correct port
- Check `apiUrl` in environment
- Ensure no firewall blocking

### Switch to Mock Data
```typescript
// Temporarily use mock data
environment.enableMockData = true
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Angular HTTP Client](https: //angular.io/guide/http)
- [JWT Authentication](https://jwt.io/)
- [RxJS Observables](https://rxjs.dev/)

---

**Note:** All API services are ready to use. Just ensure your FastAPI backend implements the same endpoints with matching request/response structures.
