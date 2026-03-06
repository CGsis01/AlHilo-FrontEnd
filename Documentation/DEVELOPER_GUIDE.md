# Developer Guide - Al Hilo Frontend

## Table of Contents
1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [API Integration](#api-integration)
5. [Adding New Features](#adding-new-features)
6. [Styling Guide](#styling-guide)
7. [State Management](#state-management)
8. [Testing](#testing)

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Angular CLI 18

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Project Structure

### Clean Architecture Layers

```
src/app/
├── core/              # Application core (singleton services)
├── data/              # Data access layer
├── domain/            # Business logic layer
├── presentation/      # UI layer
└── shared/            # Shared utilities
```

### Core Layer
Contains singleton services, guards, and interceptors:
- **Services**: Auth, API, Theme
- **Guards**: Auth guard, Role guard
- **Interceptors**: HTTP auth interceptor
- **Models**: Domain entities
- **Interfaces**: Contracts

### Data Layer
Implements data access:
- **Repositories**: API communication
- Pattern: Repository pattern for clean separation

### Domain Layer
Business logic:
- **Use Cases**: Application business rules
- Pure logic, no framework dependencies

### Presentation Layer
UI components:
- **Layouts**: App structure (header, footer)
- **Pages**: Route components
- **Components**: Reusable UI elements

## Development Workflow

### Creating a New Page

1. **Generate component**
```bash
ng generate component presentation/pages/my-page --standalone
```

2. **Add route** in `app.routes.ts`:
```typescript
{
  path: 'my-page',
  loadComponent: () => import('./presentation/pages/my-page/my-page.component')
    .then(m => m.MyPageComponent),
  canActivate: [authGuard]
}
```

3. **Add navigation** in header component

### Creating a New Service

1. **Generate service**
```bash
ng generate service core/services/my-service
```

2. **Implement service** with dependency injection:
```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(private apiService: ApiService) {}
}
```

### Creating a Repository

1. **Create repository** in `data/repositories`:
```typescript
@Injectable({ providedIn: 'root' })
export class MyRepository implements Repository<MyEntity> {
  private readonly endpoint = '/my-entities';
  
  constructor(private apiService: ApiService) {}
  
  getAll(): Observable<MyEntity[]> {
    return this.apiService.get<MyEntity[]>(this.endpoint);
  }
}
```

## API Integration

### API Service
Base service for all HTTP calls:
```typescript
// GET request
this.apiService.get<Type>('/endpoint')

// POST request
this.apiService.post<Type>('/endpoint', data)

// PUT request
this.apiService.put<Type>('/endpoint', data)

// DELETE request
this.apiService.delete<Type>('/endpoint')
```

### Using Repositories
```typescript
constructor(private myRepository: MyRepository) {}

loadData(): void {
  this.myRepository.getAll().subscribe({
    next: (data) => console.log(data),
    error: (error) => console.error(error)
  });
}
```

### Error Handling
Errors are automatically handled by the API service:
- Network errors
- HTTP errors
- Server errors

## Adding New Features

### Step-by-Step Guide

1. **Define Model** (if needed)
```typescript
// core/models/my-entity.model.ts
export interface MyEntity {
  id: string;
  name: string;
}
```

2. **Create Repository**
```typescript
// data/repositories/my-entity.repository.ts
@Injectable({ providedIn: 'root' })
export class MyEntityRepository {
  // Implementation
}
```

3. **Create Use Case**
```typescript
// domain/usecases/my-entity.usecases.ts
@Injectable({ providedIn: 'root' })
export class MyEntityUseCases {
  constructor(private repository: MyEntityRepository) {}
}
```

4. **Create Component**
```typescript
// presentation/pages/my-feature/my-feature.component.ts
@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [CommonModule]
})
export class MyFeatureComponent {
  constructor(private useCases: MyEntityUseCases) {}
}
```

5. **Add Route**
```typescript
// app.routes.ts
{
  path: 'my-feature',
  loadComponent: () => import('./presentation/pages/my-feature/my-feature.component')
}
```

## Styling Guide

### CSS Variables
Use CSS variables for theming:
```scss
.my-component {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
}
```

### Available Variables
```scss
// Colors
--gold
--gold-dark
--gold-light
--nude
--nude-light
--white
--black

// Theme-specific
--background
--surface
--text
--text-secondary
--border
--hover
```

### Component Styles
```scss
.component {
  // Layout
  display: flex;
  gap: 1rem;
  
  // Responsive
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  // Dark mode compatible
  background: var(--surface);
  color: var(--text);
}
```

### Responsive Design
```scss
// Mobile first
.container {
  padding: 1rem;
  
  // Tablet
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  // Desktop
  @media (min-width: 1024px) {
    padding: 3rem;
  }
}
```

## State Management

### Auth State
```typescript
// Subscribe to auth state
this.authService.currentUser$.subscribe(user => {
  console.log('Current user:', user);
});

// Check authentication
if (this.authService.isAuthenticated()) {
  // User is logged in
}

// Check role
if (this.authService.hasRole(UserRole.ADMINISTRATOR)) {
  // User is admin
}
```

### Theme State
```typescript
// Subscribe to theme
this.themeService.theme$.subscribe(theme => {
  console.log('Current theme:', theme);
});

// Toggle theme
this.themeService.toggleTheme();

// Set specific theme
this.themeService.setTheme('dark');
```

## Testing

### Unit Tests
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run e2e
```

### Writing Tests
```typescript
describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Best Practices

### TypeScript
- Use strong typing
- Avoid `any` type
- Use interfaces for data structures
- Use enums for constants

### RxJS
- Always unsubscribe from observables
- Use async pipe in templates when possible
- Use operators for transformation

### Components
- Keep components small and focused
- Use standalone components
- Implement OnDestroy for cleanup
- Use ChangeDetectionStrategy.OnPush when possible

### Forms
- Use Reactive Forms
- Implement form validation
- Show clear error messages
- Disable submit while loading

### Security
- Never store sensitive data in localStorage
- Use HTTP-only cookies for tokens
- Validate all user input
- Use role guards for protected routes

## Common Tasks

### Add New Menu Item
Edit `header.component.ts`:
```typescript
menuItems: MenuItem[] = [
  {
    label: 'My Page',
    route: '/my-page',
    icon: '🎯',
    roles: [UserRole.ADMINISTRATOR]
  }
];
```

### Add New User Role
1. Update `UserRole` enum in `core/models/user.model.ts`
2. Update role guard permissions
3. Update header menu items

### Change Theme Colors
Update CSS variables in `styles.scss`:
```scss
:root {
  --gold: #your-color;
  --nude: #your-color;
}
```

### Add New API Endpoint
1. Add method to repository
2. Add business logic to use case
3. Call from component

## Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf node_modules dist .angular
npm install
```

### Port Already in Use
```bash
# Change port in package.json
"start": "ng serve --port 4201"
```

### Module Not Found
```bash
# Check tsconfig.json paths
# Restart IDE
# Reinstall dependencies
```

## Resources

- [Angular Documentation](https://angular.dev)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

Happy coding! 🧵✨
