
const API = "https://leave-management.th3va.com/api";

function toggleLogin() {
  const role = document.getElementById("role").value;
  const pass = document.getElementById("admin-password");
  const calendar = document.getElementById("calendar-section");
  if (role === "admin") {
    pass.style.display = "block";
    calendar.style.display = "block";
    loadCalendar();
  } else {
    pass.style.display = "none";
    calendar.style.display = "none";
  }
}

function showPopup(msg, success = true) {
  const popup = document.getElementById("popup");
  popup.style.display = "block";
  popup.style.backgroundColor = success ? "#28a745" : "#dc3545";
  popup.innerText = msg;
  setTimeout(() => popup.style.display = "none", 3000);
}

function submitLeave() {
  const name = document.getElementById("name").value;
  const staff_id = document.getElementById("staff_id").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!name || !staff_id || !start || !end) {
    showPopup("Please fill in all fields.", false);
    return;
  }

  fetch(`${API}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, staff_id, start_date: start, end_date: end })
  })
  .then(res => res.json())
  .then(data => {
    showPopup(data.message);
    loadHistory(staff_id);
    loadCalendar();
  }).catch(err => {
    showPopup("Error submitting leave request.", false);
    console.error(err);
  });
}

function loadHistory(staff_id) {
  if (!staff_id) return;
  fetch(`${API}/history/${staff_id}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("history");
      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "<p>No leave history found.</p>";
        return;
      }
      container.innerHTML = data.map(
        r => `<div class="history-entry">${r.start_date} to ${r.end_date}<br/><small>(${r.name})</small></div>`
      ).join("");
    }).catch(err => {
      document.getElementById("history").innerHTML = "<p>Error loading history.</p>";
    });
}

function loadCalendar() {
  fetch(`${API}/leave/all`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("calendar");
      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = "<p>No leave records found.</p>";
        return;
      }
      container.innerHTML = data.map(
        r => `<div class="calendar-entry"><b>${r.name}</b><br>${r.start_date} → ${r.end_date}</div>`
      ).join("");
    }).catch(err => {
      document.getElementById("calendar").innerHTML = "<p>Error loading calendar.</p>";
    });
}
