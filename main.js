
import './modules/calendar.js';
import './modules/staff.js';
import './modules/manager.js';
import './modules/whatsapp.js';

import { renderCalendar, prevMonth, nextMonth, selectTeam, currentYear, currentMonth } from './modules/calendar.js';
import { renderManagerSummary } from './modules/manager.js';
import { renderStaffSummary } from './modules/whatsapp.js';

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("prevMonthBtn").addEventListener("click", prevMonth);
  document.getElementById("nextMonthBtn").addEventListener("click", nextMonth);

  document.querySelectorAll(".Team-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const team = parseInt(btn.dataset.team);
      selectTeam(team);
    });
  });

  renderCalendar(currentYear, currentMonth);
  renderManagerSummary();
  renderStaffSummary();
});
