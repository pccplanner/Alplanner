
let selectedTeam = 1;
let currentYear = 2025;
let currentMonth = 2;

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

  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  const approved = all.filter(req => req.status === "Approved");

  const dateCounts = {};
  approved.forEach(req => {
    let d = new Date(req.startDate);
    const end = new Date(req.endDate);
    while (d <= end) {
      const dateStr = formatDateLocal(d);
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      d.setDate(d.getDate() + 1);
    }
  });

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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
      const dayNum = new Date(year, month, 0).getDate() - startDay + i + 1;
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

      if (dateCounts[dateStr] > 2) {
        html += `<div class="flag" title="More than 2 on leave"></div>`;
      }

      cell.innerHTML = html;
      currentDay++;
    } else {
      const dayNum = i - startDay - daysInMonth + 1;
      cell.innerHTML = `<div class="date-box other-month">${dayNum}</div>`;
    }

    row.appendChild(cell);
  }
}

function submitLeaveRequest(e) {
  e.preventDefault();
  const name = document.getElementById("staffName").value.trim();
  const id = document.getElementById("staffID").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!name || !id || !start || !end) return alert("Please fill all fields.");
  if (end < start) return alert("End date must be after or same as start date.");

  const req = { staffName: name, staffID: id, startDate: start, endDate: end, status: "Pending" };
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  all.push(req);
  localStorage.setItem("leaveRequests", JSON.stringify(all));
  e.target.reset();
  renderCalendar(currentYear, currentMonth);
  renderAdminSummary();
  alert("Leave request submitted!");
}

function renderAdminSummary() {
  const adminDiv = document.getElementById("adminSummary");
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  adminDiv.innerHTML = "";
  all.forEach((req, index) => {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `
      <b>${req.staffName}</b> (${req.staffID})<br>
      ${req.startDate} to ${req.endDate}<br>
      Status: <select class="status-select" data-index="${index}">
        <option value="Pending" ${req.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="Approved" ${req.status === "Approved" ? "selected" : ""}>Approved</option>
        <option value="Rejected" ${req.status === "Rejected" ? "selected" : ""}>Rejected</option>
      </select>
      <button onclick="deleteRequest(${index})">Delete</button>
    `;
    adminDiv.appendChild(card);
  });

  document.querySelectorAll(".status-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      const val = e.target.value;
      const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
      all[idx].status = val;
      localStorage.setItem("leaveRequests", JSON.stringify(all));
      renderCalendar(currentYear, currentMonth);
    });
  });
}

function deleteRequest(index) {
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  all.splice(index, 1);
  localStorage.setItem("leaveRequests", JSON.stringify(all));
  renderCalendar(currentYear, currentMonth);
  renderAdminSummary();
}

function generateWhatsAppMessage() {
  const all = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  const today = formatDateLocal(new Date());
  const todayLeaves = all.filter(req => req.status === "Approved" && today >= req.startDate && today <= req.endDate);
  const names = todayLeaves.map(req => `${req.staffName} (${req.staffID})`).join(", ");
  const message = names ? `Leave Today: ${names}` : "No approved leaves today.";
  const link = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(link, "_blank");
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
  document.getElementById("generateWhatsApp").addEventListener("click", generateWhatsAppMessage);

  renderCalendar(currentYear, currentMonth);
  renderAdminSummary();
});
