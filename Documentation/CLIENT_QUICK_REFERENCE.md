# Quick Reference - Client Management Feature

## 🎯 Quick Start

### To Test the Feature:
1. Run `npm start`
2. Login with any user (Admin or Receptionist role)
3. Click "Nueva Compostura" or navigate to `/repairs/new`
4. Try these test phone numbers:
   - **5551234567** → María García López (exists)
   - **5552345678** → Juan Pérez Martínez (exists)
   - **5553456789** → Ana Rodríguez Silva (exists)
   - **9999999999** → Will trigger "Create Client" flow

## 📋 Client Data Fields

### Required Fields (*)
- Full Name
- Address
- Personal Phone (10 digits)
- Contact Phone (10 digits)

### Optional Fields
- Email
- Facebook
- Instagram
- Birth Date

## 🔍 Search Behavior

| User Action | System Response |
|-------------|----------------|
| Types < 10 digits | No search triggered |
| Types exactly 10 digits | Auto-search after 500ms |
| Client found | Auto-fill + ✓ + success message + lock fields |
| Client not found | Show info message + auto-open modal (300ms) |
| Modal opens | Phone pre-filled in form |
| Client created | Auto-fill + lock fields + success message |

## 💻 Code Locations

### Need to modify search logic?
`src/app/presentation/pages/repair-form/repair-form.component.ts`
- Line 52: Phone field value change subscription
- Line 64: `searchClientByPhone()` method
- Line 77: Auto-open modal timeout (300ms)

### Need to modify client form?
`src/app/presentation/components/client-modal/client-modal.component.html`

### Need to add/modify client data?
`src/app/core/services/mock-client.service.ts`
- Lines 12-47: Sample client data

### Need to modify validation?
`src/app/presentation/components/client-modal/client-modal.component.ts`
- Lines 32-42: Form validators

## 🎨 Styling

### Phone Input with Search Indicators
`src/app/presentation/pages/repair-form/repair-form.component.scss`
- Lines 48-92: `.phone-input-wrapper` styles
- Search icons (🔍, ✓)
- Green border when found
- Read-only styling

## 🔧 Common Customizations

### Change Modal Auto-Open Delay
`repair-form.component.ts` line 77:
```typescript
setTimeout(() => this.openClientModal(), 300); // Change to desired milliseconds
```

### Change Phone Number Length
1. Update validators: `Validators.pattern(/^\d{10}$/)`
2. Update maxlength: `maxlength="10"`
3. Update placeholder text

### Add New Client Field
1. Add to model: `client.model.ts`
2. Add to form: `client-modal.component.ts` (ngOnInit)
3. Add to HTML: `client-modal.component.html`
4. Update service: `mock-client.service.ts`

### Change Debounce Time
`repair-form.component.ts` line 54:
```typescript
debounceTime(500) // Change to desired milliseconds
```

### Disable Auto-Open Modal
`repair-form.component.ts` - Remove/comment lines 76-77:
```typescript
// setTimeout(() => this.openClientModal(), 300);
```

## 📱 Responsive Breakpoints

- **Desktop**: > 768px (two-column layouts)
- **Mobile**: ≤ 768px (single-column, full-screen modal)

## 🐛 Common Issues & Solutions

### Issue: Search doesn't trigger
**Solution**: Ensure exactly 10 digits are entered, wait 500ms after typing stops

### Issue: Modal doesn't open automatically
**Solution**: Check browser console for errors, verify timeout is not blocked

### Issue: Client data doesn't auto-fill
**Solution**: Check `fillClientData()` method in repair-form component, verify fields are not disabled initially

### Issue: Can't edit client fields after search
**Solution**: This is intentional - fields lock after client is found to prevent data inconsistency. To change client, clear phone and search again.

### Issue: Form validation not working
**Solution**: Check form validators in client-modal component ngOnInit

### Issue: Modal opens immediately
**Solution**: Check the timeout value (should be 300ms), may be too fast for some users

## 📊 Mock Data Structure

```typescript
{
  id: string,
  fullName: string,
  address: string,
  personalPhone: string,     // 10 digits
  contactPhone: string,      // 10 digits
  email?: string,            // Optional
  facebook?: string,         // Optional
  instagram?: string,        // Optional
  birthDate?: Date,          // Optional
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Ready to Connect to Real API?

Replace mock service calls in:
1. `client.repository.ts` - Point to HTTP client
2. Create `client.service.ts` - API endpoints
3. Update environment variables with API URL

## 📖 Full Documentation

- **Feature Overview**: `Documentation/CLIENT_MANAGEMENT_FEATURE.md`
- **Visual Guide**: `Documentation/CLIENT_SEARCH_VISUAL_GUIDE.md`
- **Complete Summary**: `Documentation/CLIENT_MANAGEMENT_SUMMARY.md`
- **This Quick Ref**: `Documentation/CLIENT_QUICK_REFERENCE.md`

---

**Need Help?** Check the full documentation files listed above for detailed information.
