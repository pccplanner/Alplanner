document.addEventListener("DOMContentLoaded", () => {
    const loginType = document.querySelector("#loginType");
    const passwordInput = document.querySelector("#adminPassword");
    const nameInput = document.querySelector("#staffName");
    const idInput = document.querySelector("#staffId");
    const startDateInput = document.querySelector("#startDate");
    const endDateInput = document.querySelector("#endDate");
    const submitBtn = document.querySelector("#submitBtn");
    const historySection = document.querySelector("#history");
    const calendarSection = document.querySelector("#calendar");

    loginType.addEventListener("change", () => {
        passwordInput.style.display = loginType.value === "Admin" ? "block" : "none";
        loadLeaveData();
    });

    submitBtn.addEventListener("click", () => {
        const payload = {
            name: nameInput.value,
            staff_id: idInput.value,
            start_date: startDateInput.value,
            end_date: endDateInput.value,
        };

        fetch("http://leave-management.th3va.com/api/leave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadLeaveData();
        })
        .catch(() => alert("Error submitting leave request."));
    });

    function loadLeaveData() {
        const isAdmin = loginType.value === "Admin";

        if (isAdmin) {
            fetch("http://leave-management.th3va.com/api/leave/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwordInput.value }),
            })
            .then(res => res.json())
            .then(data => renderCalendar(data))
            .catch(() => calendarSection.innerText = "Error loading calendar.");
        } else {
            fetch(`http://leave-management.th3va.com/api/leave/history/${idInput.value}`)
            .then(res => res.json())
            .then(data => renderHistory(data))
            .catch(() => historySection.innerText = "Error loading history.");
        }
    }

    function renderHistory(data) {
        historySection.innerHTML = data.map(entry => 
            `<div>${entry.name}: ${entry.start_date} to ${entry.end_date}</div>`).join('');
    }

    function renderCalendar(data) {
        calendarSection.innerHTML = data.map(entry => 
            `<div>${entry.name} (${entry.staff_id}): ${entry.start_date} to ${entry.end_date}</div>`).join('');
    }
});
