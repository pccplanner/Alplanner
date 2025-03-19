
const monthLabel = document.getElementById("monthLabel");
let currentMonth = new Date();

function renderCalendar() {
  monthLabel.textContent = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  for (let i = 1; i <= 31; i++) {
    const day = document.createElement("div");
    day.className = "day-cell";
    if (i % 3 === 0) day.classList.add("shift-early");
    if (i % 3 === 1) day.classList.add("shift-mid");
    if (i % 3 === 2) day.classList.add("shift-late");
    if (i === 23 || i === 25 || i === 28) {
      const dot = document.createElement("div");
      dot.className = "red-dot";
      day.appendChild(dot);
    }
    day.textContent += i;
    calendar.appendChild(day);
  }
}

function changeMonth(offset) {
  currentMonth.setMonth(currentMonth.getMonth() + offset);
  renderCalendar();
}

window.onload = () => {
  renderCalendar();
}
