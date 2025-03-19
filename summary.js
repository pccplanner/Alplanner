// js/summary.js
export function renderManagerSummary() {
  const adminDiv = document.getElementById("adminSummary");
  const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  if (requests.length === 0) {
    adminDiv.innerHTML = "<p>No leave requests found.</p>";
    return;
  }
  let html = `
    <table id="adminSummaryTable">
      <thead>
        <tr>
          <th>Staff Name (ID)</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;
  requests.forEach(req => {
    html += `
      <tr>
        <td>${req.staffName} (${req.staffID})</td>
        <td>${req.startDate}</td>
        <td>${req.endDate}</td>
        <td>${req.status}</td>
        <td>
          ${req.status === 'pending' ? `
            <button onclick="approveRequest('${req.id}')">Approve</button>
            <button onclick="rejectRequest('${req.id}')">Reject</button>
          ` : ''}
          <button onclick="deleteRequest('${req.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  adminDiv.innerHTML = html;
}

export function renderStaffSummary() {
  const summaryDiv = document.getElementById("staffSummaryDiv");
  const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  let groups = {};
  requests.forEach(req => {
    if (!groups[req.staffID]) {
      groups[req.staffID] = { name: req.staffName, requests: [] };
    }
    groups[req.staffID].requests.push(req);
  });
  let html = `<table id="staffSummaryTable">
    <thead>
      <tr>
        <th>Staff Name (ID)</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>`;
  for (let staffID in groups) {
    const staffName = groups[staffID].name;
    html += `<tr>
      <td>${staffName} (${staffID})</td>
      <td>
        <button onclick="sendWhatsAppForStaff('${staffID}', '${staffName}')">WhatsApp</button>
      </td>
    </tr>`;
  }
  html += `</tbody></table>`;
  summaryDiv.innerHTML = html;
}

// Action functions for summary (they can also be moved to their own module if desired)
export function deleteRequest(requestID) {
  let requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  requests = requests.filter(req => req.id !== requestID);
  localStorage.setItem("leaveRequests", JSON.stringify(requests));
  window.location.reload(); // or call render functions again
}

export function approveRequest(requestID) {
  let requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  const index = requests.findIndex(req => req.id === requestID);
  if (index >= 0) {
    requests[index].status = "approved";
    localStorage.setItem("leaveRequests", JSON.stringify(requests));
    window.location.reload();
  }
}

export function rejectRequest(requestID) {
  let requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  const index = requests.findIndex(req => req.id === requestID);
  if (index >= 0) {
    requests[index].status = "rejected";
    localStorage.setItem("leaveRequests", JSON.stringify(requests));
    window.location.reload();
  }
}

export function sendWhatsAppForStaff(staffID, staffName) {
  const requests = JSON.parse(localStorage.getItem("leaveRequests")) || [];
  const staffReqs = requests.filter(req => req.staffID === staffID);
  if (staffReqs.length === 0) {
    alert("No leave requests found for this staff.");
    return;
  }
  let message = `Hello ${staffName} (${staffID}),\nHere is your leave summary:\n`;
  staffReqs.forEach(req => {
    message += `- From ${req.startDate} to ${req.endDate} (Status: ${req.status})\n`;
  });
  const url = "https://api.whatsapp.com/send?text=" + encodeURIComponent(message);
  window.open(url, '_blank');
}
