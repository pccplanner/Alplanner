// js/calendar.js
import { daysBetween, formatDateLocal } from "./utils.js";
import { renderManagerSummary, renderStaffSummary } from "./summary.js";

// Setup team shift patterns and reference date
export const TeamPatterns = {
  1: ["morning", "morning", "night", "night", "off", "off"],
  2: ["off", "off", "morning", "morning", "night", "night"],
  3: ["night", "night", "off", "off", "morning", "morning"]
};
const referenceDate = new Date(2025, 2, 1); // March 1, 2025

let selectedTeam = 1;
export let currentYear = 2025, currentMonth = 2; // March (0-indexed)

export function getShiftForDate(dateObj) {
  const diff = daysBetween(referenceDate, dateObj);
  const dayIndex = ((diff % 6) + 6) % 6;
  return TeamPatterns[selectedTeam][dayIndex];
}

export function selectTeam(teamNumber) {
  selectedTeam = teamNumber;
  renderCalendar();
}

export function renderCalendar() {
  const monthTitle = document.getElementById("monthTitle");
  const container = document.getElementById("plannerContainer");
  monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  container.innerHTML = "";

  // Weekday header
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

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  let currentDay = 1;
  const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  
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
      const dateObj = new Date(currentYear, currentMonth, currentDay);
      const cellDateStr = formatDateLocal(dateObj);
      const shift = getShiftForDate(dateObj);
      let cellContent = `<div class="date-box ${shift}">${currentDay}</div>`;
      const reqsForDay = requests.filter(req => cellDateStr >= req.startDate && cellDateStr <= req.endDate);
      reqsForDay.forEach((req, index) => {
        const flaggedClass = index >= 2 ? 'flagged' : '';
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
}

// Month navigation helpers
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
  renderManagerSummary();
  renderStaffSummary();
}

export function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
  renderManagerSummary();
  renderStaffSummary();
}
