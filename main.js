// AlPlanner - Main JavaScript File
// This file contains all functionality for the leave management system

// Global Configuration
const appConfig = {
  // Approval workflow configuration
  approvalWorkflow: {
    steps: [
      { id: 'submitted', label: 'Submitted', role: 'employee' }

// Function to get pending approvals for a specific role
function getPendingApprovals(role) {
  const allRequests = getAllLeaveRequests();
  
  return allRequests.filter(req => {
    // If request isn't pending, skip it
    if (req.status !== 'Pending') return false;
    
    // Get workflow steps
    const workflowSteps = req.workflowSteps || appConfig.approvalWorkflow.steps;
    
    // Find current step
    const currentStep = workflowSteps.find(step => step.id === req.approvalStep);
    
    // Check if this step requires approval by the specified role
    return currentStep && currentStep.role === role;
  });
}

// Function to approve a request
function approveRequest(requestId) {
  // Get the request
  const request = getLeaveRequestById(requestId);
  if (!request) return;
  
  // Show comment dialog
  showCommentDialog(requestId, 'approve');
}

// Function to reject a request
function rejectRequest(requestId) {
  // Get the request
  const request = getLeaveRequestById(requestId);
  if (!request) return;
  
  // Show comment dialog
  showCommentDialog(requestId, 'reject');
}

// Function to show comment dialog for approval/rejection
function showCommentDialog(requestId, action) {
  // Create dialog HTML
  const dialogHTML = `
    <div class="modal" id="comment-dialog">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>${action === 'approve' ? 'Approve' : 'Reject'} Leave Request</h3>
        
        <form id="approval-comment-form">
          <div class="form-group">
            <label for="approval-comment">Comment (optional):</label>
            <textarea id="approval-comment" rows="3"></textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary cancel-action">Cancel</button>
            <button type="submit" class="btn ${action === 'approve' ? 'btn-secondary' : 'btn-danger'}">
              ${action === 'approve' ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add dialog to the document
  document.body.insertAdjacentHTML('beforeend', dialogHTML);
  
  // Show the dialog
  const dialog = document.getElementById('comment-dialog');
  dialog.style.display = 'block';
  
  // Add close functionality
  const closeBtn = dialog.querySelector('.close-modal');
  closeBtn.addEventListener('click', function() {
    dialog.remove();
  });
  
  // Close when clicking cancel
  const cancelBtn = dialog.querySelector('.cancel-action');
  cancelBtn.addEventListener('click', function() {
    dialog.remove();
  });
  
  // Close when clicking outside the dialog
  window.addEventListener('click', function(event) {
    if (event.target === dialog) {
      dialog.remove();
    }
  });
  
  // Handle form submission
  const commentForm = document.getElementById('approval-comment-form');
  commentForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const comment = document.getElementById('approval-comment').value;
    
    if (action === 'approve') {
      processApproval(requestId, comment);
    } else {
      processRejection(requestId, comment);
    }
    
    dialog.remove();
  });
}

// Function to process an approval
function processApproval(requestId, comment) {
  // Get the request
  const request = getLeaveRequestById(requestId);
  if (!request) return;
  
  // Get current user
  const currentUser = getCurrentUser();
  const userRole = currentUser.role || 'employee';
  
  // Determine next step based on current step and workflow
  const workflowSteps = request.workflowSteps || appConfig.approvalWorkflow.steps;
  const currentStepIndex = workflowSteps.findIndex(step => step.id === request.approvalStep);
  const nextStep = workflowSteps[currentStepIndex + 1];
  
  // Update approval history
  request.approvalHistory.push({
    step: request.approvalStep,
    date: new Date().toISOString(),
    status: 'Approved',
    by: currentUser,
    comment: comment
  });
  
  // If there are no more steps, mark as approved
  if (!nextStep) {
    request.status = 'Approved';
    request.approvalStep = 'approved';
    
    // Add final approval to history
    request.approvalHistory.push({
      step: 'approved',
      date: new Date().toISOString(),
      status: 'Completed',
      by: currentUser
    });
    
    // Create notification for employee
    createNotification('employee', 'request-approved', {
      requestId: request.id,
      approverName: currentUser.name,
      leaveType: request.type
    });
  } else {
    // Move to next step
    request.approvalStep = nextStep.id;
    
    // Add step entry to history
    request.approvalHistory.push({
      step: nextStep.id,
      date: new Date().toISOString(),
      status: 'Pending'
    });
    
    // Create notification for next approver
    createNotification(nextStep.role, 'new-approval', {
      requestId: request.id,
      employeeName: request.employee.name,
      leaveType: request.type
    });
  }
  
  // Save updated request
  saveLeaveRequest(request);
  
  // Update UI
  loadPendingApprovals();
}

// Function to process a rejection
function processRejection(requestId, comment) {
  // Get the request
  const request = getLeaveRequestById(requestId);
  if (!request) return;
  
  // Get current user
  const currentUser = getCurrentUser();
  
  // Update request status
  request.status = 'Rejected';
  request.approvalStep = 'rejected';
  
  // Add to approval history
  request.approvalHistory.push({
    step: request.approvalStep,
    date: new Date().toISOString(),
    status: 'Rejected',
    by: currentUser,
    comment: comment || 'No reason provided'
  });
  
  // Save updated request
  saveLeaveRequest(request);
  
  // Update UI
  loadPendingApprovals();
  
  // Create notification for employee
  createNotification('employee', 'request-rejected', {
    requestId: request.id,
    approverName: currentUser.name,
    leaveType: request.type,
    comment: comment
  });
}

// Function to add notification badge
function addNotificationBadge() {
  // Find or create notification badge element
  let notifBadge = document.getElementById('notification-badge');
  
  if (!notifBadge) {
    // Try to find a good spot for notifications
    const header = document.querySelector('header');
    
    if (header) {
      const badgeContainer = document.createElement('div');
      badgeContainer.className = 'notification-container';
      badgeContainer.innerHTML = `
        <div id="notification-badge" class="badge">0</div>
      `;
      header.appendChild(badgeContainer);
      notifBadge = document.getElementById('notification-badge');
    }
  }
  
  // Update notifications periodically
  if (notifBadge) {
    updateNotificationBadge();
    setInterval(updateNotificationBadge, 60000); // Update every minute
  }
}

// Function to update notification badge count
function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  
  // Get current user notifications
  const notifications = getUserNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Update badge
  badge.textContent = unreadCount;
  badge.style.display = unreadCount > 0 ? 'block' : 'none';
  
  // Update pending approval count as well
  const pendingCountBadge = document.getElementById('pending-count');
  if (pendingCountBadge) {
    const currentUser = getCurrentUser();
    const userRole = currentUser.role || 'employee';
    const pendingRequests = getPendingApprovals(userRole);
    pendingCountBadge.textContent = pendingRequests.length;
  }
}

// Function to create a notification
function createNotification(targetRole, type, data) {
  // In a real app, this would create notifications based on user role
  // For simplicity, we'll just store in localStorage
  
  const notification = {
    id: generateUniqueId(),
    type: type,
    targetRole: targetRole,
    data: data,
    date: new Date().toISOString(),
    read: false
  };
  
  // Get existing notifications
  const notifications = getAllNotifications();
  notifications.push(notification);
  
  // Save to localStorage
  localStorage.setItem('notifications', JSON.stringify(notifications));
  
  // Update badge immediately if this is for current user
  const currentUser = getCurrentUser();
  if (targetRole === currentUser.role || targetRole === 'all' || 
      (targetRole === 'employee' && currentUser.role === 'employee')) {
    updateNotificationBadge();
  }
  
  return notification;
}

// Function to get all notifications
function getAllNotifications() {
  const storedNotifications = localStorage.getItem('notifications');
  return storedNotifications ? JSON.parse(storedNotifications) : [];
}

// Function to get current user's notifications
function getUserNotifications() {
  const currentUser = getCurrentUser();
  const role = currentUser.role || 'employee';
  const allNotifications = getAllNotifications();
  
  return allNotifications.filter(notif => 
    notif.targetRole === role || 
    notif.targetRole === 'all' ||
    (notif.targetRole === 'employee' && role === 'employee')
  );
}

// =============================================
// Team View Functionality
// =============================================

// Function to initialize the team view feature
function initTeamView() {
  // Load team data and render the view
  loadTeamData().then(teamData => {
    renderTeamCalendar(teamData);
  });
  
  // Add event listeners for navigation
  addTeamViewListeners();
}

// Function to load team data
async function loadTeamData() {
  // In a real app, this would fetch from an API
  // For now, we'll use localStorage and mock data
  
  // Try to get from localStorage first
  const storedTeamData = localStorage.getItem('teamData');
  if (storedTeamData) {
    return JSON.parse(storedTeamData);
  }
  
  // Mock data if not in localStorage
  const teamData = {
    employees: [
      { id: 'user1', name: 'John Doe', role: 'manager', department: 'Engineering' },
      { id: 'user2', name: 'Jane Smith', role: 'employee', department: 'Marketing' },
      { id: 'user3', name: 'Michael Brown', role: 'employee', department: 'Engineering' },
      { id: 'user4', name: 'Sarah Johnson', role: 'employee', department: 'Design' },
      { id: 'user5', name: 'Robert Williams', role: 'employee', department: 'Sales' },
      { id: 'user6', name: 'Lisa Davis', role: 'hr', department: 'HR' }
    ],
    // Get leave data from localStorage
    leaveRequests: getAllLeaveRequests()
  };
  
  // If there are no leave requests in localStorage, add some mock data
  if (teamData.leaveRequests.length === 0) {
    teamData.leaveRequests = generateMockLeaveData(teamData.employees);
    
    // Save to localStorage
    localStorage.setItem('leaveRequests', JSON.stringify(teamData.leaveRequests));
  }
  
  // Save to localStorage
  localStorage.setItem('teamData', JSON.stringify(teamData));
  
  return teamData;
}

// Function to generate mock leave data
function generateMockLeaveData(employees) {
  const leaveTypes = ['Annual Leave', 'Sick Leave', 'Personal Day', 'Work From Home'];
  const statuses = ['Approved', 'Pending', 'Rejected'];
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const mockLeaves = [];
  
  // Generate some leave requests for each employee
  employees.forEach(employee => {
    // Generate 1-3 leave requests per employee
    const numberOfRequests = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numberOfRequests; i++) {
      // Random start date within this month and next
      const startDay = 1 + Math.floor(Math.random() * 28);
      const startMonth = month + Math.floor(Math.random() * 2);
      const startDate = new Date(year, startMonth, startDay);
      
      // Duration between 1-5 days
      const duration = 1 + Math.floor(Math.random() * 5);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration - 1);
      
      const leaveRequest = {
        id: generateUniqueId(),
        employee: {
          id: employee.id,
          name: employee.name,
          department: employee.department
        },
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        approvalStep: 'manager',
        dateRequested: new Date(year, startMonth, startDay - 5).toISOString(),
        reason: 'Mock leave request'
      };
      
      mockLeaves.push(leaveRequest);
    }
  });
  
  return mockLeaves;
}

// Function to render the team calendar
function renderTeamCalendar(teamData, targetDate = new Date()) {
  const calendarTable = document.getElementById('team-calendar');
  if (!calendarTable) return;
  
  // Update current month display
  const monthLabel = document.querySelector('.current-month');
  if (monthLabel) {
    monthLabel.textContent = targetDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }
  
  // Get the month and year
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // Get the first and last day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();
  
  // Clear existing header row except for the first cell
  const headerRow = calendarTable.querySelector('thead tr');
  while (headerRow.children.length > 1) {
    headerRow.removeChild(headerRow.lastChild);
  }
  
  // Add date headers
  for (let day = 1; day <= numDays; day++) {
    const th = document.createElement('th');
    
    // Format as 'day (weekday)'
    const date = new Date(year, month, day);
    const dayOfWeek = date.toLocaleDateString('default', { weekday: 'short' });
    
    th.textContent = `${day} (${dayOfWeek})`;
    th.className = 'date-header';
    
    // Highlight weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      th.classList.add('weekend');
    }
    
    // Highlight today
    const today = new Date();
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      th.classList.add('today');
    }
    
    headerRow.appendChild(th);
  }
  
  // Clear existing body rows
  const tbody = calendarTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Create a row for each employee
  teamData.employees.forEach(employee => {
    const row = document.createElement('tr');
    
    // Employee name cell
    const nameCell = document.createElement('td');
    nameCell.className = 'employee-name';
    nameCell.textContent = employee.name;
    row.appendChild(nameCell);
    
    // Add cells for each day of the month
    for (let day = 1; day <= numDays; day++) {
      const cell = document.createElement('td');
      cell.className = 'day-cell';
      
      // Date for this cell
      const cellDate = new Date(year, month, day).toISOString().split('T')[0];
      
      // Check if employee has leave on this day
      const leaveOnThisDay = teamData.leaveRequests.filter(leave => 
        leave.employee.id === employee.id &&
        isDateInRange(cellDate, leave.startDate, leave.endDate)
      );
      
      if (leaveOnThisDay.length > 0) {
        // Use the first leave for this day (normally there should be only one)
        const leave = leaveOnThisDay[0];
        
        // Add class based on status
        cell.classList.add('leave-day', leave.status.toLowerCase());
        
        // Add tooltip with leave info
        cell.setAttribute('title', `${leave.type} (${leave.status})`);
        
        // Add a tooltip element for mobile
        const tooltip = document.createElement('div');
        tooltip.className = 'leave-tooltip';
        tooltip.textContent = leave.type.substring(0, 3);
        cell.appendChild(tooltip);
      }
      
      row.appendChild(cell);
    }
    
    tbody.appendChild(row);
  });
  
  // Apply filter settings
  applyCalendarFilters();
}

// Function to add event listeners for the team view
function addTeamViewListeners() {
  // Month navigation
  const prevMonthBtn = document.querySelector('.prev-month');
  const nextMonthBtn = document.querySelector('.next-month');
  let currentDate = new Date();
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      loadTeamData().then(teamData => {
        renderTeamCalendar(teamData, new Date(currentDate));
      });
    });
  }
  
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      loadTeamData().then(teamData => {
        renderTeamCalendar(teamData, new Date(currentDate));
      });
    });
  }
  
  // Filter checkboxes
  const filterCheckboxes = document.querySelectorAll('.view-options input[type="checkbox"]');
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', applyCalendarFilters);
  });
}

// Function to apply calendar filters based on checkboxes
function applyCalendarFilters() {
  const showApproved = document.getElementById('show-approved').checked;
  const showPending = document.getElementById('show-pending').checked;
  const showRejected = document.getElementById('show-rejected').checked;
  
  // Get all leave day cells
  const approvedCells = document.querySelectorAll('.leave-day.approved');
  const pendingCells = document.querySelectorAll('.leave-day.pending');
  const rejectedCells = document.querySelectorAll('.leave-day.rejected');
  
  // Apply visibility based on filter settings
  approvedCells.forEach(cell => {
    cell.style.visibility = showApproved ? 'visible' : 'hidden';
  });
  
  pendingCells.forEach(cell => {
    cell.style.visibility = showPending ? 'visible' : 'hidden';
  });
  
  rejectedCells.forEach(cell => {
    cell.style.visibility = showRejected ? 'visible' : 'hidden';
  });
},
      { id: 'manager', label: 'Manager Review', role: 'manager' },
      { id: 'hr', label: 'HR Review', role: 'hr', optional: true },
      { id: 'approved', label: 'Approved', role: 'system' },
    ],
    // Rules for when HR approval is needed
    hrApprovalRequired: {
      leaveDuration: 5, // HR approval needed for leaves longer than 5 days
      leaveTypes: ['Medical Leave', 'Unpaid Leave', 'Sabbatical'] // Types that always need HR approval
    }
  },
  // Default annual leave entitlement
  annualLeaveEntitlement: 25
};

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all features
  initLeaveForm();
  initLeaveBalanceVisualization();
  initApprovalWorkflow();
  initTeamView();
  
  // Initialize tabs
  initTabs();
});

// =============================================
// General Utility Functions
// =============================================

// Function to initialize tab functionality
function initTabs() {
  const tabGroups = document.querySelectorAll('.tabs');
  
  tabGroups.forEach(tabGroup => {
    const tabButtons = tabGroup.querySelectorAll('.tab-btn');
    const parentCard = tabGroup.closest('.card');
    
    if (!parentCard) return;
    
    const tabContents = parentCard.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        const tabContent = parentCard.querySelector(`#${tabId}`);
        if (tabContent) {
          tabContent.classList.add('active');
        }
        
        // If it's a chart tab, trigger resize to fix chart rendering
        window.dispatchEvent(new Event('resize'));
      });
    });
  });
}

