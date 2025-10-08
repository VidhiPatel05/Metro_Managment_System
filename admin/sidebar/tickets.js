const API_BASE = 'http://localhost:3000/api';

let selectedPaymentId = null;
let selectedTicketId = null;

async function loadStations() {
  try {
    const res = await fetch(`${API_BASE}/tickets/stations`);
    const stations = await res.json();

    const fromSelect = document.getElementById('from-station');
    const toSelect = document.getElementById('to-station');

    fromSelect.innerHTML = '<option value="" selected>Select From Station</option>';
    toSelect.innerHTML = '<option value="" selected>Select To Station</option>';

    stations.forEach((name) => {
      const opt1 = document.createElement('option');
      opt1.value = name;
      opt1.textContent = name;
      fromSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = name;
      opt2.textContent = name;
      toSelect.appendChild(opt2);
    });
  } catch (err) {
    console.error('Failed to load stations:', err);
  }
}

async function loadTickets() {
  try {
    const res = await fetch(`${API_BASE}/tickets`);
    const tickets = await res.json();

    const visibleTickets = Array.isArray(tickets) ? tickets.filter(t => !(t.status && t.status.toLowerCase() === 'paid')) : [];

    const tbody = document.getElementById('ticket-list');
    tbody.innerHTML = '';

    visibleTickets.forEach((t) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.ticket_id}</td>
        <td>${t.from_station}</td>
        <td>${t.to_station}</td>
        <td>${new Date(t.ticket_date).toLocaleDateString()}</td>
        <td>${t.status}</td>
        <td>
          <button class="action-btn pay" data-action="pay" data-payment-id="${t.payment_id}" data-ticket-id="${t.ticket_id}" ${t.status === 'paid' ? 'disabled' : ''}>Pay</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="pay"]');
      if (!btn) return;
      selectedPaymentId = btn.getAttribute('data-payment-id');
      selectedTicketId = btn.getAttribute('data-ticket-id');
      openPaymentModal(selectedTicketId);
    });
  } catch (err) {
    console.error('Failed to load tickets:', err);
  }
}


function openPaymentModal(ticketId) {
  const modal = document.getElementById('payment-modal');
  const ticketSpan = document.getElementById('payment-ticket-id');
  const qrSection = document.getElementById('qr-section');
  const confirmBtn = document.getElementById('confirm-payment');
  ticketSpan.textContent = ticketId;
  qrSection.style.display = 'none';
  confirmBtn.disabled = true;
  modal.style.display = 'block';
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'none';
  selectedPaymentId = null;
  selectedTicketId = null;
}

function wirePaymentModal() {
  const modal = document.getElementById('payment-modal');
  const closeBtn = modal.querySelector('.close');
  const physical = document.getElementById('physical-payment');
  const online = document.getElementById('online-payment');
  const qrSection = document.getElementById('qr-section');
  const confirmBtn = document.getElementById('confirm-payment');
  const cancelBtn = document.getElementById('cancel-payment');

  physical.addEventListener('click', () => {
    qrSection.style.display = 'none';
    confirmBtn.disabled = false;
  });

  online.addEventListener('click', () => {
    qrSection.style.display = 'block';
    confirmBtn.disabled = false;
  });

  confirmBtn.addEventListener('click', async () => {
    if (!selectedPaymentId) return;
    try {
      const res = await fetch(`${API_BASE}/tickets/${selectedPaymentId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ msg: 'Payment failed' }));
        alert(data.msg || 'Payment failed');
        return;
      }
      closePaymentModal();
      loadTickets();
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment error');
    }
  });

  cancelBtn.addEventListener('click', closePaymentModal);
  closeBtn.addEventListener('click', closePaymentModal);

  window.addEventListener('click', (e) => {
    if (e.target === modal) closePaymentModal();
  });
}

function wireBookingForm() {
  const form = document.getElementById('book-ticket-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from_station = document.getElementById('from-station').value;
    const to_station = document.getElementById('to-station').value;
    const ticket_date = document.getElementById('ticket_date').value;

    if (!from_station || !to_station || !ticket_date) {
      alert('Please fill all fields');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_station, to_station, ticket_date })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || 'Failed to book ticket');
        return;
      }

      // Show preview modal
      const ticketModal = document.getElementById('ticket-modal');
      const preview = document.getElementById('ticket-preview');
      preview.innerHTML = `
        <div>
          <p><strong>Ticket ID:</strong> ${data.ticket.id}</p>
          <p><strong>From:</strong> ${data.ticket.from}</p>
          <p><strong>To:</strong> ${data.ticket.to}</p>
          <p><strong>Date:</strong> ${data.ticket.date}</p>
          <p><strong>Status:</strong> ${data.ticket.status}</p>
          <p><strong>Amount:</strong> ₹${data.ticket.amount}</p>
        </div>
      `;
      ticketModal.style.display = 'block';

      document.getElementById('print-ticket').onclick = () => window.print();
      ticketModal.querySelector('.close').onclick = () => {
        ticketModal.style.display = 'none';
      };

      form.reset();
      loadTickets();
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking error');
    }
  });
}

function wireToggleBookingPanel() {
  const toggleBtn = document.getElementById('toggle-booking');
  const panel = document.getElementById('booking-panel');
  toggleBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' || panel.style.display === '' ? 'block' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadStations();
  loadTickets();
  wirePaymentModal();
  wireBookingForm();
  wireToggleBookingPanel();
});
