document.addEventListener('DOMContentLoaded', function () {
    loadCalendar();

    const form = document.getElementById('leaveForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const staff_id = document.getElementById('staff_id').value;
        const start_date = document.getElementById('start_date').value;
        const end_date = document.getElementById('end_date').value;

        fetch('https://leave-management.th3va.com/api/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, staff_id, start_date, end_date })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message || data.error || 'Leave submitted.');
            loadCalendar();
        })
        .catch(err => {
            console.error('Submission error:', err);
            alert('Failed to submit leave.');
        });
    });
});

function loadCalendar() {
    fetch('https://leave-management.th3va.com/api/calendar')
        .then(response => {
            if (!response.ok) throw new Error('Calendar fetch failed');
            return response.json();
        })
        .then(data => {
            const calendar = document.getElementById('calendar');
            calendar.innerHTML = '';
            data.forEach(entry => {
                const item = document.createElement('div');
                item.textContent = `${entry.name} (${entry.status}): ${entry.start_date} to ${entry.end_date}`;
                calendar.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Calendar load error:', error);
            const calendar = document.getElementById('calendar');
            calendar.innerHTML = '<p style="color:red;">Error loading calendar.</p>';
        });
}