// Function to get current user (in a real app, this would come from auth)
function getCurrentUser() {
  // Try to get from localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  
  // Default user
  const defaultUser = {
    id: 'user1',
    name: 'John Doe',
    role: 'manager', // Options: employee, manager, hr, admin
    email: 'john.doe@example.com',
    department: 'Engineering'
  };
  
  // Store for future use
  localStorage.setItem('currentUser', JSON.stringify(defaultUser));
  
  return defaultUser;
}

// Function to generate a unique ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Function to calculate days between two dates
function calculateDaysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}

// Function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Function to format date and time
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Function to check if a date is within a range
function isDateInRange(dateStr, startStr, endStr) {
  const date = new Date(dateStr);
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  // Normalize all dates to midnight
  date.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return date >= start && date <= end;
}

// =============================================
// Leave Request Form Functionality
// =============================================

// Function to initialize the leave request form
function initLeaveForm() {
  const leaveForm = document.getElementById('leave-form');
  
  if (leaveForm) {
    // Set default dates
    const today = new Date();
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) {
      startDateInput.min = today.toISOString().split('T')[0];
      startDateInput.value = today.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
      endDateInput.min = today.toISOString().split('T')[0];
      endDateInput.value = today.toISOString().split('T')[0];
    }
    
    // Add form submission handler
    leaveForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Get form data
      const formData = new FormData(leaveForm);
      
      // Create a new leave request
      const leaveRequest = {
        id: generateUniqueId(),
        employee: getCurrentUser(),
        startDate: formData.get('start-date'),
        endDate: formData.get('end-date'),
        type: formData.get('leave-type'),
        reason: formData.get('reason') || 'No reason provided',
        status: 'Pending',
        approvalStep: 'submitted',
        approvalHistory: [
          {
            step: 'submitted',
            date: new Date().toISOString(),
            by: getCurrentUser(),
            status: 'Completed'
          }
        ],
        dateRequested: new Date().toISOString()
      };
      
      // Determine if HR approval is needed
      const daysBetween = calculateDaysBetween(leaveRequest.startDate, leaveRequest.endDate);
      const needsHrApproval = 
        daysBetween > appConfig.approvalWorkflow.hrApprovalRequired.leaveDuration ||
        appConfig.approvalWorkflow.hrApprovalRequired.leaveTypes.includes(leaveRequest.type);
      
      // Customize workflow steps if HR approval is not needed
      leaveRequest.workflowSteps = appConfig.approvalWorkflow.steps.filter(step => 
        !step.optional || step.id !== 'hr' || needsHrApproval
      );
      
      // Save the leave request
      saveLeaveRequest(leaveRequest);
      
      // Create notification for manager
      createNotification('manager', 'new-approval', {
        requestId: leaveRequest.id,
        employeeName: leaveRequest.employee.name,
        leaveType: leaveRequest.type,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate
      });
      
      // Show success message
      alert('Leave request submitted successfully!');
      
      // Reset form
      leaveForm.reset();
      
      // Update UI
      updateMyRequestsList();
      initLeaveBalanceVisualization();
      
      // Clear any active display
      const requestTracker = document.getElementById('request-status-tracker');
      if (requestTracker) {
        requestTracker.innerHTML = '';
      }
      
      // Show the new request status
      showLeaveRequestStatus(leaveRequest);
    });
  }
}

