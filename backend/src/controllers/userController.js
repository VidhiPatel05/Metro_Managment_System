const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay'); // Added Razorpay import
const crypto = require('crypto'); // Added crypto import

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.registerUser = async (req, res) => {
    const { full_name, email, password, phone_number } = req.body;

    // Basic validation
    if (!full_name || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ msg: 'User with this email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user to database
        const newUser = {
            full_name,
            email,
            password: hashedPassword
        };

        const [result] = await db.query('INSERT INTO users SET ?', newUser);
        const userId = result.insertId;

        // Create JWT Payload
        const payload = {
            user: {
                id: userId,
                name: full_name
            }
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 }, // Expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }

    try {
        // Check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Create JWT Payload
        const payload = {
            user: {
                id: user.user_id,
                name: user.full_name
            }
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 }, // Expires in 1 hour
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getStations = async (req, res) => {
    try {
        const [stations] = await db.query('SELECT station_id, station_name FROM station');
        res.json(stations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.bookTicket = async (req, res) => {
    const { fromStation, toStation, travelDate, travelTime } = req.body;
    const userId = req.user.id; // Assuming user ID is available from JWT token

    // Basic validation
    if (!fromStation || !toStation || !travelDate || !travelTime) {
        return res.status(400).json({ msg: 'Please provide all required booking details' });
    }

    try {
        // Get station IDs from station names
        const [fromStationResult] = await db.query('SELECT station_id FROM station WHERE station_name = ?', [fromStation]);
        const [toStationResult] = await db.query('SELECT station_id FROM station WHERE station_name = ?', [toStation]);

        if (fromStationResult.length === 0 || toStationResult.length === 0) {
            return res.status(400).json({ msg: 'Invalid station name(s) provided' });
        }

        const fromStationId = fromStationResult[0].station_id;
        const toStationId = toStationResult[0].station_id;

        // --- Fare Calculation (Placeholder for now) ---
        // In a real application, you would calculate fare based on distance, line, etc.
        const ticketAmount = 50; // Example fixed fare

        // Save booking to database (ticket table)
        const newTicket = {
            user_id: userId,
            from_station_id: fromStationId,
            to_station_id: toStationId,
            ticket_date: travelDate,
            issued_time: travelTime,
            // payment_id will be added after successful payment
        };

        const [result] = await db.query('INSERT INTO ticket SET ?', newTicket);
        const ticketId = result.insertId;

        console.log(`Booked ticket with ID: ${ticketId}, Amount: ${ticketAmount}`);

        res.status(201).json({
            msg: 'Ticket booked successfully',
            ticketId,
            ticketAmount,
            fromStation,
            toStation,
            travelDate,
            travelTime
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createOrder = async (req, res) => {
    const { ticketAmount, ticketId } = req.body; // ticketId from our database
    console.log(`Received request for createOrder: ticketAmount=${ticketAmount}, ticketId=${ticketId}`);

    try {
        // Validate ticketAmount and ticketId
        if (isNaN(ticketAmount) || ticketAmount <= 0) {
            console.error(`Invalid ticketAmount received: ${ticketAmount}`);
            return res.status(400).json({ msg: 'Invalid ticket amount' });
        }
        if (isNaN(ticketId)) {
            console.error(`Invalid ticketId received: ${ticketId}`);
            return res.status(400).json({ msg: 'Invalid ticket ID' });
        }

        const options = {
            amount: ticketAmount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_ticket_${ticketId}`,
            payment_capture: 1 // auto capture
        };
        console.log("Razorpay order options:", options);

        const order = await razorpay.orders.create(options);
        console.log("Razorpay order created successfully:", order);
        res.json(order);
    } catch (err) {
        console.error("Error in createOrder:", err.message);
        res.status(500).send('Server Error');
    }
};

exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ticketId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                    .update(body.toString())
                                    .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        try {
            // Update ticket_payment table
            const [paymentResult] = await db.query(
                'INSERT INTO ticket_payment (ticket_amount, payment_status, razorpay_order_id, razorpay_payment_id, razorpay_signature) VALUES (?, ?, ?, ?, ?)',
                [req.body.ticketAmount, 'success', razorpay_order_id, razorpay_payment_id, razorpay_signature]
            );
            const paymentId = paymentResult.insertId;

            // Update the ticket table with payment_id
            await db.query(
                'UPDATE ticket SET payment_id = ? WHERE ticket_id = ?',
                [paymentId, ticketId]
            );

            res.json({ msg: 'Payment successful and verified' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    } else {
        res.status(400).json({ msg: 'Payment verification failed' });
    }
};

exports.getTickets = async (req, res) => {
    const userId = req.user.id; // User ID from auth middleware

    try {
        const [tickets] = await db.query(
            `SELECT 
                t.ticket_id,
                t.ticket_date,
                t.issued_time,
                tp.ticket_amount,
                tp.payment_status,
                fs.station_name AS from_station_name,
                ts.station_name AS to_station_name
            FROM 
                ticket t
            JOIN 
                users u ON t.user_id = u.user_id
            JOIN 
                station fs ON t.from_station_id = fs.station_id
            JOIN 
                station ts ON t.to_station_id = ts.station_id
            LEFT JOIN
                ticket_payment tp ON t.payment_id = tp.payment_id
            WHERE 
                t.user_id = ? AND (CONCAT(t.ticket_date, ' ', t.issued_time) + INTERVAL 24 HOUR) > NOW() ORDER BY t.ticket_date DESC, t.issued_time DESC`,
            [userId]
        );
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};