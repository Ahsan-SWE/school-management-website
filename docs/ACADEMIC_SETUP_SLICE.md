# Academic Setup Vertical Slice

## Included

- Academic years with active-range overlap protection
- Terms, semesters, quarters, and custom periods
- Grade-level masters
- Branch/year-specific class offerings
- Section offerings
- Subject masters and class subject offerings
- Teacher assignment model and UI
- Tenant-scoped API authorization
- PostgreSQL RLS, audit events, and transactional outbox events
- Protected Next.js academic setup workspace

## API

All endpoints require:

```text
Authorization: Bearer <Supabase access token>
X-School-Membership-Id: <active membership UUID>
```

Routes:

```text
GET  /api/v1/academic/overview
POST /api/v1/academic/years
POST /api/v1/academic/periods
POST /api/v1/academic/grades
POST /api/v1/academic/classes
POST /api/v1/academic/sections
POST /api/v1/academic/subjects
POST /api/v1/academic/subject-offerings
POST /api/v1/academic/teaching-assignments
```

## Suggested setup order

1. Academic year
2. Term/semester
3. Grade level
4. Class offering
5. Section
6. Subject
7. Subject offering
8. Teacher assignment after a teacher/employee membership exists

## Next slice

People & Access should add teacher/employee creation before full teaching-assignment
acceptance testing. Admission and enrollment can then use these academic masters.