// Function to save a leave request
function saveLeaveRequest(leaveRequest) {
  // Get all leave requests
  const allRequests = getAllLeaveRequests();
  
  // Find existing request with this ID
  const existingIndex = allRequests.findIndex(req => req.id === leaveRequest.id);
  
  if (existingIndex >= 0) {
    // Update existing request
    allRequests[existingIndex] = leaveRequest;
  } else {
    // Add new request
    allRequests.push(leaveRequest);
  }
  
  // Save to localStorage
  localStorage.setItem('leaveRequests', JSON.stringify(allRequests));
  
  return leaveRequest;
}

// Function to get all leave requests
function getAllLeaveRequests() {
  const storedRequests = localStorage.getItem('leaveRequests');
  return storedRequests ? JSON.parse(storedRequests) : [];
}

// Function to get a specific leave request by ID
function getLeaveRequestById(requestId) {
  const allRequests = getAllLeaveRequests();
  return allRequests.find(req => req.id === requestId);
}

// =============================================
// Leave Balance Visualization Functionality
// =============================================

// Function to initialize leave balance visualization
function initLeaveBalanceVisualization() {
  // Load leave data and render charts
  loadLeaveData().then(leaveData => {
    renderLeaveBalanceCharts(leaveData);
    updateLeaveStats(leaveData);
  });
}

