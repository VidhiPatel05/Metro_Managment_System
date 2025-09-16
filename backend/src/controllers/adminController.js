const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.loginAdmin = async (req, res) => {
    const { station_id, password } = req.body;

    // Basic validation
    if (!station_id || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check for existing station
        const [rows] = await db.query('SELECT * FROM station WHERE station_id = ?', [station_id]);

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Station not found' });
        }

        const station = rows[0];

        // Validate password
        const isMatch = await bcrypt.compare(password, station.password);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        // Create JWT Payload
        const payload = {
            station: {
                id: station.station_id,
                name: station.station_name
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
