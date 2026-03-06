# 🎨 Custom Fonts - Al Hilo

## Fonts Added

Two custom fonts have been integrated into the Al Hilo application:

### 1. Glacial Indifference
- **Type:** Sans-serif
- **Usage:** Body text, UI elements, forms
- **Weights:** Regular (400), Bold (700)
- **Files:** 
  - GlacialIndifference-Regular.otf
  - GlacialIndifference-Bold.otf
- **Location:** `src/assets/fonts/glacial-indifference/`

**Characteristics:**
- Clean and modern
- Excellent readability
- Perfect for UI elements
- Professional appearance

### 2. Higuen Serif
- **Type:** Serif
- **Usage:** Headings, logo, titles
- **Weight:** Regular (400)
- **File:** Higuen Serif.otf
- **Location:** `src/assets/fonts/higuen/`

**Characteristics:**
- Elegant and sophisticated
- Distinctive character
- Perfect for branding
- Adds personality

## Font Application

### CSS Variables
```scss
:root {
  --font-primary: 'Glacial Indifference', sans-serif;
  --font-heading: 'Higuen Serif', Georgia, serif;
  --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Usage in Components

**Body Text:**
```scss
body {
  font-family: var(--font-primary);
}
```

**Headings:**
```scss
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

**System Fallback:**
```scss
.component {
  font-family: var(--font-system);
}
```

## Where Fonts Are Used

### Glacial Indifference (Primary Font)
- ✅ Body text throughout the app
- ✅ Navigation menu items
- ✅ Form labels and inputs
- ✅ Button text
- ✅ Table content
- ✅ Card descriptions
- ✅ Status badges
- ✅ User information

### Higuen Serif (Heading Font)
- ✅ "Al Hilo" logo/brand name
- ✅ Page headings (h1, h2, h3)
- ✅ Section titles
- ✅ Dashboard statistics
- ✅ Card headers
- ✅ Modal titles

## Visual Hierarchy

```
┌─────────────────────────────────────┐
│  Al Hilo (Higuen Serif - Logo)      │
│  ═════════════════════════════════  │
│                                     │
│  Dashboard (Higuen Serif - H1)      │
│  Welcome back! (Glacial - Body)     │
│                                     │
│  Total Repairs (Higuen - H2)        │
│  124 (Glacial - Number)             │
│                                     │
└─────────────────────────────────────┘
```

## Typography Scale

### Headings (Higuen Serif)
```scss
h1 { font-size: 2rem; }      // Page titles
h2 { font-size: 1.5rem; }    // Section titles
h3 { font-size: 1.25rem; }   // Subsection titles
h4 { font-size: 1.1rem; }    // Card titles
h5 { font-size: 1rem; }      // Minor headings
h6 { font-size: 0.9rem; }    // Smallest headings
```

### Body Text (Glacial Indifference)
```scss
body { font-size: 1rem; }       // Normal text
small { font-size: 0.875rem; }  // Small text
.large { font-size: 1.125rem; } // Large text
```

## Font Loading Strategy

**font-display: swap**
- Shows fallback font immediately
- Swaps to custom font when loaded
- Prevents invisible text (FOIT)
- Improves perceived performance

## Browser Support

✅ **Modern Browsers:**
- Chrome 4+
- Firefox 3.5+
- Safari 3.1+
- Edge (all versions)
- Opera 10+

✅ **Format:**
- OpenType (.otf) - Universal support
- Fallback fonts defined for older browsers

## Performance

### Font Files
- Glacial Indifference Regular: ~38KB
- Glacial Indifference Bold: ~39KB
- Higuen Serif: ~52KB
- **Total:** ~129KB (compressed)

### Loading Optimization
```scss
font-display: swap;  // Immediate fallback display
```

## Customization

### Changing Primary Font
Edit `src/assets/fonts/fonts.scss`:
```scss
:root {
  --font-primary: 'Your Font', sans-serif;
}
```

### Changing Heading Font
```scss
:root {
  --font-heading: 'Your Heading Font', serif;
}
```

### Adding Font Variants
```scss
@font-face {
  font-family: 'Glacial Indifference';
  src: url('/assets/fonts/glacial-indifference/GlacialIndifference-Italic.otf');
  font-weight: 400;
  font-style: italic;
}
```

## Font Pairing

**Why These Fonts Work Together:**

1. **Contrast:** Serif headings + sans-serif body creates visual hierarchy
2. **Harmony:** Both fonts share similar proportions
3. **Readability:** Glacial for long-form content
4. **Personality:** Higuen adds elegance without sacrificing legibility
5. **Modern:** Both are contemporary designs

## Usage Examples

### Component Header
```html
<div class="header">
  <h1>Al Hilo</h1>           <!-- Higuen Serif -->
  <p class="tagline">         <!-- Glacial Indifference -->
    Clothing Repair Service
  </p>
</div>
```

### Card Layout
```html
<div class="card">
  <h3>Repair Order #123</h3>  <!-- Higuen Serif -->
  <p>Customer: John Doe</p>   <!-- Glacial Indifference -->
  <p>Status: Pending</p>      <!-- Glacial Indifference -->
</div>
```

### Form Elements
```html
<form>
  <label>Email</label>        <!-- Glacial Indifference -->
  <input type="email">        <!-- Glacial Indifference -->
  <button>Sign In</button>    <!-- Glacial Indifference -->
</form>
```

## Testing Fonts

### Visual Check
1. Start the application: `npm start`
2. Check logo uses Higuen Serif
3. Check body text uses Glacial Indifference
4. Verify all headings use Higuen Serif
5. Test on different browsers

### Developer Tools
```javascript
// Check computed font in browser console
getComputedStyle(document.querySelector('h1')).fontFamily
// Should return: "Higuen Serif", Georgia, serif

getComputedStyle(document.querySelector('body')).fontFamily
// Should return: "Glacial Indifference", -apple-system...
```

## Fallback Fonts

If custom fonts fail to load:
- **Primary:** System fonts (SF Pro, Segoe UI, Roboto)
- **Heading:** Georgia, Times New Roman, serif
- **Guaranteed display** with graceful degradation

## Files Structure

```
src/assets/fonts/
├── fonts.scss                          # Font definitions
├── glacial-indifference/
│   ├── GlacialIndifference-Regular.otf
│   └── GlacialIndifference-Bold.otf
└── higuen/
    └── Higuen Serif.otf
```

## Import Location

**Main stylesheet** (`src/styles.scss`):
```scss
@import 'assets/fonts/fonts.scss';
```

This ensures fonts are loaded globally and available to all components.

## License Information

Please ensure you have the proper licenses for these fonts:
- Check font license files in the extracted folders
- Verify commercial use permissions
- Include attribution if required

## Tips

1. **Font Loading:** Fonts load on first page view, then cached
2. **Performance:** Use `font-display: swap` for better UX
3. **Testing:** Test on slow connections to see fallback behavior
4. **Accessibility:** Ensure sufficient contrast with colors
5. **Responsive:** Fonts scale with viewport on mobile

---

**Fonts Successfully Integrated!** 🎨

The Al Hilo brand now has its distinctive typography:
- **Higuen Serif** for elegant headings
- **Glacial Indifference** for clean, readable content