// Function to load leave data
async function loadLeaveData() {
  // Get leave requests from localStorage
  const leaveRequests = getAllLeaveRequests();
  
  // If no leave requests, generate mock data
  if (leaveRequests.length === 0) {
    const mockData = generateMockLeaveData([getCurrentUser()]);
    mockData.forEach(request => saveLeaveRequest(request));
    return mockData;
  }
  
  return leaveRequests;
}

// Function to render all charts
function renderLeaveBalanceCharts(leaveData) {
  renderUsageSummaryChart(leaveData);
  renderMonthlyChart(leaveData);
  renderLeaveTypeChart(leaveData);
}

// Function to render the usage summary chart (donut chart)
function renderUsageSummaryChart(leaveData) {
  const canvas = document.getElementById('leaveUsageChart');
  if (!canvas) return;
  
  // Clear any existing chart
  if (canvas.chart) {
    canvas.chart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Calculate total leave and used leave
  const totalAnnualLeave = appConfig.annualLeaveEntitlement;
  
  // Calculate used leave days (only count Approved and Pending Annual Leave)
  const currentUser = getCurrentUser();
  let usedLeaveDays = 0;
  
  leaveData.forEach(leave => {
    if (leave.employee.id === currentUser.id && 
        (leave.status === 'Approved' || leave.status === 'Pending') && 
        leave.type === 'Annual Leave') {
      usedLeaveDays += calculateDaysBetween(leave.startDate, leave.endDate);
    }
  });
  
  const remainingLeave = totalAnnualLeave - usedLeaveDays;
  
  // Create the chart
  canvas.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Used', 'Remaining'],
      datasets: [{
        data: [usedLeaveDays, remainingLeave],
        backgroundColor: [
          '#3498db',
          '#2ecc71'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.raw + ' days';
            }
          }
        }
      }
    }
  });
}

