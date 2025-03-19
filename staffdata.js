// js/staffData.js
export function initStaffData() {
  const staffForm = document.getElementById("staffDataForm");
  const staffStatus = document.getElementById("staffStatus");
  staffForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const staffName = document.getElementById("staffName").value;
    const staffID = document.getElementById("staffID").value;
    const staffData = { name: staffName, id: staffID };
    localStorage.setItem("staffData", JSON.stringify(staffData));
    staffStatus.textContent = "Staff data saved.";
  });
}
