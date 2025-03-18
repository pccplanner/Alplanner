const API_BASE = "https://leave-management.th3va.com";

document.getElementById("leaveForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("nameInput").value.trim();
    const staffId = document.getElementById("staffIdInput").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    const payload = {
        name: name,
        staff_id: staffId,
        start_date: startDate,
        end_date: endDate
    };

    try {
        const response = await fetch(`${API_BASE}/api/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Leave request submitted successfully.");
            loadCalendar();
        } else {
            alert("Failed to submit leave.");
        }
    } catch (error) {
        console.error("Submission error:", error);
        alert("Error occurred while submitting.");
    }
});

async function loadCalendar() {
    try {
        const response = await fetch(`${API_BASE}/api/calendar`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById("calendar").innerHTML = JSON.stringify(data, null, 2);
        } else {
            document.getElementById("calendar").textContent = "Error loading calendar.";
        }
    } catch {
        document.getElementById("calendar").textContent = "Error loading calendar.";
    }
}

loadCalendar();