// Function to render the monthly breakdown chart
function renderMonthlyChart(leaveData) {
  const canvas = document.getElementById('monthlyLeaveChart');
  if (!canvas) return;
  
  // Clear any existing chart
  if (canvas.chart) {
    canvas.chart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Set up monthly data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = Array(12).fill(0);
  
  // Calculate days taken per month
  const currentUser = getCurrentUser();
  
  leaveData.forEach(leave => {
    if (leave.employee.id === currentUser.id && 
        (leave.status === 'Approved' || leave.status === 'Pending')) {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();
      
      if (startMonth === endMonth) {
        // If leave is within the same month
        monthlyData[startMonth] += calculateDaysBetween(leave.startDate, leave.endDate);
      } else {
        // If leave spans multiple months, distribute days accordingly
        for (let month = startMonth; month <= endMonth; month++) {
          // Calculate days in this month
          let monthStart, monthEnd;
          
          if (month === startMonth) {
            monthStart = new Date(startDate);
            monthEnd = new Date(startDate.getFullYear(), startMonth + 1, 0);
          } else if (month === endMonth) {
            monthStart = new Date(endDate.getFullYear(), endMonth, 1);
            monthEnd = new Date(endDate);
          } else {
            monthStart = new Date(startDate.getFullYear(), month, 1);
            monthEnd = new Date(startDate.getFullYear(), month + 1, 0);
          }
          
          monthlyData[month] += calculateDaysBetween(monthStart, monthEnd);
        }
      }
    }
  });
  
  // Create the chart
  canvas.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Leave Days',
        data: monthlyData,
        backgroundColor: '#3498db',
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Days'
          },
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Function to render the leave type breakdown chart
function renderLeaveTypeChart(leaveData) {
  const canvas = document.getElementById('leaveTypeChart');
  if (!canvas) return;
  
  // Clear any existing chart
  if (canvas.chart) {
    canvas.chart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Count days by leave type
  const leaveByType = {};
  const currentUser = getCurrentUser();
  
  leaveData.forEach(leave => {
    if (leave.employee.id === currentUser.id && 
        (leave.status === 'Approved' || leave.status === 'Pending')) {
      const days = calculateDaysBetween(leave.startDate, leave.endDate);
      if (!leaveByType[leave.type]) {
        leaveByType[leave.type] = 0;
      }
      leaveByType[leave.type] += days;
    }
  });
  
  // Prepare data for chart
  const types = Object.keys(leaveByType);
  const typeData = types.map(type => leaveByType[type]);
  
  // Color palette for different leave types
  const colorPalette = [
    '#3498db',
    '#2ecc71',
    '#e74c3c',
    '#f39c12',
    '#9b59b6',
    '#1abc9c'
  ];
  
  // Create the chart
  canvas.chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: types,
      datasets: [{
        data: typeData,
        backgroundColor: colorPalette.slice(0, types.length),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.raw + ' days';
            }
          }
        }
      }
    }
  });
}

