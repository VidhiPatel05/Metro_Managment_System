const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Basic route
app.get('/', (req, res) => {
    res.send('Pune Metro Backend is running!');
});

// Define Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const db = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test the database connection
        const connection = await db.getConnection();
        console.log('Successfully connected to the database.');
        connection.release(); // Release the connection back to the pool

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1); // Exit the process with an error
    }
};

startServer();
