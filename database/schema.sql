-- Campus Placement Tracker database schema
-- Run this entire script in Supabase Dashboard -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(100) not null,
  roll_number varchar(30) not null unique,
  branch varchar(30) not null,
  email varchar(150),
  created_at timestamptz not null default now()
);

create table if not exists public.placement_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  company_name varchar(120) not null,
  role varchar(120),
  status varchar(20) not null default 'Applied'
    check (status in ('Applied', 'Assessment', 'Interview', 'Selected', 'Rejected')),
  package_lpa numeric(8,2) check (package_lpa is null or package_lpa >= 0),
  applied_at timestamptz not null default now()
);

create index if not exists idx_students_roll_number on public.students(roll_number);
create index if not exists idx_applications_student_id on public.placement_applications(student_id);
create index if not exists idx_applications_status on public.placement_applications(status);

-- The backend accesses these tables using the Supabase service-role key stored
-- in backend/.env. Never expose that key in frontend files or commit .env.
-- For a production deployment, add authentication and a carefully designed
-- Row Level Security policy before allowing public access.
