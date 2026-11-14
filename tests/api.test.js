// ============================================================================
// TrekGear Hub - Automated API Test Suite
// Purpose: Validates all CRUD endpoints, JOIN queries, validation rules,
//          and explicitly tests all three required Special Twist test cases.
// ============================================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { initDatabase, seedDatabase } = require('../database/init');

// Before running tests, initialize tables and seed fresh known data
test.before(async () => {
  await initDatabase();
  await seedDatabase();
});

// ============================================================================
// SUITE 1: TENTS CRUD & SEARCH ENDPOINTS
// ============================================================================

test('GET /tents - should return a list of all tents with HTTP 200', async () => {
  const res = await request(app).get('/tents');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 10);
});

test('GET /tents?size=2 - should filter tents by size using query parameters', async () => {
  const res = await request(app).get('/tents?size=2');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);
  res.body.forEach((tent) => {
    assert.equal(tent.size, 2);
  });
});

test('GET /tents?search=Dome - should search tents by name substring', async () => {
  const res = await request(app).get('/tents?search=Dome');
  assert.equal(res.status, 200);
  assert.ok(res.body.some((tent) => tent.name.includes('Dome')));
});

test('GET /tents/:id - should return a single tent by valid ID', async () => {
  const res = await request(app).get('/tents/8');
  assert.equal(res.status, 200);
  assert.equal(res.body.tent_id, 8);
  assert.equal(res.body.name, 'Alpine Explorer 4P');
});

test('GET /tents/:id - should return HTTP 404 for nonexistent tent ID', async () => {
  const res = await request(app).get('/tents/9999');
  assert.equal(res.status, 404);
  assert.ok(res.body.error.includes('not found'));
});

test('GET /tents/:id - should return HTTP 400 for invalid non-integer ID', async () => {
  const res = await request(app).get('/tents/abc');
  assert.equal(res.status, 400);
});

test('POST /tents - should create a new tent with HTTP 201', async () => {
  const newTentData = {
    name: 'Glacier Dome 3P',
    size: 3,
    status: 'available'
  };
  const res = await request(app).post('/tents').send(newTentData);
  assert.equal(res.status, 201);
  assert.equal(res.body.message, 'Tent created successfully.');
  assert.equal(res.body.tent.name, 'Glacier Dome 3P');
  assert.equal(res.body.tent.size, 3);
  assert.equal(res.body.tent.status, 'available');
});

test('POST /tents - should return HTTP 400 when name is missing or invalid', async () => {
  const invalidData = { size: 3, status: 'available' };
  const res = await request(app).post('/tents').send(invalidData);
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
  assert.ok(res.body.details.some((msg) => msg.includes('name')));
});

test('POST /tents - should return HTTP 400 when size is negative or zero', async () => {
  const invalidData = { name: 'Invalid Size Tent', size: 0 };
  const res = await request(app).post('/tents').send(invalidData);
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Validation failed');
  assert.ok(res.body.details.some((msg) => msg.includes('size')));
});

test('POST /tents - should return HTTP 400 when status is invalid', async () => {
  const invalidData = { name: 'Invalid Status Tent', size: 2, status: 'broken' };
  const res = await request(app).post('/tents').send(invalidData);
  assert.equal(res.status, 400);
  assert.ok(res.body.details.some((msg) => msg.includes('status')));
});

test('PUT /tents/:id - should update an existing tent with HTTP 200', async () => {
  const updateData = {
    name: 'TrailDome 2P Updated',
    size: 2,
    status: 'available'
  };
  const res = await request(app).put('/tents/1').send(updateData);
  assert.equal(res.status, 200);
  assert.equal(res.body.tent.name, 'TrailDome 2P Updated');
});

test('PUT /tents/:id - should return HTTP 404 when updating nonexistent tent', async () => {
  const updateData = { name: 'Nonexistent', size: 2, status: 'available' };
  const res = await request(app).put('/tents/9999').send(updateData);
  assert.equal(res.status, 404);
});

test('DELETE /tents/:id - should prevent deletion of a tent with active/past rentals (HTTP 409)', async () => {
  // Tent 2 is in rental 1 in seed data
  const res = await request(app).delete('/tents/2');
  assert.equal(res.status, 409);
  assert.ok(res.body.error.includes('referenced in'));
});

test('DELETE /tents/:id - should delete an unrented tent with HTTP 200', async () => {
  // Tent 10 has no rentals
  const res = await request(app).delete('/tents/10');
  assert.equal(res.status, 200);
  assert.ok(res.body.message.includes('deleted successfully'));

  // Confirm it is gone
  const checkRes = await request(app).get('/tents/10');
  assert.equal(checkRes.status, 404);
});

// ============================================================================
// SUITE 2: TREKKER ENDPOINTS
// ============================================================================

test('GET /trekkers - should return all registered trekkers', async () => {
  const res = await request(app).get('/trekkers');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 4);
});

test('POST /trekkers - should create a new trekker with HTTP 201', async () => {
  const newTrekker = {
    name: 'Liam Gallagher',
    email: 'liam.g@example.com'
  };
  const res = await request(app).post('/trekkers').send(newTrekker);
  assert.equal(res.status, 201);
  assert.equal(res.body.trekker.name, 'Liam Gallagher');
  assert.equal(res.body.trekker.email, 'liam.g@example.com');
});

test('POST /trekkers - should reject duplicate email with HTTP 409', async () => {
  const duplicate = {
    name: 'Alex Copy',
    email: 'alex.rivera@example.com' // Already in seed data
  };
  const res = await request(app).post('/trekkers').send(duplicate);
  assert.equal(res.status, 409);
});

