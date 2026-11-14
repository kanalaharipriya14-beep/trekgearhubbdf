// ============================================================================
// TrekGear Hub - Express Application Setup
// Purpose: Configures Express middleware, registers API routes,
//          and sets up standard error handlers.
// ============================================================================

const express = require('express');

// Import route modules
const tentRoutes = require('./routes/tentRoutes');
const trekkerRoutes = require('./routes/trekkerRoutes');
const rentalRoutes = require('./routes/rentalRoutes');

const app = express();

// Middleware: Parse JSON request bodies
app.use(express.json());

// Middleware: Handle malformed JSON error gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload in request body.' });
  }
  next();
});

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'TrekGear Hub',
    description: 'Trekking Tent Rental Management System API',
    endpoints: {
      tents: {
        list: 'GET /tents',
        search_by_size: 'GET /tents?size=2',
        available: 'GET /tents/available?date=YYYY-MM-DD',
        get_one: 'GET /tents/:id',
        create: 'POST /tents',
        update: 'PUT /tents/:id',
        delete: 'DELETE /tents/:id'
      },
      trekkers: {
        list: 'GET /trekkers',
        get_one: 'GET /trekkers/:id',
        create: 'POST /trekkers'
      },
      rentals: {
        list_with_join: 'GET /rentals',
        details_join: 'GET /rentals/details',
        get_one: 'GET /rentals/:id',
        create: 'POST /rentals'
      }
    }
  });
});

// Register domain routes
app.use('/tents', tentRoutes);
app.use('/trekkers', trekkerRoutes);
app.use('/rentals', rentalRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global internal error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;

