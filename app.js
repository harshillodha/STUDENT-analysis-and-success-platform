"use strict";

const STORAGE_KEY = "northstar-campus-data-v1";
const SESSION_KEY = "northstar-campus-session-v1";
const seed = {
  teachers: [{ name: "Teacher" }, { name: "Ms. Priya Shah" }],
  students: [
    { id: "s101", name: "Aarav Sharma", section: "CSE-A", cgpa: 8.7, attendance: 92, lms: 88, engagement: 78, aptitude: 82, coding: 76, interviews: 80, backlogs: 0, skills: 84, feedback: 4.6, note: "Consistent performer with strong peer collaboration.", improvements: [{ date: "2026-09-18", area: "Attendance", from: "86%", to: "92%", note: "Attended weekly mentor check-ins and built a steadier class routine." }, { date: "2026-09-04", area: "Coding practice", from: "68 / 100", to: "76 / 100", note: "Completed the guided problem-solving practice plan." }], feedbackReports: [{ date: "2026-09-26", area: "Academic mentoring", rating: 4.6, note: "Consistent effort across classes. Keep practising coding problems and sharing your approach with peers." }] },
    { id: "s102", name: "Ananya Iyer", section: "CSE-A", cgpa: 9.1, attendance: 96, lms: 94, engagement: 64, aptitude: 58, coding: 54, interviews: 52, backlogs: 0, skills: 72, feedback: 4.4, note: "Excellent academics; could benefit from more placement practice.", improvements: [{ date: "2026-09-22", area: "LMS activity", from: "87%", to: "94%", note: "Assignment completion improved after setting a weekly study plan." }], feedbackReports: [{ date: "2026-09-28", area: "Faculty feedback", rating: 4.4, note: "Excellent academic work and thoughtful participation. A few mock interviews would help build placement confidence." }] },
    { id: "s103", name: "Rohan Mehta", section: "CSE-B", cgpa: 6.2, attendance: 68, lms: 55, engagement: 42, aptitude: 49, coding: 52, interviews: 45, backlogs: 2, skills: 57, feedback: 3.2, note: "Would like additional support with core programming subjects.", improvements: [] },
    { id: "s104", name: "Diya Nair", section: "CSE-A", cgpa: 7.8, attendance: 83, lms: 80, engagement: 91, aptitude: 73, coding: 70, interviews: 77, backlogs: 0, skills: 86, feedback: 4.7, note: "Active in hackathons and the campus coding club.", improvements: [] },
    { id: "s105", name: "Kabir Verma", section: "ECE-A", cgpa: 7.0, attendance: 74, lms: 61, engagement: 50, aptitude: 68, coding: 47, interviews: 56, backlogs: 1, skills: 62, feedback: 3.7, note: "Interested in embedded systems; needs a structured practice plan.", improvements: [] },
    { id: "s106", name: "Meera Das", section: "ECE-A", cgpa: 8.3, attendance: 89, lms: 91, engagement: 72, aptitude: 86, coding: 81, interviews: 85, backlogs: 0, skills: 88, feedback: 4.8, note: "Strong project portfolio and confident mock interview performance.", improvements: [{ date: "2026-09-25", area: "Mock interviews", from: "74 / 100", to: "85 / 100", note: "Practised two structured mock interviews and refined project examples." }] },
    { id: "s107", name: "Ishaan Kapoor", section: "CSE-B", cgpa: 7.4, attendance: 79, lms: 72, engagement: 58, aptitude: 61, coding: 64, interviews: 58, backlogs: 0, skills: 69, feedback: 3.9, note: "Making steady progress; encourage one more mock interview.", improvements: [] },
    { id: "s108", name: "Sara Joseph", section: "ECE-A", cgpa: 8.0, attendance: 86, lms: 78, engagement: 84, aptitude: 57, coding: 60, interviews: 63, backlogs: 0, skills: 76, feedback: 4.2, note: "Strong campus involvement; aptitude practice is the next opportunity.", improvements: [] }
  ]
};
const app = document.getElementById("app");
let db = loadData();
let session = readSession();
let loginRole = "teacher";
let toastTimer;

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return structuredClone(seed);
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed.students) || !Array.isArray(parsed.teachers)) throw new Error("Invalid saved data");
    parsed.students = parsed.students.map(student => ({
      ...student,
      improvements: Array.isArray(student.improvements) ? student.improvements : [],
      feedbackReports: Array.isArray(student.feedbackReports) ? student.feedbackReports : []
    }));
    return parsed;
  } catch (error) {
    console.error("Unable to load saved campus data:", error);
    return structuredClone(seed);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return true;
  } catch (error) {
    console.error("Unable to save campus data:", error);
    showToast("Could not save changes in this browser.");
    return false;
  }
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch (error) {
    console.error("Unable to read login session:", error);
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function displayDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? escapeHtml(date) : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function weightedAverage(parts) {
  return Math.round(parts.reduce((sum, item) => sum + item.value * item.weight, 0));
}

function scores(student) {
  const placement = (Number(student.aptitude) + Number(student.coding) + Number(student.interviews)) / 3;
  const academic = Math.min(100, Number(student.cgpa) * 10);
  const success = weightedAverage([
    { value: academic, weight: .35 },
    { value: Number(student.attendance), weight: .20 },
    { value: Number(student.lms), weight: .15 },
    { value: Number(student.engagement), weight: .10 },
    { value: placement, weight: .20 }
  ]);
  const academicRisk = Number(student.cgpa) < 6.5 || Number(student.attendance) < 70 || Number(student.backlogs) >= 2;
  const placementRisk = placement < 55;
  const risk = academicRisk && placementRisk ? "High" : academicRisk || placementRisk ? "Moderate" : "Low";
  return { success, academic, placement: Math.round(placement), academicRisk, placementRisk, risk };
}

function header() {
  return `<header class="topbar">
    <div class="brand"><div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5V8.8L12 4l8 4.8v10.7M8 19.5v-6h8v6M8 9.5h.01M12 9.5h.01M16 9.5h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div><div class="brand-name">northstar</div><div class="brand-sub">Student success, in focus</div></div></div>
    ${session ? `<div class="top-actions"><span class="date-chip">${session.role === "teacher" ? "Faculty workspace" : "Student portal"} · ${escapeHtml(session.name)}</span>${session.role === "teacher" ? `<button class="button" data-action="add-teacher">＋ Add faculty</button>` : ""}<button class="button text-button" data-action="logout">Sign out ↗</button></div>` : ""}
  </header>`;
}

function render() {
  if (!session) {
    app.innerHTML = `${header()}${renderLogin()}`;
    return;
  }
  const isTeacher = session.role === "teacher";
  const knownTeacher = db.teachers.some(teacher => teacher.name.toLowerCase() === session.name.toLowerCase());
  const student = db.students.find(item => item.name.toLowerCase() === session.name.toLowerCase());
  if ((isTeacher && !knownTeacher) || (!isTeacher && !student)) {
    logout(false);
    app.innerHTML = `${header()}${renderLogin()}`;
    return;
  }
  app.innerHTML = `${header()}${isTeacher ? renderTeacherDashboard() : renderStudentDashboard(student)}`;
}

function renderLogin() {
  const loginAccounts = loginRole === "teacher" ? db.teachers : db.students;
  const accountOptions = loginAccounts.map(account => `<option value="${escapeHtml(account.name)}"></option>`).join("");
  return `<section class="login-wrap"><div class="login-card glass">
    <div class="login-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5V8.8L12 4l8 4.8v10.7M8 19.5v-6h8v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <div class="eyebrow" style="margin-top:19px">Northstar campus analytics</div>
    <h1>Make every student's next step clearer.</h1>
    <p>A calm, connected view of academic progress, engagement and placement readiness.</p>
    <div class="role-switch"><button class="${loginRole === "teacher" ? "active" : ""}" data-action="role" data-role="teacher">Faculty</button><button class="${loginRole === "student" ? "active" : ""}" data-action="role" data-role="student">Student</button></div>
    <form class="login-form" id="login-form">
      <div class="field"><label for="login-name">${loginRole === "teacher" ? "Faculty name" : "Student name"}</label><input id="login-name" name="name" list="saved-account-names" autocomplete="username" placeholder="${loginRole === "teacher" ? "Choose or enter faculty name" : "Choose or enter student name"}" required><datalist id="saved-account-names">${accountOptions}</datalist></div>
      <div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your name as password" required></div>
      <div class="login-error" id="login-error"></div>
      <button class="button primary" type="submit">Continue to ${loginRole === "teacher" ? "faculty workspace" : "student portal"} <span aria-hidden="true">→</span></button>
    </form>
    <div class="hint"><strong>Saved accounts:</strong> choose an existing name above. Newly added student and faculty names are saved in this browser and available after refresh; each person's name is also their demo password.</div>
  </div></section>`;
}

function average(list, field) {
  return list.length ? list.reduce((sum, item) => sum + Number(item[field]), 0) / list.length : 0;
}

function studentRow(student) {
  const result = scores(student);
  return `<tr class="click-row" data-action="edit-student" data-id="${escapeHtml(student.id)}">
    <td><div class="student-name"><span class="avatar">${escapeHtml(initials(student.name))}</span><div><div class="name-primary">${escapeHtml(student.name)}</div><div class="name-secondary">${escapeHtml(student.section)}</div></div></div></td>
    <td>${Number(student.cgpa).toFixed(1)}</td>
    <td><div class="score-cell"><span>${result.success}</span><span class="mini-progress"><span style="width:${result.success}%"></span></span></div></td>
    <td>${Number(student.attendance)}%</td>
    <td><span class="badge ${result.risk.toLowerCase()}">${result.risk}</span></td>
    <td><button class="icon-button" aria-label="Edit ${escapeHtml(student.name)}" data-action="edit-student" data-id="${escapeHtml(student.id)}">↗</button></td>
  </tr>`;
}

function buildInsights(students) {
  if (!students.length) return `<div class="insight-item"><div class="insight-icon">i</div><div><div class="insight-title">Add students to see cohort insights</div><div class="insight-copy">Patterns and suggested actions will appear here as the roster grows.</div></div></div>`;
  const risk = students.filter(student => scores(student).risk !== "Low");
  const academicStrong = students.filter(student => Number(student.cgpa) >= 8 && scores(student).placement < 65);
  const attendanceNeeds = students.filter(student => Number(student.attendance) < 75);
  const insights = [
    risk.length && { icon: "!", tone: "warm", title: `${risk.length} student${risk.length === 1 ? "" : "s"} could use an early check-in`, copy: "Review attendance, current coursework and any active backlogs with their faculty mentor." },
    academicStrong.length && { icon: "↗", tone: "", title: `${academicStrong.length} strong academic${academicStrong.length === 1 ? "" : "s"} profile${academicStrong.length === 1 ? "" : "s"} may need placement practice`, copy: "A focused aptitude or mock interview session could turn classroom strength into job readiness." },
    attendanceNeeds.length && { icon: "◎", tone: "mint", title: `${attendanceNeeds.length} student${attendanceNeeds.length === 1 ? "" : "s"} below 75% attendance`, copy: "Pair a supportive attendance conversation with a check for timetable or access barriers." }
  ].filter(Boolean);
  if (!insights.length) insights.push({ icon: "✓", tone: "mint", title: "Cohort signals look steady", copy: "Keep the regular student check-ins and monitor changes in attendance and LMS activity." });
  return insights.map(item => `<div class="insight-item"><div class="insight-icon ${item.tone}">${item.icon}</div><div><div class="insight-title">${item.title}</div><div class="insight-copy">${item.copy}</div></div></div>`).join("");
}

function renderTeacherDashboard() {
  const all = db.students;
  const riskCount = all.filter(student => scores(student).risk !== "Low").length;
  const highCount = all.filter(student => scores(student).risk === "High").length;
  const averageScore = all.length ? Math.round(average(all.map(scores), "success")) : 0;
  const averageAttendance = Math.round(average(all, "attendance"));
  const sections = [...new Set(all.map(item => item.section))].sort();
  return `<section>
    <div class="dashboard-heading"><div><div class="eyebrow">Faculty overview · Fall 2026</div><h1>Student success, one step ahead.</h1><p>Spot meaningful signals early. Start with a conversation, not just a score.</p></div><button class="button primary" data-action="add-student">＋ Add student</button></div>
    <div class="metric-grid">
      <article class="metric-card glass" style="--accent:#9bb9ff;--glow:rgba(125,169,255,.12)"><div class="metric-label">Students in view <span class="metric-dot"></span></div><div class="metric-value">${all.length}</div><div class="metric-note">Across ${sections.length} section${sections.length === 1 ? "" : "s"}</div></article>
      <article class="metric-card glass" style="--accent:#79e0c0;--glow:rgba(112,225,193,.11)"><div class="metric-label">Avg. success score <span class="metric-dot"></span></div><div class="metric-value">${averageScore}<small style="font:500 13px 'DM Sans';color:#95a4bc"> / 100</small></div><div class="metric-note">Weighted academic + engagement signals</div></article>
      <article class="metric-card glass" style="--accent:#ffd182;--glow:rgba(255,209,130,.1)"><div class="metric-label">Students to check in <span class="metric-dot"></span></div><div class="metric-value">${riskCount}</div><div class="metric-note">${highCount} higher-priority · review context first</div></article>
      <article class="metric-card glass" style="--accent:#b9a5ff;--glow:rgba(185,165,255,.11)"><div class="metric-label">Avg. attendance <span class="metric-dot"></span></div><div class="metric-value">${averageAttendance}<small style="font:500 13px 'DM Sans';color:#95a4bc">%</small></div><div class="metric-note">A useful early engagement indicator</div></article>
    </div>
    <div class="content-grid">
      <section class="panel glass">
        <div class="panel-head"><div><div class="panel-title">Student roster</div><div class="panel-subtitle">Select a student to review and edit their profile</div></div>
          <div class="student-tools"><input class="search-input" id="student-search" type="search" placeholder="Search students…" aria-label="Search students"><select class="filter-select" id="standing-filter" aria-label="Filter by student standing"><option value="all">All students</option><option value="good">Good standing</option><option value="support">Needs support</option></select><select class="filter-select" id="section-filter" aria-label="Filter by section"><option value="all">All sections</option>${sections.map(section => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join("")}</select></div>
        </div>
        <div class="table-wrap"><table class="student-table"><thead><tr><th>Student</th><th>CGPA</th><th>Success score</th><th>Attendance</th><th>Check-in</th><th></th></tr></thead><tbody id="student-rows">${all.map(studentRow).join("") || `<tr><td colspan="6" class="table-empty">No students yet. Add the first student to begin.</td></tr>`}</tbody></table></div>
        <div class="panel-body" style="padding-top:12px"><span class="subtle" style="font-size:9px">Scores are directional signals for supportive conversations—not a diagnosis or a decision about a student.</span></div>
      </section>
      <aside class="panel glass">
        <div class="panel-head"><div><div class="panel-title">What deserves attention</div><div class="panel-subtitle">Cohort patterns · suggested next steps</div></div></div>
        <div class="panel-body"><div class="insight-list">${buildInsights(all)}</div>
          <div class="segment-block"><div class="segment-title">Student segments</div>
            <div class="segment-row"><span>Academically strong · placement practice needed</span><strong>${all.filter(student => Number(student.cgpa) >= 8 && scores(student).placement < 65).length}</strong></div><div class="bar-track"><span style="width:${all.length ? Math.round(all.filter(student => Number(student.cgpa) >= 8 && scores(student).placement < 65).length / all.length * 100) : 0}%"></span></div>
            <div class="segment-row" style="margin-top:8px"><span>Steady academic · attendance follow-up</span><strong>${all.filter(student => Number(student.cgpa) >= 7 && Number(student.attendance) < 75).length}</strong></div><div class="bar-track"><span style="width:${all.length ? Math.round(all.filter(student => Number(student.cgpa) >= 7 && Number(student.attendance) < 75).length / all.length * 100) : 0}%"></span></div>
          </div>
        </div>
      </aside>
    </div>
    <div class="footer-note">Northstar is a decision-support prototype. Use human judgment and student context before taking action.</div>
  </section>`;
}

function renderStudentDashboard(student) {
  const result = scores(student);
  const breakdown = [
    ["Academic performance", result.academic, "35%"],
    ["Attendance", Number(student.attendance), "20%"],
    ["LMS activity", Number(student.lms), "15%"],
    ["Campus engagement", Number(student.engagement), "10%"],
    ["Placement readiness", result.placement, "20%"]
  ];
  const callout = result.academicRisk
    ? `Your attendance is ${Number(student.attendance)}% and you have ${Number(student.backlogs)} active backlog${Number(student.backlogs) === 1 ? "" : "s"}. Consider talking with your faculty mentor about a manageable support plan.`
    : result.placementRisk
      ? `Your placement readiness indicators suggest there may be room to practise. Your faculty can help you find a relevant aptitude or mock interview session.`
      : `Your indicators are looking steady. Keep building on the routines that work for you, and reach out to your faculty mentor whenever you need support.`;
  return `<section>
    <div class="student-welcome glass"><span class="avatar">${escapeHtml(initials(student.name))}</span><div><div class="eyebrow">Your student space · ${escapeHtml(student.section)}</div><h1>Hello, ${escapeHtml(student.name.split(" ")[0])}.</h1><p>Your progress at a glance. These insights are here to support you, not define you.</p></div></div>
    <div class="student-view-grid">
      <section class="panel glass">
        <div class="panel-head"><div><div class="panel-title">Your success score</div><div class="panel-subtitle">An explainable snapshot across five support indicators</div></div><span class="badge ${result.risk.toLowerCase()}">${result.risk} check-in</span></div>
        <div class="panel-body score-overview">
          <div class="score-circle-wrap"><div class="score-circle" style="--score:${result.success}"><span>${result.success}<small> / 100</small></span></div><div class="score-summary">${result.success >= 75 ? "A promising mix of learning and engagement indicators." : "A snapshot can highlight where the right support may help."}<br><span style="color:#7887a0;font-size:9px">Your score is not a grade or an outcome prediction.</span></div></div>
          ${breakdown.map(([name, value, weight]) => `<div class="breakdown-row"><div class="breakdown-label"><span>${name} <span style="color:#7887a0">· ${weight} weight</span></span><span>${Math.round(value)}%</span></div><div class="bar-track"><span style="width:${Math.max(0, Math.min(100, value))}%"></span></div></div>`).join("")}
          <div class="insight-callout"><strong>A possible next step</strong><p>${callout}</p></div>
        </div>
      </section>
      <section class="panel glass">
        <div class="panel-head"><div><div class="panel-title">Your profile</div><div class="panel-subtitle">Shared with you by your faculty team</div></div></div>
        <div class="panel-body">
          <div class="info-grid">
            ${[["CGPA", `${Number(student.cgpa).toFixed(1)} / 10`], ["Attendance", `${Number(student.attendance)}%`], ["LMS activity", `${Number(student.lms)}%`], ["Backlogs", Number(student.backlogs)], ["Aptitude", `${Number(student.aptitude)}%`], ["Coding assessment", `${Number(student.coding)}%`], ["Mock interviews", `${Number(student.interviews)}%`], ["Skills assessment", `${Number(student.skills)}%`]].map(([label, value]) => `<div class="info-tile"><span>${label}</span><strong>${value}</strong></div>`).join("")}
          </div>
          <div class="feedback-quote">“${escapeHtml(student.note || "Keep checking in with your faculty mentor about your goals and the support that works for you.")}”</div>
          <div class="student-notice">Profile information is read-only here. If something needs updating, please contact your faculty team. Your password for this demo is your name.</div>
        </div>
      </section>
      <section class="student-reports-heading"><div><div class="eyebrow">Your student reports</div><h2>Academic progress & feedback</h2><p>See your improvement over time and read feedback shared by your faculty team.</p></div><span class="progress-count">${(student.improvements || []).length + (student.feedbackReports || []).length} reports</span></section>
      <section class="panel glass improvement-panel">
        <div class="panel-head"><div><div class="panel-title">Academic improvement</div><div class="panel-subtitle">Progress over time · dates, results and notes</div></div><span class="progress-count">${(student.improvements || []).length} updates</span></div>
        <div class="panel-body">${renderImprovements(student)}</div>
      </section>
      <section class="panel glass improvement-panel feedback-report-panel">
        <div class="panel-head"><div><div class="panel-title">Faculty feedback</div><div class="panel-subtitle">Feedback reports shared with you</div></div><span class="progress-count">${(student.feedbackReports || []).length} notes</span></div>
        <div class="panel-body">${renderFeedbackReports(student)}</div>
      </section>
    </div><div class="footer-note">Your information is stored in this browser for the demo. Please avoid entering real or sensitive student data.</div>
  </section>`;
}

function renderImprovements(student) {
  const entries = [...(student.improvements || [])].sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return `<div class="improvement-empty"><span>✦</span><div><strong>Your progress log starts here</strong><p>When your faculty team adds a progress update, you'll be able to see the date, area and notes here.</p></div></div>`;
  return `<div class="improvement-list">${entries.map(entry => `<article class="improvement-item"><span class="improvement-marker"></span><div class="improvement-content"><div class="improvement-meta"><span class="improvement-area">${escapeHtml(entry.area)}</span><time>${displayDate(entry.date)}</time></div><div class="improvement-change"><span>${escapeHtml(entry.from)}</span><span class="improvement-arrow">→</span><strong>${escapeHtml(entry.to)}</strong></div><p>${escapeHtml(entry.note)}</p></div></article>`).join("")}</div>`;
}

function renderFeedbackReports(student) {
  const entries = [...(student.feedbackReports || [])].sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return `<div class="improvement-empty"><span>✦</span><div><strong>No feedback reports yet</strong><p>Your faculty team can add dated feedback to recognise your strengths and suggest a helpful next step.</p></div></div>`;
  return `<div class="feedback-report-list">${entries.map(entry => `<article class="feedback-report"><div class="improvement-meta"><span class="improvement-area">${escapeHtml(entry.area)}</span><time>${displayDate(entry.date)}</time></div><div class="feedback-rating" aria-label="${Number(entry.rating).toFixed(1)} out of 5">${"★".repeat(Math.max(0, Math.min(5, Math.round(Number(entry.rating)))))}<span>${Number(entry.rating).toFixed(1)} / 5</span></div><p>${escapeHtml(entry.note)}</p></article>`).join("")}</div>`;
}

function studentForm(student) {
  const editing = Boolean(student);
  const value = (key, fallback = "") => escapeHtml(student ? student[key] : fallback);
  return `<div class="modal-backdrop" data-action="backdrop-close"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
    <div class="modal-head"><div><h2 id="student-modal-title">${editing ? "Edit student profile" : "Add a student"}</h2><div class="panel-subtitle">Profile details power the score and cohort signals.</div></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <form id="student-form" data-id="${editing ? escapeHtml(student.id) : ""}">
      <div class="form-grid">
        <div class="field"><label for="student-name">Student name</label><input id="student-name" name="name" value="${value("name")}" required maxlength="80"></div>
        <div class="field"><label for="student-section">Section</label><input id="student-section" name="section" value="${value("section", "CSE-A")}" required maxlength="24" placeholder="e.g. CSE-A"></div>
        <div class="field"><label for="student-cgpa">CGPA (0–10)</label><input id="student-cgpa" name="cgpa" type="number" min="0" max="10" step="0.1" value="${value("cgpa", "7.5")}" required></div>
        <div class="field"><label for="student-attendance">Attendance (%)</label><input id="student-attendance" name="attendance" type="number" min="0" max="100" value="${value("attendance", "80")}" required></div>
        <div class="field"><label for="student-lms">LMS activity (%)</label><input name="lms" type="number" min="0" max="100" value="${value("lms", "75")}" required></div>
        <div class="field"><label for="student-engagement">Campus engagement (%)</label><input name="engagement" type="number" min="0" max="100" value="${value("engagement", "60")}" required></div>
        <div class="field"><label for="student-aptitude">Aptitude score (%)</label><input name="aptitude" type="number" min="0" max="100" value="${value("aptitude", "60")}" required></div>
        <div class="field"><label for="student-coding">Coding score (%)</label><input name="coding" type="number" min="0" max="100" value="${value("coding", "60")}" required></div>
        <div class="field"><label for="student-interviews">Mock interview score (%)</label><input name="interviews" type="number" min="0" max="100" value="${value("interviews", "60")}" required></div>
        <div class="field"><label for="student-backlogs">Active backlogs</label><input name="backlogs" type="number" min="0" max="30" value="${value("backlogs", "0")}" required></div>
        <div class="field"><label for="student-skills">Skills assessment (%)</label><input name="skills" type="number" min="0" max="100" value="${value("skills", "65")}" required></div>
        <div class="field"><label for="student-feedback">Satisfaction (1–5)</label><input name="feedback" type="number" min="1" max="5" step="0.1" value="${value("feedback", "4.0")}" required></div>
        <div class="field span-two"><label for="student-note">Faculty note / student feedback</label><input id="student-note" name="note" maxlength="180" value="${value("note")}" placeholder="A short, supportive observation"></div>
      </div>
      ${editing ? `<div class="modal-progress"><div class="segment-title">Academic improvement report</div>${renderImprovements(student)}<div class="segment-title" style="margin-top:12px">Faculty feedback reports</div>${renderFeedbackReports(student)}</div>` : ""}
      <div class="modal-actions">${editing ? `<button class="button danger" type="button" data-action="delete-student" data-id="${escapeHtml(student.id)}">Remove student</button><button class="button" type="button" data-action="add-improvement" data-id="${escapeHtml(student.id)}">＋ Progress update</button><button class="button" type="button" data-action="add-feedback-report" data-id="${escapeHtml(student.id)}">＋ Feedback report</button>` : ""}<span style="flex:1"></span><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">${editing ? "Save changes" : "Add student"}</button></div>
    </form>
  </div></div>`;
}

function improvementForm(student) {
  const today = new Date().toISOString().slice(0, 10);
  return `<div class="modal-backdrop" data-action="backdrop-close"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="improvement-modal-title" style="width:min(500px,100%)">
    <div class="modal-head"><div><h2 id="improvement-modal-title">Log a progress update</h2><div class="panel-subtitle">This update will be visible to ${escapeHtml(student.name)} in their student view.</div></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <form id="improvement-form" data-id="${escapeHtml(student.id)}"><div class="field"><label for="improvement-area">Area of progress</label><select id="improvement-area" name="area" required><option>Academic performance</option><option>Attendance</option><option>LMS activity</option><option>Placement readiness</option><option>Coding practice</option><option>Mock interviews</option><option>Campus engagement</option><option>Skills development</option><option>Other</option></select></div>
      <div class="form-grid"><div class="field"><label for="improvement-date">Update date</label><input id="improvement-date" name="date" type="date" value="${today}" required></div><div class="field"><label for="improvement-from">Starting point</label><input id="improvement-from" name="from" required maxlength="40" placeholder="e.g. 68%"></div><div class="field"><label for="improvement-to">Latest result</label><input id="improvement-to" name="to" required maxlength="40" placeholder="e.g. 82%"></div></div>
      <div class="field"><label for="improvement-note">Progress note</label><input id="improvement-note" name="note" required maxlength="180" placeholder="What changed or helped the student improve?"></div>
      <div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Save progress update</button></div>
    </form>
  </div></div>`;
}

function feedbackReportForm(student) {
  const today = new Date().toISOString().slice(0, 10);
  return `<div class="modal-backdrop" data-action="backdrop-close"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="feedback-report-title" style="width:min(500px,100%)">
    <div class="modal-head"><div><h2 id="feedback-report-title">Add faculty feedback report</h2><div class="panel-subtitle">This dated report will appear in ${escapeHtml(student.name)}'s student reports.</div></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <form id="feedback-report-form" data-id="${escapeHtml(student.id)}"><div class="form-grid"><div class="field"><label for="feedback-report-date">Report date</label><input id="feedback-report-date" name="date" type="date" value="${today}" required></div><div class="field"><label for="feedback-report-rating">Feedback rating (1–5)</label><input id="feedback-report-rating" name="rating" type="number" min="1" max="5" step="0.1" value="${Number(student.feedback || 4).toFixed(1)}" required></div></div>
      <div class="field"><label for="feedback-report-area">Feedback area</label><input id="feedback-report-area" name="area" maxlength="60" value="Faculty feedback" required></div>
      <div class="field"><label for="feedback-report-note">Feedback for the student</label><textarea id="feedback-report-note" name="note" rows="4" maxlength="500" required placeholder="Recognise a strength and share one helpful next step."></textarea></div>
      <div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Save feedback report</button></div>
    </form>
  </div></div>`;
}

function teacherForm() {
  return `<div class="modal-backdrop" data-action="backdrop-close"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="teacher-modal-title" style="width:min(430px,100%)">
    <div class="modal-head"><div><h2 id="teacher-modal-title">Add faculty account</h2><div class="panel-subtitle">The faculty member's name is their demo username and password.</div></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div>
    <form id="teacher-form"><div class="field"><label for="teacher-name">Faculty name</label><input id="teacher-name" name="name" required maxlength="80" placeholder="e.g. Dr. Lee"></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Create account</button></div></form>
  </div></div>`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function showStudentModal(id) {
  const student = id ? db.students.find(item => item.id === id) : null;
  if (id && !student) return showToast("This student profile is no longer available.");
  document.body.insertAdjacentHTML("beforeend", studentForm(student));
}

function showImprovementModal(id) {
  const student = db.students.find(item => item.id === id);
  if (!student) return showToast("This student profile is no longer available.");
  document.body.insertAdjacentHTML("beforeend", improvementForm(student));
}

function showFeedbackReportModal(id) {
  const student = db.students.find(item => item.id === id);
  if (!student) return showToast("This student profile is no longer available.");
  document.body.insertAdjacentHTML("beforeend", feedbackReportForm(student));
}

function logout(redraw = true) {
  session = null;
  sessionStorage.removeItem(SESSION_KEY);
  if (redraw) render();
}

function handleLogin(form) {
  const name = form.elements.name.value.trim();
  const password = form.elements.password.value;
  const accounts = loginRole === "teacher" ? db.teachers : db.students;
  const account = accounts.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!account || password.toLowerCase() !== name.toLowerCase()) {
    document.getElementById("login-error").textContent = "We couldn't match that name and password. Check the spelling or ask your faculty team.";
    return;
  }
  session = { role: loginRole, name: account.name };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  render();
}

function handleStudentSave(form) {
  if (!form.reportValidity()) return;
  const previousDb = structuredClone(db);
  const data = new FormData(form);
  const fields = ["cgpa", "attendance", "lms", "engagement", "aptitude", "coding", "interviews", "backlogs", "skills", "feedback"];
  const student = {
    name: String(data.get("name")).trim(),
    section: String(data.get("section")).trim().toUpperCase(),
    note: String(data.get("note")).trim()
  };
  fields.forEach(field => { student[field] = Number(data.get(field)); });
  const id = form.dataset.id;
  if (id) {
    const existing = db.students.find(item => item.id === id);
    const duplicate = db.students.some(item => item.id !== id && item.name.toLowerCase() === student.name.toLowerCase());
    if (duplicate) return showToast("A student with that name already exists; names are demo sign-in IDs.");
    Object.assign(existing, student);
    if (session.role === "student" && session.name.toLowerCase() === id.toLowerCase()) session.name = student.name;
  } else {
    if (db.students.some(item => item.name.toLowerCase() === student.name.toLowerCase()) || db.teachers.some(item => item.name.toLowerCase() === student.name.toLowerCase())) {
      return showToast("That name is already in use. Names are demo sign-in IDs.");
    }
    student.id = `s${Date.now()}`;
    db.students.push(student);
  }
  if (!saveData()) {
    db = previousDb;
    return;
  }
  document.querySelector(".modal-backdrop")?.remove();
  render();
  showToast(id ? "Student profile updated and saved." : "Student added and saved. Their name is their demo password.");
}

function handleImprovementSave(form) {
  if (!form.reportValidity()) return;
  const previousDb = structuredClone(db);
  const student = db.students.find(item => item.id === form.dataset.id);
  if (!student) return showToast("This student profile is no longer available.");
  const data = new FormData(form);
  student.improvements = Array.isArray(student.improvements) ? student.improvements : [];
  student.improvements.push({
    date: String(data.get("date")),
    area: String(data.get("area")),
    from: String(data.get("from")).trim(),
    to: String(data.get("to")).trim(),
    note: String(data.get("note")).trim()
  });
  if (!saveData()) {
    db = previousDb;
    return;
  }
  document.querySelector(".modal-backdrop")?.remove();
  render();
  showToast("Progress update saved to the student record.");
}

function handleFeedbackReportSave(form) {
  if (!form.reportValidity()) return;
  const previousDb = structuredClone(db);
  const student = db.students.find(item => item.id === form.dataset.id);
  if (!student) return showToast("This student profile is no longer available.");
  const data = new FormData(form);
  student.feedbackReports = Array.isArray(student.feedbackReports) ? student.feedbackReports : [];
  student.feedbackReports.push({
    date: String(data.get("date")),
    area: String(data.get("area")).trim(),
    rating: Number(data.get("rating")),
    note: String(data.get("note")).trim()
  });
  if (!saveData()) {
    db = previousDb;
    return;
  }
  document.querySelector(".modal-backdrop")?.remove();
  render();
  showToast("Faculty feedback report saved.");
}

function filterRoster() {
  const search = (document.getElementById("student-search")?.value || "").trim().toLowerCase();
  const section = document.getElementById("section-filter")?.value || "all";
  const standing = document.getElementById("standing-filter")?.value || "all";
  const filtered = db.students.filter(student => {
    const result = scores(student);
    const goodStanding = result.risk === "Low" && result.success >= 70;
    const matchesStanding = standing === "all" || (standing === "good" && goodStanding) || (standing === "support" && !goodStanding);
    return matchesStanding && (section === "all" || student.section === section) && `${student.name} ${student.section}`.toLowerCase().includes(search);
  });
  const rows = document.getElementById("student-rows");
  if (rows) rows.innerHTML = filtered.map(studentRow).join("") || `<tr><td colspan="6" class="table-empty">No students match this search.</td></tr>`;
}

document.addEventListener("click", event => {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;
  const { action, role, id } = actionElement.dataset;
  if (action === "role") { loginRole = role; render(); }
  if (action === "logout") logout();
  if (action === "add-student") showStudentModal();
  if (action === "edit-student") showStudentModal(id);
  if (action === "add-improvement") {
    document.querySelector(".modal-backdrop")?.remove();
    showImprovementModal(id);
  }
  if (action === "add-feedback-report") {
    document.querySelector(".modal-backdrop")?.remove();
    showFeedbackReportModal(id);
  }
  if (action === "close-modal") actionElement.closest(".modal-backdrop")?.remove();
  if (action === "backdrop-close" && event.target === actionElement) actionElement.remove();
  if (action === "add-teacher") document.body.insertAdjacentHTML("beforeend", teacherForm());
  if (action === "delete-student") {
    const student = db.students.find(item => item.id === id);
    if (!student || !window.confirm(`Remove ${student.name} from the demo roster?`)) return;
    const previousDb = structuredClone(db);
    db.students = db.students.filter(item => item.id !== id);
    if (!saveData()) {
      db = previousDb;
      return;
    }
    document.querySelector(".modal-backdrop")?.remove();
    render();
    showToast("Student removed.");
  }
});

document.addEventListener("submit", event => {
  if (event.target.id === "login-form") {
    event.preventDefault();
    handleLogin(event.target);
  }
  if (event.target.id === "student-form") {
    event.preventDefault();
    handleStudentSave(event.target);
  }
  if (event.target.id === "improvement-form") {
    event.preventDefault();
    handleImprovementSave(event.target);
  }
  if (event.target.id === "feedback-report-form") {
    event.preventDefault();
    handleFeedbackReportSave(event.target);
  }
  if (event.target.id === "teacher-form") {
    event.preventDefault();
    const name = new FormData(event.target).get("name").trim();
    if (db.teachers.some(item => item.name.toLowerCase() === name.toLowerCase()) || db.students.some(item => item.name.toLowerCase() === name.toLowerCase())) return showToast("That name is already in use.");
    const previousDb = structuredClone(db);
    db.teachers.push({ name });
    if (!saveData()) {
      db = previousDb;
      return;
    }
    document.querySelector(".modal-backdrop")?.remove();
    render();
    showToast("Faculty account created. The name is the demo password.");
  }
});

window.addEventListener("storage", event => {
  if (event.key !== STORAGE_KEY) return;
  db = loadData();
  render();
  showToast("Saved campus accounts were refreshed from another tab.");
});

document.addEventListener("input", event => {
  if (event.target.id === "student-search") filterRoster();
});
document.addEventListener("change", event => {
  if (event.target.id === "section-filter" || event.target.id === "standing-filter") filterRoster();
});

render();
