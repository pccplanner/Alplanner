
document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("role");
  const adminSection = document.querySelectorAll(".admin-only");

  roleSelect.addEventListener("change", () => {
    const isAdmin = roleSelect.value === "Admin";
    adminSection.forEach(el => el.classList.toggle("d-none", !isAdmin));
  });

  // Load leave history and calendar initially
  loadLeaveHistory();
  loadLeaveCalendar();
});

function submitRequest() {
  const name = document.getElementById("staffName").value.trim();
  const id = document.getElementById("staffId").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (!name || !id || !start || !end) {
    alert("Please fill in all fields.");
    return;
  }

  fetch("http://103.91.67.126/api/leave", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      staff_name: name,
      staff_id: id,
      start_date: start,
      end_date: end
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Network response was not ok");
    return res.json();
  })
  .then(data => {
    alert("Leave request submitted!");
    loadLeaveHistory();
    loadLeaveCalendar();
  })
  .catch(err => {
    console.error("Submission error:", err);
    alert("Submission failed. Check console.");
  });
}

function loadLeaveHistory() {
  const id = document.getElementById("staffId").value.trim();
  if (!id) {
    document.getElementById("leaveHistory").innerText = "Enter Staff ID to load history.";
    return;
  }

  fetch(`http://103.91.67.126/api/leave/${id}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        document.getElementById("leaveHistory").innerText = "No leave history.";
        return;
      }

      const html = data.map(d =>
        `<div>${d.start_date} to ${d.end_date} — ${d.status || 'pending'}</div>`
      ).join("");
      document.getElementById("leaveHistory").innerHTML = html;
    })
    .catch(() => {
      document.getElementById("leaveHistory").innerText = "Error loading history.";
    });
}

function loadLeaveCalendar() {
  fetch("http://103.91.67.126/api/leave")
    .then(res => res.json())
    .then(data => {
      const html = data.map(d =>
        `<div>Staff ${d.staff_name} (${d.staff_id}): ${d.start_date} to ${d.end_date} — ${d.status || 'pending'}</div>`
      ).join("");
      document.getElementById("leaveCalendar").innerHTML = html;
    })
    .catch(() => {
      document.getElementById("leaveCalendar").innerText = "Error loading calendar.";
    });
}
