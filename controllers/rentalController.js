// ============================================================================
// TrekGear Hub - Rental Controller
// Purpose: Handles rental bookings, date validations, double-booking checks,
//          and SQL JOIN queries returning rental, trekker, and tent details.
// ============================================================================

const db = require('../database/db');

/**
 * Validates a date string in YYYY-MM-DD format with real calendar validity.
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid YYYY-MM-DD date
 */
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * GET /rentals or GET /rentals/details
 * REQUIRED JOIN ENDPOINT:
 * Returns rental records joined with trekker name/email and tent name/size/status.
 */
exports.getAllRentalsWithDetails = async (req, res) => {
  try {
    const sql = `
      SELECT 
        r.rental_id,
        r.start_date,
        r.end_date,
        r.trekker_id,
        tr.name AS trekker_name,
        tr.email AS trekker_email,
        r.tent_id,
        t.name AS tent_name,
        t.size AS tent_size,
        t.status AS tent_status
      FROM rentals r
      JOIN trekkers tr ON r.trekker_id = tr.trekker_id
      JOIN tents t ON r.tent_id = t.tent_id
      ORDER BY r.rental_id ASC;
    `;

    const rentals = await db.allAsync(sql);
    return res.status(200).json(rentals);
  } catch (error) {
    console.error('Error fetching rentals with JOIN:', error);
    return res.status(500).json({ error: 'Internal server error while fetching rentals.' });
  }
};

/**
 * GET /rentals/:id
 * Retrieves a single rental by ID with joined trekker and tent details.
 */
exports.getRentalById = async (req, res) => {
  try {
    const rentalId = Number(req.params.id);

    if (!Number.isInteger(rentalId) || rentalId <= 0) {
      return res.status(400).json({ error: 'Rental ID must be a positive integer.' });
    }

    const sql = `
      SELECT 
        r.rental_id,
        r.start_date,
        r.end_date,
        r.trekker_id,
        tr.name AS trekker_name,
        tr.email AS trekker_email,
        r.tent_id,
        t.name AS tent_name,
        t.size AS tent_size,
        t.status AS tent_status
      FROM rentals r
      JOIN trekkers tr ON r.trekker_id = tr.trekker_id
      JOIN tents t ON r.tent_id = t.tent_id
      WHERE r.rental_id = ?;
    `;

    const rental = await db.getAsync(sql, [rentalId]);

    if (!rental) {
      return res.status(404).json({ error: `Rental with ID ${rentalId} not found.` });
    }

    return res.status(200).json(rental);
  } catch (error) {
    console.error('Error fetching rental by ID:', error);
    return res.status(500).json({ error: 'Internal server error while fetching rental.' });
  }
};

/**
 * POST /rentals
 * Creates a new rental with thorough validation:
 * 1. Checks trekker_id and tent_id are positive integers.
 * 2. Checks start_date and end_date are valid YYYY-MM-DD dates.
 * 3. SPECIAL TWIST RULE 1: If end_date is earlier than start_date, returns HTTP 400.
 * 4. Verifies trekker exists in the database.
 * 5. Verifies tent exists in the database and is currently 'available'.
 * 6. Checks for overlapping dates (no double-booking, inclusive date ranges).
 */
exports.createRental = async (req, res) => {
  try {
    const { trekker_id, tent_id, start_date, end_date } = req.body;
    const errors = [];

    // Validate trekker_id
    const parsedTrekkerId = Number(trekker_id);
    if (!Number.isInteger(parsedTrekkerId) || parsedTrekkerId <= 0) {
      errors.push("Field 'trekker_id' is required and must be a positive integer.");
    }

    // Validate tent_id
    const parsedTentId = Number(tent_id);
    if (!Number.isInteger(parsedTentId) || parsedTentId <= 0) {
      errors.push("Field 'tent_id' is required and must be a positive integer.");
    }

    // Validate start_date format
    if (!start_date || !isValidDateString(start_date)) {
      errors.push("Field 'start_date' is required and must be a valid date in YYYY-MM-DD format.");
    }

    // Validate end_date format
    if (!end_date || !isValidDateString(end_date)) {
      errors.push("Field 'end_date' is required and must be a valid date in YYYY-MM-DD format.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // SPECIAL TWIST RULE 1:
    // A rental with end_date earlier than start_date must return HTTP 400.
    if (end_date < start_date) {
      return res.status(400).json({
        error: 'End date cannot be earlier than start date.'
      });
    }

    // Verify trekker exists in the database
    const trekker = await db.getAsync(
      'SELECT trekker_id, name, email FROM trekkers WHERE trekker_id = ?;',
      [parsedTrekkerId]
    );
    if (!trekker) {
      return res.status(404).json({
        error: `Trekker with ID ${parsedTrekkerId} not found.`
      });
    }

    // Verify tent exists in the database
    const tent = await db.getAsync(
      'SELECT tent_id, name, size, status FROM tents WHERE tent_id = ?;',
      [parsedTentId]
    );
    if (!tent) {
      return res.status(404).json({
        error: `Tent with ID ${parsedTentId} not found.`
      });
    }

    // Verify tent status is 'available'
    if (tent.status !== 'available') {
      return res.status(400).json({
        error: `Tent '${tent.name}' cannot be rented because its status is '${tent.status}'.`
      });
    }

    // Prevent double-booking: check for any overlapping rental for this tent.
    // In inclusive date ranges, [start_date, end_date] overlaps with [existing.start, existing.end]
    // if: existing.start_date <= new_end_date AND existing.end_date >= new_start_date
    const overlapSql = `
      SELECT rental_id, start_date, end_date 
      FROM rentals 
      WHERE tent_id = ? 
        AND start_date <= ? 
        AND end_date >= ?
      LIMIT 1;
    `;
    const overlappingRental = await db.getAsync(overlapSql, [
      parsedTentId,
      end_date,
      start_date
    ]);

    if (overlappingRental) {
      return res.status(409).json({
        error: `Tent '${tent.name}' is already booked from ${overlappingRental.start_date} to ${overlappingRental.end_date}. Double-booking is not allowed.`
      });
    }

    // Insert new rental
    const insertResult = await db.runAsync(
      'INSERT INTO rentals (trekker_id, tent_id, start_date, end_date) VALUES (?, ?, ?, ?);',
      [parsedTrekkerId, parsedTentId, start_date, end_date]
    );

    const newRental = {
      rental_id: insertResult.lastID,
      trekker_id: parsedTrekkerId,
      trekker_name: trekker.name,
      tent_id: parsedTentId,
      tent_name: tent.name,
      start_date,
      end_date
    };

    return res.status(201).json({
      message: 'Rental created successfully.',
      rental: newRental
    });
  } catch (error) {
    console.error('Error creating rental:', error);
    return res.status(500).json({ error: 'Internal server error while creating rental.' });
  }
};

