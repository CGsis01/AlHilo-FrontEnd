# FastAPI Backend Endpoints Reference

This document lists all API endpoints that the FastAPI backend should implement to integrate with the Angular frontend.

## Base URL

- **Development:** `http://localhost:8000/api/v1`
- **Production:** `https://api.alhilo.com/api/v1`

## 🔐 Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@alhilo.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@alhilo.com",
    "role": "Administrador",
    "is_active": true,
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  },
  "token": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### POST /auth/register
Register a new user (Admin only).

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "secure123",
  "role": "Recepcionista"
}
```

**Response (201):** Same as login

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):** Same as login

### POST /auth/logout
Logout and invalidate tokens.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Admin User",
  "email": "admin@alhilo.com",
  "role": "Administrador",
  "is_active": true,
  "created_at": "2026-02-16T00:00:00Z",
  "updated_at": "2026-02-16T00:00:00Z"
}
```

### POST /auth/change-password
Change user password.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "old_password": "oldpass123",
  "new_password": "newpass123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

## 👥 User Endpoints

### GET /users
Get all users with optional filters.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `role` (optional): Filter by role (Administrador, Recepcionista, Costurera)
- `is_active` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or email
- `page` (optional): Page number for pagination
- `page_size` (optional): Items per page

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "role": "Recepcionista",
    "is_active": true,
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  }
]
```

### GET /users/{id}
Get user by ID.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Single user object

### POST /users
Create new user.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "secure123",
  "role": "Recepcionista",
  "is_active": true
}
```

**Response (201):** Created user object

### PUT /users/{id}
Update user completely.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "Recepcionista",
  "is_active": true
}
```

**Response (200):** Updated user object

### PATCH /users/{id}
Partially update user.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "is_active": false
}
```

**Response (200):** Updated user object

### DELETE /users/{id}
Delete user (soft delete).

**Headers:** `Authorization: Bearer {token}`

**Response (204):** No content

### POST /users/{id}/activate
Activate user.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Updated user object

### POST /users/{id}/deactivate
Deactivate user.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Updated user object

## 👤 Client Endpoints

### GET /clients
Get all clients with optional filters.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `search` (optional): Search by name, phone, or email
- `phone` (optional): Specific phone search
- `page` (optional): Page number
- `page_size` (optional): Items per page

**Response (200):**
```json
[
  {
    "id": "uuid",
    "full_name": "María López",
    "address": "Calle Principal 123",
    "personal_phone": "5551234567",
    "contact_phone": "5559876543",
    "email": "maria@example.com",
    "facebook": "@maria.lopez",
    "instagram": "@maria_lopez",
    "birth_date": "1990-05-15",
    "created_at": "2026-02-16T00:00:00Z",
    "updated_at": "2026-02-16T00:00:00Z"
  }
]
```

### GET /clients/{id}
Get client by ID.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Single client object

### GET /clients/search/phone
Search client by phone.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `phone`: Phone number to search

**Response (200):** Single client object or null

### GET /clients/search/name
Search clients by name.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `name`: Name to search

**Response (200):** Array of matching clients

### POST /clients
Create new client.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "full_name": "María López",
  "address": "Calle Principal 123",
  "personal_phone": "5551234567",
  "contact_phone": "5559876543",
  "email": "maria@example.com",
  "facebook": "@maria.lopez",
  "instagram": "@maria_lopez",
  "birth_date": "1990-05-15"
}
```

**Response (201):** Created client object

### PUT /clients/{id}
Update client.

**Headers:** `Authorization: Bearer {token}`

**Request:** Same as POST

**Response (200):** Updated client object

### PATCH /clients/{id}
Partially update client.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "email": "newemail@example.com"
}
```

**Response (200):** Updated client object

### DELETE /clients/{id}
Delete client.

**Headers:** `Authorization: Bearer {token}`

**Response (204):** No content

### GET /clients/{id}/repairs
Get client's repair history.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Array of repairs

### GET /clients/birthdays/upcoming
Get clients with upcoming birthdays.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `days` (optional): Number of days ahead (default: 30)

**Response (200):** Array of clients

## 🔧 Repair Endpoints

### GET /repairs
Get all repairs with optional filters.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional): Pendiente, En progreso, Completada, Entregada, Cancelada
- `repair_type` (optional): Costura, Cremallera, Botón, Dobladillo, Parche, Ajuste, Otro
- `assigned_to_id` (optional): Filter by assigned user
- `created_by_id` (optional): Filter by creator
- `client_id` (optional): Filter by client
- `customer_phone` (optional): Filter by customer phone
- `search` (optional): Search by customer name, phone, or garment
- `date_from` (optional): Start date (ISO format)
- `date_to` (optional): End date (ISO format)
- `page` (optional): Page number
- `page_size` (optional): Items per page

**Response (200):**
```json
[
  {
    "id": "uuid",
    "customer_name": "Ana García",
    "customer_phone": "5551234567",
    "customer_email": "ana@example.com",
    "client_id": "uuid",
    "garment_type": "Pantalón",
    "repair_type": "Dobladillo",
    "description": "Dobladillo de pantalón largo",
    "status": "En progreso",
    "estimated_price": 150.00,
    "final_price": 150.00,
    "assigned_to_id": "uuid",
    "assigned_to": {
      "id": "uuid",
      "name": "Seamstress Name",
      "email": "seamstress@example.com",
      "role": "Costurera"
    },
    "created_by_id": "uuid",
    "created_by": {
      "id": "uuid",
      "name": "Receptionist Name",
      "email": "receptionist@example.com",
      "role": "Recepcionista"
    },
    "received_date": "2026-02-16T10:00:00Z",
    "estimated_delivery_date": "2026-02-19T10:00:00Z",
    "actual_delivery_date": null,
    "notes": "Cliente quiere entrega urgente",
    "created_at": "2026-02-16T10:00:00Z",
    "updated_at": "2026-02-16T10:00:00Z"
  }
]
```

