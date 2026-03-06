# Sales Report - Visual Guide

## 📅 Date Filters Section

```
┌─────────────────────────────────────────────────────────┐
│ Filtros de Fecha                                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Fecha Inicio         Fecha Fin          Action          │
│  [2024-01-01▼]       [2024-01-31▼]     [🔄 Últimos...]  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 📊 Statistics Cards

```
┌────────────┬────────────┬────────────┬────────────┐
│ 📦 125     │ 💰 $15,750 │ ⏱️ 3.5 días│ ✅ 85.6%   │
│ Total      │ Ingresos   │ Tiempo     │ Finaliz.   │
│ Reparacion │ Totales    │ Promedio   │ Rate       │
└────────────┴────────────┴────────────┴────────────┘
```

## 👩‍🔧 Seamstress Sales Table

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Ventas por Costurera                                                          │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ Costurera      │ Total  │ Complet │ Ingresos   │ Promedio  │ Tasa           │
│                │ Repar. │ adas    │ Totales    │ p/Repar.  │ Finaliz.       │
│ ───────────────┼────────┼─────────┼────────────┼───────────┼────────────── │
│ María García   │   45   │   38    │  $4,750.00 │  $125.00  │  84.4% 🟢     │
│ Ana Rodríguez  │   38   │   30    │  $3,600.00 │  $120.00  │  78.9% 🟡     │
│ Laura Martínez │   32   │   28    │  $3,360.00 │  $120.00  │  87.5% 🟢     │
│ Carmen López   │   25   │   18    │  $2,160.00 │  $120.00  │  72.0% 🟡     │
│ Rosa Sánchez   │   22   │    9    │  $1,080.00 │  $120.00  │  40.9% 🔴     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## 📈 Seamstress Sales Chart

```
┌─────────────────────────────────────────────────────────┐
│ Ventas por Costurera                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ María G.    ████████████████████████ $4,750            │
│ Ana R.      ███████████████████ $3,600                 │
│ Laura M.    ██████████████████ $3,360                  │
│ Carmen L.   ███████████ $2,160                         │
│ Rosa S.     █████ $1,080                               │
│                                                           │
│          $0    $1k    $2k    $3k    $4k    $5k          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Completion Rate Badge Guide

### High Performance (≥80%)
```
┌──────────┐
│  84.4%   │  ← Green background
└──────────┘     Dark green text
```

### Medium Performance (50-79%)
```
┌──────────┐
│  72.0%   │  ← Yellow/orange background
└──────────┘     Dark orange text
```

### Low Performance (<50%)
```
┌──────────┐
│  40.9%   │  ← Red background
└──────────┘     Dark red text
```

## 📱 Mobile View

### Stacked Layout
```
┌────────────────────┐
│ Filtros de Fecha   │
├────────────────────┤
│ Fecha Inicio       │
│ [2024-01-01 ▼]    │
│                    │
│ Fecha Fin          │
│ [2024-01-31 ▼]    │
│                    │
│ [🔄 Últimos 30...] │
└────────────────────┘

┌────────────────────┐
│ 📦 125            │
│ Total Reparacion   │
└────────────────────┘

┌────────────────────┐
│ 💰 $15,750        │
│ Ingresos Totales   │
└────────────────────┘

(Stats continue...)

┌────────────────────┐
│ Seamstress Table   │
│ (Scrollable →)     │
└────────────────────┘
```

## 🖱️ User Interactions

### Changing Date Range
```
┌─────────────────────────────────────┐
│ 1. Click "Fecha Inicio" date picker│
│    ↓                                 │
│ 2. Select date from calendar        │
│    ↓                                 │
│ 3. Click "Fecha Fin" date picker   │
│    ↓                                 │
│ 4. Select date from calendar        │
│    ↓                                 │
│ 5. ALL DATA UPDATES AUTOMATICALLY   │
│    ✓ Stats refresh                  │
│    ✓ Table recalculates             │
│    ✓ Charts redraw                  │
└─────────────────────────────────────┘
```

