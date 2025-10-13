# 🏗️ Smart Attendance Management - System Architecture

## 📊 Complete Flowchart Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER INTERFACE                                    │
│                                  (Browser - React)                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS 15 APP ROUTER                                   │
│                           (Server-Side & Client-Side)                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐                          │
│  │   src/app/page.tsx   │───────▶│  Tab Navigation:     │                          │
│  │  (Main Entry Point)  │        │  - Timetable         │                          │
│  └──────────────────────┘        │  - Predictor         │                          │
│              │                    └──────────────────────┘                          │
│              │                                                                       │
│              ├──────────────────────┬──────────────────────┐                       │
│              ▼                      ▼                      ▼                        │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐          │
│  │  AcademicCalendar   │  │ HolidayPredictor │  │   Layout & Styling  │          │
│  │    Component        │  │    Component     │  │   (Tailwind CSS)    │          │
│  └─────────────────────┘  └──────────────────┘  └─────────────────────┘          │
│              │                      │                                               │
└──────────────┼──────────────────────┼───────────────────────────────────────────────┘
               │                      │
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT-SIDE STATE                                      │
│                            (React useState Hooks)                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  • subjects[]          • timetableSlots[]         • attendanceRecords[]             │
│  • selectedDate        • showModals               • predictions[]                   │
│  • collegeHolidays     • personalLeaves           • bulkImportData                  │
│                                                                                       │
└───────────────────────────────────┬───────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES (Next.js)                                    │
│                         src/app/api/*/route.ts                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │  /api/subjects       │  │  /api/timetable      │  │  /api/attendance     │     │
│  │                      │  │                      │  │                      │     │
│  │  GET  - Fetch all    │  │  GET  - Fetch slots  │  │  GET  - Fetch records│     │
│  │  POST - Create       │  │  POST - Create slot  │  │  POST - Mark present │     │
│  │  PUT  - Update       │  │  PUT  - Update slot  │  │  PUT  - Update record│     │
│  │  DELETE - Remove     │  │  DELETE - Remove     │  │  DELETE - Remove     │     │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘     │
│              │                      │                      │                        │
└──────────────┼──────────────────────┼──────────────────────┼────────────────────────┘
               │                      │                      │
               └──────────────────────┴──────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PRISMA ORM LAYER                                        │
│                           (Database Abstraction)                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  • Query Builder                  • Type Safety (TypeScript)                        │
│  • Connection Pooling             • Automatic Migrations                            │
│  • Transaction Management         • Schema Validation                               │
│                                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │  Subject Model       │  │  TimetableSlot       │  │  AttendanceRecord    │     │
│  │                      │  │     Model            │  │      Model           │     │
│  │  - id                │  │  - id                │  │  - id                │     │
│  │  - name              │  │  - dayOfWeek         │  │  - subjectId         │     │
│  │  - color             │  │  - periodStart       │  │  - date              │     │
│  │  - totalClasses      │  │  - periodEnd         │  │  - status            │     │
│  │  - attendedClasses   │  │  - merged            │  │  - count             │     │
│  │  - createdAt         │  │  - subjectId         │  │  - createdAt         │     │
│  │  - updatedAt         │  │  - createdAt         │  │                      │     │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘     │
│              │                      │                      │                        │
└──────────────┼──────────────────────┼──────────────────────┼────────────────────────┘
               │                      │                      │
               └──────────────────────┴──────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL - Neon)                                  │
│                           (Serverless Database)                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │  subjects TABLE     │  │  timetable_slots    │  │  attendance_records │        │
│  │                     │  │      TABLE          │  │      TABLE          │        │
│  │  Primary Key: id    │  │  Primary Key: id    │  │  Primary Key: id    │        │
│  │                     │  │  Foreign Key:       │  │  Foreign Key:       │        │
│  │  Unique: name       │  │    subjectId        │  │    subjectId        │        │
│  │                     │  │                     │  │                     │        │
│  │  Indexes:           │  │  Unique Constraint: │  │  Unique Constraint: │        │
│  │    - name           │  │    (dayOfWeek,      │  │    (subjectId,      │        │
│  │                     │  │     periodStart,    │  │     date)           │        │
│  │                     │  │     periodEnd)      │  │                     │        │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘        │
│                                                                                       │
│  Relationships:                                                                      │
│    - Subject → TimetableSlot (One-to-Many)                                          │
│    - Subject → AttendanceRecord (One-to-Many)                                       │
│    - CASCADE DELETE enabled on foreign keys                                         │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### **1. Timetable Creation Flow**

```
User Interface
      │
      ▼ (User creates timetable)
Select Day + Period + Subject
      │
      ▼
POST /api/timetable
      │
      ▼
Prisma: timetableSlots.create()
      │
      ▼
PostgreSQL INSERT
      │
      ▼
Return success + new slot data
      │
      ▼
Update UI state (add to timetableSlots[])
      │
      ▼
Re-render calendar grid
```

---

### **2. Attendance Marking Flow**

```
User clicks on date cell
      │
      ▼
Modal opens → Select status (Present/Absent/Holiday)
      │
      ▼
POST /api/attendance
      │
      ├──── Check if date + subject already exists
      │     │
      │     ├─ Exists? → Update count (count++)
      │     │             │
      │     │             ▼
      │     │        Prisma: attendanceRecords.update()
      │     │
      │     └─ Not exists? → Create new record
      │                   │
      │                   ▼
      │            Prisma: attendanceRecords.create()
      │
      ▼
PostgreSQL: INSERT or UPDATE
      │
      ▼
Update Subject.totalClasses & Subject.attendedClasses
      │
      ▼
Return updated attendance data
      │
      ▼
Update UI state:
  - attendanceRecords[]
  - subjects[] (attendance counts)
      │
      ▼
Re-render calendar with updated attendance
```

---

### **3. Bulk Import Flow**

```
User enters dates (DD-MM-YYYY format)
      │
      ▼
Parse dates → Validate format
      │
      ├──── For each valid date:
      │     │
      │     ▼
      │   Check duplicates (same date, same subject)
      │     │
      │     ├─ Duplicate? → Increment count
      │     │               │
      │     │               ▼
      │     │         Smart Count: count × periods on that day
      │     │
      │     └─ Not duplicate? → Create with count = 1 × periods
      │
      ▼
POST /api/attendance (batch)
      │
      ▼
Prisma: Multiple create/update operations
      │
      ▼
PostgreSQL: Batch INSERT/UPDATE
      │
      ▼
Return success summary
      │
      ▼
Show alert: "Successfully imported X dates"
      │
      ▼
Refresh attendance data
```

---

### **4. Holiday Predictor Flow**

```
Component Mount
      │
      ▼
Fetch data in parallel:
  ├─ GET /api/subjects
  ├─ GET /api/timetable
  └─ GET /api/attendance
      │
      ▼
Load calendar for current month
      │
      ▼
User marks holidays (left-click) or leaves (right-click)
      │
      ├─ College Holiday → Add to collegeHolidays Set (red)
      └─ Personal Leave → Add to personalLeaves Set (orange)
      │
      ▼
User clicks "Calculate Predictions"
      │
      ▼
For each subject:
      │
      ├──── Get current attendance:
      │     │
      │     ▼
      │   Filter attendanceRecords by subjectId
      │     │
      │     ▼
      │   Calculate actualAttended & actualTotal (using count field)
      │     │
      │     ▼
      │   currentPercentage = (actualAttended / actualTotal) × 100
      │
      ├──── Get timetable slots for this subject
      │     │
      │     ▼
      │   Filter by subject.id
      │
      ├──── Loop through remaining days of month:
      │     │
      │     ▼
      │   For each day:
      │     │
      │     ├─ Is it a college holiday? → Skip (no classes)
      │     │
      │     ├─ Is it a personal leave? → Count as absent
      │     │
      │     └─ Otherwise → Count periods from timetable
      │
      ▼
Calculate future attendance:
  - futureTotal = actualTotal + classes in month
  - futureAttended = actualAttended + attended classes
  - futurePercentage = (futureAttended / futureTotal) × 100
      │
      ▼
Display predictions per subject:
  - Current: X%
  - After Month: Y%
  - Change: +/- Z%
  - Warning if < 75%
```

---

### **5. Subject Graphs Flow**

```
User clicks "Subject Graphs"
      │
      ▼
Fetch all attendance records
      │
      ▼
For each subject:
      │
      ├──── Group records by date
      │     │
      │     ▼
      │   Sort by date (oldest first)
      │     │
      │     ▼
      │   Limit to recent 15 records
      │     │
      │     ▼
      │   Calculate cumulative attendance % for each date
      │
      ▼
Generate Chart.js data:
      │
      ├─ X-axis: Dates
      ├─ Y-axis: Attendance %
      └─ Line color: Subject color
      │
      ▼
Render LineChart with:
  - Animations
  - Tooltips
  - Dynamic Y-axis (min to max)
      │
      ▼
Display stats:
  - Current attendance %
  - Total classes
  - Recent trend
```

---

## 🛠️ Technology Stack Breakdown

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ⚛️  React 18          → Component-based UI                         │
│  ⚡ Next.js 15.5.4     → App Router, SSR, API Routes                │
│  🎨 Tailwind CSS       → Utility-first styling                      │
│  🎬 Framer Motion      → Smooth animations                          │
│  📊 Chart.js           → Data visualization                         │
│  🔷 TypeScript         → Type safety                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🚀 Next.js API Routes → RESTful endpoints                          │
│  📝 TypeScript         → Type-safe API handlers                     │
│  🔐 CORS & Security    → Built-in Next.js security                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ORM LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🔷 Prisma Client      → Type-safe database queries                 │
│  📜 Prisma Schema      → Database schema definition                 │
│  🔄 Prisma Migrate     → Version-controlled migrations              │
│  🔍 Prisma Studio      → Database GUI (dev tool)                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  🐘 PostgreSQL         → Relational database                        │
│  ☁️  Neon              → Serverless PostgreSQL                      │
│  🌐 Connection Pooling → Efficient connections                      │
│  🔒 SSL Required       → Secure connections                         │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ▲  Vercel             → Hosting & CDN                              │
│  🌍 Edge Network       → Global distribution                        │
│  🤖 Auto Deployment    → GitHub integration                         │
│  📈 Analytics          → Performance monitoring                     │
│  🔐 Environment Vars   → Secure config management                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure & Responsibilities

```
smart-attendance-predictor/
│
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                    → Main entry, tab navigation
│  │  ├─ layout.tsx                  → Root layout, metadata
│  │  ├─ globals.css                 → Global styles, Tailwind imports
│  │  │
│  │  └─ api/
│  │     ├─ subjects/route.ts        → CRUD for subjects
│  │     ├─ timetable/route.ts       → CRUD for timetable slots
│  │     └─ attendance/route.ts      → CRUD for attendance records
│  │
│  ├─ components/
│  │  ├─ AcademicCalendar.tsx        → Main timetable & attendance UI
│  │  └─ HolidayPredictor.tsx        → Prediction calendar UI
│  │
│  ├─ lib/
│  │  └─ prisma.ts                   → Prisma client singleton
│  │
│  └─ types/
│     └─ index.ts                    → TypeScript type definitions
│
├─ prisma/
│  ├─ schema.prisma                  → Database schema definition
│  ├─ dev.db                         → Local SQLite (old, replaced)
│  └─ migrations/                    → Version-controlled migrations
│
├─ .env                               → Environment variables (DATABASE_URL)
├─ .env.example                       → Template for environment setup
├─ next.config.js                     → Next.js configuration
├─ tailwind.config.js                 → Tailwind CSS configuration
├─ tsconfig.json                      → TypeScript configuration
├─ package.json                       → Dependencies & scripts
├─ README.md                          → Project documentation
├─ DEPLOYMENT.md                      → Deployment guide
└─ ARCHITECTURE.md                    → This file (system design)
```

---

## 🔐 Security & Best Practices

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. Environment Variables                                            │
│     └─ DATABASE_URL stored securely in Vercel                       │
│                                                                       │
│  2. SSL/TLS Encryption                                               │
│     └─ All database connections use sslmode=require                 │
│                                                                       │
│  3. Input Validation                                                 │
│     └─ TypeScript types + Prisma schema validation                  │
│                                                                       │
│  4. SQL Injection Prevention                                         │
│     └─ Prisma ORM parameterized queries                             │
│                                                                       │
│  5. CORS Protection                                                  │
│     └─ Next.js built-in API route security                          │
│                                                                       │
│  6. Error Handling                                                   │
│     └─ Try-catch blocks, user-friendly error messages               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Pipeline

```
Developer (Local)
       │
       ▼ (git push)
GitHub Repository (main branch)
       │
       ▼ (webhook trigger)
Vercel Build System
       │
       ├─ Install dependencies (npm install)
       ├─ Run postinstall (prisma generate)
       ├─ Build Next.js app (npm run build)
       ├─ Inject environment variables
       └─ Deploy to Edge Network
       │
       ▼
Live Application
       │
       ├─ Serve static assets from CDN
       ├─ Execute serverless functions (API routes)
       └─ Connect to Neon PostgreSQL
       │
       ▼
End Users (Global Access)
```

---

## 📊 Performance Optimizations

1. **Server-Side Rendering (SSR)**
   - Fast initial page load
   - SEO-friendly

2. **React Component Optimization**
   - useState for local state
   - useEffect for data fetching
   - Conditional rendering

3. **Database Query Optimization**
   - Indexes on frequently queried fields
   - Connection pooling via Prisma
   - Efficient foreign key relationships

4. **Edge Network Delivery**
   - CDN distribution via Vercel
   - Auto-scaling serverless functions
   - Low latency globally

5. **Build Optimizations**
   - Tree shaking (removes unused code)
   - Code splitting (lazy loading)
   - Minification & compression

---

## 🔄 State Management Flow

```
User Action
    │
    ▼
Event Handler (onClick, onChange)
    │
    ▼
setState() call
    │
    ├─ Update local state
    │
    ├─ Trigger API call (if needed)
    │  │
    │  ▼
    │  Fetch/POST to API route
    │  │
    │  ▼
    │  Database operation via Prisma
    │  │
    │  ▼
    │  Return updated data
    │
    ▼
React re-renders affected components
    │
    ▼
UI updates with new data
```

---

## 🎯 Key Features Implementation

### **1. Smart Duplicate Handling**
```
Input: Same date multiple times
  ↓
Count occurrences per date
  ↓
Get periods for that day from timetable
  ↓
Calculate: occurrences × periods = total count
  ↓
Store single record with aggregated count
```

### **2. Attendance Percentage Calculation**
```
Query: Get all attendance records for subject
  ↓
Filter by status != 'holiday'
  ↓
Sum: totalClasses += count
Sum: attendedClasses += (status === 'present' ? count : 0)
  ↓
Calculate: (attendedClasses / totalClasses) × 100
```

### **3. Month-End Predictions**
```
Current Attendance → Read from database
  ↓
Get timetable for subject
  ↓
Loop through remaining days of month
  ↓
For each day:
  - Check if college holiday → Skip
  - Check if personal leave → Absent
  - Otherwise → Count periods from timetable
  ↓
Calculate future attendance percentage
  ↓
Display comparison & warnings
```

---

**Built with Claude Sonnet**  
**Developed by @workwithaaditya**  
© 2025 All rights reserved
