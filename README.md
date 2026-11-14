# TrekGear Hub - Trekking Tent Rental Management System

A clean, beginner-friendly, production-ready backend REST API for **TrekGear Hub**, built with **Node.js**, **Express.js**, and **SQLite**. This system allows an outdoor gear rental company to manage tents, customers (trekkers), rentals, and tent availability without double-booking.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Database Schema](#database-schema)
5. [Installation & Setup](#installation--setup)
6. [Running the Application](#running-the-application)
7. [Running the Automated Tests](#running-the-automated-tests)
8. [API Endpoints & Documentation](#api-endpoints--documentation)
9. [Special Twist Rules & Test Scenarios](#special-twist-rules--test-scenarios)
10. [Postman Setup & Collection Testing](#postman-setup--collection-testing)
11. [College Assignment Submission Checklist](#college-assignment-submission-checklist)

---

## 1. Project Overview

TrekGear Hub is designed strictly as a backend service (no frontend, HTML, or CSS). It solves key outdoor rental challenges:
- Tracking tents, sizes, and operational statuses (`available`, `maintenance`, `retired`).
- Storing customer (trekker) details.
- Booking rentals with date validation and conflict detection to prevent double-booking.
- Checking tent availability on any given date with inclusive rental date ranges.

---

## 2. Technology Stack

- **Runtime:** Node.js (v18+)
- **Web Framework:** Express.js (v4)
- **Database:** SQLite3 with relational foreign keys enabled (`PRAGMA foreign_keys = ON;`)
- **SQL Queries:** Safe parameterized queries (`?` placeholders) to prevent SQL injection
- **API Testing:** Postman & Node.js Native Test Runner with Supertest

---

## 3. Folder Structure

```
TREKGEAR HUB/
├── database/
│   ├── db.js                            # SQLite connection setup & Promise-based helpers (runAsync, allAsync, getAsync)
│   └── init.js                          # Schema creation (CREATE TABLE) and sample data seeder
├── controllers/
│   ├── tentController.js                # Tents CRUD, search filter, validation, and availability check
│   ├── trekkerController.js             # Customer/trekker creation and retrieval
│   └── rentalController.js              # Rental creation, date validation, conflict prevention, and JOIN queries
├── routes/
│   ├── tentRoutes.js                    # Tent routes (/tents, /tents/available, /tents/:id)
│   ├── trekkerRoutes.js                 # Trekker routes (/trekkers, /trekkers/:id)
│   └── rentalRoutes.js                  # Rental routes (/rentals, /rentals/details, /rentals/:id)
├── tests/
│   └── api.test.js                      # Automated test suite covering CRUD, JOIN, validations, and twist cases
├── app.js                               # Express app configuration, middlewares, and error handlers
├── server.js                            # Server entry point that initializes DB and listens on PORT
├── package.json                         # Project metadata, dependencies, and NPM scripts
├── .gitignore                           # Git ignore rules (node_modules, *.db, logs)
├── README.md                            # Comprehensive beginner-friendly documentation
└── TrekGear_Hub.postman_collection.json # Complete Postman collection with tests & sample payloads
```

---

## 4. Database Schema

The database consists of **exactly three related tables**:

```
 ┌─────────────────┐         ┌────────────────────────┐         ┌─────────────────┐
 │    TREKKERS     │         │        RENTALS         │         │      TENTS      │
 ├─────────────────┤         ├────────────────────────┤         ├─────────────────┤
 │ trekker_id (PK) │◄───┐    │ rental_id (PK)         │    ┌───►│ tent_id (PK)    │
 │ name            │    └───┼│ trekker_id (FK)        │    │    │ name            │
 │ email (UNIQUE)  │         │ tent_id (FK)           ├────┘    │ size            │
 └─────────────────┘         │ start_date (YYYY-MM-DD)│         │ status          │
                             │ end_date (YYYY-MM-DD)  │         └─────────────────┘
                             └────────────────────────┘
```

### Table Definitions:

1. **`trekkers`**
   - `trekker_id` (INTEGER, Primary Key, Auto Increment) - Unique ID for each customer.
   - `name` (TEXT, Not Null) - Customer full name.
   - `email` (TEXT, Not Null, Unique) - Contact email address.

2. **`tents`**
   - `tent_id` (INTEGER, Primary Key, Auto Increment) - Unique ID for each tent.
   - `name` (TEXT, Not Null) - Brand/Model name of the tent.
   - `size` (INTEGER, Not Null) - Tent capacity (e.g. 1, 2, 4, 6 persons).
   - `status` (TEXT, Not Null, Default: `'available'`) - Tent status (`available`, `maintenance`, `retired`).

3. **`rentals`**
   - `rental_id` (INTEGER, Primary Key, Auto Increment) - Unique booking transaction ID.
   - `trekker_id` (INTEGER, Foreign Key referencing `trekkers(trekker_id)`) - Customer booking the tent.
   - `tent_id` (INTEGER, Foreign Key referencing `tents(tent_id)`) - Tent being rented.
   - `start_date` (TEXT, Not Null) - Starting date in `YYYY-MM-DD` format.
   - `end_date` (TEXT, Not Null) - Ending date in `YYYY-MM-DD` format.

---

## 5. Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed (version 18 or newer recommended).
- Git installed (optional, for version control).

### Step-by-Step Setup:
1. Open your terminal / command prompt.
2. Navigate to the project root directory:
   ```bash
   cd "d:\softwares\TREKGEAR HUB"
   ```
3. Install project dependencies:
   ```bash
   npm install
   ```
4. Initialize the SQLite database and seed initial test data:
   ```bash
   npm run init-db
   ```
   *(Note: The server will also automatically initialize and seed the database if it doesn't exist yet!)*

---

## 6. Running the Application

### Start the Server (Standard Mode)
```bash
npm start
```

### Start the Server in Development Mode (Auto-restarts on file changes)
```bash
npm run dev
```

The server will start on port `3000`:
```
====================================================
 TrekGear Hub Server is running!
 Base URL: http://localhost:3000
 Available Tents Endpoint: http://localhost:3000/tents/available?date=YYYY-MM-DD
 Rentals JOIN Endpoint:    http://localhost:3000/rentals
====================================================
```

---

## 7. Running the Automated Tests

An automated test suite (`tests/api.test.js`) is included. It tests all 28 requirements including CRUD operations, JOIN queries, input validation, and the 3 Special Twist tests.

Run tests using:
```bash
npm test
```

### Expected Output:
```
✔ GET /tents - should return a list of all tents with HTTP 200
✔ GET /tents?size=2 - should filter tents by size using query parameters
✔ GET /tents?search=Dome - should search tents by name substring
✔ GET /tents/:id - should return a single tent by valid ID
✔ GET /tents/:id - should return HTTP 404 for nonexistent tent ID
✔ GET /tents/:id - should return HTTP 400 for invalid non-integer ID
✔ POST /tents - should create a new tent with HTTP 201
✔ POST /tents - should return HTTP 400 when name is missing or invalid
✔ POST /tents - should return HTTP 400 when size is negative or zero
✔ POST /tents - should return HTTP 400 when status is invalid
✔ PUT /tents/:id - should update an existing tent with HTTP 200
✔ PUT /tents/:id - should return HTTP 404 when updating nonexistent tent
✔ DELETE /tents/:id - should prevent deletion of a tent with active/past rentals (HTTP 409)
✔ DELETE /tents/:id - should delete an unrented tent with HTTP 200
✔ GET /trekkers - should return all registered trekkers
✔ POST /trekkers - should create a new trekker with HTTP 201
✔ POST /trekkers - should reject duplicate email with HTTP 409
✔ POST /trekkers - should reject invalid email with HTTP 400
✔ GET /rentals - should return rental details with trekker name and tent name via JOIN
✔ GET /rentals/details - should return identical joined results via dedicated alias
✔ GET /rentals/:id - should return single rental with JOIN details
✔ POST /rentals - should prevent double-booking for the same tent with HTTP 409
✔ Test 1: Rental end date before start date returns HTTP 400
✔ Test 2: Tent 8 rented from Nov 10 to Nov 12 must NOT appear when checking Nov 11
✔ Test 3: The same Tent 8 MUST appear when checking Nov 13 (rental ended Nov 12)
✔ GET /tents/available - should return HTTP 400 when date parameter is missing
✔ GET /tents/available - should return HTTP 400 for invalid date format
✔ GET /tents/available - should return HTTP 400 for nonexistent calendar date

ℹ tests 28
ℹ pass 28
ℹ fail 0
```

---

## 8. API Endpoints & Documentation

### 1. Tents Endpoints (`/tents`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/tents` | Get all tents (supports `?size=`, `?status=`, `?search=`) | `200 OK` |
| `GET` | `/tents/available?date=YYYY-MM-DD` | Get tents available on a specific date (Special Twist) | `200 OK` / `400 Bad Request` |
| `GET` | `/tents/:id` | Get single tent by ID | `200 OK` / `404 Not Found` |
| `POST` | `/tents` | Create a new tent | `201 Created` / `400 Bad Request` |
| `PUT` | `/tents/:id` | Update an existing tent | `200 OK` / `400 Bad Request` / `404 Not Found` |
| `DELETE` | `/tents/:id` | Delete a tent (blocked if rented) | `200 OK` / `404 Not Found` / `409 Conflict` |

#### Sample Request: Search Tents by Size
```http
GET /tents?size=2 HTTP/1.1
Host: localhost:3000
```

#### Sample Request: Create a Tent
```http
POST /tents HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "name": "Summit Explorer 3P",
  "size": 3,
  "status": "available"
}
```
**Response (201 Created):**
```json
{
  "message": "Tent created successfully.",
  "tent": {
    "tent_id": 11,
    "name": "Summit Explorer 3P",
    "size": 3,
    "status": "available"
  }
}
```

---

### 2. Trekkers Endpoints (`/trekkers`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/trekkers` | Get all trekkers | `200 OK` |
| `GET` | `/trekkers/:id` | Get single trekker by ID | `200 OK` / `404 Not Found` |
| `POST` | `/trekkers` | Register a new trekker | `201 Created` / `400 Bad Request` / `409 Conflict` |

#### Sample Request: Create a Trekker
```http
POST /trekkers HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "name": "Carlos Gomez",
  "email": "carlos.gomez@example.com"
}
```
**Response (201 Created):**
```json
{
  "message": "Trekker created successfully.",
  "trekker": {
    "trekker_id": 5,
    "name": "Carlos Gomez",
    "email": "carlos.gomez@example.com"
  }
}
```

---

### 3. Rentals & JOIN Endpoints (`/rentals`)

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/rentals` | Get all rentals joined with trekker name and tent name | `200 OK` |
| `GET` | `/rentals/details` | Dedicated alias for the rental JOIN endpoint | `200 OK` |
| `GET` | `/rentals/:id` | Get single rental by ID with joined details | `200 OK` / `404 Not Found` |
| `POST` | `/rentals` | Create a new rental with validation and conflict check | `201 Created` / `400 Bad Request` / `409 Conflict` |

#### Sample Request: Rental JOIN Endpoint
```http
GET /rentals HTTP/1.1
Host: localhost:3000
```
**Response (200 OK):**
```json
[
  {
    "rental_id": 1,
    "start_date": "2026-11-01",
    "end_date": "2026-11-05",
    "trekker_id": 1,
    "trekker_name": "Alex Rivera",
    "trekker_email": "alex.rivera@example.com",
    "tent_id": 2,
    "tent_name": "StormShield 4P",
    "tent_size": 4,
    "tent_status": "available"
  },
  {
    "rental_id": 2,
    "start_date": "2026-11-10",
    "end_date": "2026-11-12",
    "trekker_id": 2,
    "trekker_name": "Maya Lin",
    "trekker_email": "maya.lin@example.com",
    "tent_id": 8,
    "tent_name": "Alpine Explorer 4P",
    "tent_size": 4,
    "tent_status": "available"
  }
]
```

---

## 9. Special Twist Rules & Test Scenarios

### Rule 1: Rental End Date Before Start Date Returns HTTP 400
- **Test Request:**
  ```http
  POST /rentals HTTP/1.1
  Host: localhost:3000
  Content-Type: application/json

  {
    "trekker_id": 1,
    "tent_id": 4,
    "start_date": "2026-11-15",
    "end_date": "2026-11-10"
  }
  ```
- **Response (HTTP 400 Bad Request):**
  ```json
  {
    "error": "End date cannot be earlier than start date."
  }
  ```

---

### Rule 2 & 3: Tent Availability on a Specific Date
- **Endpoint:** `GET /tents/available?date=YYYY-MM-DD`
- **Business Rule:** Rental date ranges are **inclusive**. A rental from November 10 to November 12 means the tent is unavailable on November 10, November 11, and November 12. It becomes available again on November 13.
- **SQL Implementation:**
  ```sql
  SELECT tent_id, name, size, status
  FROM tents
  WHERE status = 'available'
    AND tent_id NOT IN (
      SELECT tent_id
      FROM rentals
      WHERE start_date <= ? AND end_date >= ?
    )
  ORDER BY tent_id ASC;
  ```

#### Test 2: Check November 11 (Tent 8 must NOT appear)
- **Request:**
  ```http
  GET /tents/available?date=2026-11-11 HTTP/1.1
  Host: localhost:3000
  ```
- **Result:**
  Tent 8 (`Alpine Explorer 4P`) is currently rented by Maya Lin from Nov 10 to Nov 12. Therefore, Tent 8 is **excluded** from the returned list.

#### Test 3: Check November 13 (Tent 8 MUST appear)
- **Request:**
  ```http
  GET /tents/available?date=2026-11-13 HTTP/1.1
  Host: localhost:3000
  ```
- **Result:**
  The rental ended on November 12. Tent 8 has `status = 'available'` and no further bookings, so Tent 8 **is included** in the returned list.

---

## 10. Postman Setup & Collection Testing

A ready-to-import Postman collection is included in the project:
`TrekGear_Hub.postman_collection.json`

### How to Import:
1. Open the **Postman** desktop application (or web client).
2. Click the **Import** button in the upper left corner.
3. Drag and drop the `TrekGear_Hub.postman_collection.json` file into Postman, or click **files** and select it from your project folder.
4. The collection named **TrekGear Hub API** will appear in your left sidebar.

### How to Run Automated Tests in Postman:
1. Make sure your server is running (`npm start`).
2. In Postman, click on the **TrekGear Hub API** collection name.
3. Click the **Run** button (Collection Runner).
4. Click **Run TrekGear Hub API**.
5. All 23 requests will execute sequentially and show all green passing assertions (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, and Special Twist checks).

---

## 11. College Assignment Submission Checklist

- [x] Node.js & Express.js backend architecture.
- [x] SQLite relational database with safe parameterized queries.
- [x] Exactly three related tables: `trekkers`, `tents`, `rentals`.
- [x] Full CRUD on tents (`GET /tents`, `GET /tents/:id`, `POST /tents`, `PUT /tents/:id`, `DELETE /tents/:id`).
- [x] Search tents with query parameter (`GET /tents?size=2`, `status`, `search`).
- [x] Minimal trekker and rental endpoints to insert test data.
- [x] Rental JOIN endpoint returning trekker name and tent name (`GET /rentals` and `GET /rentals/details`).
- [x] Input validations with clear error messages and standard HTTP status codes (200, 201, 400, 404, 409).
- [x] Special Twist Rule 1: Rental end date before start date returns HTTP 400.
- [x] Special Twist Rule 2 & 3: `GET /tents/available?date=YYYY-MM-DD` excludes active rentals and non-available status.
- [x] Special Twist Rule 4: Inclusive date ranges verified.
- [x] Special Twist Rule 5: Safe parameterized SQL queries.
- [x] Special Twist Rule 6: Rejection of missing and invalid dates with HTTP 400.
- [x] Test 1, Test 2, and Test 3 verified and passing.
- [x] Separate folder structure (`database/`, `controllers/`, `routes/`, `tests/`).
- [x] Complete Postman collection JSON file (`TrekGear_Hub.postman_collection.json`).
- [x] Beginner-friendly `README.md` with complete documentation.
- [x] No frontend or unnecessary frameworks created.

