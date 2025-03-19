
const calendarContainer = document.getElementById('calendar-container');
const monthLabel = document.getElementById('calendar-month');
let currentDate = new Date();

const sampleLeaveData = {
    "2025-03-23": [
        { name: "Fan", id: "8282", status: "approved" },
        { name: "Theb", id: "1727", status: "pending" },
        { name: "Kai", id: "8838", status: "rejected" }
    ],
    "2025-03-26": [
        { name: "Leo", id: "1234", status: "pending" },
        { name: "Ana", id: "5678", status: "approved" },
        { name: "Ben", id: "8765", status: "approved" }
    ]
};

function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthLabel.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    let html = '<table class="calendar">';
    html += '<tr><th>MON</th><th>TUE</th><th>WED</th><th>THU</th><th>FRI</th><th>SAT</th><th>SUN</th></tr><tr>';

    const offset = (startDay + 6) % 7;
    for (let i = 0; i < offset; i++) {
        html += '<td></td>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const entries = sampleLeaveData[dateStr] || [];

        const redDot = entries.filter(e => e.status === "pending" || e.status === "approved").length > 2
            ? ' red-dot'
            : '';

        html += `<td><div class="date-number${redDot}">${day}</div>`;
        entries.forEach(entry => {
            html += `<div class="entry ${entry.status}">${entry.name} (${entry.id})</div>`;
        });
        html += '</td>';

        if ((day + offset) % 7 === 0 && day !== daysInMonth) {
            html += '</tr><tr>';
        }
    }

    const remaining = (daysInMonth + offset) % 7;
    for (let i = 0; i < (7 - remaining) % 7; i++) {
        html += '<td></td>';
    }

    html += '</tr></table>';
    calendarContainer.innerHTML = html;
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
}

renderCalendar(currentDate);
