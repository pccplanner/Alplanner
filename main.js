
const leaveForm = document.getElementById('leaveForm');
const calendar = document.getElementById('calendar');
const adminSummary = document.getElementById('adminSummary');
let leaveData = [];

function renderCalendar() {
  calendar.innerHTML = '';
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'date-cell';
    cell.dataset.date = dateStr;

    const dayNum = document.createElement('div');
    dayNum.className = 'day-number';
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    const entries = leaveData.filter(item =>
      new Date(item.startDate) <= new Date(dateStr) &&
      new Date(item.endDate) >= new Date(dateStr)
    );

    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = `leave-entry ${entry.status.toLowerCase()}`;
      div.textContent = `${entry.name} (${entry.id})`;
      cell.appendChild(div);
    });

    const flagged = entries.filter(e => e.status !== 'Rejected').length > 2;
    if (flagged) {
      const redDot = document.createElement('div');
      redDot.className = 'red-dot';
      cell.appendChild(redDot);
    }

    calendar.appendChild(cell);
  }
  renderSummary();
}

function renderSummary() {
  adminSummary.innerHTML = '<h2>Admin Summary</h2>';
  leaveData.forEach((entry, index) => {
    const card = document.createElement('div');
    card.innerHTML = `
      <p><strong>${entry.name}</strong> (${entry.id})<br>${entry.startDate} to ${entry.endDate}</p>
      <label>Status:
        <select data-index="${index}">
          <option value="Pending"${entry.status === 'Pending' ? ' selected' : ''}>Pending</option>
          <option value="Approved"${entry.status === 'Approved' ? ' selected' : ''}>Approved</option>
          <option value="Rejected"${entry.status === 'Rejected' ? ' selected' : ''}>Rejected</option>
        </select>
      </label>
      <button data-del="${index}">Delete</button>
    `;
    adminSummary.appendChild(card);
  });

  document.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', e => {
      const idx = e.target.dataset.index;
      leaveData[idx].status = e.target.value;
      renderCalendar();
    });
  });

  document.querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', e => {
      const idx = e.target.dataset.del;
      leaveData.splice(idx, 1);
      renderCalendar();
    });
  });
}

leaveForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('staffName').value;
  const id = document.getElementById('staffId').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  leaveData.push({ name, id, startDate, endDate, status: 'Pending' });
  leaveForm.reset();
  renderCalendar();
});

renderCalendar();
