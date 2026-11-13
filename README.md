# Smart Attendance

A lightweight student attendance portal with role-based dashboards, attendance
tracking, and administrator-reviewed student account requests. The interface is
responsive and uses a pink glassmorphism theme with animated decorative
elements.

> **Prototype notice:** This project is a browser-only demo. It does not have a
> server, database, or secure authentication. Do not use real student information
> or real passwords. See [Security and production readiness](#security-and-production-readiness).

## Features

- One sign-in form routes users automatically:
  - The `admin` username opens the administrator dashboard when paired with
    the demo admin password.
  - A registered student username opens that student's dashboard.
- Student dashboard shows attendance totals, percentage, and history.
- Administrator dashboard can record attendance by date, add student accounts,
  review account requests, and view the student directory.
- Prospective students can request an account with their name, username,
  password, and class.
- Administrators can approve or reject pending requests. Approval creates an
  account that can sign in; rejection does not.
- Student class information appears in the student dashboard and directory.
- Data is persisted in browser `localStorage` for the current browser origin.
- Accessible form labels, status announcements, responsive layouts, and
  reduced-motion support are included.

## Technology

| Technology | Use |
| --- | --- |
| HTML5 | Page structure, forms, dashboards, and tables |
| CSS3 | Responsive layout, pink theme, glassmorphism, and animations |
| Vanilla JavaScript (ES6+) | Login routing, request review, attendance, and rendering |
| Web Storage API (`localStorage`) | Demo persistence between page reloads |
| Google Fonts | DM Sans and Manrope typography (requires internet access) |

There is no build step, package manager, framework, or third-party JavaScript
dependency.

## Project files

```text
.
├── index.html   # Markup and references to the stylesheet and application script
├── styles.css   # Theme, layout, responsive rules, and animations
├── app.js       # Application state, validation, rendering, and event handlers
└── read.md      # Project guide
```

`index.html` loads `styles.css` and loads `app.js` with `defer`, so the document
is parsed before the application attaches event handlers.

## Run locally

### Open the page directly

Open `index.html` in a modern browser. This works for a quick demo; note that
browser storage behavior for `file://` pages can vary between browsers.

### Use a local web server (recommended)

From the project directory, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Stop the server with `Ctrl+C`.

No dependencies need to be installed. An internet connection is only needed to
download the optional Google Fonts; the page's layout and functionality are
otherwise local.

## Demo accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Student | `abhi` | `abhi` |
| Student | `ST002` | `student123` |

These are public demo credentials, not secure accounts. Student records saved
or changed through the app can override the initial demo data for that browser.

## User workflows

### Student sign-in

1. A student enters their username and password on the shared sign-in screen.
2. The app searches registered student records for a case-insensitive username
   match and an exact password match.
3. If a match exists, the student dashboard displays that account's class and
   attendance records. Otherwise, an error is shown.

The app does not provide a role selector. The administrator username is checked
separately from student usernames.

### Requesting a student account

1. On the sign-in screen, choose **Request an account**.
2. Enter a full name, username, password, and class, then submit the form.
3. The app checks for the reserved `admin` username, existing student usernames,
   and duplicate non-rejected requests.
4. A valid request is saved with a pending status and shown to the administrator.
5. The student can sign in only after the administrator approves the request.

### Reviewing requests as an administrator

1. Sign in with the administrator demo credentials.
2. Open **Student account requests** in the admin dashboard.
3. Choose **Accept** or **Reject**:
   - **Accept** creates a student record with the requested username, password,
     name, and class. The new student can then sign in.
   - **Reject** marks the request as rejected and does not create a student
     record.
4. The request remains in the table with its final status. Its password is
   removed from the stored request after a decision.

An administrator can also add a student directly using **Add a student**.

### Recording attendance

1. In the administrator dashboard, select an attendance date.
2. Choose Present or Absent for each student.
3. Select **Save attendance**.
4. The admin totals update for that date. Students see their own records,
   present and absent totals, and attendance percentage on their dashboard.

For a selected date, saving attendance replaces the existing saved records for
that date with the current selections.

## Browser data model

The app stores JSON arrays under these `localStorage` keys:

### `students`

```json
[
  {
    "id": "abhi",
    "name": "Student One",
    "password": "abhi",
    "className": "10-A"
  }
]
```

`className` may be absent on older demo records.

### `attendance`

```json
[
  {
    "id": "abhi",
    "date": "2026-11-13",
    "status": "Present"
  }
]
```

### `studentRequests`

A pending request contains an internal request ID, name, username, password,
class, request timestamp, and status. Once decided, the password is removed and
the status is `approved` or `rejected`.

The app includes a small migration for the earlier demo student (`ST001` /
`student123`), changing that account and its attendance records to `abhi` / `abhi`
when the old record is present.

## Validation and behavior

- Required form fields are checked by HTML form validation and JavaScript.
- Usernames are compared case-insensitively; passwords are case-sensitive.
- The username `admin` is reserved for the administrator.
- Student names, usernames, and class values are escaped before being placed in
  generated table markup.
- Browser storage failures are reported in the interface and logged to the
  console.
- Data is scoped to the browser and origin. `localhost`, `file://`, and another
  hostname do not necessarily share the same stored data.
- Clearing site data or changing browsers/devices removes access to this local
  demo data.

## Security and production readiness

This application is suitable for demonstrations and local learning only:

- The admin password is hard-coded in client-side JavaScript and is visible to
  anyone who can inspect the files.
- Student passwords are stored as plain text in browser storage. Pending signup
  requests also contain the submitted password until an administrator makes a
  decision.
- Anyone with access to the same browser profile can inspect or modify
  `localStorage`, including adding a student or changing a request status.
- There is no server-side authorization, audit log, account recovery, request
  notification, or cross-device synchronization.
- A rejected request cannot authenticate because it is not added to the student
  records, but client-side checks are not a security boundary.

Before using this with real people or deploying it publicly, replace the
browser-only flow with a backend that:

1. Stores users and attendance in a database.
2. Hashes passwords with a suitable password-hashing algorithm; never stores
   submitted passwords in a signup request.
3. Enforces role checks, signup approval, and attendance permissions on the
   server for every protected operation.
4. Uses secure sessions, HTTPS, validation, rate limiting, and appropriate
   privacy controls.
5. Records account decisions and attendance changes in an audit trail.

## Troubleshooting

- **Styles or script do not load:** Keep `index.html`, `styles.css`, and
  `app.js` in the same folder and preserve their filenames.
- **A demo login does not work:** The browser may already have saved an older
  or manually changed `students` record. Inspect or clear this site's local
  storage only if you are comfortable losing its saved students, requests,
  and attendance.
- **The admin sees no request:** Signup requests are local to the same browser
  and origin. This demo cannot send requests between different devices.
- **Fonts look different:** Google Fonts needs an internet connection; the
  browser uses a sans-serif fallback when they are unavailable.
