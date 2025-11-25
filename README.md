# Metro Management System

A full-stack Metro ticketing and management project with a Node.js/Express backend (MySQL) and a React frontend. It supports user registration/login (JWT), station and line management (admin), ticket booking, and Razorpay payment integration.

## Tech Stack
- **Backend**: Node.js, Express, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`, `nodemon`
- **Payments**: Razorpay (orders + signature verification)
- **Frontend**: React (Create React App), Tailwind CSS (configured), Web Vitals, Testing Library

## Repository Structure
```
dbms_project/
├─ backend/
│  ├─ package.json
│  ├─ .env.example
│  ├─ schema.sql
│  └─ src/
│     ├─ index.js
│     ├─ config/
│     │  └─ db.js
│     ├─ middleware/
│     │  └─ auth.js        (JWT middleware expected; referenced by routes)
│     ├─ controllers/
│     │  ├─ userController.js
│     │  └─ adminController.js
│     └─ routes/
│        ├─ userRoutes.js
│        ├─ adminRoutes.js
│        └─ ticketRoutes.js (routes present; controller may be optional/unused)
├─ frontend/
│  ├─ package.json
│  └─ src/ ...
├─ user/ ... (static HTML/CSS screens)
├─ admin/ ... (static HTML/CSS screens)
└─ README.md
```

## Prerequisites
- Node.js 18+
- MySQL 8+
- Razorpay account for API keys (for payment flows)

## Backend Setup (`backend/`)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in values:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=metro_db
     RAZORPAY_KEY_ID=your_razorpay_key_id
     RAZORPAY_KEY_SECRET=your_razorpay_key_secret
     QR_IMAGE_PATH=path_for_the_qr
     JWT_SECRET=your_jwt_secret_key
     ```
3. Initialize database schema:
   - Create database `metro_db` (or the name you configured).
   - Import `backend/schema.sql` into the database.
4. Start the server:
   ```bash
   npm start
   ```
   The server runs by default on `http://localhost:3000`.

### Backend Key Files
- `backend/src/index.js`: Express app entry, mounts routes at `/api/admin`, `/api/users`, `/api/tickets`. Loads env from `backend/.env` and verifies DB connection.
- `backend/src/config/db.js`: MySQL connection pool using env vars.
- `backend/src/controllers/userController.js`: Handles user register/login, stations, ticket booking, Razorpay order creation, payment verification, user tickets/history/stats, and profile.
- `backend/src/controllers/adminController.js`: Station admin login (JWT), manage lines and stations.
- `backend/src/routes/*.js`: Route definitions, e.g., `userRoutes.js` uses JWT auth middleware for protected endpoints.

## Frontend Setup (`frontend/`)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm start
   ```
   React dev server runs on `http://localhost:3000` unless port is taken (CRA may prompt for another port). Configure API base URLs as needed.

## Authentication
- JWT tokens are issued on successful login/registration.
- For protected endpoints, send header:
  ```http
  Authorization: Bearer <token>
  ```

## Payments (Razorpay)
- `userController.createOrder` creates an order with Razorpay for the ticket amount.
- `userController.verifyPayment` verifies Razorpay signature using `RAZORPAY_KEY_SECRET`, records a row in `ticket_payment`, and updates the `ticket.payment_id`.
- Ensure your Razorpay keys in `.env` match your account and that your server can receive the verification request.

## API Overview
Base URL: `http://localhost:<PORT>` (default 3000)

### Users (`/api/users`)
- `POST /register` — Register user. Body: `{ full_name, email, password, phone_number? }`. Returns JWT.
- `POST /login` — Login with `{ email, password }`. Returns JWT.
- `GET /stations` — Public list of stations.
- `POST /book-ticket` — Protected. Body: `{ fromStation, toStation, travelDate, travelTime }`. Creates a ticket; returns `ticketId` and `ticketAmount`.
- `POST /create-order` — Protected. Body: `{ ticketAmount, ticketId }`. Creates Razorpay order; returns order object.
- `POST /verify-payment` — Protected. Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, ticketId, ticketAmount }`. Verifies and records payment.
- `GET /my-tickets` — Protected. Upcoming/active tickets within next 24 hours.
- `GET /travel-history` — Protected. Completed trips.
- `GET /travel-stats` — Protected. Aggregated stats `{ activeTicketsCount, totalTrips, totalSpentThisMonth }`.
- `GET /profile` — Protected. Returns `{ user_id, full_name, email }`.

### Admin (`/api/admin`)
- `POST /login` — Station admin login. Body: `{ station_id, password }`. Returns JWT.
- `GET /lines` — List metro lines with start/end stations.
- `POST /lines` — Create a new line. Body: `{ color, start_station, end_station, line_name? }`.
- `GET /stations` — List stations with optional associated line info.
- `POST /stations` — Create station and attach to a line. Body: `{ station_name, password, station_location, line_id }`.

### Tickets (`/api/tickets`)
Routes exist (`ticketRoutes.js`), but booking/payment flows are primarily implemented under `/api/users`. Use `/api/users/*` for core ticketing.

## Database Schema
See `backend/schema.sql` for tables:
- `users`, `station`, `metro_line`, `line_stations`, `metro_schedule`
- Ticketing and payments: `ticket`, `ticket_payment`

## Running End-to-End
1. Start MySQL and import schema.
2. Configure `backend/.env` and start backend.
3. Start React app in `frontend/` or use static HTML pages in `user/` and `admin/` for quick UI checks.
4. Register user, fetch stations, book ticket, create Razorpay order, complete payment, verify payment, then check `my-tickets`.

## Notes & Tips
- Ensure time zones between app server and MySQL are consistent; `getTickets` and `getTravelHistory` compare with `NOW()` and a 24-hour window.
- Keep `JWT_SECRET` safe; never commit `.env`.
- If using static HTML in `user/` or `admin/`, configure API base URLs to point to the backend server.