### GET /repairs/{id}
Get repair by ID.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Single repair object with nested user objects

### POST /repairs
Create new repair.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "customer_name": "Ana García",
  "customer_phone": "5551234567",
  "customer_email": "ana@example.com",
  "client_id": "uuid",
  "garment_type": "Pantalón",
  "repair_type": "Dobladillo",
  "description": "Dobladillo de pantalón largo",
  "status": "Pendiente",
  "estimated_price": 150.00,
  "assigned_to_id": "uuid",
  "received_date": "2026-02-16T10:00:00Z",
  "estimated_delivery_date": "2026-02-19T10:00:00Z",
  "notes": "Cliente quiere entrega urgente"
}
```

**Response (201):** Created repair object

### PUT /repairs/{id}
Update repair completely.

**Headers:** `Authorization: Bearer {token}`

**Request:** Same as POST

**Response (200):** Updated repair object

### PATCH /repairs/{id}
Partially update repair.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "status": "Completada",
  "final_price": 175.00,
  "notes": "Trabajo completado"
}
```

**Response (200):** Updated repair object

### DELETE /repairs/{id}
Delete repair.

**Headers:** `Authorization: Bearer {token}`

**Response (204):** No content

### POST /repairs/{id}/status
Update repair status.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "status": "En progreso",
  "notes": "Iniciando trabajo"
}
```

**Response (200):** Updated repair object

### POST /repairs/{id}/assign
Assign repair to seamstress.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "assigned_to_id": "uuid"
}
```

**Response (200):** Updated repair object

### GET /repairs/stats
Get repair statistics.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:** Same filters as GET /repairs

**Response (200):**
```json
{
  "total": 250,
  "pending": 45,
  "in_progress": 78,
  "completed": 95,
  "delivered": 30,
  "cancelled": 2
}
```

### GET /repairs/{id}/history
Get repair status change history.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id": "uuid",
    "repair_id": "uuid",
    "user_id": "uuid",
    "user_name": "Admin User",
    "previous_status": "Pendiente",
    "new_status": "En progreso",
    "comment": "Iniciando trabajo",
    "created_at": "2026-02-16T10:00:00Z"
  }
]
```

### GET /repairs/overdue
Get overdue repairs (past estimated delivery date).

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Array of repair objects

### GET /repairs/due-today
Get repairs due today.

**Headers:** `Authorization: Bearer {token}`

**Response (200):** Array of repair objects

### GET /repairs/reports
Get report data for analytics.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `date_from`: Start date (ISO format)
- `date_to`: End date (ISO format)

**Response (200):**
```json
{
  "total_repairs": 150,
  "total_revenue": 45000.00,
  "average_price": 300.00,
  "repairs_by_type": {
    "Dobladillo": 50,
    "Costura": 40,
    "Cremallera": 30,
    "Botón": 20,
    "Ajuste": 10
  },
  "repairs_by_status": {
    "Pendiente": 20,
    "En progreso": 40,
    "Completada": 60,
    "Entregada": 30
  },
  "revenue_by_day": [
    {"date": "2026-02-16", "revenue": 1500.00, "count": 5},
    {"date": "2026-02-17", "revenue": 2200.00, "count": 7}
  ]
}
```

## Paginated Response Format

When using pagination (`page` and `page_size` query parameters), responses should follow this format:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## 📝 Notes

1. **Date Format:** All dates should be in ISO 8601 format: `2026-02-16T10:00:00Z`
2. **Authentication:** All endpoints (except `/auth/login` and `/auth/register`) require Bearer token
3. **Role Values:** Must be exactly: `Administrador`, `Recepcionista`, `Costurera`
4. **Status Values:** Must be exactly: `Pendiente`, `En progreso`, `Completada`, `Entregada`, `Cancelada`
5. **Repair Type Values:** Must be exactly: `Costura`, `Cremallera`, `Botón`, `Dobladillo`, `Parche`, `Ajuste`, `Otro`
6. **Field Names:** Use snake_case (Python convention) in API, frontend will convert to camelCase
7. **Nested Objects:** When returning repairs, include nested user objects for `assigned_to` and `created_by`
8. **UUIDs:** Use UUID v4 for all ID fields
9. **Soft Delete:** DELETE endpoints should implement soft delete (set `is_active = false` or similar)
10. **CORS:** Enable CORS for the frontend origin (`http://localhost:4200` for dev)

## 🔒 Security Requirements

1. **JWT Authentication:** Use JWT tokens with expiration
2. **Password Hashing:** Use bcrypt or similar for password storage
3. **HTTPS:** Required in production
4. **Rate Limiting:** Implement rate limiting for auth endpoints
5. **Input Validation:** Validate all inputs using Pydantic models
6. **SQL Injection:** Use parameterized queries (SQLAlchemy handles this)
7. **CORS:** Restrict origins to specific domains

## 🛠️ FastAPI Implementation Example

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

app = FastAPI(title="AL HILO API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication example
@app.post("/api/v1/auth/login")
async def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    return {
        "user": user,
        "token": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "expiresIn": 3600
        }
    }
```

For complete FastAPI implementation examples, refer to the FastAPI documentation and the database schema from Liquibase.
