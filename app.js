"use strict";

const defaultStudents = [
    { id: "abhi", name: "Student One", password: "abhi" },
    { id: "ST002", name: "Student Two", password: "student123" }
];

function readStoredArray(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : fallback;
    } catch (error) {
        console.error(`Could not read ${key} from local storage.`, error);
        return fallback;
    }
}

let students = readStoredArray("students", defaultStudents);
let attendance = readStoredArray("attendance", []);
let studentRequests = readStoredArray("studentRequests", []);
let currentUser = null;

const previousDemoStudent = students.find((student) =>
    student.id === "ST001" && student.name === "Student One" && student.password === "student123"
);
if (previousDemoStudent) {
    previousDemoStudent.id = "abhi";
    previousDemoStudent.password = "abhi";
    attendance.forEach((record) => {
        if (record.id === "ST001") record.id = "abhi";
    });
}

const element = (id) => document.getElementById(id);
const loginSection = element("loginSection");
const adminDashboard = element("adminDashboard");
const studentDashboard = element("studentDashboard");
const loginMessage = element("loginMessage");
const adminMessage = element("adminMessage");
const attendanceMessage = element("attendanceMessage");
const signupMessage = element("signupMessage");
const usernameInput = element("username");
const passwordInput = element("password");
const attendanceDate = element("attendanceDate");

