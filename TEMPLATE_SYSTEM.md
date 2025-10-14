# Template Sharing System

## Overview
The Template Sharing System allows users to create, share, and import timetable templates. This is perfect for students in the same class/section/batch who want to quickly set up their attendance tracking without manually entering all subjects and schedules.

## Key Features

### 1. **Create Templates**
- Export your current subjects and timetable as a reusable template
- Add metadata: Name, Description, Semester, Section, Batch
- Choose to make templates public (shareable) or private
- Example: "5th Sem ISE Section A Batch A1"

### 2. **Browse Public Templates**
- Search templates by keywords
- Filter by:
  - Semester (e.g., "5th Sem", "Semester 5")
  - Section (e.g., "A", "B")
  - Batch (e.g., "A1", "B2")
- Sort by popularity (import count)
- Preview template details before importing

### 3. **Import Templates**
- Two import modes:
  - **Keep Existing**: Adds template subjects, updates matching ones
  - **Replace All**: Clears your data and imports fresh (with confirmation)
- Automatically creates all subjects with correct colors
- Imports complete timetable with all period slots
- Tracks import count for popularity

### 4. **Manage Your Templates**
- View all templates you've created
- See import statistics
- Delete templates you no longer need
- Toggle public/private visibility

## Database Schema

### Template
```prisma
model Template {
  id               Int                @id @default(autoincrement())
  name             String             // e.g., "5th Sem ISE Section A Batch A1"
  description      String?
  semester         String?            // e.g., "5th Sem"
  section          String?            // e.g., "Section A"
  batch            String?            // e.g., "Batch A1"
  isPublic         Boolean            @default(true)
  importCount      Int                @default(0)
  userId           String
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  user             User               @relation(...)
  templateSubjects TemplateSubject[]
  templateTimetable TemplateTimetable[]
}
```

### TemplateSubject
```prisma
model TemplateSubject {
  id                Int                @id @default(autoincrement())
  name              String
  code              String?            // Subject code (e.g., "CS501")
  color             String             @default("#3B82F6")
  templateId        Int
  template          Template           @relation(...)
  timetableSlots    TemplateTimetable[]
}
```

### TemplateTimetable
```prisma
model TemplateTimetable {
  id                Int              @id @default(autoincrement())
  dayOfWeek         String
  periodStart       Int
  periodEnd         Int
  merged            Boolean          @default(false)
  templateSubjectId Int
  templateId        Int
  templateSubject   TemplateSubject  @relation(...)
  template          Template         @relation(...)
}
```

## API Endpoints

### `GET /api/templates`
Browse public templates or your own templates

**Query Parameters:**
- `myTemplates=true` - Get only your templates
- `search=keyword` - Search in name/description
- `semester=5th` - Filter by semester
- `section=A` - Filter by section
- `batch=A1` - Filter by batch

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "5th Sem ISE Section A Batch A1",
      "description": "Complete timetable for ISE students",
      "semester": "5th Sem",
      "section": "A",
      "batch": "A1",
      "importCount": 45,
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "templateSubjects": [...],
      "_count": {
        "templateSubjects": 8,
        "templateTimetable": 35
      }
    }
  ]
}
```

### `POST /api/templates`
Create a new template from your current subjects and timetable

**Request Body:**
```json
{
  "name": "5th Sem ISE Section A Batch A1",
  "description": "Complete schedule for all ISE subjects",
  "semester": "5th Sem",
  "section": "A",
  "batch": "A1",
  "isPublic": true
}
```

**Response:**
```json
{
  "template": {
    "id": 1,
    "name": "5th Sem ISE Section A Batch A1",
    "templateSubjects": [...]
  }
}
```

### `DELETE /api/templates?id=1`
Delete your own template

**Response:**
```json
{
  "success": true
}
```

### `POST /api/templates/[id]/import`
Import a template into your account

**Request Body:**
```json
{
  "clearExisting": false  // true = replace all, false = merge
}
```

**Response:**
```json
{
  "success": true,
  "subjectsCreated": 8,
  "message": "Template imported successfully"
}
```

## User Interface

### Main Dashboard
- **Templates Button**: Purple button in the navigation area
- Opens the Template Manager modal

### Template Manager Modal

#### Tab 1: Browse Templates
- **Search Bar**: Search by keywords
- **Filters**: Semester, Section, Batch
- **Template Cards**: Show:
  - Template name and description
  - Semester/Section/Batch tags
  - Number of subjects and timetable slots
  - Import count (popularity)
  - Creator name
  - Quick import button
- **Click Card**: Opens detailed preview

#### Tab 2: My Templates
- Shows all templates you've created
- Displays:
  - Public/Private status
  - Import count
  - Delete button
- Empty state encourages creating first template

#### Tab 3: Create Template
- **Form Fields**:
  - Template Name (required)
  - Description (optional)
  - Semester, Section, Batch (optional but recommended)
  - Public/Private toggle
- **Info Banner**: Explains that template is created from current data
- **Create Button**: Validates and creates template

### Template Preview Modal
- Shows all subjects with their colors
- Displays timetable in a weekly grid
- Shows periods for each day
- **Import Options**:
  - Import (Keep Existing)
  - Import (Replace All)

## Use Cases

### For Class Representatives
1. Set up your complete timetable once
2. Create a public template: "5th Sem ISE Section A Batch A1"
3. Share the template name with classmates
4. Everyone can import instantly

### For Students
1. Search for your class template
2. Filter by semester/section/batch
3. Preview to verify it's correct
4. Import with one click
5. Start tracking attendance immediately

### For Multiple Batches
1. Each batch has slightly different practical schedules
2. Create separate templates:
   - "5th Sem ISE Section A Batch A1"
   - "5th Sem ISE Section A Batch A2"
   - "5th Sem ISE Section A Batch A3"
3. Students import the right one for their batch

## Technical Implementation

### Template Creation Flow
```
User clicks "Create Template" →
API fetches user's subjects with timetable slots →
Validates (must have at least 1 subject) →
Creates Template record →
Creates TemplateSubject records (copies subject data) →
Creates TemplateTimetable records (copies timetable slots) →
Returns success
```

### Template Import Flow
```
User selects template →
Shows preview modal →
User chooses import mode →
API fetches template with all subjects and slots →
If clearExisting: Deletes all user's subjects →
For each template subject:
  - Check if subject exists (by name)
  - If exists: Update color
  - If not: Create new subject
  - Delete existing timetable slots
  - Create new timetable slots from template →
