# Quick Reference - Sales Report with Seamstress Performance

## 🎯 Quick Start

### Access the Feature
1. Login as Administrator or Receptionist
2. Navigate to "Reportes" from menu or dashboard
3. Date filters and seamstress table are at the top

### Default Behavior
- **Auto-loads**: Last 30 days of data
- **Auto-updates**: Changes reflect immediately when dates change

## 📅 Date Filtering

### Set Custom Date Range
```
1. Click "Fecha Inicio" → Select start date
2. Click "Fecha Fin" → Select end date
3. Data updates automatically
```

### Reset to Default
```
Click: 🔄 Últimos 30 días
Result: Shows last 30 days of data
```

### Date Selection Tips
- Start date must be before or equal to end date
- Both dates must be selected for filter to work
- Future dates won't show data (obviously!)

## 📊 Seamstress Sales Table

### Column Meanings

| Column | What it Shows | How to Use |
|--------|---------------|------------|
| Costurera | Seamstress name | Identify who |
| Total Reparaciones | All assigned repairs | Workload indicator |
| Completadas | Finished repairs | Actual productivity |
| Ingresos Totales | Total revenue earned | Money generated |
| Promedio por Reparación | Average per repair | Price indicator |
| Tasa de Finalización | % completed | Performance rating |

### Understanding Completion Rate Badges

| Badge Color | Range | Meaning | Action |
|------------|-------|---------|--------|
| 🟢 Green | ≥80% | Excellent | No action needed |
| 🟡 Yellow | 50-79% | Good | Monitor |
| 🔴 Red | <50% | Needs attention | Investigate/support |

## 💻 Code Locations

### Need to modify date range default?
`reports.component.ts` - Constructor (lines 55-61):
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30); // Change 30 to desired days
```

### Need to modify completion rate thresholds?
`reports.component.html` - Table badges (line 95):
```html
[class.high]="sale.completionRate >= 80"  <!-- Change 80 -->
[class.medium]="sale.completionRate >= 50 && sale.completionRate < 80"  <!-- Change 50/80 -->
```

### Need to change chart colors?
`reports.component.ts` - createSeamstressChart() method (line 488):
```typescript
backgroundColor: '#9C27B0',  // Change purple
borderColor: '#7B1FA2',
```

### Need to add new calculation?
`reports.component.ts` - calculateSeamstressSales() method (line 151)

## 🎨 Styling

### Table Styles
`reports.component.scss` - Lines 115-225

### Date Filter Styles
`reports.component.scss` - Lines 87-114

### Badge Styles
`reports.component.scss` - Lines 186-204

## 📱 Responsive Breakpoints

- **Desktop** (>768px): Side-by-side layout
- **Mobile** (≤768px): Stacked layout, horizontal scroll table

## 🔧 Common Customizations

### Add New Table Column

1. **Update Interface** (`reports.component.ts`):
```typescript
interface SeamstressSales {
  // ... existing properties
  newMetric: number;  // Add this
}
```

2. **Calculate Metric** (`calculateSeamstressSales()`):
```typescript
sales.newMetric = /* your calculation */;
```

3. **Add Column** (`reports.component.html`):
```html
<th>New Metric</th>  <!-- In <thead> -->
<td>{{ sale.newMetric }}</td>  <!-- In <tbody> -->
```

### Change Sort Order

In `calculateSeamstressSales()` method (line 189):
```typescript
// Current: Sort by revenue (descending)
.sort((a, b) => b.totalRevenue - a.totalRevenue);

// Sort by completion rate instead:
.sort((a, b) => b.completionRate - a.completionRate);

// Sort by name (ascending):
.sort((a, b) => a.seamstress.name.localeCompare(b.seamstress.name));
```

### Add Export Button

1. Install library: `npm install xlsx`
2. Import: `import * as XLSX from 'xlsx';`
3. Add method:
```typescript
exportToExcel(): void {
  const worksheet = XLSX.utils.json_to_sheet(this.seamstressSales);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
  XLSX.writeFile(workbook, 'sales-report.xlsx');
}
```
4. Add button in HTML

## 🐛 Troubleshooting

### Issue: Table doesn't show
**Causes:**
- No repairs assigned to seamstresses in date range
- Date range has no data
**Solution:** Check date range, verify repair assignments

### Issue: Charts don't update
**Solution:** Check browser console for errors, refresh page

### Issue: Dates don't work
**Solution:** Ensure both start and end dates are selected

### Issue: Wrong calculations
**Solution:** Check that repairs have finalPrice or estimatedPrice

### Issue: Performance slow with large dataset
**Solution:** Use narrower date ranges, consider pagination

## 📊 Data Requirements

### For Sales to Appear
1. Repair must be assigned to a seamstress (`assignedTo` field)
2. Repair must be within selected date range
3. For revenue: Repair must be COMPLETED or DELIVERED status

### Revenue Calculation
```
Priority: finalPrice > estimatedPrice > 0
Status: Only COMPLETED or DELIVERED repairs count
```

## 🎯 Use Cases

### Weekly Team Meeting
```
1. Set date range: Last 7 days
2. Review table with team
3. Discuss performance
4. Set goals for next week
```

### Monthly Performance Review
```
1. Set date range: Previous month (e.g., Jan 1 - Jan 31)
2. Print/export table
3. One-on-one meetings with each seamstress
4. Document in employee files
```

### Payroll/Commission Calculation
```
1. Set date range: Pay period
2. Use "Ingresos Totales" column
3. Calculate commission (e.g., 10% of revenue)
4. Process payments
```

### Identifying Training Needs
```
1. Look for 🔴 Red badges (low completion rate)
2. Review that seamstress's repair history
3. Identify common issues
4. Provide targeted training
```

## 💡 Tips & Tricks

### Quick Date Ranges
- **This Month**: Start = 1st of month, End = today
- **Last Month**: Start = 1st of last month, End = last day of last month
- **Quarter**: Start = 3 months ago, End = today
- **Year to Date**: Start = Jan 1 of this year, End = today

### Reading the Data
- **High repairs + Low completion** = May be overwhelmed, needs help
- **Low repairs + High completion** = Can handle more work
- **High revenue + Low repair count** = Focuses on high-value work
- **Low average per repair** = May be doing simpler/cheaper repairs

### Maximizing Performance
- Review weekly to catch issues early
- Recognize high performers publicly
- Support low performers privately
- Balance workload distribution

## 📖 Related Documentation

- **Full Feature Doc**: `SALES_REPORT_FEATURE.md`
- **Original Reports**: `REPORTS_FEATURE.md`
- **Quick Ref**: `SALES_REPORT_QUICK_REFERENCE.md` (this file)

---

**Need Help?** Check full documentation or consult system administrator.