function saveData() {
    try {
        localStorage.setItem("students", JSON.stringify(students));
        localStorage.setItem("attendance", JSON.stringify(attendance));
        localStorage.setItem("studentRequests", JSON.stringify(studentRequests));
    } catch (error) {
        console.error("Could not save portal data to local storage.", error);
        throw new Error("Your browser could not save the latest changes.");
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function login(event) {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    loginMessage.textContent = "";

    if (username.toLowerCase() === "admin") {
        if (password === "admin123") {
            currentUser = { role: "admin" };
            showAdmin();
        } else {
            loginMessage.textContent = "That username and password don't match. Please try again.";
        }
        return;
    }

    const student = students.find((item) =>
        String(item.id).toLowerCase() === username.toLowerCase() && item.password === password
    );
    if (student) {
        currentUser = { role: "student", id: student.id };
        showStudent(student);
    } else {
        loginMessage.textContent = "That username and password don't match. Please try again.";
    }
}

function showAdmin() {
    loginSection.classList.add("hidden");
    studentDashboard.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    adminMessage.textContent = "";
    renderAdmin();
}

function showEmptyRow(target, message, columns) {
    target.innerHTML = `<tr><td class="empty-state" colspan="${columns}">${escapeHTML(message)}</td></tr>`;
}

function renderAdmin() {
    const date = attendanceDate.value;
    const studentTable = element("studentTable");
    const attendanceTable = element("attendanceTable");
    const requestTable = element("requestTable");
    const pendingRequests = studentRequests.filter((request) => request.status === "pending");
    element("requestCount").textContent = `${pendingRequests.length} pending`;

    if (studentRequests.length === 0) {
        showEmptyRow(requestTable, "No sign-up requests yet.", 5);
    } else {
        requestTable.innerHTML = [...studentRequests]
            .sort((first, second) => second.requestedAt.localeCompare(first.requestedAt))
            .map((request) => {
                const status = request.status || "pending";
                const statusLabel = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending";
                const statusClass = status === "approved" ? "request-status-approved" : status === "rejected" ? "request-status-rejected" : "request-status-pending";
                const actions = status === "pending"
                    ? `<div class="request-actions">
                        <button class="request-action request-accept" type="button" data-request-action="approve" data-request-id="${escapeHTML(request.id)}">Accept</button>
                        <button class="request-action request-reject" type="button" data-request-action="reject" data-request-id="${escapeHTML(request.id)}">Reject</button>
                    </div>`
                    : `<span class="request-status ${statusClass}">${statusLabel}</span>`;
                const requestedAt = request.requestedAt ? new Date(request.requestedAt).toLocaleDateString() : "—";
                return `<tr>
                    <td>${escapeHTML(request.name)}</td>
                    <td>${escapeHTML(request.username)}</td>
                    <td>${escapeHTML(request.className)}</td>
                    <td>${escapeHTML(requestedAt)}</td>
                    <td>${actions}</td>
                </tr>`;
            }).join("");
    }

    if (students.length === 0) {
        showEmptyRow(studentTable, "No students yet. Add a student above to get started.", 3);
        showEmptyRow(attendanceTable, "Add a student to start recording attendance.", 3);
    } else {
        studentTable.innerHTML = students.map((student) => `
            <tr><td>${escapeHTML(student.id)}</td><td>${escapeHTML(student.name)}</td><td>${escapeHTML(student.className || "—")}</td></tr>
        `).join("");
        attendanceTable.innerHTML = students.map((student) => {
            const record = attendance.find((item) => item.id === student.id && item.date === date);
            const safeId = escapeHTML(student.id);
            return `<tr>
                <td>${safeId}</td>
                <td>${escapeHTML(student.name)}</td>
                <td><select id="status-${safeId}" aria-label="Attendance status for ${safeId}">
                    <option value="Present" ${record?.status === "Present" ? "selected" : ""}>Present</option>
                    <option value="Absent" ${record?.status === "Absent" ? "selected" : ""}>Absent</option>
                </select></td>
            </tr>`;
        }).join("");
    }

    const todayRecords = attendance.filter((record) => record.date === date);
    element("totalStudents").textContent = students.length;
    element("totalPresent").textContent = todayRecords.filter((record) => record.status === "Present").length;
    element("totalAbsent").textContent = todayRecords.filter((record) => record.status === "Absent").length;
}

function addStudent(event) {
    event.preventDefault();
    const name = element("newName").value.trim();
    const id = element("newID").value.trim();
    const password = element("newPassword").value;
    const className = element("newClass").value.trim();

    if (!name || !id || !password || !className) {
        adminMessage.textContent = "Please complete all student details, including class.";
        return;
    }
    if (id.toLowerCase() === "admin" || students.some((student) => String(student.id).toLowerCase() === id.toLowerCase()) ||
        studentRequests.some((request) => request.status === "pending" && request.username.toLowerCase() === id.toLowerCase())) {
        adminMessage.textContent = "That student ID is already in use.";
        return;
    }

    students.push({ name, id, password, className });
    try {
        saveData();
    } catch (error) {
        students.pop();
        adminMessage.textContent = error.message;
        return;
    }
    element("addStudentForm").reset();
    adminMessage.textContent = `${name} was added successfully.`;
    renderAdmin();
}

function submitStudentRequest(event) {
    event.preventDefault();
    const name = element("signupName").value.trim();
    const username = element("signupUsername").value.trim();
    const password = element("signupPassword").value;
    const className = element("signupClass").value.trim();
    const normalizedUsername = username.toLowerCase();
    signupMessage.textContent = "";

    if (!name || !username || !password || !className) {
        signupMessage.textContent = "Please complete all fields.";
        return;
    }
    if (normalizedUsername === "admin" ||
        students.some((student) => String(student.id).toLowerCase() === normalizedUsername) ||
        studentRequests.some((request) => request.username.toLowerCase() === normalizedUsername && request.status !== "rejected")) {
        signupMessage.textContent = "That username is already registered or has a pending request.";
        return;
    }

    const request = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        username,
        password,
        className,
        requestedAt: new Date().toISOString(),
        status: "pending"
    };
    studentRequests.push(request);
    try {
        saveData();
    } catch (error) {
        studentRequests.pop();
        signupMessage.textContent = error.message;
        return;
    }
    element("signupForm").reset();
    signupMessage.textContent = "Request sent. You can sign in after an administrator approves it.";
}

function decideStudentRequest(requestId, decision) {
    if (currentUser?.role !== "admin" || !["approved", "rejected"].includes(decision)) return;
    const request = studentRequests.find((item) => item.id === requestId && item.status === "pending");
    if (!request) return;

    if (decision === "approved") {
        const usernameExists = students.some((student) => String(student.id).toLowerCase() === request.username.toLowerCase());
        if (usernameExists) {
            adminMessage.textContent = `Cannot accept ${request.username}: that username is already in use.`;
            return;
        }
        students.push({
            id: request.username,
            name: request.name,
            password: request.password,
            className: request.className
        });
    }

    const requestPassword = request.password;
    request.status = decision;
    delete request.password;
    try {
        saveData();
    } catch (error) {
        request.status = "pending";
        request.password = requestPassword;
        if (decision === "approved") students.pop();
        adminMessage.textContent = error.message;
        return;
    }
    adminMessage.textContent = decision === "approved"
        ? `${request.name}'s account is approved and ready to use.`
        : `${request.name}'s request was rejected.`;
    renderAdmin();
}

function saveAttendance() {
    const date = attendanceDate.value;
    if (!date) {
        attendanceMessage.textContent = "Choose a date before saving attendance.";
        return;
    }

    const updatedRecords = students.map((student) => ({
        id: student.id,
        date,
        status: element(`status-${student.id}`).value
    }));
    const previousAttendance = attendance;
    attendance = attendance.filter((record) => record.date !== date).concat(updatedRecords);
    try {
        saveData();
    } catch (error) {
        attendance = previousAttendance;
        attendanceMessage.textContent = error.message;
        return;
    }
    attendanceMessage.textContent = "Attendance saved successfully.";
    renderAdmin();
}

function showStudent(student) {
    loginSection.classList.add("hidden");
    adminDashboard.classList.add("hidden");
    studentDashboard.classList.remove("hidden");
    element("studentWelcome").textContent = `Welcome, ${student.name} (${student.id}).`;
    element("studentClass").textContent = student.className
        ? `Class ${student.className} · Keep building good habits, one day at a time.`
        : "Keep building good habits, one day at a time.";

    const records = attendance.filter((record) => record.id === student.id);
    const present = records.filter((record) => record.status === "Present").length;
    const absent = records.filter((record) => record.status === "Absent").length;
    const percentage = records.length ? (present / records.length * 100).toFixed(1) : "0";
    element("myPresent").textContent = present;
    element("myAbsent").textContent = absent;
    element("myPercentage").textContent = `${percentage}%`;

    const history = element("myHistory");
    if (records.length === 0) {
        showEmptyRow(history, "No attendance has been recorded yet.", 2);
        return;
    }
    history.innerHTML = [...records]
        .sort((first, second) => second.date.localeCompare(first.date))
        .map((record) => {
            const statusClass = record.status === "Present" ? "status-present" : "status-absent";
            return `<tr><td>${escapeHTML(record.date)}</td><td><span class="status-pill ${statusClass}">${escapeHTML(record.status)}</span></td></tr>`;
        }).join("");
}

function logout() {
    currentUser = null;
    adminDashboard.classList.add("hidden");
    studentDashboard.classList.add("hidden");
    loginSection.classList.remove("hidden");
    element("loginForm").reset();
    loginMessage.textContent = "";
    signupMessage.textContent = "";
    element("signupForm").classList.add("hidden");
    element("loginForm").classList.remove("hidden");
    element("showSignupButton").closest(".signup-prompt").classList.remove("hidden");
    element("demoNote").classList.remove("hidden");
    usernameInput.focus();
}

function showSignup() {
    element("loginForm").classList.add("hidden");
    element("demoNote").classList.add("hidden");
    element("showSignupButton").closest(".signup-prompt").classList.add("hidden");
    element("signupForm").classList.remove("hidden");
    signupMessage.textContent = "";
    element("signupName").focus();
}

function showLogin() {
    element("signupForm").classList.add("hidden");
    element("loginForm").classList.remove("hidden");
    element("demoNote").classList.remove("hidden");
    element("showSignupButton").closest(".signup-prompt").classList.remove("hidden");
    signupMessage.textContent = "";
    usernameInput.focus();
}

element("loginForm").addEventListener("submit", login);
element("addStudentForm").addEventListener("submit", addStudent);
element("signupForm").addEventListener("submit", submitStudentRequest);
element("saveAttendanceButton").addEventListener("click", saveAttendance);
element("showSignupButton").addEventListener("click", showSignup);
element("backToLoginButton").addEventListener("click", showLogin);
element("requestTable").addEventListener("click", (event) => {
    const button = event.target.closest("[data-request-action]");
    if (!button) return;
    decideStudentRequest(button.dataset.requestId, button.dataset.requestAction === "approve" ? "approved" : "rejected");
});
element("togglePassword").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const showing = passwordInput.type === "password";
    passwordInput.type = showing ? "text" : "password";
    button.textContent = showing ? "Hide" : "Show";
    button.setAttribute("aria-label", showing ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(showing));
});
document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", logout));
attendanceDate.addEventListener("change", renderAdmin);
attendanceDate.value = new Date().toISOString().slice(0, 10);
