# Al Hilo - Frontend Application

Angular 18 application for Al Hilo clothing repair company.

## Features

- ✅ Clean Architecture (Domain, Data, Presentation layers)
- ✅ Role-based access (Administrator, Receptionist/Cashier, Seamstress)
- ✅ Responsive design with collapsible top menu
- ✅ Dark mode support
- ✅ Minimalist aesthetic (White, Nude, Gold colors)
- ✅ API-ready with service classes
- ✅ TypeScript strict mode
- ✅ Path aliases for clean imports

## Prerequisites

- Node.js 18+ 
- npm 9+
- PowerShell 7+ (for Windows)
- Angular CLI 18+

## Installation

### Windows Users
1. Install PowerShell 7: https://aka.ms/powershell
2. Run setup script: `setup.bat`
3. Install dependencies: `npm install`
4. Install Angular CLI: `npm install -g @angular/cli@18`

### All Platforms
```bash
npm install
npm install -g @angular/cli@18
```

## Development

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Build

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── core/              # Singleton services, guards, interceptors
│   │   ├── guards/        # Route guards
│   │   ├── interceptors/  # HTTP interceptors
│   │   └── services/      # Core services (auth, theme, etc.)
│   ├── shared/            # Shared components, directives, pipes
│   │   ├── components/    # Reusable UI components
│   │   ├── directives/    # Custom directives
│   │   └── pipes/         # Custom pipes
│   ├── domain/            # Business logic layer
│   │   ├── models/        # Domain entities
│   │   └── repositories/  # Repository interfaces
│   ├── data/              # Data access layer
│   │   ├── api/           # API service classes
│   │   └── repositories/  # Repository implementations
│   └── features/          # Feature modules
│       ├── auth/          # Authentication
│       ├── dashboard/     # Dashboard views
│       ├── orders/        # Order management
│       └── users/         # User management
├── assets/                # Static assets
└── environments/          # Environment configurations
```

## Architecture

### Clean Architecture Layers

1. **Domain Layer** (`@domain/*`)
   - Pure business logic
   - Domain entities and models
   - Repository interfaces
   - No framework dependencies

2. **Data Layer** (`@data/*`)
   - API communications
   - Repository implementations
   - DTOs and mappers
   - External service integrations

3. **Presentation Layer** (`@features/*`)
   - UI components
   - View models
   - User interactions
   - Feature modules

4. **Core Layer** (`@core/*`)
   - Singletons (auth, theme, etc.)
   - Guards and interceptors
   - App-wide services

5. **Shared Layer** (`@shared/*`)
   - Reusable components
   - Common directives and pipes
   - UI utilities

## User Roles

- **Administrator**: Full system access
- **Receptionist/Cashier**: Order management, customer service
- **Seamstress**: Work queue, order updates

## Theme

- Primary: Gold (#D4AF37)
- Secondary: Nude (#E8D5C4)
- Background: White (#FFFFFF)
- Text: Dark Gray (#333333)
- Dark Mode: Automatic color inversion with theme service

## API Integration

All API services extend BaseApiService with:
- Automatic error handling
- Request/response interceptors
- Authentication headers
- Environment-based URLs

## Code Style

- TypeScript strict mode enabled
- ESLint configuration included
- Consistent naming conventions
- Clean code principles

## License

Proprietary - Al Hilo Company
