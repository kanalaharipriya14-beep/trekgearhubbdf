// ============================================================================
// TrekGear Hub - Server Entry Point
// Purpose: Initializes the database, starts the Express HTTP server,
//          and listens on the designated port.
// ============================================================================

const app = require('./app');
const { setupDatabase } = require('./database/init');
const db = require('./database/db');

const PORT = process.env.PORT || 3000;

// Start server after verifying database is initialized
async function startServer() {
  try {
    await setupDatabase();

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(` TrekGear Hub Server is running!`);
      console.log(` Base URL: http://localhost:${PORT}`);
      console.log(` Available Tents Endpoint: http://localhost:${PORT}/tents/available?date=YYYY-MM-DD`);
      console.log(` Rentals JOIN Endpoint:    http://localhost:${PORT}/rentals`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const handleShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down TrekGear Hub gracefully...`);
      server.close(async () => {
        try {
          await db.closeAsync();
          console.log('SQLite database connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database connection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;

