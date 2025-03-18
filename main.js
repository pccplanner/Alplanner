const apiBase = 'https://leave-management.th3va.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const role = document.getElementById("role");
  const calendarSection = document.getElementById("calendarSection");
  const leaveHistory = document.getElementById("leaveHistory");

  role.addEventListener("change", () => {
    const isAdmin = role.value === "admin";
    calendarSection.style.display = isAdmin ? "block" : "none";
    if (isAdmin) loadCalendar();
    else loadLeaveHistory();
  });

  loadLeaveHistory(); // default view for staff
});

function submitLeave() {
  const staffName = document.getElementById("staffName").value;
  const staffId = document.getElementById("staffId").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  fetch(`${apiBase}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffName, staffId, startDate, endDate })
  })
  .then(res => res.json())
  .then(data => {
    alert("Leave submitted!");
    loadLeaveHistory();
  })
  .catch(err => alert("Submission failed"));
}

function loadLeaveHistory() {
  const staffId = document.getElementById("staffId").value;
  const leaveHistory = document.getElementById("leaveHistory");
  if (!staffId) {
    leaveHistory.innerHTML = "Enter Staff ID to view history.";
    return;
  }
  fetch(`${apiBase}/history/${staffId}`)
    .then(res => res.json())
    .then(data => {
      leaveHistory.innerHTML = data.length === 0
        ? "No leave history."
        : "<ul>" + data.map(d => `<li>${d.startDate} to ${d.endDate}</li>`).join('') + "</ul>";
    })
    .catch(err => {
      leaveHistory.innerHTML = "Error loading history.";
    });
}

function loadCalendar() {
  fetch(`${apiBase}/leave/all`)
    .then(res => res.json())
    .then(data => {
      const calendarEl = document.getElementById('calendar');
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events: data.map(d => ({
          title: `${d.staffName} (${d.staffId})`,
          start: d.startDate,
          end: d.endDate
        }))
      });
      calendar.render();
    })
    .catch(err => {
      document.getElementById('calendar').innerHTML = "Error loading calendar.";
    });
}