// Function to update the leave statistics
function updateLeaveStats(leaveData) {
  const totalAnnualLeave = appConfig.annualLeaveEntitlement;
  const currentUser = getCurrentUser();
  
  // Calculate used leave days (only count Approved and Pending Annual Leave)
  let usedLeaveDays = 0;
  leaveData.forEach(leave => {
    if (leave.employee.id === currentUser.id && 
        (leave.status === 'Approved' || leave.status === 'Pending') && 
        leave.type === 'Annual Leave') {
      usedLeaveDays += calculateDaysBetween(leave.startDate, leave.endDate);
    }
  });
  
  const remainingLeave = totalAnnualLeave - usedLeaveDays;
  
  // Update the stat cards
  const totalAnnualElement = document.getElementById('total-annual');
  const totalUsedElement = document.getElementById('total-used');
  const totalRemainingElement = document.getElementById('total-remaining');
  
  if (totalAnnualElement) totalAnnualElement.textContent = totalAnnualLeave;
  if (totalUsedElement) totalUsedElement.textContent = usedLeaveDays;
  if (totalRemainingElement) totalRemainingElement.textContent = remainingLeave;
}

// =============================================
// Approval Workflow Functionality
// =============================================

// Function to initialize the approval workflow
function initApprovalWorkflow() {
  // Add event listeners for existing leave request form
  attachApprovalFormListeners();
  
  // Add notification badge to show pending approvals
  addNotificationBadge();
  
  // Initialize approval tasks for current user
  loadPendingApprovals();
  
  // Load and display user's requests
  updateMyRequestsList();
}

// Function to attach listeners to the leave request form
function attachApprovalFormListeners() {
  // Already handled in initLeaveForm()
}

