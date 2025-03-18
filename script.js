
const API_BASE = "http://103.91.67.126";

document.addEventListener("DOMContentLoaded", () => {
    const loginType = document.getElementById("loginType");
    const adminPassword = document.getElementById("adminPassword");
    loginType.addEventListener("change", () => {
        if (loginType.value === "Admin") {
            adminPassword.classList.remove("d-none");
        } else {
            adminPassword.classList.add("d-none");
        }
    });
});

function submitRequest() {
    const name = document.getElementById("staffName").value;
    const id = document.getElementById("staffId").value;
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const payload = { staff_name: name, staff_id: id, start_date: start, end_date: end };

    fetch(`${API_BASE}/api/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.ok ? alert("Leave submitted!") : Promise.reject(res))
    .catch(err => {
        console.error("Submission error:", err);
        alert("Failed to submit leave.");
    });
}

function loadLeaveHistory() {
    const id = document.getElementById("staffId").value;
    if (!id) return;

    fetch(`${API_BASE}/api/leave/${id}`)
    .then(res => res.json())
    .then(data => {
        const history = document.getElementById("leaveHistory");
        if (!data.length) return history.innerText = "No history found.";
        history.innerHTML = "<ul>" + data.map(l => `<li>${l.start_date} to ${l.end_date} - ${l.status || "pending"}</li>`).join("") + "</ul>";
    })
    .catch(() => {
        document.getElementById("leaveHistory").innerText = "Error loading history.";
    });
}

function loadCalendar() {
    fetch(`${API_BASE}/api/leave`)
    .then(res => res.json())
    .then(data => {
        const cal = document.getElementById("leaveCalendar");
        if (!data.length) return cal.innerText = "No leave records.";
        cal.innerHTML = "<ul>" + data.map(l => `<li>${l.staff_name} (${l.staff_id}) - ${l.start_date} to ${l.end_date} [${l.status}]</li>`).join("") + "</ul>";
    })
    .catch(() => {
        document.getElementById("leaveCalendar").innerText = "Error loading calendar.";
    });
}

// Auto load calendar and history if Admin
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (document.getElementById("loginType").value === "Admin") {
            loadCalendar();
        }
        loadLeaveHistory();
    }, 1000);
});
