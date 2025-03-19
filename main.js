
let selectedTeam = 1;
let currentYear = 2025, currentMonth = 2;
const QUOTA_LIMIT = 2;

const TeamPatterns = {
  1: ["morning", "morning", "night", "night", "off", "off"],
  2: ["off", "off", "morning", "morning", "night", "night"],
  3: ["night", "night", "off", "off", "morning", "morning"]
};
const referenceDate = new Date(2025, 2, 1);
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function daysBetween(d1, d2) {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getShiftForDate(dateObj) {
  const diff = daysBetween(referenceDate, dateObj);
  const dayIndex = ((diff % 6) + 6) % 6;
  return TeamPatterns[selectedTeam][dayIndex];
}

function selectTeam(teamNumber) {
  selectedTeam = teamNumber;
  renderCalendar(currentYear, currentMonth);
}

function renderCalendar(year, month) {
  const container = document.getElementById("plannerContainer");
  document.getElementById("monthTitle").textContent = `${monthNames[month]} ${year}`;
  container.innerHTML = "";

  const weekdayRow = document.createElement("div");
  weekdayRow.className = "weekday-row";
  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  weekdays.forEach(day => {
    const header = document.createElement("div");
    header.className = "weekday-header";
    header.textContent = day;
    weekdayRow.appendChild(header);
  });
  container.appendChild(weekdayRow);

  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  const approved = all.filter(r => r.status === "approved");
  const dayMap = {};

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  let currentDay = 1;

  for (let i = 0; i < totalCells; i++) {
    if (i % 7 === 0) {
      var row = document.createElement("div");
      row.className = "calendar-row";
      container.appendChild(row);
    }

    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    if (i < startDay) {
      const dayNum = prevMonthDays - startDay + i + 1;
      cell.innerHTML = `<div class="date-box other-month">${dayNum}</div>`;
    } else if (currentDay <= daysInMonth) {
      const dateObj = new Date(year, month, currentDay);
      const dateStr = formatDateLocal(dateObj);
      const shift = getShiftForDate(dateObj);

      let html = `<div class="date-box ${shift}">${currentDay}</div>`;
      const matches = approved.filter(req => dateStr >= req.startDate && dateStr <= req.endDate);

      matches.forEach(req => {
        html += `<div class="leave-info">${req.staffName} (${req.staffID})</div>`;
      });

      if (matches.length > QUOTA_LIMIT) {
        html = `<div class="date-box ${shift} flagged">${currentDay}</div>` + html;
      }

      cell.innerHTML = html;
      currentDay++;
    } else {
      const dayNum = i - startDay - daysInMonth + 1;
      cell.innerHTML = `<div class="date-box other-month">${dayNum}</div>`;
    }

    row.appendChild(cell);
  }

  renderAdminSummary();
}

function renderAdminSummary() {
  const container = document.getElementById("adminSummary");
  container.innerHTML = "";
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");

  all.forEach((req, i) => {
    const card = document.createElement("div");
    card.className = "admin-card";
    if (req.status === "approved") card.style.borderLeft = "4px solid green";
    else if (req.status === "rejected") card.style.borderLeft = "4px solid red";
    card.innerHTML = `
      <strong>${req.staffName} (${req.staffID})</strong><br>
      ${req.startDate} → ${req.endDate}<br>
      Status: <em>${req.status || "pending"}</em><br>
      <div class="actions">
        <button onclick="approve(${i})">Approve</button>
        <button onclick="reject(${i})">Reject</button>
        <button onclick="remove(${i})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function approve(index) {
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  all[index].status = "approved";
  localStorage.setItem("leaveRequests", JSON.stringify(all));
  renderCalendar(currentYear, currentMonth);
}

function reject(index) {
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  all[index].status = "rejected";
  localStorage.setItem("leaveRequests", JSON.stringify(all));
  renderCalendar(currentYear, currentMonth);
}

function remove(index) {
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  all.splice(index, 1);
  localStorage.setItem("leaveRequests", JSON.stringify(all));
  renderCalendar(currentYear, currentMonth);
}

function submitLeaveRequest(e) {
  e.preventDefault();
  const name = document.getElementById("staffName").value.trim().replace(/[^a-zA-Z0-9 ]/g, '');
  const id = document.getElementById("staffID").value.trim().replace(/[^a-zA-Z0-9]/g, '');
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!name || !id || !start || !end) return alert("Please fill all fields.");
  if (end < start) return alert("End date must be after or same as start date.");

  const req = { staffName: name, staffID: id, startDate: start, endDate: end, status: "pending" };
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  all.push(req);
  localStorage.setItem("leaveRequests", JSON.stringify(all));
  e.target.reset();
  renderCalendar(currentYear, currentMonth);
  alert("Leave request submitted!");
}

function generateWhatsAppSummary() {
  const approved = JSON.parse(localStorage.getItem("leaveRequests") || "[]")
    .filter(r => r.status === "approved");
  if (approved.length === 0) return alert("No approved leave requests to summarize.");

  let text = "*Approved Leave Summary*%0A";
  approved.forEach(r => {
    text += `• ${r.staffName} (${r.staffID}): ${r.startDate} → ${r.endDate}%0A`;
  });

  const link = `https://wa.me/?text=${text}`;
  window.open(link, '_blank');
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".Team-btn").forEach((btn, index) => {
    btn.addEventListener("click", () => selectTeam(index + 1));
  });
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(currentYear, currentMonth);
  });
  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(currentYear, currentMonth);
  });

  document.getElementById("leaveForm").addEventListener("submit", submitLeaveRequest);
  document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);
  document.getElementById("generateWhatsApp").addEventListener("click", generateWhatsAppSummary);
  renderCalendar(currentYear, currentMonth);
});