// Function to show approval status for a leave request
function showLeaveRequestStatus(leaveRequest) {
  const statusTracker = document.getElementById('request-status-tracker');
  if (!statusTracker) return;
  
  // Clear existing steps
  statusTracker.innerHTML = '';
  
  // Get workflow steps (either from request or default config)
  const workflowSteps = leaveRequest.workflowSteps || appConfig.approvalWorkflow.steps;
  
  // Find the current step index
  const currentStepIndex = workflowSteps.findIndex(step => step.id === leaveRequest.approvalStep);
  
  // Create step indicators
  workflowSteps.forEach((step, index) => {
    const stepElement = document.createElement('div');
    stepElement.className = 'approval-step';
    
    // Add appropriate classes based on workflow progress
    if (index < currentStepIndex) {
      stepElement.classList.add('completed');
    }
    if (index === currentStepIndex) {
      stepElement.classList.add('active');
    }
    
    // Create step content
    stepElement.innerHTML = `
      <div class="step-number">${index + 1}</div>
      <div class="step-label">${step.label}</div>
    `;
    
    statusTracker.appendChild(stepElement);
  });
}

// Function to update the list of user's requests
function updateMyRequestsList() {
  const requestsList = document.getElementById('my-requests-list');
  if (!requestsList) return;
  
  // Get current user's leave requests
  const requests = getMyLeaveRequests();
  
  if (requests.length === 0) {
    requestsList.innerHTML = '<p>You have no active leave requests.</p>';
    return;
  }
  
  // Build HTML for requests
  let requestsHTML = `
    <table>
      <thead>
        <tr>
          <th>Dates</th>
          <th>Type</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  requests.forEach(request => {
    // Find current approval step info
    const workflowSteps = request.workflowSteps || appConfig.approvalWorkflow.steps;
    const currentStepInfo = workflowSteps.find(step => step.id === request.approvalStep);
    
    requestsHTML += `
      <tr data-request-id="${request.id}">
        <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
        <td>${request.type}</td>
        <td>
          <span class="status-badge ${request.status.toLowerCase()}">${request.status}</span>
          <span class="step-info">${currentStepInfo ? currentStepInfo.label : ''}</span>
        </td>
        <td>
          <button class="btn btn-small view-request" data-request-id="${request.id}">View</button>
          ${request.status === 'Pending' ? `<button class="btn btn-small btn-danger cancel-request" data-request-id="${request.id}">Cancel</button>` : ''}
        </td>
      </tr>
    `;
  });
  
  requestsHTML += `
      </tbody>
    </table>
  `;
  
  requestsList.innerHTML = requestsHTML;
  
  // Add event listeners for buttons
  document.querySelectorAll('.view-request').forEach(btn => {
    btn.addEventListener('click', function() {
      const requestId = this.getAttribute('data-request-id');
      displayRequestDetails(requestId);
    });
  });
  
  document.querySelectorAll('.cancel-request').forEach(btn => {
    btn.addEventListener('click', function() {
      const requestId = this.getAttribute('data-request-id');
      cancelLeaveRequest(requestId);
    });
  });
}

// Function to get current user's leave requests
function getMyLeaveRequests() {
  const currentUser = getCurrentUser();
  const allRequests = getAllLeaveRequests();
  
  return allRequests.filter(req => 
    req.employee.id === currentUser.id
  ).sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested));
}

// Function to display request details in a modal
function displayRequestDetails(requestId) {
  // Get request data
  const request = getLeaveRequestById(requestId);
  if (!request) return;
  
  // Create modal HTML
  const modalHTML = `
    <div class="modal" id="request-details-modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>Leave Request Details</h3>
        
        <div class="request-info">
          <div class="info-row">
            <div class="info-label">Type:</div>
            <div class="info-value">${request.type}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Dates:</div>
            <div class="info-value">${formatDate(request.startDate)} - ${formatDate(request.endDate)}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Duration:</div>
            <div class="info-value">${calculateDaysBetween(request.startDate, request.endDate)} days</div>
          </div>
          <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">
              <span class="status-badge ${request.status.toLowerCase()}">${request.status}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-label">Reason:</div>
            <div class="info-value">${request.reason || 'Not provided'}</div>
          </div>
        </div>
        
        <h4>Approval Timeline</h4>
        <div class="approval-timeline">
          ${generateApprovalTimeline(request)}
        </div>
      </div>
    </div>
  `;
  
  // Add modal to the document
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Show the modal
  const modal = document.getElementById('request-details-modal');
  modal.style.display = 'block';
  
  // Add close functionality
  const closeBtn = modal.querySelector('.close-modal');
  closeBtn.addEventListener('click', function() {
    modal.remove();
  });
  
  // Close when clicking outside the modal
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

// Function to generate approval timeline HTML
function generateApprovalTimeline(request) {
  if (!request.approvalHistory || request.approvalHistory.length === 0) {
    return '<p>No approval history available.</p>';
  }
  
  let timelineHTML = '<ul class="timeline">';
  
  request.approvalHistory.forEach(entry => {
    timelineHTML += `
      <li class="timeline-item">
        <div class="timeline-badge ${entry.status.toLowerCase()}"></div>
        <div class="timeline-content">
          <h5>${getStepLabel(entry.step)}</h5>
          <p>${entry.status} on ${formatDateTime(entry.date)}</p>
          ${entry.comment ? `<p class="comment">"${entry.comment}"</p>` : ''}
          ${entry.by ? `<p class="by">By: ${entry.by.name || entry.by}</p>` : ''}
        </div>
      </li>
    `;
  });
  
  timelineHTML += '</ul>';
  return timelineHTML;
}

// Function to get the label for a step
function getStepLabel(stepId) {
  const step = appConfig.approvalWorkflow.steps.find(s => s.id === stepId);
  return step ? step.label : stepId;
}

// Function to cancel a leave request
function cancelLeaveRequest(requestId) {
  if (!confirm('Are you sure you want to cancel this leave request?')) return;
  
  // Get the request
  const request = getLeaveRequestById(requestId);
  if (!request) return;
  
  // Update request status
  request.status = 'Cancelled';
  request.approvalStep = 'cancelled';
  
  // Add to approval history
  request.approvalHistory.push({
    step: 'cancelled',
    date: new Date().toISOString(),
    status: 'Cancelled',
    by: getCurrentUser(),
    comment: 'Request cancelled by employee'
  });
  
  // Save updated request
  saveLeaveRequest(request);
  
  // Update UI
  updateMyRequestsList();
  
  // Update leave balance charts
  initLeaveBalanceVisualization();
  
  // Create notification for approvers
  createNotification(request.approvalStep, 'request-cancelled', {
    requestId: request.id,
    employeeName: request.employee.name,
    leaveType: request.type
  });
}

// Function to load pending approvals for the current user
function loadPendingApprovals() {
  const approvalTasksList = document.getElementById('approval-tasks-list');
  if (!approvalTasksList) return;
  
  // Get current user role and pending approvals
  const currentUser = getCurrentUser();
  const userRole = currentUser.role || 'employee';
  
  // Only show pending approvals if user has approval authority
  if (userRole !== 'manager' && userRole !== 'hr' && userRole !== 'admin') {
    approvalTasksList.innerHTML = '<p>You don\'t have approval authority.</p>';
    return;
  }
  
  // Get pending requests for this approver
  const pendingRequests = getPendingApprovals(userRole);
  
  // Update notification badge
  const pendingCountBadge = document.getElementById('pending-count');
  if (pendingCountBadge) {
    pendingCountBadge.textContent = pendingRequests.length;
  }
  
  if (pendingRequests.length === 0) {
    approvalTasksList.innerHTML = '<p>You have no pending approval tasks.</p>';
    return;
  }
  
  // Build HTML for pending approvals
  let approvalsHTML = `
    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Dates</th>
          <th>Type</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  pendingRequests.forEach(request => {
    approvalsHTML += `
      <tr data-request-id="${request.id}">
        <td>${request.employee.name}</td>
        <td>${formatDate(request.startDate)} - ${formatDate(request.endDate)}</td>
        <td>${request.type}</td>
        <td>
          <button class="btn btn-small btn-secondary approve-request" data-request-id="${request.id}">Approve</button>
          <button class="btn btn-small btn-danger reject-request" data-request-id="${request.id}">Reject</button>
          <button class="btn btn-small view-request" data-request-id="${request.id}">View</button>
        </td>
      </tr>
    `;
  });
  
  approvalsHTML += `
      </tbody>
    </table>
  `;
  
  approvalTasksList.innerHTML = approvalsHTML;
  
  // Add event listeners for approval buttons
  document.querySelectorAll('.approve-request').forEach(btn => {
    btn.addEventListener('click', function() {
      const requestId = this.getAttribute('data-request-id');
      approveRequest(requestId);
    });
  });
  
  document.querySelectorAll('.reject-request').forEach(btn => {
    btn.addEventListener('click', function() {
      const requestId = this.getAttribute('data-request-id');
      rejectRequest(requestId);
    });
  });
  
  document.querySelectorAll('#approval-tasks-list .view-request').forEach(btn => {
    btn.addEventListener('click', function() {
      const requestId = this.getAttribute('data-request-id');
      displayRequestDetails(requestId);
    });
  });
}