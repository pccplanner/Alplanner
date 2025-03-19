document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('leaveForm');
    const calendar = document.getElementById('calendar');
    
    // Load initial calendar data
    loadCalendar();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const staff_id = document.getElementById('staff_id').value;
        const start_date = document.getElementById('start_date').value;
        const end_date = document.getElementById('end_date').value;

        try {
            const response = await fetch('https://leave-management.th3va.com/api/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id, start_date, end_date })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit leave request');
            }

            alert('Leave request submitted successfully!');
            form.reset();
            loadCalendar();
        } catch (error) {
            console.error('Submission Error:', error);
            alert(`Error: ${error.message}`);
        }
    });

    async function loadCalendar() {
        try {
            calendar.innerHTML = '<div class="loading">Loading leave entries...</div>';
            
            const response = await fetch('https://leave-management.th3va.com/api/leave/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'admin123' })
            });

            if (!response.ok) {
                throw new Error('Failed to load calendar data');
            }

            const entries = await response.json();
            renderCalendar(entries);
        } catch (error) {
            console.error('Calendar Load Error:', error);
            calendar.innerHTML = `<div class="error">Error loading calendar: ${error.message}</div>`;
        }
    }

    function renderCalendar(entries) {
        calendar.innerHTML = entries.length > 0 
            ? entries.map(entry => `
                <div class="leave-entry ${entry.status}">
                    <strong>${entry.name}</strong> (ID: ${entry.staff_id})
                    <span class="status">${entry.status.toUpperCase()}</span>
                    <div>${formatDate(entry.start_date)} to ${formatDate(entry.end_date)}</div>
                </div>
              `).join('')
            : '<div class="loading">No leave requests found</div>';
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
});