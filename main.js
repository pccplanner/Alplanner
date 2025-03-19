const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");

let currentDate = new Date();

const dummyLeaveData = {
  "2025-03-23": [
    { name: "Fan", id: 8282, status: "pending" },
    { name: "Theb", id: 1727, status: "approved" },
    { name: "Trix", id: 7777, status: "rejected" }
  ],
};

function renderCalendar(date) {
  calendar.innerHTML = "";

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();

  const startDay = firstDay.getDay();
  monthYear.textContent = `${date.toLocaleString("default", { month: "long" })} ${year}`;

  // Fill blanks for start
  for (let i = 0; i < startDay; i++) {
    const blank = document.createElement("div");
    blank.classList.add("day");
    calendar.appendChild(blank);
  }

  for (let d = 1; d <= lastDate; d++) {
    const thisDate = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const dayBox = document.createElement("div");
    dayBox.classList.add("day");

    const dateEl = document.createElement("div");
    dateEl.className = "date";
    dateEl.textContent = d;
    dayBox.appendChild(dateEl);

    const leaves = dummyLeaveData[thisDate] || [];

    leaves.forEach(leave => {
      const person = document.createElement("div");
      person.textContent = `${leave.name} (${leave.id})`;
      person.className = leave.status;
      dayBox.classList.add(leave.status);
      dayBox.appendChild(person);
    });

    const activeLeaves = leaves.filter(l => l.status === "pending" || l.status === "approved");
    if (activeLeaves.length > 2) {
      const dot = document.createElement("div");
      dot.classList.add("red-dot");
      dayBox.appendChild(dot);
    }

    calendar.appendChild(dayBox);
  }
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
