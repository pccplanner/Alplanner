const apiBase = "https://leave-management.th3va.com";

document.addEventListener("DOMContentLoaded", () => {
  const loginType = document.getElementById("loginType");
  const adminPasswordDiv = document.getElementById("adminPasswordDiv");
  const leaveHistory = document.getElementById("leaveHistory");
  const calendarDiv = document.getElementById("adminCalendarSection");

  loginType.addEventListener("change", () => {
    const isAdmin = loginType.value === "Admin";
    adminPasswordDiv.style.display = isAdmin ? "block" : "none";
    calendarDiv.style.display = isAdmin ? "block" : "none";
  });

  document.getElementById("staffId").addEventListener("blur", loadLeaveHistory);
});

async function submitRequest() {
  const staffName = document.getElementById("staffName").value.trim();
  const staffId = document.getElementById("staffId").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!staffName || !staffId || !startDate || !endDate) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_name: staffName,
        staff_id: staffId,
        start_date: startDate,
        end_date: endDate,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Leave request submitted successfully.");
      loadLeaveHistory();
    } else {
      alert("Failed to submit leave: " + result.message);
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("Submission failed. Check console.");
  }
}

async function loadLeaveHistory() {
  const staffId = document.getElementById("staffId").value.trim();
  const historyContainer = document.getElementById("leaveHistory");
  if (!staffId) return;

  try {
    const res = await fetch(`${apiBase}/api/leave/${staffId}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      historyContainer.innerHTML = data
        .map(
          (entry) =>
            `<div>${entry.start_date} to ${entry.end_date} - <strong>${entry.status || "pending"}</strong></div>`
        )
        .join("");
    } else {
      historyContainer.textContent = "No leave records found.";
    }
  } catch (e) {
    historyContainer.textContent = "Error loading history.";
  }
}
