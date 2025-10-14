# Production Migration Guide

## After Deploying New Code

If you see incorrect attendance counts (e.g., showing 41 when you have 32 records), run this one-time migration:

### Option 1: Via Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Functions
2. Add a new API route temporarily:
   - Create `app/api/migrate-counts/route.ts`
   - Visit `https://your-app.vercel.app/api/migrate-counts`
   - Delete the route after running

### Option 2: Via Terminal (Local Database)

```bash
node scripts/migrate-reset-counts.js
```

### Option 3: Direct Database Query

Connect to your Neon database and run:

```sql
UPDATE attendance_records SET count = 1;
```

## Why This Is Needed

Old attendance records were created with a multiplication system:
- `count = number_of_duplicates × periods_per_day`
- Example: 2 uploads × 3 periods = count of 6

New period-wise system:
- Each upload = 1 record with count = 1
- Duplicates = multiple separate records

This migration resets all old counts to 1 for accurate graphs.

## Verify Fix

After migration, check your graphs:
- Total count should match number of records
- No records should have count > 1
