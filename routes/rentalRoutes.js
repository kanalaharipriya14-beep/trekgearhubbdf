// ============================================================================
// TrekGear Hub - Rental Routes
// Purpose: Maps rental endpoints to controller actions, including JOIN queries
//          and rental creation with date validation.
// ============================================================================

const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');

// GET /rentals - Returns all rentals with JOIN details (trekker name, tent name, etc.)
router.get('/', rentalController.getAllRentalsWithDetails);

// GET /rentals/details - Explicit alias for the JOIN endpoint
router.get('/details', rentalController.getAllRentalsWithDetails);

// GET /rentals/:id - Retrieve a single rental by ID with JOIN details
router.get('/:id', rentalController.getRentalById);

// POST /rentals - Create a new rental (validates dates, twist rule 1, double-booking)
router.post('/', rentalController.createRental);

module.exports = router;

