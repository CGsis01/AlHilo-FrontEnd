# Mock Data & Test Credentials

## 🔐 Test User Credentials

The application comes with three pre-configured user accounts for testing different roles:

### 1. Administrator Account
- **Email:** `admin@alhilo.com`
- **Password:** `admin123`
- **Name:** María García
- **Access:** Full system access
  - View all repairs
  - Create/edit repairs
  - Manage users
  - View reports
  - All administrative functions

### 2. Receptionist Account
- **Email:** `receptionist@alhilo.com`
- **Password:** `receptionist123`
- **Name:** Carlos Rodríguez
- **Access:** Customer service operations
  - View all repairs
  - Create new repairs
  - Update repair status
  - View reports
  - Cannot manage users

### 3. Seamstress Account
- **Email:** `seamstress@alhilo.com`
- **Password:** `seamstress123`
- **Name:** Ana Martínez
- **Access:** Workshop operations
  - View assigned repairs
  - Update repair status
  - Mark repairs as complete
  - Cannot create repairs
  - Cannot manage users

## 📊 Mock Data

### Repair Orders (8 items)
The application includes 8 sample repair orders with different statuses:

1. **Pending Repairs (3)**
   - Juan Pérez - Zipper repair on jacket
   - Laura Martín - Jeans waist resize
   - Isabel Romero - Skirt hem adjustment

2. **In Progress Repairs (2)**
   - María López - Dress hem shortening
   - Pedro Sánchez - Coat patch repair

3. **Completed Repairs (2)**
   - Carlos Ruiz - Pants seam repair
   - Ana Fernández - Button replacement

4. **Delivered Repairs (1)**
   - Diego Torres - Blazer shoulder seam

### User Accounts (5 items)
1. María García - Administrator (Active)
2. Carlos Rodríguez - Receptionist (Active)
3. Ana Martínez - Seamstress (Active)
4. Luis Hernández - Seamstress (Active)
5. Elena Ruiz - Receptionist (Inactive)

## 🎨 Testing Different Roles

### Testing Administrator Features
1. Login with `admin@alhilo.com / admin123`
2. You should see:
   - Dashboard with all statistics
   - Access to "Users" menu item
   - "New Repair" button
   - Full navigation menu

### Testing Receptionist Features
1. Login with `receptionist@alhilo.com / receptionist123`
2. You should see:
   - Dashboard with statistics
   - "New Repair" button
   - No "Users" menu item
   - Limited navigation menu

### Testing Seamstress Features
1. Login with `seamstress@alhilo.com / seamstress123`
2. You should see:
   - Dashboard with statistics
   - View repairs (read-only mostly)
   - No "New Repair" button
   - No "Users" menu item
   - Limited navigation menu

## 🔧 How Mock Data Works

### Authentication
- Uses `MockAuthService` instead of real API
- Simulates network delay (800ms)
- Validates credentials against mock user database
- Generates mock JWT tokens
- Stores authentication state in localStorage

### Repairs
- Uses `MockRepairService` for all repair operations
- Data persists during session (in memory)
- Simulates network delays (300-800ms)
- Supports all CRUD operations
- Resets when page is refreshed

### Users
- Uses `MockUserService` for user management
- Pre-populated with 5 test users
- Simulates network delays (300-800ms)
- Supports all CRUD operations
- Resets when page is refreshed

## 📝 Creating New Mock Data

### Adding a New Test User
Edit `src/app/core/services/mock-auth.service.ts`:

```typescript
{
  email: 'newuser@alhilo.com',
  password: 'password123',
  user: {
    id: '4',
    name: 'New User',
    email: 'newuser@alhilo.com',
    role: UserRole.RECEPTIONIST,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
```

### Adding a New Repair Order
Edit `src/app/core/services/mock-repair.service.ts`:

```typescript
{
  id: '9',
  customerName: 'Customer Name',
  customerPhone: '+34 600 000 000',
  garmentType: 'Shirt',
  repairType: RepairType.BUTTON,
  description: 'Description here',
  status: RepairStatus.PENDING,
  estimatedPrice: 15.00,
  // ... other fields
}
```

## 🚀 Switching to Real API

When you're ready to connect to a real backend:

1. **Remove mock services from repositories:**

In `repair.repository.ts`:
```typescript
// Change from:
constructor(private mockRepairService: MockRepairService) {}

// To:
constructor(private apiService: ApiService) {}
```

2. **Update AuthService:**

In `auth.service.ts`:
```typescript
// Change from:
constructor(private mockAuthService: MockAuthService, ...)

// To:
constructor(private apiService: ApiService, ...)
```

3. **Configure API URL:**

In `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://your-backend-api.com/api'
};
```

## 🎯 Features You Can Test

### With Any Role:
- ✅ Login/Logout
- ✅ Theme toggle (dark/light mode)
- ✅ Dashboard statistics
- ✅ View repairs list
- ✅ Filter repairs by status
- ✅ Responsive menu

### With Admin or Receptionist:
- ✅ Create new repair order
- ✅ View all repair details
- ✅ Access reports menu

### With Admin Only:
- ✅ View users list
- ✅ See all user roles and statuses
- ✅ Full system access

## 📱 Mobile Testing

Test the responsive design:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device
4. Test:
   - Collapsible hamburger menu
   - Touch-friendly buttons
   - Responsive cards
   - Mobile form layouts

## 💡 Tips

- **Quick Login:** Copy-paste credentials from the login page
- **Data Persistence:** Mock data resets on page refresh
- **Role Testing:** Use multiple browser tabs to test different roles simultaneously
- **Network Simulation:** Mock services include realistic delays
- **Error Testing:** Try wrong credentials to test error handling

## 🐛 Known Limitations

- Data doesn't persist across page refreshes
- No real backend validation
- Mock tokens are not real JWT tokens
- No actual email sending
- No file uploads
- Pagination is simulated (all items returned)

## 🔄 Next Steps

Once you have a real backend:
1. Replace mock services with API calls
2. Update environment configuration
3. Test with real data
4. Add error handling for network issues
5. Implement proper authentication flow
6. Add data persistence

---

**Happy Testing!** 🧵✨

If you encounter any issues with mock data, check the browser console for error messages.
