# Client Search and Creation - Visual Guide

## Screen Flow

### 1. Initial State - Empty Form
```
┌─────────────────────────────────────────────────────────┐
│ Nueva Orden de Reparación                               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Información del Cliente                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Nombre del Cliente *                                │ │
│ │ [Se llenará automáticamente_______________]        │ │
│ │                                                     │ │
│ │ Teléfono *                                          │ │
│ │ [Ingrese 10 dígitos para buscar___________]        │ │
│ │                                                     │ │
│ │ Email                                               │ │
│ │ [Email del cliente (opcional)______________]       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2. Searching State
```
┌─────────────────────────────────────────────────────────┐
│ Información del Cliente                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Teléfono *                                          │ │
│ │ [5551234567                              ] 🔍      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3. Client Found - Auto-filled
```
┌─────────────────────────────────────────────────────────┐
│ Información del Cliente                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Nombre del Cliente *                                │ │
│ │ [María García López___________________] (readonly) │ │
│ │                                                     │ │
│ │ Teléfono *                                          │ │
│ │ [5551234567                              ] ✓       │ │
│ │ ✓ Cliente encontrado                                │ │
│ │                                                     │ │
│ │ Email                                               │ │
│ │ [maria.garcia@email.com_______________] (readonly) │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4. Client Not Found - Modal Auto-Opens
```
┌─────────────────────────────────────────────────────────┐
│ Información del Cliente                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Teléfono *                                          │ │
│ │ [9999999999                              ]         │ │
│ │ Cliente no encontrado - Abriendo formulario...     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│   ┌─────────────────────────────────────────────────┐   │
│   │ Crear Nuevo Cliente                          × │   │
│   ├─────────────────────────────────────────────────┤   │
│   │ [Modal appears automatically...]                │   │
│   │                                                   │   │
│   │ Teléfono Personal: [9999999999] (pre-filled)   │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Field States

### Phone Input States

**Empty State**
- Normal border
- Placeholder: "Ingrese 10 dígitos para buscar"
- Editable

**Searching State** 
- 🔍 icon appears on the right
- Input remains editable

**Client Found State**
- ✓ Green checkmark appears
- Green border and subtle green background
- Success message below
- Fields auto-fill and become read-only

**Client Not Found State**
- Info message appears
- "Abriendo formulario..." message
- Modal opens automatically after 300ms

### Name and Email Fields

**Before Client Selection**
- Editable but placeholder suggests auto-fill
- "Se llenará automáticamente"

**After Client Selection**
- Auto-filled with client data
- Read-only (grayed out background)
- Cannot be edited to prevent data inconsistency

### Phone Validation
- Must be exactly 10 digits
- Only numbers allowed
- Maxlength prevents more than 10 characters

### Email Validation
- Must match email format
- Optional field (can be left blank)
- Shows "Ingrese un email válido" if format is wrong

## Button States

### "Crear Cliente" Button (in modal)
- Primary button (gold gradient)
- Disabled when form is invalid
- Shows "Creando..." when submitting

### "Crear Reparación" Button (main form)
- Disabled until client is selected (found or created)
- Disabled when form is invalid
- Shows "Creando..." when submitting

## User Flow Diagram

```
Start Creating Repair
        ↓
Enter Phone Number (in phone field)
        ↓
Type 10 digits
        ↓
    [Auto-Search]
    ↙           ↘
Found           Not Found
  ↓               ↓
Show ✓          Show Info Message
  ↓               ↓
Auto-fill       Auto-open Modal
Name & Email    (after 300ms)
  ↓               ↓
Fields locked   Phone pre-filled
  ↓               ↓
  ↓           Fill Remaining Info
  ↓               ↓
  ↓           Submit Modal
  ↓               ↓
  ↓           Client Created
  ↓               ↓
  └───────────────┘
        ↓
Client Ready
        ↓
Fill Repair Details
        ↓
Submit Repair
        ↓
    Success!
```

## Keyboard Shortcuts & Accessibility

- **Tab**: Navigate between fields
- **Enter**: Submit form (when focused on submit button)
- **Escape**: Close modal (when modal is open)
- **Click outside modal**: Close modal

## Responsive Behavior

### Desktop (> 768px)
- Two-column layout for phone fields
- Two-column layout for social media fields
- Modal centered on screen
- Wider input fields

### Mobile (≤ 768px)
- Single column layout
- Full-width modal
- Stacked form fields
- Touch-friendly button sizes
```
