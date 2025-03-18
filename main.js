
const API = "https://leave-management.th3va.com/api";

function submitLeave() {
  const name = document.getElementById("name").value;
  const staff_id = document.getElementById("staff_id").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!name || !staff_id || !start || !end) {
    alert("Please fill in all fields.");
    return;
  }

  fetch(`${API}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, staff_id, start_date: start, end_date: end })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadHistory(staff_id);
  }).catch(err => {
    alert("Error submitting leave request.");
    console.error(err);
  });
}

function loadHistory(staff_id) {
  fetch(`${API}/history/${staff_id}`)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        document.getElementById("history").innerHTML = "<p>No leave history found.</p>";
        return;
      }
      document.getElementById("history").innerHTML = data.map(
        r => `<div class="history-entry">${r.start_date} to ${r.end_date} <br/><small>(${r.name})</small></div>`
      ).join("");
    }).catch(err => {
      document.getElementById("history").innerHTML = "<p>Error loading history.</p>";
      console.error(err);
    });
}
