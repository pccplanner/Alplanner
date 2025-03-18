const apiUrl = "https://leave-management.th3va.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const loginType = document.getElementById("loginType");
  const adminPasswordField = document.getElementById("adminPasswordField");
  loginType.addEventListener("change", () => {
    adminPasswordField.style.display = loginType.value === "Admin" ? "block" : "none";
  });

  loadLeaveHistory();
  loadCalendar();
});

async function submitLeave() {
  const name = document.getElementById("staffName").value;
  const id = document.getElementById("staffId").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const role = document.getElementById("loginType").value;

  const response = await fetch(`${apiUrl}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, user_id: id, start_date: start, end_date: end, role })
  });

  if (response.ok) {
    alert("Leave request submitted successfully.");
    loadLeaveHistory();
    loadCalendar();
  } else {
    alert("Failed to submit leave.");
  }
}

async function loadLeaveHistory() {
  const id = document.getElementById("staffId").value;
  if (!id) return;
  const res = await fetch(`${apiUrl}/leave/${id}`);
  const data = await res.json();
  document.getElementById("leaveHistory").innerHTML = data.map(d =>
    `<div>${d.start_date} to ${d.end_date} - ${d.status}</div>`
  ).join("");
}

async function loadCalendar() {
  const res = await fetch(`${apiUrl}/calendar`);
  const data = await res.json();

  const events = data.map(item => ({
    title: `${item.name} (${item.status})`,
    start: item.start_date,
    end: item.end_date
  }));

  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events
  });
  calendar.render();
}
