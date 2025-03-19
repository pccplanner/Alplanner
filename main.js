let selectedTeam=1, currentYear=2025, currentMonth=2;
const TeamPatterns={1:["morning","morning","night","night","off","off"],2:["off","off","morning","morning","night","night"],3:["night","night","off","off","morning","morning"]};
const referenceDate=new Date(2025,2,1), monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];

function daysBetween(a,b){return Math.floor((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}
function formatDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getShift(d){return TeamPatterns[selectedTeam][((daysBetween(referenceDate,d)%6)+6)%6];}

function renderCalendar(){
  document.getElementById("monthTitle").textContent=`${monthNames[currentMonth]} ${currentYear}`;
  const container=document.getElementById("plannerContainer"); container.innerHTML="";
  const reqs=JSON.parse(localStorage.getItem("leaveRequests")||"[]");
  let first=new Date(currentYear,currentMonth,1), start=(first.getDay()||7)-1, days=new Date(currentYear,currentMonth+1,0).getDate(), total=Math.ceil((start+days)/7)*7, day=1;

  for(let i=0;i<total;i++){
    if(i%7===0){container.appendChild(document.createElement("div")).className="calendar-row";}
    const cell=document.createElement("div");cell.className="calendar-cell";
    if(i<start){cell.innerHTML=`<div class="date-box other-month">${new Date(currentYear,currentMonth,0).getDate()-start+i+1}</div>`;}
    else if(day<=days){
      const d=new Date(currentYear,currentMonth,day), dateStr=formatDate(d), shift=getShift(d);
      let html=`<div class="date-box ${shift}">${day}</div>`;
      const daily=reqs.filter(r=>dateStr>=r.startDate&&dateStr<=r.endDate);
      const count=daily.filter(r=>r.status!=="Rejected").length;
      if(count>2) html+=`<span class="red-dot"></span>`;
      daily.forEach(r=>html+=`<div class="leave-info ${r.status.toLowerCase()}">${r.staffName} (${r.staffID})</div>`);
      cell.innerHTML=html; day++;
    } else cell.innerHTML=`<div class="date-box other-month">${i-start-days+1}</div>`;
    container.lastChild.appendChild(cell);
  }
}

function renderAdmin(){
  const panel=document.getElementById("adminSummary");panel.innerHTML="";
  const reqs=JSON.parse(localStorage.getItem("leaveRequests")||"[]");
  reqs.forEach((r,i)=>{
    const card=document.createElement("div");card.className="admin-card";
    card.innerHTML=`<b>${r.staffName}</b> (${r.staffID}) ${r.startDate}→${r.endDate}<select data-i="${i}">
      <option${r.status==="Pending"?" selected":""}>Pending</option>
      <option${r.status==="Approved"?" selected":""}>Approved</option>
      <option${r.status==="Rejected"?" selected":""}>Rejected</option>
    </select><button data-del="${i}">Delete</button>`;
    panel.appendChild(card);
  });
  panel.querySelectorAll("select").forEach(s=>s.onchange=e=>{
    const a=JSON.parse(localStorage.getItem("leaveRequests")); a[e.target.dataset.i].status=e.target.value;
    localStorage.setItem("leaveRequests",JSON.stringify(a)); renderCalendar(); renderAdmin();
  });
  panel.querySelectorAll("button[data-del]").forEach(b=>b.onclick=e=>{
    let a=JSON.parse(localStorage.getItem("leaveRequests")); a.splice(e.target.dataset.del,1);
    localStorage.setItem("leaveRequests",JSON.stringify(a)); renderCalendar(); renderAdmin();
  });
}

document.getElementById("leaveForm").onsubmit=e=>{
  e.preventDefault();
  const name=document.getElementById("staffName").value.trim(),id=document.getElementById("staffID").value.trim(),
        start=document.getElementById("startDate").value,end=document.getElementById("endDate").value;
  if(!name||!id||!start||!end) return alert("All fields required");
  const arr=JSON.parse(localStorage.getItem("leaveRequests")||"[]");
  arr.push({staffName:name,staffID:id,startDate:start,endDate:end,status:"Pending"});
  localStorage.setItem("leaveRequests",JSON.stringify(arr));
  e.target.reset(); renderCalendar(); renderAdmin();
};

document.getElementById("prevMonthBtn").onclick=()=>{
  currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} renderCalendar();
};
document.getElementById("nextMonthBtn").onclick=()=>{
  currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} renderCalendar();
};

document.getElementById("generateWhatsApp").onclick=()=>{
  const today=formatDate(new Date()),arr=JSON.parse(localStorage.getItem("leaveRequests")||"[]")
    .filter(r=>r.status==="Approved"&&today>=r.startDate&&today<=r.endDate)
    .map(r=>`${r.staffName} (${r.staffID})`).join(", ");
  window.open(`https://wa.me/?text=${encodeURIComponent(arr||"No approved leaves today")}`);
};

renderCalendar(); renderAdmin();