### Quick Reset
```
┌─────────────────────────────────────┐
│ 1. Click "🔄 Últimos 30 días"      │
│    ↓                                 │
│ 2. Dates reset to:                  │
│    - Start: 30 days ago             │
│    - End: Today                     │
│    ↓                                 │
│ 3. ALL DATA UPDATES AUTOMATICALLY   │
└─────────────────────────────────────┘
```

## 🔍 Data Interpretation Examples

### Example 1: High Performer
```
María García
─────────────────────────────────
Total Repairs:      45
Completed:          38
Revenue:         $4,750
Average:          $125
Completion:      84.4% 🟢

INTERPRETATION:
→ Handles high volume (45 repairs)
→ Great completion rate (84%)
→ Good average price ($125)
→ Top revenue generator
→ No action needed ✓
```

### Example 2: Needs Support
```
Rosa Sánchez
─────────────────────────────────
Total Repairs:      22
Completed:           9
Revenue:         $1,080
Average:          $120
Completion:      40.9% 🔴

INTERPRETATION:
→ Normal workload (22 repairs)
→ Low completion rate (41%)
→ Many unfinished repairs
→ Revenue suffering
→ ACTION: Investigate & support!
```

### Example 3: Workload Imbalance
```
Comparing two seamstresses:

María: 45 repairs, 84% completion
Rosa:  22 repairs, 41% completion

INTERPRETATION:
→ María may be overloaded
→ Rosa may need more work
→ Or Rosa needs training
→ ACTION: Balance or train
```

## 📊 Chart Reading Guide

### Bar Chart Height = Revenue
```
Tallest bar  = Most revenue
Shortest bar = Least revenue

Order: Highest to lowest (left to right)

Example:
María (tallest)  → $4,750
Rosa (shortest)  → $1,080
```

## 💡 Quick Tips

### Daily Use
```
Morning routine:
1. Open Reports
2. Keep default (30 days)
3. Check for red badges
4. Address issues
```

### Weekly Review
```
Team meeting:
1. Set to "Last 7 days"
2. Review table together
3. Recognize high performers
4. Support low performers
5. Set goals for next week
```

### Monthly Analysis
```
End of month:
1. Set to full month
2. Export/print data
3. Calculate commissions
4. Document reviews
5. Plan next month
```

## 🎨 Color Coding System

### Performance Badges
- 🟢 **Green** = Keep doing what you're doing!
- 🟡 **Yellow** = Good, but room for improvement
- 🔴 **Red** = Needs immediate attention

### Charts
- 🔵 **Blue** = Status/Type/Monthly (general data)
- 🟣 **Purple** = Seamstress sales (revenue focus)
- 🟢 **Green** = Revenue by type (money)

## 📐 Layout Structure

```
┌──────────────────────────────────────────┐
│           REPORTS HEADER                  │
├──────────────────────────────────────────┤
│           DATE FILTERS                    │
├──────────────────────────────────────────┤
│    STATS  │  STATS │  STATS │  STATS    │
├──────────────────────────────────────────┤
│        SEAMSTRESS SALES TABLE            │
├──────────────────────────────────────────┤
│  CHART   │  CHART  │  CHART  │  CHART   │
├──────────────────────────────────────────┤
│      SEAMSTRESS CHART (FULL WIDTH)       │
└──────────────────────────────────────────┘
```

## 🌙 Dark Mode Preview

### Light Mode
```
Background: White
Text: Black
Tables: Gray borders
Badges: Colored backgrounds
```

### Dark Mode
```
Background: Dark gray (#2a2a2a)
Text: White
Tables: Dark borders (#404040)
Badges: Same colors, darker theme
```

## ✅ Checklist for Using Reports

```
□ Open Reports page
□ Check default date range (30 days)
□ Adjust dates if needed
□ Review statistics cards
□ Scan seamstress table
□ Note any red badges
□ Check revenue distribution
□ View charts for trends
□ Take action on findings
□ Document decisions
```

---

**Pro Tip**: Bookmark specific date ranges in your browser for quick access to common time periods!
