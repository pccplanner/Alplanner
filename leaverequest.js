// js/leaveRequest.js
import { renderCalendar } from "./calendar.js";
import { renderManagerSummary, renderStaffSummary } from "./summary.js";

export function initLeaveRequest() {
  const leaveForm = document.getElementById("leaveRequestForm");
  leaveForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }
    const staffData = JSON.parse(localStorage.getItem("staffData"));
    if (!staffData) {
      alert("Please save your staff data first.");
      return;
    }
    const newRequest = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      startDate,
      endDate,
      timestamp: new Date().toISOString(),
      staffName: staffData.name,
      staffID: staffData.id,
      status: "pending"
    };
    const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
    requests.push(newRequest);
    localStorage.setItem("leaveRequests", JSON.stringify(requests));
    alert("Leave request submitted.");
    renderCalendar(); // re-render calendar to show updated leave data
    renderManagerSummary();
    renderStaffSummary();
    leaveForm.reset();
  });
}