Increment template.importCount →
Returns success
```

### Search & Filter
- Case-insensitive search in name and description
- Optional filters combine with AND logic
- Results sorted by import count (popularity)
- Real-time filtering as user types

## Security & Privacy

### Authentication
- All template operations require authentication
- Template creation requires valid session
- Import requires login

### Authorization
- Users can only delete their own templates
- Private templates only visible to creator
- Public templates visible to all users

### Data Validation
- Template name is required
- Must have at least 1 subject to create template
- Validates template exists before import
- Confirms ownership before delete

## Future Enhancements

### Potential Features
- [ ] Subject codes (e.g., "CS501") for better organization
- [ ] Template versioning (update existing templates)
- [ ] Template ratings/reviews
- [ ] Template categories/tags
- [ ] Duplicate detection (warn if similar template exists)
- [ ] Bulk template management
- [ ] Template export/import as JSON
- [ ] Template preview without login (for sharing links)

### Analytics
- [ ] Track which templates are most popular
- [ ] Show trending templates
- [ ] Template usage statistics
- [ ] Regional/university-specific templates

## Example Scenarios

### Scenario 1: New Semester Setup
```
Class Representative (Aaditya):
1. Manually sets up all 8 subjects
2. Adds complete timetable for the week
3. Creates template: "5th Sem ISE Section A Batch A1"
4. Shares template name in class WhatsApp group

Classmate (Rahul):
1. Opens app, logs in
2. Clicks "Templates" button
3. Searches for "5th Sem ISE"
4. Finds Aaditya's template
5. Clicks Import → Done in 5 seconds!
```

### Scenario 2: Multiple Batches
```
Section A has 3 batches (A1, A2, A3)
Theory classes: Same for all
Practical classes: Different timings

Solution:
- Create base template with theory subjects
- Create 3 variants with different practical slots:
  - "5th Sem ISE Sec A Batch A1" (Mon 1-3)
  - "5th Sem ISE Sec A Batch A2" (Tue 1-3)
  - "5th Sem ISE Sec A Batch A3" (Wed 1-3)
- Students filter by their batch and import
```

### Scenario 3: Semester Transition
```
End of 4th Sem:
- Create template "4th Sem ISE Section A" (for juniors)

Start of 5th Sem:
- Import "5th Sem ISE Section A" created by seniors
- Update with any changes in your schedule
- Track new semester's attendance
```

## Best Practices

### For Template Creators
✅ Use clear, descriptive names with semester/section/batch
✅ Add helpful descriptions
✅ Verify timetable is correct before creating
✅ Use consistent naming conventions
✅ Make templates public to help classmates

### For Template Users
✅ Preview templates before importing
✅ Use filters to find exact match
✅ Choose "Replace All" only if starting fresh
✅ Verify imported data is correct
✅ Give feedback to template creators

### Naming Conventions
- Format: `{Semester} {Department} Section {Letter} Batch {Number}`
- Examples:
  - "5th Sem ISE Section A Batch A1"
  - "3rd Sem CSE Section B Batch B2"
  - "7th Sem ECE Section C Batch C3"
- Benefits: Easy searching, clear identification, standardized

## Troubleshooting

### "No subjects found" when creating template
- **Cause**: You haven't added any subjects yet
- **Solution**: Add at least one subject before creating template

### Template not appearing in search
- **Cause**: Template is private, or filters too restrictive
- **Solution**: Check "My Templates" tab, adjust filters

### Import failed
- **Cause**: Network error or server issue
- **Solution**: Refresh page and try again

### Duplicate subjects after import
- **Cause**: Used "Keep Existing" mode with same subjects
- **Solution**: Use "Replace All" or manually delete duplicates

### Can't delete template
- **Cause**: Not the template creator
- **Solution**: Only creators can delete their templates

## Performance Considerations

### Optimizations
- Templates indexed by semester/section/batch for fast filtering
- Import count cached (no need to count on each query)
- Cascading deletes prevent orphaned records
- Batch creation reduces database roundtrips

### Scaling
- Pagination can be added for large template lists
- Caching for popular templates
- Background jobs for template validation
- CDN for template previews

---

## Summary

The Template Sharing System transforms the onboarding experience from:
- ⏱️ **15-30 minutes** of manual data entry
- ❌ High chance of errors/typos
- 😓 Repetitive work for each student

To:
- ⚡ **5 seconds** to import and start
- ✅ Guaranteed accuracy (copied from verified source)
- 😊 One person creates, everyone benefits

This feature is especially valuable for:
- 🎓 Students starting a new semester
- 👥 Large classes where everyone has the same schedule
- 📚 Institutions with structured timetables
- 🔄 Recurring schedules (same for all batches/sections)
