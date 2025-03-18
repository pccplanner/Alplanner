
const API = "https://leave-management.th3va.com/api";

function submitLeave() {
  const name = document.getElementById("name").value;
  const staff_id = document.getElementById("staff_id").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  fetch(`${API}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, staff_id, start_date: start, end_date: end })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadHistory(staff_id);
  });
}

function loadHistory(staff_id) {
  fetch(`${API}/history/${staff_id}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("history").innerHTML = data.map(
        r => `<div>${r.start_date} to ${r.end_date} (${r.name})</div>`
      ).join("");
    });
}
