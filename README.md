# Northstar — Student Success, in Focus

A local-first hackathon prototype for turning academic, attendance, LMS, engagement, skills and placement indicators into explainable student-support signals.

## Run locally

1. Open this folder in VS Code.
2. Choose **Terminal → Run Task… → Northstar: Serve locally**.
3. Open [http://localhost:8000](http://localhost:8000).

The VS Code task uses Python's built-in static web server; there are no package installs or external services. For a longer demo, double-click [Start Northstar.bat](./Start%20Northstar.bat) instead; it restarts the local server if it exits. Keep its console window open while you demo. To launch it when you sign into Windows, create a shortcut to that batch file in the Startup folder (`Win+R` → `shell:startup`).

The local site has no seven-day expiry. Its availability still depends on this computer staying powered on and awake and, for automatic login startup, you signing into Windows again after a restart. It only listens on this computer at `127.0.0.1`; this is not a public website and cannot be opened by judges on other devices.

## Demo accounts

| Interface | Username | Password |
|---|---|---|
| Faculty | `Teacher` | `Teacher` |
| Student | `Aarav Sharma` | `Aarav Sharma` |

Faculty can add/edit student profiles (including section and CGPA), remove demo records, and create faculty accounts. Account names and student data are saved to this browser's `localStorage`; after refreshing or reopening the site at the same address, registered names appear in the login name suggestions and can be used to sign in. A student's or faculty member's name is their demo password. `localhost` and `127.0.0.1` are different browser storage origins, so keep using [http://localhost:8000](http://localhost:8000) to see the same saved roster. This prototype does not sync records to other devices or browsers.

Faculty can log dated academic improvement updates with an area, starting point, latest result and note, as well as separate feedback reports with a rating and written guidance. Example records are included for the demo cohort. The student view has a dedicated **Academic progress & feedback** reports section with read-only improvement and faculty-feedback timelines. Faculty can review both report types from the student's edit profile.

## Student Success Score

The score is a weighted 0–100 indicator intended to make the underlying data visible—not a grade, diagnosis, or guaranteed prediction:

| Indicator | Weight | Normalization |
|---|---:|---|
| Academic performance | 35% | CGPA × 10, capped at 100 |
| Attendance | 20% | Percentage |
| LMS activity | 15% | Percentage |
| Campus engagement | 10% | Percentage |
| Placement readiness | 20% | Average of aptitude, coding and mock interview scores |

Student-facing profiles show all five contributions and weights. Skills assessment, feedback and backlog counts also appear in student information and support faculty review. Academic check-in signals use CGPA below 6.5, attendance below 70%, or at least two backlogs. Placement readiness below 55% is a placement check-in signal. One signal yields a moderate check-in; both together yield high. A signal is a prompt to review context and talk with the student, not an automated decision.

The faculty view includes cohort averages, section and name filters, check-in flags, explainable indicator segments and suggested supportive next steps. The roster includes a **Good standing / Needs support** dropdown: good standing means a low check-in risk and a success score of at least 70; other profiles are grouped as needing support. These are prompts to offer support, not labels for students.

## Quick demo walkthrough

1. Sign in as `Teacher` / `Teacher`. Point out the cohort overview, then filter the roster by section or search for a student.
2. Open Ananya Iyer's profile from the roster. Her CGPA is strong while her placement-readiness indicators are lower; the segment calls out a useful mentoring opportunity rather than labeling her as failing.
3. Open a student's profile, select **Progress update** to add an academic result, then select **Feedback report** to share dated written feedback and a rating.
4. Add a student, assign a section and CGPA, and fill in the remaining indicators. Edit the record to show that faculty owns the profile.
5. Sign out and enter that student's name as both username and password. Show the five weighted score contributions and the read-only academic improvement and faculty-feedback reports.
6. Close by explaining that check-in flags are prompts to use context and human judgment—not automated decisions.

## Data and privacy

The sample cohort is synthetic. Changes are stored in the current browser's `localStorage`; the sign-in session uses `sessionStorage`. The prototype has no backend, secure authentication, cross-device sync or access-control boundary. Do not clear this site's browser storage if you want to retain added records. Do not enter real or sensitive student records, and do not expose the demo server to a public network.

## GitHub

The GitHub Actions workflow in `.github/workflows/pages.yml` publishes the static site from the `main` branch to GitHub Pages. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. After the workflow succeeds, GitHub displays the public site URL under the repository's Pages settings and in the deployment environment.

The demo records are synthetic. Names and records entered while using the website are kept in each visitor's browser and are not committed or synced to other visitors.
