// ============================================================================
// TrekGear Hub - Trekker Controller
// Purpose: Handles customer/trekker creation, retrieval, and validation.
// ============================================================================

const db = require('../database/db');

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /trekkers
 * Retrieves all registered trekkers.
 */
exports.getAllTrekkers = async (req, res) => {
  try {
    const trekkers = await db.allAsync('SELECT * FROM trekkers ORDER BY trekker_id ASC;');
    return res.status(200).json(trekkers);
  } catch (error) {
    console.error('Error fetching trekkers:', error);
    return res.status(500).json({ error: 'Internal server error while fetching trekkers.' });
  }
};

/**
 * GET /trekkers/:id
 * Retrieves a single trekker by their primary key ID.
 */
exports.getTrekkerById = async (req, res) => {
  try {
    const trekkerId = Number(req.params.id);

    if (!Number.isInteger(trekkerId) || trekkerId <= 0) {
      return res.status(400).json({ error: 'Trekker ID must be a positive integer.' });
    }

    const trekker = await db.getAsync('SELECT * FROM trekkers WHERE trekker_id = ?;', [trekkerId]);

    if (!trekker) {
      return res.status(404).json({ error: `Trekker with ID ${trekkerId} not found.` });
    }

    return res.status(200).json(trekker);
  } catch (error) {
    console.error('Error fetching trekker by ID:', error);
    return res.status(500).json({ error: 'Internal server error while fetching trekker.' });
  }
};

/**
 * POST /trekkers
 * Creates a new trekker with validation.
 */
exports.createTrekker = async (req, res) => {
  try {
    const { name, email } = req.body;
    const errors = [];

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push("Field 'name' is required and must be a non-empty string.");
    }

    // Validate email
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.push("Field 'email' is required and must be a valid email address.");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await db.getAsync('SELECT * FROM trekkers WHERE email = ?;', [cleanEmail]);
    if (existing) {
      return res.status(409).json({
        error: `A trekker with email '${cleanEmail}' already exists.`
      });
    }

    const result = await db.runAsync(
      'INSERT INTO trekkers (name, email) VALUES (?, ?);',
      [cleanName, cleanEmail]
    );

    const newTrekker = {
      trekker_id: result.lastID,
      name: cleanName,
      email: cleanEmail
    };

    return res.status(201).json({
      message: 'Trekker created successfully.',
      trekker: newTrekker
    });
  } catch (error) {
    console.error('Error creating trekker:', error);
    return res.status(500).json({ error: 'Internal server error while creating trekker.' });
  }
};

