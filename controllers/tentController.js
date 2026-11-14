// ============================================================================
// TrekGear Hub - Tent Controller
// Purpose: Handles business logic and database queries for tent management,
//          including CRUD, query search, input validation, and availability check.
// ============================================================================

const db = require('../database/db');

// Allowed status values for tents
const ALLOWED_STATUSES = ['available', 'maintenance', 'retired'];

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
 * Validates tent input data for creation and updates.
 * @param {Object} body - Request body containing name, size, and status
 * @returns {Array<string>} Array of validation error messages, if any
 */
function validateTentInput(body) {
  const errors = [];
  const { name, size, status } = body;

  // Validate name
  if (name === undefined || name === null || typeof name !== 'string' || name.trim().length === 0) {
    errors.push("Field 'name' is required and must be a non-empty string.");
  } else if (name.trim().length > 100) {
    errors.push("Field 'name' cannot exceed 100 characters.");
  }

  // Validate size
  if (size === undefined || size === null) {
    errors.push("Field 'size' is required.");
  } else {
    const numericSize = Number(size);
    if (!Number.isInteger(numericSize) || numericSize <= 0) {
      errors.push("Field 'size' must be a positive integer (number of people).");
    }
  }

  // Validate status (optional on create, but if supplied must be one of allowed)
  if (status !== undefined && status !== null) {
    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status.toLowerCase().trim())) {
      errors.push(`Field 'status' must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }
  }

  return errors;
}

/**
 * GET /tents
 * Retrieves all tents, with optional filtering via query parameters:
 * - ?size=X (filter by exact capacity)
 * - ?status=X (filter by status: available, maintenance, retired)
 * - ?search=X (search by tent name substring)
 */
exports.getAllTents = async (req, res) => {
  try {
    const { size, status, search } = req.query;

    let sql = 'SELECT * FROM tents WHERE 1=1';
    const params = [];

    // Filter by size
    if (size !== undefined) {
      const parsedSize = Number(size);
      if (!Number.isInteger(parsedSize) || parsedSize <= 0) {
        return res.status(400).json({
          error: "Query parameter 'size' must be a positive integer."
        });
      }
      sql += ' AND size = ?';
      params.push(parsedSize);
    }

    // Filter by status
    if (status !== undefined) {
      const cleanStatus = status.toLowerCase().trim();
      if (!ALLOWED_STATUSES.includes(cleanStatus)) {
        return res.status(400).json({
          error: `Query parameter 'status' must be one of: ${ALLOWED_STATUSES.join(', ')}.`
        });
      }
      sql += ' AND status = ?';
      params.push(cleanStatus);
    }

    // Search by name
    if (search !== undefined && search.trim() !== '') {
      sql += ' AND name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY tent_id ASC;';

    const tents = await db.allAsync(sql, params);
    return res.status(200).json(tents);
  } catch (error) {
    console.error('Error fetching tents:', error);
    return res.status(500).json({ error: 'Internal server error while fetching tents.' });
  }
};

/**
 * GET /tents/available?date=YYYY-MM-DD
 * SPECIAL TWIST IMPLEMENTATION:
 * Returns only tents whose status is 'available' and which have no rental covering the requested date.
 * Rental date ranges are inclusive (start_date <= date AND end_date >= date).
 */
exports.getAvailableTents = async (req, res) => {
  try {
    const { date } = req.query;

    // Reject missing date parameter
    if (!date) {
      return res.status(400).json({
        error: "Query parameter 'date' is required in YYYY-MM-DD format."
      });
    }

    // Reject invalid date format
    if (!isValidDateString(date)) {
      return res.status(400).json({
        error: "Invalid date format. Please provide a valid calendar date in YYYY-MM-DD format."
      });
    }

    // Safe parameterized SQL query
    // Finds all tents with status='available' whose tent_id is NOT in active rentals on that date
    const sql = `
      SELECT tent_id, name, size, status
      FROM tents
      WHERE status = 'available'
        AND tent_id NOT IN (
          SELECT tent_id
          FROM rentals
          WHERE start_date <= ? AND end_date >= ?
        )
      ORDER BY tent_id ASC;
    `;

    const availableTents = await db.allAsync(sql, [date, date]);
    return res.status(200).json(availableTents);
  } catch (error) {
    console.error('Error fetching available tents:', error);
    return res.status(500).json({ error: 'Internal server error while checking availability.' });
  }
};

/**
 * GET /tents/:id
 * Retrieves a single tent by its primary key ID.
 */
exports.getTentById = async (req, res) => {
  try {
    const tentId = Number(req.params.id);

    if (!Number.isInteger(tentId) || tentId <= 0) {
      return res.status(400).json({ error: 'Tent ID must be a positive integer.' });
    }

    const tent = await db.getAsync('SELECT * FROM tents WHERE tent_id = ?;', [tentId]);

    if (!tent) {
      return res.status(404).json({ error: `Tent with ID ${tentId} not found.` });
    }

    return res.status(200).json(tent);
  } catch (error) {
    console.error('Error fetching tent by ID:', error);
    return res.status(500).json({ error: 'Internal server error while fetching tent.' });
  }
};

/**
 * POST /tents
 * Creates a new tent record with input validation.
 */
exports.createTent = async (req, res) => {
  try {
    const errors = validateTentInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    const name = req.body.name.trim();
    const size = Number(req.body.size);
    const status = req.body.status ? req.body.status.toLowerCase().trim() : 'available';

    const result = await db.runAsync(
      'INSERT INTO tents (name, size, status) VALUES (?, ?, ?);',
      [name, size, status]
    );

    const newTent = {
      tent_id: result.lastID,
      name,
      size,
      status
    };

    return res.status(201).json({
      message: 'Tent created successfully.',
      tent: newTent
    });
  } catch (error) {
    console.error('Error creating tent:', error);
    return res.status(500).json({ error: 'Internal server error while creating tent.' });
  }
};

/**
 * PUT /tents/:id
 * Updates an existing tent record with input validation.
 */
exports.updateTent = async (req, res) => {
  try {
    const tentId = Number(req.params.id);

    if (!Number.isInteger(tentId) || tentId <= 0) {
      return res.status(400).json({ error: 'Tent ID must be a positive integer.' });
    }

    // Check if the tent exists
    const existingTent = await db.getAsync('SELECT * FROM tents WHERE tent_id = ?;', [tentId]);
    if (!existingTent) {
      return res.status(404).json({ error: `Tent with ID ${tentId} not found.` });
    }

    const errors = validateTentInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    const name = req.body.name.trim();
    const size = Number(req.body.size);
    const status = req.body.status ? req.body.status.toLowerCase().trim() : existingTent.status;

    await db.runAsync(
      'UPDATE tents SET name = ?, size = ?, status = ? WHERE tent_id = ?;',
      [name, size, status, tentId]
    );

    const updatedTent = {
      tent_id: tentId,
      name,
      size,
      status
    };

    return res.status(200).json({
      message: 'Tent updated successfully.',
      tent: updatedTent
    });
  } catch (error) {
    console.error('Error updating tent:', error);
    return res.status(500).json({ error: 'Internal server error while updating tent.' });
  }
};

/**
 * DELETE /tents/:id
 * Deletes a tent record after verifying it is not referenced in active or past rentals.
 */
exports.deleteTent = async (req, res) => {
  try {
    const tentId = Number(req.params.id);

    if (!Number.isInteger(tentId) || tentId <= 0) {
      return res.status(400).json({ error: 'Tent ID must be a positive integer.' });
    }

    // Check if tent exists
    const tent = await db.getAsync('SELECT * FROM tents WHERE tent_id = ?;', [tentId]);
    if (!tent) {
      return res.status(404).json({ error: `Tent with ID ${tentId} not found.` });
    }

    // Prevent deletion if referenced in rentals (preserves relational integrity)
    const rentalRef = await db.getAsync(
      'SELECT COUNT(*) AS count FROM rentals WHERE tent_id = ?;',
      [tentId]
    );

    if (rentalRef && rentalRef.count > 0) {
      return res.status(409).json({
        error: `Cannot delete tent with ID ${tentId} because it is referenced in ${rentalRef.count} rental record(s).`
      });
    }

    await db.runAsync('DELETE FROM tents WHERE tent_id = ?;', [tentId]);

    return res.status(200).json({
      message: `Tent with ID ${tentId} ('${tent.name}') deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting tent:', error);
    return res.status(500).json({ error: 'Internal server error while deleting tent.' });
  }
};

