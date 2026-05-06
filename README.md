# Hospital Employee Tracker

Hospital HR and workforce platform built with NestJS, React, and PostgreSQL.

## Local Setup (No Docker)

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL 15+

### 1. Create database and schema
```powershell
psql -U postgres -c "CREATE USER hospital_user WITH PASSWORD 'hospital_password';"
psql -U postgres -c "CREATE DATABASE hospital_tracker_dev OWNER hospital_user;"
npm run setup:db
```

### 2. Install all dependencies in one command
```powershell
npm run install:all
```

### 3. Run services
Terminal 1 (backend):
```powershell
npm run dev:backend
```

Terminal 2 (seed demo data):
```powershell
npm run seed
```

Terminal 3 (frontend):
```powershell
npm run dev:frontend
```

### 4. Access app
- Frontend: http://localhost:3001
- Backend API: http://localhost:3002
- API Docs: http://localhost:3002/api/docs

Demo credentials:
- Email: demo@example.com
- Password: password123

## BRD Verification (Module 5.1 and 5.2)

### 5.1 Authentication & Security
- AUTH-01 Login page with username/email + password: Completed
- AUTH-02 MFA setup/verify endpoints: Completed
- AUTH-03 Change password endpoint: Completed
- AUTH-04 Secure logout endpoint and frontend logout flow: Completed
- AUTH-05 Session timeout auto logout after inactivity: Completed

### 5.2 Employee Dashboard
- 5.2.1 Header profile details, role, location, manager, date/time, notification count: Completed
- 5.2.2 Welcome + quick-access tiles (rendering 3 tiles): Completed
- 5.2.3 Attendance summary with 30-day data + check-in/check-out toggle: Completed
- 5.2.4 Leave balance overview by leave type: Completed
- 5.2.5 Team leave, celebrations, holiday calendar, recent leave requests: Completed

### Notes on current scope
- Dashboard quick-access tile user preference persistence is not yet implemented (currently defaults are returned).
- Notification text such as payslip-generated content depends on notification data population from later payroll module.

## Key Workspace Scripts
- npm run install:all
- npm run dev:backend
- npm run dev:frontend
- npm run seed
- npm run setup:db

## Project Structure
- backend: NestJS API
- frontend: React + Vite UI
- infra/init-db.sql: PostgreSQL schema and seed base data
