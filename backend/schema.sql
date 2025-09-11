-- For Admin/Station login
CREATE TABLE station (
    station_id INT PRIMARY KEY AUTO_INCREMENT,
    station_name VARCHAR(50) NOT NULL,
    station_location VARCHAR(100),
    password VARCHAR(255) NOT NULL -- ADDED: For station-specific admin login (will be hashed)
);

-- For User accounts
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Will be hashed
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- For Razorpay integration
CREATE TABLE ticket_payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    razorpay_order_id VARCHAR(255),   -- ADDED
    razorpay_payment_id VARCHAR(255), -- ADDED
    razorpay_signature VARCHAR(255)   -- ADDED
);

-- Linking tickets to users
CREATE TABLE ticket (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT, -- ADDED
    payment_id INT, -- RENAMED from transaction_id
    from_station_id INT,
    to_station_id INT,
    ticket_date DATE NOT NULL,
    issued_time TIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (payment_id) REFERENCES ticket_payment(payment_id),
    FOREIGN KEY (from_station_id) REFERENCES station(station_id),
    FOREIGN KEY (to_station_id) REFERENCES station(station_id)
);

-- No changes needed for these tables yet
CREATE TABLE metro_line (
    line_id INT PRIMARY KEY AUTO_INCREMENT,
    line_color VARCHAR(50) NOT NULL
);

CREATE TABLE line_stations (
    line_id INT,
    station_id INT,
    station_order INT, -- Defines the sequence of stations on a line
    PRIMARY KEY (line_id, station_id),
    FOREIGN KEY (line_id) REFERENCES metro_line(line_id),
    FOREIGN KEY (station_id) REFERENCES station(station_id)
);

CREATE TABLE metro_schedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    line_id INT,
    station_id INT,
    arrival_time TIME,
    departure_time TIME,
    FOREIGN KEY (line_id) REFERENCES metro_line(line_id),
    FOREIGN KEY (station_id) REFERENCES station(station_id)
);
