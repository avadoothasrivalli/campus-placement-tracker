# Campus Placement Tracker

A beginner-friendly full-stack project for tracking students, placement applications, and placement outcomes.

## Technologies
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express
- Database: Supabase PostgreSQL
- Version control: Git + GitHub

## 1. Install Node.js
Install the current LTS version from https://nodejs.org/. Close and reopen VS Code/PowerShell afterward.
Check:
```powershell
node -v
npm -v
```
If either command is not recognized, reinstall Node.js LTS and make sure the installer adds it to PATH.

## 2. Configure Supabase
1. Create a project at https://supabase.com/.
2. Open **SQL Editor** in your Supabase project.
3. Open `database/schema.sql` from this project, copy its contents, paste into SQL Editor, and click **Run**.
4. Open **Project Settings → API** (or **Connect**, depending on the dashboard).
5. Copy the Project URL and the `service_role` key. Keep the service-role key private: never put it in frontend JavaScript or upload it to GitHub.
6. In `backend`, copy `.env.example` to `.env` and fill in your values:
```env
PORT=3000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```
The backend uses the service-role key only on the server. Do not share your `.env` file or screenshots containing the key.

## 3. Install dependencies and run
Open a terminal in the project root (`campus-placement-tracker`):
```powershell
cd backend
npm install
npm start
```
Then open http://localhost:3000 in your browser. The backend serves the frontend itself, so do not open `index.html` directly.

## 4. If you have not configured Supabase yet
The website still opens, but API requests will show a helpful database configuration error until you set up Supabase and restart the server.

## Features
- Dashboard counts for students, applications, and placed students
- Add and view student records
- Add and view placement application records
- Update application status
- Search students and applications
- Input validation and user-friendly error messages
- REST API endpoints and Supabase PostgreSQL storage

## Project structure
```text
campus-placement-tracker/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
└── README.md
```

## Git and GitHub (optional)
From the project root:
```powershell
git init
git add .
git commit -m "Initial Campus Placement Tracker project"
```
Create an empty repository on GitHub, then follow GitHub's instructions to add its remote and push. The `.gitignore` excludes `.env` and `node_modules`.
