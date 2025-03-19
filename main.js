
let selectedTeam = 1;
let currentYear = 2025, currentMonth = 2;

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

function getShiftForDate(dateObj) {
  const diff = daysBetween(referenceDate, dateObj);
  const dayIndex = ((diff % 6) + 6) % 6;
  return TeamPatterns[selectedTeam][dayIndex];
}

function selectTeam(teamNumber) {
  selectedTeam = teamNumber;
  renderCalendar(currentYear, currentMonth);
}

function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderCalendar(year, month) {
  document.getElementById("monthTitle").textContent = `${monthNames[month]} ${year}`;
  const container = document.getElementById("plannerContainer");
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

  let requests = [];
  try {
    requests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  } catch (e) {
    console.warn("Invalid stored leave data. Resetting...");
    localStorage.setItem("leaveRequests", "[]");
  }

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

      const matches = requests.filter(req => dateStr >= req.startDate && dateStr <= req.endDate);
      matches.forEach(req => {
        const name = req.staffName || "";
        const sid = req.staffID || "";
        html += `<div class="leave-info">${name} (${sid})</div>`;
      });

      cell.innerHTML = html;
      currentDay++;
    } else {
      const dayNum = i - startDay - daysInMonth + 1;
      cell.innerHTML = `<div class="date-box other-month">${dayNum}</div>`;
    }

    row.appendChild(cell);
  }
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar(currentYear, currentMonth);
}
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
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

  const newRequest = { staffName: name, staffID: id, startDate: start, endDate: end };
  const requests = JSON.parse(localStorage.getItem("leaveRequests") || "[]");
  requests.push(newRequest);
  localStorage.setItem("leaveRequests", JSON.stringify(requests));

  renderCalendar(currentYear, currentMonth);
  e.target.reset();
  alert("Leave request submitted!");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".Team-btn").forEach((btn, index) => {
    btn.addEventListener("click", () => selectTeam(index + 1));
  });
  document.getElementById("prevMonthBtn").addEventListener("click", prevMonth);
  document.getElementById("nextMonthBtn").addEventListener("click", nextMonth);
  document.getElementById("leaveForm").addEventListener("submit", submitLeaveRequest);
  renderCalendar(currentYear, currentMonth);
});
