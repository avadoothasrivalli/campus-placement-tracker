const $ = (selector) => document.querySelector(selector);
const state = { students: [], applications: [] };

function showNotice(message, isError = false) {
  const notice = $('#notice');
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.setTimeout(() => { notice.hidden = true; }, 6500);
}
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}
function statusClass(status) {
  return `status-${String(status).toLowerCase()}`;
}
function renderStudents() {
  const query = $('#studentSearch').value.trim().toLowerCase();
  const filtered = state.students.filter(s =>
    [s.full_name, s.roll_number, s.branch, s.email].some(v => String(v || '').toLowerCase().includes(query))
  );
  $('#studentsTable').innerHTML = filtered.length ? filtered.map(s => `
    <tr><td>${escapeHtml(s.full_name)}</td><td>${escapeHtml(s.roll_number)}</td>
    <td>${escapeHtml(s.branch)}</td><td>${escapeHtml(s.email || '—')}</td><td>${dateLabel(s.created_at)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">No students found. Add a student using the form above.</td></tr>';
  $('#studentSelect').innerHTML = '<option value="">Choose student</option>' + state.students.map(s =>
    `<option value="${s.id}">${escapeHtml(s.full_name)} — ${escapeHtml(s.roll_number)}</option>`).join('');
}
function renderApplications() {
  const query = $('#applicationSearch').value.trim().toLowerCase();
  const filtered = state.applications.filter(a =>
    [a.student_name, a.roll_number, a.company_name, a.role, a.status].some(v => String(v || '').toLowerCase().includes(query))
  );
  $('#applicationsTable').innerHTML = filtered.length ? filtered.map(a => `
    <tr><td>${escapeHtml(a.student_name)}<br><small>${escapeHtml(a.roll_number)}</small></td>
    <td>${escapeHtml(a.company_name)}</td><td>${escapeHtml(a.role || '—')}</td>
    <td>${a.package_lpa == null ? '—' : `₹${escapeHtml(a.package_lpa)} LPA`}</td>
    <td><span class="status ${statusClass(a.status)}">${escapeHtml(a.status)}</span></td>
    <td><select class="status-select" data-application-id="${a.id}" aria-label="Update status for ${escapeHtml(a.company_name)}">
      ${['Applied','Assessment','Interview','Selected','Rejected'].map(status =>
        `<option ${status === a.status ? 'selected' : ''}>${status}</option>`).join('')}
    </select></td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No applications found. Add an application using the form above.</td></tr>';
}
function renderStats() {
  const placedIds = new Set(state.applications.filter(a => a.status === 'Selected').map(a => a.student_id));
  $('#studentCount').textContent = state.students.length;
  $('#applicationCount').textContent = state.applications.length;
  $('#placedCount').textContent = placedIds.size;
  $('#placementRate').textContent = state.students.length ? `${Math.round(placedIds.size / state.students.length * 100)}%` : '0%';
}
async function loadData() {
  $('#refreshBtn').disabled = true;
  try {
    const [students, applications] = await Promise.all([api('/students'), api('/applications')]);
    state.students = students;
    state.applications = applications;
    renderStudents(); renderApplications(); renderStats();
  } catch (error) {
    showNotice(`${error.message} Check your Supabase settings in backend/.env and restart the server.`, true);
    $('#studentsTable').innerHTML = '<tr><td colspan="5" class="empty">Could not load data.</td></tr>';
    $('#applicationsTable').innerHTML = '<tr><td colspan="6" class="empty">Could not load data.</td></tr>';
  } finally { $('#refreshBtn').disabled = false; }
}
$('#studentForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form));
  try {
    await api('/students', { method: 'POST', body: JSON.stringify(payload) });
    form.reset(); await loadData(); showNotice('Student added successfully.');
  } catch (error) { showNotice(error.message, true); }
});
$('#applicationForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const raw = Object.fromEntries(new FormData(form));
  const payload = { ...raw, package_lpa: raw.package_lpa === '' ? null : Number(raw.package_lpa) };
  try {
    await api('/applications', { method: 'POST', body: JSON.stringify(payload) });
    form.reset(); await loadData(); showNotice('Placement application added successfully.');
  } catch (error) { showNotice(error.message, true); }
});
$('#applicationsTable').addEventListener('change', async event => {
  const select = event.target.closest('[data-application-id]');
  if (!select) return;
  try {
    await api(`/applications/${select.dataset.applicationId}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
    await loadData(); showNotice('Application status updated.');
  } catch (error) { showNotice(error.message, true); await loadData(); }
});
$('#studentSearch').addEventListener('input', renderStudents);
$('#applicationSearch').addEventListener('input', renderApplications);
$('#refreshBtn').addEventListener('click', loadData);
loadData();
