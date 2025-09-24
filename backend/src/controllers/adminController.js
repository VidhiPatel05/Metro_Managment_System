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

// Get metro lines with start and end stations
exports.getLines = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                ml.line_id,
                CONCAT('Line ', ml.line_id) AS line_name,
                ml.line_color,
                s_start.station_name AS start_station,
                s_end.station_name AS end_station
            FROM metro_line ml
            LEFT JOIN line_stations ls_start 
                ON ls_start.line_id = ml.line_id 
               AND ls_start.station_order = (
                   SELECT MIN(station_order) FROM line_stations WHERE line_id = ml.line_id
               )
            LEFT JOIN line_stations ls_end 
                ON ls_end.line_id = ml.line_id 
               AND ls_end.station_order = (
                   SELECT MAX(station_order) FROM line_stations WHERE line_id = ml.line_id
               )
            LEFT JOIN station s_start ON s_start.station_id = ls_start.station_id
            LEFT JOIN station s_end ON s_end.station_id = ls_end.station_id
            ORDER BY ml.line_id ASC;
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching lines:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Add a new metro line (with start and end stations)
exports.addLine = async (req, res) => {
    const { line_name, color, start_station, end_station } = req.body;
    if (!color || !start_station || !end_station) {
        return res.status(400).json({ msg: 'color, start_station, end_station are required' });
    }
    try {
        // Resolve station IDs by name
        const [startRows] = await db.query('SELECT station_id FROM station WHERE station_name = ?', [start_station]);
        const [endRows] = await db.query('SELECT station_id FROM station WHERE station_name = ?', [end_station]);
        const startRow = startRows && startRows[0];
        const endRow = endRows && endRows[0];
        if (!startRow || !endRow) {
            return res.status(404).json({ msg: 'Start or end station not found' });
        }

        // Create line
        const [lineResult] = await db.query('INSERT INTO metro_line (line_color) VALUES (?)', [color]);
        const line_id = lineResult.insertId;

        // Add start and end stations with basic ordering
        await db.query('INSERT INTO line_stations (line_id, station_id, station_order) VALUES (?, ?, ?)', [line_id, startRow.station_id, 1]);
        await db.query('INSERT INTO line_stations (line_id, station_id, station_order) VALUES (?, ?, ?)', [line_id, endRow.station_id, 2]);

        res.status(201).json({
            msg: 'Line created successfully',
            line: {
                line_id,
                line_name: line_name || `Line ${line_id}`,
                line_color: color,
                start_station,
                end_station
            }
        });
    } catch (err) {
        console.error('Error creating line:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get stations with one associated line (if any)
exports.getStations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.station_id,
                s.station_name,
                s.station_location,
                ml.line_id,
                ml.line_color
            FROM station s
            LEFT JOIN (
                SELECT ls.station_id, MIN(ls.line_id) AS line_id
                FROM line_stations ls
                GROUP BY ls.station_id
            ) ls_min ON ls_min.station_id = s.station_id
            LEFT JOIN metro_line ml ON ml.line_id = ls_min.line_id
            ORDER BY s.station_id ASC;
        `);
        const mapped = rows.map(r => ({
            station_id: r.station_id,
            station_name: r.station_name,
            station_location: r.station_location,
            line_id: r.line_id || null,
            line_name: r.line_id ? `Line ${r.line_id}` : null,
            line_color: r.line_color || null
        }));
        res.json(mapped);
    } catch (err) {
        console.error('Error fetching stations:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Add a new station and attach to a line
exports.addStation = async (req, res) => {
    const { station_name, password, line_id, station_location } = req.body;
    if (!station_name || !password || !station_location || !line_id) {
        return res.status(400).json({ msg: 'station_name, password, station_location, line_id are required' });
    }
    try {
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        // create station
        const [result] = await db.query(
            'INSERT INTO station (station_name, station_location, password) VALUES (?, ?, ?)',
            [station_name, station_location, hashed]
        );
        const station_id = result.insertId;

        // find next station_order for the line
        const [orderRows] = await db.query(
            'SELECT COALESCE(MAX(station_order), 0) + 1 AS next_order FROM line_stations WHERE line_id = ?',
            [parseInt(line_id, 10)]
        );
        const nextOrder = orderRows && orderRows[0] ? orderRows[0].next_order : 1;

        // attach to line
        await db.query(
            'INSERT INTO line_stations (line_id, station_id, station_order) VALUES (?, ?, ?)',
            [parseInt(line_id, 10), station_id, nextOrder]
        );

        res.status(201).json({
            msg: 'Station created successfully',
            station: {
                station_id,
                station_name,
                station_location,
                line_id
            }
        });
    } catch (err) {
        console.error('Error creating station:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

