const db = require('../config/db');

// Helper to get station ID from name
async function getStationId(stationName) {
  const [rows] = await db.query('SELECT station_id FROM station WHERE station_name = ?', [stationName]);
  if (rows.length === 0) throw new Error(`Station not found: ${stationName}`);
  return rows[0].station_id;
}

// Book a new ticket
exports.bookTicket = async (req, res) => {
  try {
    const { from_station, to_station, ticket_date } = req.body;
    const user_id = req.user?.id || 1; // assuming logged-in user ID, fallback to 1

    if (!from_station || !to_station || !ticket_date) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    // Get station IDs
    const from_station_id = await getStationId(from_station);
    const to_station_id = await getStationId(to_station);

    // Insert payment record first (default unpaid)
    const [paymentResult] = await db.query(
      'INSERT INTO ticket_payment (ticket_amount, payment_status) VALUES (?, ?)',
      [50.0, 'pending'] // set default amount
    );
    const payment_id = paymentResult.insertId;

    // Insert ticket
    const [ticketResult] = await db.query(
      `INSERT INTO ticket (user_id, payment_id, from_station_id, to_station_id, ticket_date, issued_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        payment_id,
        from_station_id,
        to_station_id,
        ticket_date,
        new Date().toISOString().substring(11, 19) // HH:MM:SS
      ]
    );

    res.status(201).json({
      msg: 'Ticket booked successfully',
      ticket: {
        id: ticketResult.insertId,
        from: from_station,
        to: to_station,
        date: ticket_date,
        status: 'pending',
        amount: 50.0
      }
    });

  } catch (error) {
    console.error('Error booking ticket:', error);
    res.status(500).json({ msg: error.message || 'Server error' });
  }
};

// Fetch all tickets
exports.getTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.ticket_id, s1.station_name AS from_station, s2.station_name AS to_station,
              t.ticket_date, p.payment_status AS status, p.payment_id AS payment_id
       FROM ticket t
       JOIN station s1 ON t.from_station_id = s1.station_id
       JOIN station s2 ON t.to_station_id = s2.station_id
       JOIN ticket_payment p ON t.payment_id = p.payment_id`
    );
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update payment status
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expect "paid" or "pending"

    await db.query('UPDATE ticket_payment SET payment_status = ? WHERE payment_id = ?', [status, id]);

    res.json({ msg: 'Payment status updated' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};


exports.getStations = async (req, res) => {
    try {
      const [stations] = await db.query('SELECT station_name FROM station');
      res.json(stations.map(s => s.station_name)); // send array of names
    } catch (err) {
      console.error('Error fetching stations:', err.message);
      res.status(500).json({ msg: 'Server error' });
    }
  };
  