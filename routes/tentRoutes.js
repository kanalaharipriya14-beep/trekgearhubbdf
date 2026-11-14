// ============================================================================
// TrekGear Hub - Tent Routes
// Purpose: Maps tent-related endpoints to controller actions.
// ============================================================================

const express = require('express');
const router = express.Router();
const tentController = require('../controllers/tentController');

// GET /tents - Retrieve all tents (supports ?size=X, ?status=X, ?search=X)
router.get('/', tentController.getAllTents);

// GET /tents/available - Special Twist: retrieve tents available on a specific date
// NOTE: Must be defined before /:id so 'available' is not parsed as an id parameter
router.get('/available', tentController.getAvailableTents);

// GET /tents/:id - Retrieve a single tent by ID
router.get('/:id', tentController.getTentById);

// POST /tents - Create a new tent
router.post('/', tentController.createTent);

// PUT /tents/:id - Update an existing tent
router.put('/:id', tentController.updateTent);

// DELETE /tents/:id - Delete a tent
router.delete('/:id', tentController.deleteTent);

module.exports = router;

