
let selectedTeam = 1;
window.currentYear = 2025;
window.currentMonth = 2;

const TeamPatterns = {
  1: ["morning", "morning", "night", "night", "off", "off"],
  2: ["off", "off", "morning", "morning", "night", "night"],
  3: ["night", "night", "off", "off", "morning", "morning"]
};
const referenceDate = new Date(2025, 2, 1);
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

window.selectTeam = function(teamNumber) {
  selectedTeam = teamNumber;
  window.renderCalendar(window.currentYear, window.currentMonth);
};

function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

window.renderCalendar = function(year, month) {
  document.getElementById("monthTitle").textContent = `${monthNames[month]} ${year}`;
  const container = document.getElementById("plannerContainer");
  container.innerHTML = "";
  const weekdayRow = document.createElement("div");
  weekdayRow.className = "weekday-row";
  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  weekdays.forEach(day => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "weekday-header";
    dayHeader.textContent = day;
    weekdayRow.appendChild(dayHeader);
  });
  container.appendChild(weekdayRow);
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  let currentDay = 1;
  var requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
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
      const cellDateStr = formatDateLocal(dateObj);
      const shift = getShiftForDate(dateObj);
      let cellContent = `<div class="date-box ${shift}">${currentDay}</div>`;
      let reqsForDay = requests.filter(req => cellDateStr >= req.startDate && cellDateStr <= req.endDate);
      reqsForDay.forEach((req, index) => {
        let flaggedClass = index >= 2 ? 'flagged' : '';
        cellContent += `<div class="leave-info ${flaggedClass}">${req.staffName} (${req.staffID})</div>`;
      });
      cell.innerHTML = cellContent;
      currentDay++;
    } else {
      const dayNum = i - startDay - daysInMonth + 1;
      cell.innerHTML = `<div class="date-box other-month">${dayNum}</div>`;
    }
    row.appendChild(cell);
  }
};

window.prevMonth = function() {
  window.currentMonth--;
  if (window.currentMonth < 0) { window.currentMonth = 11; window.currentYear--; }
  window.renderCalendar(window.currentYear, window.currentMonth);
  window.renderManagerSummary?.();
  window.renderStaffSummary?.();
};

window.nextMonth = function() {
  window.currentMonth++;
  if (window.currentMonth > 11) { window.currentMonth = 0; window.currentYear++; }
  window.renderCalendar(window.currentYear, window.currentMonth);
  window.renderManagerSummary?.();
  window.renderStaffSummary?.();
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".Team-btn").forEach((btn, index) => {
    btn.addEventListener("click", () => window.selectTeam(index + 1));
  });

  document.getElementById("prevMonthBtn").addEventListener("click", window.prevMonth);
  document.getElementById("nextMonthBtn").addEventListener("click", window.nextMonth);

  window.renderCalendar(window.currentYear, window.currentMonth);
});
