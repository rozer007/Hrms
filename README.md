# HRMS Lite – Human Resource Management System

A lightweight, production-ready HRMS web application built with FastAPI and React.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.11, FastAPI, SQLAlchemy (async), Pydantic v2 |
| Database | PostgreSQL (via asyncpg) |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Axios |
| Deployment | Render (backend + DB), Vercel (frontend) |

## Features

- **Employee Management** – Add, view, delete employees; search/filter; total present days per employee
- **Attendance Management** – Mark attendance (Present/Absent), filter by employee/date range, delete records
- **Dashboard** – Summary stats (total employees, departments, present/absent today), recent activity
- **Validations** – Client-side + server-side (required fields, email format, duplicate ID/email, duplicate attendance)
- **UI States** – Loading, empty, error states on all pages

---

## Project Structure

```
hrms/
├── backend/
│   ├── main.py           # FastAPI app + CORS + lifespan
│   ├── database.py       # Async SQLAlchemy engine + session
│   ├── models.py         # Employee, Attendance ORM models
│   ├── schemas.py        # Pydantic v2 request/response schemas
│   ├── routers/
│   │   ├── employees.py  # employees endpoint
│   │   └── attendance.py # attendance endpoint
|   ├── services/
│   │   ├── employee_services.py  # services for employee routes
│   │   └── attendance_services.py # services for attendance routes
│   ├── requirements.txt
│   └── render.yaml       # Render deployment config
└── frontend/
    ├── src/
    │   ├── api/client.ts      # Axios API wrapper
    │   ├── types/index.ts     # TypeScript interfaces
    │   ├── components/
    │   │   ├── Layout.tsx     # Sidebar navigation
    │   │   └── ui.tsx         # Reusable UI components
    │   └── pages/
    │       ├── Dashboard.tsx
    │       ├── Employees.tsx
    │       └── Attendance.tsx
    ├── vercel.json
    └── package.json
```

---

## API Reference

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/list_employees` | List all employees (with total_present) |
| POST | `/api/employees/create_employee` | Create employee |
| GET | `/api/employees/dashboard` | Dashboard stats |
| GET | `/api/employees/get_employee/{id}` | Get single employee |
| DELETE | `/api/employees/delete_employee/{id}` | Delete employee (cascades attendance) |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance/list_attendance` | List records (filters: employee_id, date_from, date_to) |
| POST | `/api/attendance/mark_attendance` | Mark attendance |
| DELETE | `/api/attendance/delete_attendance/{id}` | Delete record |

---

## Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL running locally
- Node.js 18+

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run
uvicorn main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install

# Configure API URL
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000

npm run dev
# App: http://localhost:5173
```

---
## Design Decisions

- **No auth** – Single admin user as specified; no login required
- **Cascade deletes** – Deleting an employee removes all their attendance records
- **Duplicate prevention** – Both employee ID and email must be unique; same employee can't have two entries for the same date
- **Async throughout** – SQLAlchemy async sessions for non-blocking I/O
- **Auto table creation** – `Base.metadata.create_all` on startup; no migration tool needed for this scope
