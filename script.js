const BASE_URL = "https://leave-management.th3va.com/api";

document.getElementById("role").addEventListener("change", function () {
  const isAdmin = this.value === "Admin";
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("d-none", !isAdmin);
  });
});

async function submitRequest() {
  const name = document.getElementById("staffName").value;
  const id = document.getElementById("staffId").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const res = await fetch(`${BASE_URL}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, id, start_date: start, end_date: end })
  });

  if (res.ok) {
    alert("Leave submitted successfully.");
    loadHistory();
    loadCalendar();
  } else {
    alert("Error submitting leave.");
  }
}

async function loadHistory() {
  try {
    const id = document.getElementById("staffId").value;
    const res = await fetch(`${BASE_URL}/history/${id}`);
    const data = await res.json();
    const container = document.getElementById("leaveHistory");
    container.innerHTML = data.map(d => `<div>${d.start_date} to ${d.end_date}</div>`).join("");
  } catch {
    document.getElementById("leaveHistory").innerText = "Error loading history.";
  }
}

async function loadCalendar() {
  try {
    const res = await fetch(`${BASE_URL}/calendar`);
    const data = await res.json();
    const container = document.getElementById("leaveCalendar");
    container.innerHTML = data.map(d => `<div>${d.name}: ${d.start_date} to ${d.end_date}</div>`).join("");
  } catch {
    document.getElementById("leaveCalendar").innerText = "Error loading calendar.";
  }
}

loadHistory();
