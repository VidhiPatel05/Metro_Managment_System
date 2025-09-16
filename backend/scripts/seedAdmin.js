require('dotenv').config({ path: '.env' });
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const seedStation = async () => {
    try {
        console.log('Seeding admin station...');

        const stationId = 101;
        const stationName = 'Pune Central';
        const plainPassword = 'pune_metro_123';

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        // SQL to insert the station
        const sql = 'INSERT INTO station (station_id, station_name, station_location, password) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE station_name = ?, password = ?';
        const values = [stationId, stationName, 'Pune City', hashedPassword, stationName, hashedPassword];

        // Execute the query
        await db.query(sql, values);

        console.log(`Successfully seeded station with ID: ${stationId}`);
        console.log(`Login with Station ID: ${stationId} and Password: ${plainPassword}`);

    } catch (error) {
        console.error('Error seeding the database:', error);
    } finally {
        // Close the database connection
        db.end();
    }
};

seedStation();