test('POST /trekkers - should reject invalid email with HTTP 400', async () => {
  const invalidTrekker = {
    name: 'No Email Guy',
    email: 'invalid-email-format'
  };
  const res = await request(app).post('/trekkers').send(invalidTrekker);
  assert.equal(res.status, 400);
  assert.ok(res.body.details.some((msg) => msg.includes('email')));
});

// ============================================================================
// SUITE 3: RENTAL JOIN ENDPOINTS
// ============================================================================

test('GET /rentals - should return rental details with trekker name and tent name via JOIN', async () => {
  const res = await request(app).get('/rentals');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);

  // Verify JOIN fields are present in every rental row
  res.body.forEach((rental) => {
    assert.ok(rental.rental_id, 'rental_id must be present');
    assert.ok(rental.start_date, 'start_date must be present');
    assert.ok(rental.end_date, 'end_date must be present');
    assert.ok(rental.trekker_id, 'trekker_id must be present');
    assert.ok(rental.trekker_name, 'trekker_name must be present from JOIN');
    assert.ok(rental.tent_id, 'tent_id must be present');
    assert.ok(rental.tent_name, 'tent_name must be present from JOIN');
    assert.ok(rental.tent_size, 'tent_size must be present from JOIN');
  });
});

test('GET /rentals/details - should return identical joined results via dedicated alias', async () => {
  const res = await request(app).get('/rentals/details');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body[0].trekker_name);
  assert.ok(res.body[0].tent_name);
});

test('GET /rentals/:id - should return single rental with JOIN details', async () => {
  const res = await request(app).get('/rentals/2');
  assert.equal(res.status, 200);
  assert.equal(res.body.rental_id, 2);
  assert.equal(res.body.tent_id, 8);
  assert.equal(res.body.tent_name, 'Alpine Explorer 4P');
  assert.equal(res.body.trekker_id, 2);
  assert.equal(res.body.trekker_name, 'Maya Lin');
});

test('POST /rentals - should prevent double-booking for the same tent with HTTP 409', async () => {
  // Tent 8 is rented 2026-11-10 to 2026-11-12
  // Attempting to book Tent 8 on overlapping dates (e.g. 2026-11-11 to 2026-11-14) must fail
  const overlapRental = {
    trekker_id: 1,
    tent_id: 8,
    start_date: '2026-11-11',
    end_date: '2026-11-14'
  };
  const res = await request(app).post('/rentals').send(overlapRental);
  assert.equal(res.status, 409);
  assert.ok(res.body.error.includes('already booked'));
});

// ============================================================================
// SUITE 4: SPECIAL TWIST REQUIRED TESTS
// ============================================================================

/**
 * TEST 1: Rental end date before start date returns HTTP 400.
 */
test('Test 1: Rental end date before start date returns HTTP 400', async () => {
  const invalidRental = {
    trekker_id: 1,
    tent_id: 3,
    start_date: '2026-11-15',
    end_date: '2026-11-10' // earlier than start_date!
  };

  const res = await request(app).post('/rentals').send(invalidRental);

  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'End date cannot be earlier than start date.');
});

/**
 * TEST 2: Tent 8 rented from November 10 to November 12 must not appear when checking November 11.
 */
test('Test 2: Tent 8 rented from Nov 10 to Nov 12 must NOT appear when checking Nov 11', async () => {
  const res = await request(app).get('/tents/available?date=2026-11-11');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));

  // Find Tent 8 in the returned available tents
  const tent8 = res.body.find((tent) => tent.tent_id === 8);

  // Tent 8 MUST NOT appear
  assert.equal(
    tent8,
    undefined,
    'Tent 8 is actively rented on 2026-11-11 and must NOT be listed in available tents'
  );
});

/**
 * TEST 3: The same Tent 8 must appear when checking November 13, provided its status is available and there is no other rental.
 */
test('Test 3: The same Tent 8 MUST appear when checking Nov 13 (rental ended Nov 12)', async () => {
  const res = await request(app).get('/tents/available?date=2026-11-13');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));

  // Find Tent 8 in the returned available tents
  const tent8 = res.body.find((tent) => tent.tent_id === 8);

  // Tent 8 MUST appear
  assert.ok(
    tent8 !== undefined,
    'Tent 8 rental ended on 2026-11-12 and MUST be available on 2026-11-13'
  );
  assert.equal(tent8.tent_id, 8);
  assert.equal(tent8.name, 'Alpine Explorer 4P');
  assert.equal(tent8.status, 'available');
});

// ============================================================================
// SUITE 5: SPECIAL TWIST DATE VALIDATIONS
// ============================================================================

test('GET /tents/available - should return HTTP 400 when date parameter is missing', async () => {
  const res = await request(app).get('/tents/available');
  assert.equal(res.status, 400);
  assert.ok(res.body.error.includes("Query parameter 'date' is required"));
});

test('GET /tents/available - should return HTTP 400 for invalid date format', async () => {
  const res = await request(app).get('/tents/available?date=invalid-date');
  assert.equal(res.status, 400);
  assert.ok(res.body.error.includes('Invalid date format'));
});

test('GET /tents/available - should return HTTP 400 for nonexistent calendar date', async () => {
  // February 31st does not exist
  const res = await request(app).get('/tents/available?date=2026-02-31');
  assert.equal(res.status, 400);
  assert.ok(res.body.error.includes('Invalid date format'));
});

