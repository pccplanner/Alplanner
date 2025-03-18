
document.addEventListener('DOMContentLoaded', function () {
    const loginType = document.getElementById("loginType");
    const adminPasswordContainer = document.getElementById("adminPasswordContainer");
    const passwordInput = document.getElementById("adminPassword");
    const historySection = document.getElementById("history");
    const calendarSection = document.getElementById("calendar");

    function updateUIForRole(role) {
        if (role === "Admin") {
            adminPasswordContainer.style.display = "block";
            historySection.style.display = "block";
            calendarSection.style.display = "block";
        } else {
            adminPasswordContainer.style.display = "none";
            historySection.style.display = "block";
            calendarSection.style.display = "none";
        }
    }

    if (loginType) {
        loginType.addEventListener("change", function () {
            updateUIForRole(this.value);
        });
        updateUIForRole(loginType.value); // Initialize based on current value
    }

    window.submitRequest = function () {
        const name = document.getElementById("staffName").value;
        const id = document.getElementById("staffId").value;
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (!name || !id || !startDate || !endDate) {
            alert("Please fill in all fields.");
            return;
        }

        fetch("http://leave-management.th3va.com/api/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, staff_id: id, start_date: startDate, end_date: endDate })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            alert("Leave submitted!");
            loadLeaveHistory(id);
        })
        .catch(error => {
            console.error("Submission error:", error);
            alert("Failed to submit leave.");
        });
    };

    window.loadLeaveHistory = function (id) {
        const historyContainer = document.getElementById("leaveHistoryList");
        historyContainer.innerHTML = "Loading...";
        fetch(`http://leave-management.th3va.com/api/leave/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    historyContainer.innerHTML = "No leave history.";
                } else {
                    historyContainer.innerHTML = "<ul>" + data.map(leave =>
                        `<li>${leave.start_date} to ${leave.end_date}</li>`
                    ).join("") + "</ul>";
                }
            })
            .catch(error => {
                console.error("History load error:", error);
                historyContainer.innerHTML = "<span style='color: red;'>Error loading history.</span>";
            });
    };

    window.loadLeaveCalendar = function () {
        const calendarContainer = document.getElementById("leaveCalendar");
        calendarContainer.innerHTML = "Loading calendar...";
        fetch("http://leave-management.th3va.com/api/all-leaves")
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    calendarContainer.innerHTML = "No leave data.";
                } else {
                    calendarContainer.innerHTML = "<ul>" + data.map(leave =>
                        `<li>${leave.name} (${leave.staff_id}): ${leave.start_date} to ${leave.end_date}</li>`
                    ).join("") + "</ul>";
                }
            })
            .catch(error => {
                console.error("Calendar load error:", error);
                calendarContainer.innerHTML = "<span style='color: red;'>Error loading calendar.</span>";
            });
    };
});
