const apiBase = 'https://leave-management.th3va.com/api';
const ADMIN_PASSWORD = "admin123"; // Should be handled securely in production

document.addEventListener('DOMContentLoaded', () => {
  const roleSelector = document.getElementById("role");
  const calendarSection = document.getElementById("calendarSection");
  const leaveHistorySection = document.getElementById("leaveHistory");

  roleSelector.addEventListener("change", () => {
    const isAdmin = roleSelector.value === "admin";
    calendarSection.style.display = isAdmin ? "block" : "none";
    leaveHistorySection.style.display = isAdmin ? "none" : "block";
    
    if (isAdmin) loadCalendar();
    else loadLeaveHistory();
  });

  loadLeaveHistory(); // Initial load for staff view
});

async function submitLeave() {
  const staffId = document.getElementById("staffId").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  try {
    const response = await fetch(`${apiBase}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        start_date: startDate,
        end_date: endDate
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Leave submission failed');
    }

    alert('Leave request submitted successfully!');
    loadLeaveHistory();
  } catch (error) {
    console.error('Submission Error:', error);
    alert(`Error: ${error.message}`);
  }
}

async function loadLeaveHistory() {
  const staffId = document.getElementById("staffId").value;
  const historyContainer = document.getElementById("leaveHistory");

  if (!staffId) {
    historyContainer.innerHTML = "<div class='notice'>Enter your Staff ID to view leave history</div>";
    return;
  }

  try {
    const response = await fetch(`${apiBase}/leave/history/${staffId}`);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to load history');

    historyContainer.innerHTML = data.length > 0
      ? `<ul>${data.map(entry => `
          <li class="history-item ${entry.status}">
            <div class="dates">${formatDate(entry.start_date)} - ${formatDate(entry.end_date)}</div>
            <div class="status">Status: ${entry.status.toUpperCase()}</div>
          </li>
        `).join('')}</ul>`
      : "<div class='notice'>No leave history found</div>";
      
  } catch (error) {
    console.error('History Load Error:', error);
    historyContainer.innerHTML = `<div class="error">Error loading history: ${error.message}</div>`;
  }
}

async function loadCalendar() {
  const calendarEl = document.getElementById('calendar');
  
  try {
    const response = await fetch(`${apiBase}/leave/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASSWORD })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load calendar');
    }

    // Clear existing calendar
    if (window.calendar) window.calendar.destroy();
    
    window.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: data.map(entry => ({
        title: `${entry.name} (${entry.staff_id}) - ${entry.status.toUpperCase()}`,
        start: entry.start_date,
        end: entry.end_date,
        color: getStatusColor(entry.status),
        extendedProps: {
          status: entry.status
        }
      })),
      eventContent: renderEventContent
    });

    calendar.render();
  } catch (error) {
    console.error('Calendar Error:', error);
    calendarEl.innerHTML = `<div class="error">Calendar Error: ${error.message}</div>`;
  }
}

// Helper functions
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function getStatusColor(status) {
  const colors = {
    pending: '#f39c12',
    approved: '#2ecc71',
    rejected: '#e74c3c'
  };
  return colors[status] || '#3498db';
}

function renderEventContent(info) {
  const statusEl = document.createElement('div');
  statusEl.className = `event-status ${info.event.extendedProps.status}`;
  statusEl.textContent = info.event.extendedProps.status.toUpperCase();

  return {
    html: `
      <div class="fc-event-main">
        <div class="event-title">${info.event.title}</div>
        ${statusEl.outerHTML}
      </div>
    `
  };
}