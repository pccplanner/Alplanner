// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const submitButton = document.getElementById('submitBtn');
    if (submitButton) {
        submitButton.addEventListener('click', submitRequest);
    }
});

async function submitRequest() {
    const loginType = document.getElementById("loginType").value;
    const adminPassword = document.getElementById("adminPassword")?.value || "";
    const name = document.getElementById("name").value.trim();
    const staffId = document.getElementById("staffId").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!name || !staffId || !startDate || !endDate) {
        alert("Please fill in all fields.");
        return;
    }

    const data = {
        name: name,
        staff_id: staffId,
        start_date: startDate,
        end_date: endDate
    };

    try {
        const response = await fetch('http://leave-management.th3va.com/api/leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-auth': loginType === 'Admin' ? adminPassword : ''
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || "Leave submitted successfully!");
            loadLeaveHistory(staffId);
            if (loginType === 'Admin') loadLeaveCalendar();
        } else {
            alert(result.error || "Failed to submit leave.");
        }
    } catch (error) {
        console.error("Error submitting leave:", error);
        alert("Error submitting leave.");
    }
}

async function loadLeaveHistory(staffId = null) {
    const id = staffId || document.getElementById("staffId").value.trim();
    if (!id) return;

    try {
        const response = await fetch(`http://leave-management.th3va.com/api/history/${id}`);
        const result = await response.json();
        const historyDiv = document.getElementById("leaveHistory");
        if (Array.isArray(result)) {
            historyDiv.innerHTML = result.map(item =>
                `<div>${item.name} (${item.staff_id}): ${item.start_date} to ${item.end_date}</div>`
            ).join('');
        } else {
            historyDiv.innerHTML = "No leave history found.";
        }
    } catch (error) {
        console.error("Error loading history:", error);
        document.getElementById("leaveHistory").innerHTML = "Error loading history.";
    }
}

async function loadLeaveCalendar() {
    try {
        const response = await fetch('http://leave-management.th3va.com/api/calendar');
        const result = await response.json();
        const calendarDiv = document.getElementById("leaveCalendar");
        if (Array.isArray(result)) {
            calendarDiv.innerHTML = result.map(item =>
                `<div>${item.name} (${item.staff_id}): ${item.start_date} to ${item.end_date}</div>`
            ).join('');
        } else {
            calendarDiv.innerHTML = "No leave calendar found.";
        }
    } catch (error) {
        console.error("Error loading calendar:", error);
        document.getElementById("leaveCalendar").innerHTML = "Error loading calendar.";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const staffIdField = document.getElementById("staffId");
    if (staffIdField && staffIdField.value) {
        loadLeaveHistory(staffIdField.value);
    }
});