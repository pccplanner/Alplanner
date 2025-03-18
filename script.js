document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        fetch('https://leave-management.th3va.com/calendar')
            .then(response => response.json())
            .then(events => {
                const calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    events: events
                });
                calendar.render();
            })
            .catch(error => {
                calendarEl.innerHTML = '<p style="color: red;">Error loading calendar.</p>';
                console.error('Calendar load error:', error);
            });
    }

    const form = document.getElementById('leave-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const userId = document.getElementById('staffId').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            fetch('https://leave-management.th3va.com/api/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    start_date: startDate,
                    end_date: endDate
                })
            })
            .then(response => {
                if (response.ok) {
                    alert('Leave request submitted successfully.');
                    form.reset();
                } else {
                    alert('Failed to submit leave.');
                }
            })
            .catch(error => {
                alert('Submission failed.');
                console.error('Submission error:', error);
            });
        });
    }
});
