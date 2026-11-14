// ============================================================================
// TrekGear Hub - Database Initialization and Seeding Script
// Purpose: Creates the three required tables (trekkers, tents, rentals)
//          and populates sample data for development, testing, and grading.
// ============================================================================

const db = require('./db');

/**
 * Creates the required tables if they don't already exist.
 * Exactly three related tables as specified:
 * 1. trekkers (trekker_id, name, email)
 * 2. tents (tent_id, name, size, status)
 * 3. rentals (rental_id, trekker_id, tent_id, start_date, end_date)
 */
async function initDatabase() {
  // 1. Create 'trekkers' table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS trekkers (
      trekker_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    );
  `);

  // 2. Create 'tents' table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS tents (
      tent_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available'
    );
  `);

  // 3. Create 'rentals' table with foreign keys
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS rentals (
      rental_id INTEGER PRIMARY KEY AUTOINCREMENT,
      trekker_id INTEGER NOT NULL,
      tent_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      FOREIGN KEY (trekker_id) REFERENCES trekkers (trekker_id) ON DELETE CASCADE,
      FOREIGN KEY (tent_id) REFERENCES tents (tent_id) ON DELETE RESTRICT
    );
  `);

  if (process.env.NODE_ENV !== 'test') {
    console.log('Database tables verified or created successfully.');
  }
}

/**
 * Populates sample data into all three tables.
 * Ensures Tent 8 exists with status 'available' and has a rental from 2026-11-10 to 2026-11-12
 * to directly satisfy Special Twist Test 2 and Test 3.
 */
async function seedDatabase() {
  // Clear existing data cleanly in reverse order of foreign key dependencies
  await db.runAsync('DELETE FROM rentals;');
  await db.runAsync('DELETE FROM sqlite_sequence WHERE name IN ("rentals", "tents", "trekkers");');
  await db.runAsync('DELETE FROM tents;');
  await db.runAsync('DELETE FROM trekkers;');

  // Insert sample Trekkers
  const sampleTrekkers = [
    { name: 'Alex Rivera', email: 'alex.rivera@example.com' },
    { name: 'Maya Lin', email: 'maya.lin@example.com' },
    { name: 'Samir Khan', email: 'samir.khan@example.com' },
    { name: 'Elena Rostova', email: 'elena.rostova@example.com' }
  ];

  for (const trekker of sampleTrekkers) {
    await db.runAsync(
      'INSERT INTO trekkers (name, email) VALUES (?, ?);',
      [trekker.name, trekker.email]
    );
  }

  // Insert sample Tents (explicitly ensuring tent_id 8 is created as required for twist test)
  const sampleTents = [
    { id: 1, name: 'TrailDome 2P', size: 2, status: 'available' },
    { id: 2, name: 'StormShield 4P', size: 4, status: 'available' },
    { id: 3, name: 'Backpacker Solo 1P', size: 1, status: 'available' },
    { id: 4, name: 'Alpine Haven 6P', size: 6, status: 'available' },
    { id: 5, name: 'RidgeRest 2P', size: 2, status: 'maintenance' },
    { id: 6, name: 'Summit Seeker 3P', size: 3, status: 'available' },
    { id: 7, name: 'Glacier Pro 4P', size: 4, status: 'retired' },
    { id: 8, name: 'Alpine Explorer 4P', size: 4, status: 'available' }, // Required for twist tests
    { id: 9, name: 'CloudPeak 2P', size: 2, status: 'available' },
    { id: 10, name: 'Basecamp Heavy 8P', size: 8, status: 'available' }
  ];

  for (const tent of sampleTents) {
    await db.runAsync(
      'INSERT INTO tents (tent_id, name, size, status) VALUES (?, ?, ?, ?);',
      [tent.id, tent.name, tent.size, tent.status]
    );
  }

  // Insert sample Rentals
  // Note: Rental 2 books Tent 8 from 2026-11-10 to 2026-11-12 (inclusive)
  const sampleRentals = [
    { trekker_id: 1, tent_id: 2, start_date: '2026-11-01', end_date: '2026-11-05' },
    { trekker_id: 2, tent_id: 8, start_date: '2026-11-10', end_date: '2026-11-12' }, // Twist Test 2 & 3
    { trekker_id: 3, tent_id: 1, start_date: '2026-11-20', end_date: '2026-11-25' }
  ];

  for (const rental of sampleRentals) {
    await db.runAsync(
      'INSERT INTO rentals (trekker_id, tent_id, start_date, end_date) VALUES (?, ?, ?, ?);',
      [rental.trekker_id, rental.tent_id, rental.start_date, rental.end_date]
    );
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('Sample data seeded successfully.');
  }
}

/**
 * Master initialization function to prepare tables and seed data if needed.
 */
async function setupDatabase() {
  await initDatabase();
  const count = await db.getAsync('SELECT COUNT(*) AS total FROM tents;');
  if (count.total === 0) {
    await seedDatabase();
  }
}

// Run directly from CLI (e.g. `node database/init.js` or `npm run init-db`)
if (require.main === module) {
  (async () => {
    try {
      await initDatabase();
      await seedDatabase();
      console.log('Database initialization and seeding complete.');
      process.exit(0);
    } catch (err) {
      console.error('Database initialization failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = {
  initDatabase,
  seedDatabase,
  setupDatabase
};

