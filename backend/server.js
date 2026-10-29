require('dotenv').config();
const express = require('express');
const path = require('path');
const { supabase, requireSupabase } = require('./supabase');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const frontendPath = path.resolve(__dirname, '../frontend');

app.use(express.json({ limit: '100kb' }));
app.use(express.static(frontendPath));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', databaseConfigured: Boolean(supabase) });
});

app.get('/api/students', requireSupabase, async (req, res) => {
  const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: `Could not fetch students: ${error.message}` });
  res.json(data);
});

app.post('/api/students', requireSupabase, async (req, res) => {
  const full_name = String(req.body.full_name || '').trim();
  const roll_number = String(req.body.roll_number || '').trim();
  const branch = String(req.body.branch || '').trim();
  const email = String(req.body.email || '').trim() || null;
  if (!full_name || !roll_number || !branch) {
    return res.status(400).json({ error: 'Full name, roll number, and branch are required.' });
  }
  if (full_name.length > 100 || roll_number.length > 30 || branch.length > 30 || (email && email.length > 150)) {
    return res.status(400).json({ error: 'One or more fields are too long.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const { data, error } = await supabase.from('students')
    .insert([{ full_name, roll_number, branch, email }]).select().single();
  if (error) {
    const duplicate = error.code === '23505';
    return res.status(duplicate ? 409 : 500).json({
      error: duplicate ? 'That roll number is already registered.' : `Could not add student: ${error.message}`
    });
  }
  res.status(201).json(data);
});

app.get('/api/applications', requireSupabase, async (req, res) => {
  const { data, error } = await supabase.from('placement_applications')
    .select('id, student_id, company_name, role, status, package_lpa, applied_at, students(full_name, roll_number)')
    .order('applied_at', { ascending: false });
  if (error) return res.status(500).json({ error: `Could not fetch applications: ${error.message}` });
  res.json(data.map(row => ({
    id: row.id, student_id: row.student_id, company_name: row.company_name,
    role: row.role, status: row.status, package_lpa: row.package_lpa,
    applied_at: row.applied_at, student_name: row.students?.full_name || 'Unknown student',
    roll_number: row.students?.roll_number || ''
  })));
});

app.post('/api/applications', requireSupabase, async (req, res) => {
  const student_id = String(req.body.student_id || '').trim();
  const company_name = String(req.body.company_name || '').trim();
  const role = String(req.body.role || '').trim() || null;
  const status = String(req.body.status || 'Applied');
  let package_lpa = req.body.package_lpa;
  if (package_lpa === '' || package_lpa === undefined) package_lpa = null;
  if (package_lpa !== null) package_lpa = Number(package_lpa);
  if (!student_id || !company_name) return res.status(400).json({ error: 'Choose a student and enter a company name.' });
  if (company_name.length > 120 || (role && role.length > 120)) return res.status(400).json({ error: 'Company or role name is too long.' });
  if (!['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid application status.' });
  }
  if (package_lpa !== null && (!Number.isFinite(package_lpa) || package_lpa < 0 || package_lpa > 1000)) {
    return res.status(400).json({ error: 'Package must be a number between 0 and 1000 LPA.' });
  }
  const { data, error } = await supabase.from('placement_applications')
    .insert([{ student_id, company_name, role, status, package_lpa }]).select().single();
  if (error) {
    const statusCode = error.code === '23503' ? 400 : 500;
    return res.status(statusCode).json({ error: `Could not add application: ${error.message}` });
  }
  res.status(201).json(data);
});

app.patch('/api/applications/:id', requireSupabase, async (req, res) => {
  const status = String(req.body.status || '');
  if (!['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid application status.' });
  }
  const { data, error } = await supabase.from('placement_applications')
    .update({ status }).eq('id', req.params.id).select().single();
  if (error) return res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: `Could not update application: ${error.message}` });
  res.json(data);
});

app.get('*splat', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  res.sendFile(path.join(frontendPath, 'index.html'), err => { if (err) next(err); });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error. Check the terminal for details.' });
});

app.listen(PORT, () => {
  console.log(`Campus Placement Tracker running at http://localhost:${PORT}`);
  if (!supabase) console.log('Database not configured yet. Add values to backend/.env to enable database features.');
});
