// Toggle booking panel visibility
const toggleBtn = document.getElementById('toggle-booking');
const bookingPanel = document.getElementById('booking-panel');
const paymentModal = document.getElementById('payment-modal');
const ticketModal = document.getElementById('ticket-modal');
const closeModalButtons = document.querySelectorAll('.close');
const printTicketBtn = document.getElementById('print-ticket');
const confirmPaymentBtn = document.getElementById('confirm-payment');
const cancelPaymentBtn = document.getElementById('cancel-payment');
const qrSection = document.getElementById('qr-section');
const physicalPaymentOption = document.getElementById('physical-payment');
const onlinePaymentOption = document.getElementById('online-payment');

// Sample tickets data
let tickets = [
  {
    id: 1,
    from: "Station A",
    to: "Station B",
    date: "2025-09-18",
    status: "unpaid"
  }
];

// Track current ticket being processed
let currentTicketId = null;
let selectedPaymentMethod = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  renderTickets();
  setMinDate();
  
  // Hide booking panel initially
  bookingPanel.style.display = 'none';
  
  // Event listeners
  toggleBtn.addEventListener('click', toggleBookingPanel);
  
  closeModalButtons.forEach(button => {
    button.addEventListener('click', function() {
      paymentModal.style.display = 'none';
      ticketModal.style.display = 'none';
    });
  });
  
  window.addEventListener('click', function(event) {
    if (event.target === paymentModal || event.target === ticketModal) {
      paymentModal.style.display = 'none';
      ticketModal.style.display = 'none';
    }
  });
  
  // Form submission
  document.getElementById('book-ticket-form').addEventListener('submit', function(e) {
    e.preventDefault();
    createNewTicket();
  });
  
  // Payment options selection
  physicalPaymentOption.addEventListener('click', function() {
    selectPayment('physical');
  });
  
  onlinePaymentOption.addEventListener('click', function() {
    selectPayment('online');
  });
  
  // Payment actions
  confirmPaymentBtn.addEventListener('click', completePayment);
  cancelPaymentBtn.addEventListener('click', function() {
    paymentModal.style.display = 'none';
  });
  
  // Print ticket
  printTicketBtn.addEventListener('click', printTicket);
});

// Set minimum date as today
function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1;
  let dd = today.getDate();
  
  if (mm < 10) mm = '0' + mm;
  if (dd < 10) dd = '0' + dd;
  
  const formattedToday = `${yyyy}-${mm}-${dd}`;
  document.getElementById('ticket_date').setAttribute('min', formattedToday);
}

// Toggle booking panel
function toggleBookingPanel() {
  bookingPanel.style.display = bookingPanel.style.display === 'block' ? 'none' : 'block';
}

// Render tickets to the table
function renderTickets() {
  const ticketList = document.getElementById('ticket-list');
  ticketList.innerHTML = '';
  
  tickets.forEach(ticket => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${ticket.id}</td>
      <td>${ticket.from}</td>
      <td>${ticket.to}</td>
      <td>${formatDate(ticket.date)}</td>
      <td><span class="status ${ticket.status}">${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</span></td>
      <td>
        ${ticket.status === 'unpaid' ? 
          `<button class="action-btn pay" onclick="showPaymentOptions(${ticket.id})">Pay Now</button>` : 
          `<button class="action-btn view" onclick="viewTicket(${ticket.id})">View Ticket</button>`
        }
        <button class="action-btn delete" onclick="removeTicket(${ticket.id})">Remove</button>
      </td>
    `;
    
    ticketList.appendChild(row);
  });
}

// Format date for display
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Create a new ticket
function createNewTicket() {
  const fromStation = document.getElementById('from_station');
  const toStation = document.getElementById('to_station');
  const date = document.getElementById('ticket_date');
  
  // Generate a new ID
  const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;
  
  // Create new ticket object
  const newTicket = {
    id: newId,
    from: fromStation.value,
    to: toStation.value,
    date: date.value,
    status: 'unpaid'
  };
  
  // Add to tickets array
  tickets.push(newTicket);
  
  // Re-render tickets
  renderTickets();
  
  // Reset form and hide panel
  document.getElementById('book-ticket-form').reset();
  bookingPanel.style.display = 'none';
  
  // Show payment options for the new ticket
  showPaymentOptions(newId);
}

// Show payment options modal
function showPaymentOptions(ticketId) {
  currentTicketId = ticketId;
  selectedPaymentMethod = null;
  
  // Reset UI state
  document.getElementById('payment-ticket-id').textContent = ticketId;
  document.querySelectorAll('.payment-option').forEach(option => {
    option.classList.remove('selected');
  });
  qrSection.style.display = 'none';
  confirmPaymentBtn.disabled = true;
  
  // Show modal
  paymentModal.style.display = 'block';
}

// Select payment method
function selectPayment(method) {
  selectedPaymentMethod = method;
  
  // Update UI
  document.querySelectorAll('.payment-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  if (method === 'physical') {
    document.querySelector('.payment-option.physical').classList.add('selected');
    qrSection.style.display = 'none';
  } else {
    document.querySelector('.payment-option.online').classList.add('selected');
    qrSection.style.display = 'block';
  }
  
  confirmPaymentBtn.disabled = false;
}

// Complete payment process
function completePayment() {
  if (!selectedPaymentMethod || !currentTicketId) return;
  
  const ticket = tickets.find(t => t.id === currentTicketId);
  if (ticket) {
    ticket.status = 'paid';
    renderTickets();
    
    // Close payment modal and show ticket
    paymentModal.style.display = 'none';
    viewTicket(currentTicketId);
    
    if (selectedPaymentMethod === 'physical') {
      alert(`Payment recorded for Ticket #${currentTicketId}. Customer paid at counter.`);
    } else {
      alert(`Payment recorded for Ticket #${currentTicketId}. Customer paid online.`);
    }
  }
}

// View ticket
function viewTicket(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  
  const ticketPreview = document.getElementById('ticket-preview');
  
  ticketPreview.innerHTML = `
    <div class="ticket-header">
      <h3>Travel Ticket</h3>
      <p>Ticket #${ticket.id}</p>
    </div>
    <div class="ticket-details">
      <div class="ticket-detail">
        <span class="ticket-label">From</span>
        <span class="ticket-value">${ticket.from}</span>
      </div>
      <div class="ticket-detail">
        <span class="ticket-label">To</span>
        <span class="ticket-value">${ticket.to}</span>
      </div>
      <div class="ticket-detail">
        <span class="ticket-label">Date</span>
        <span class="ticket-value">${formatDate(ticket.date)}</span>
      </div>
      <div class="ticket-detail">
        <span class="ticket-label">Status</span>
        <span class="ticket-value" style="color: ${ticket.status === 'paid' ? '#28a745' : '#d9534f'}">
          ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </span>
      </div>
    </div>
    <div class="ticket-footer">
      <p>Thank you for traveling with us!</p>
    </div>
  `;
  
  ticketModal.style.display = 'block';
}

// Print ticket
function printTicket() {
  const printContent = document.getElementById('ticket-preview').innerHTML;
  const originalContent = document.body.innerHTML;
  
  document.body.innerHTML = printContent;
  window.print();
  document.body.innerHTML = originalContent;
  
  // Re-render tickets after printing
  renderTickets();
}

// Remove ticket
function removeTicket(ticketId) {
  if (confirm('Are you sure you want to remove this ticket?')) {
    tickets = tickets.filter(t => t.id !== ticketId);
    renderTickets();
  }
}
