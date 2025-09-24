require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const seedStations = async () => {
    try {
        console.log('🚉 Seeding all stations...');

        // Step 2: Fetch all existing stations
        const [stations] = await db.query('SELECT station_id, station_name, station_location, password FROM station');

        for (const station of stations) {
            const { station_id, password } = station;

            // Skip if password already looks like a bcrypt hash
            if (password.startsWith('$2b$')) {
                console.log(`⏭️ Skipping station ${station_id}, already hashed`);
                continue;
            }

            // Generate hash
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Update the DB
            await db.query(
                'UPDATE station SET password = ? WHERE station_id = ?',
                [hashedPassword, station_id]
            );

            console.log(`🔑 Updated station ${station_id} with hashed password`);
        }

        console.log('🎉 Successfully hashed all station passwords!');

    } catch (error) {
        console.error('❌ Error seeding the database:', error);
    } finally {
        db.end();
    }
};

seedStations();
