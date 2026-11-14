// ============================================================================
// TrekGear Hub - Trekker Routes
// Purpose: Maps customer/trekker endpoints to controller actions.
// ============================================================================

const express = require('express');
const router = express.Router();
const trekkerController = require('../controllers/trekkerController');

// GET /trekkers - Retrieve all trekkers
router.get('/', trekkerController.getAllTrekkers);

// GET /trekkers/:id - Retrieve a single trekker by ID
router.get('/:id', trekkerController.getTrekkerById);

// POST /trekkers - Create a new trekker
router.post('/', trekkerController.createTrekker);

module.exports = router;

