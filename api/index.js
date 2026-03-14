/**
 * Vercel serverless entry (repo root).
 * Forwards to the built backend Express app.
 */
let app;
try {
  app = require('../backend/dist/app').default;
} catch (err) {
  // If the app fails to load (e.g. missing build, env), respond with 500 so the function doesn't crash silently
  app = (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server failed to start',
      error: process.env.NODE_ENV !== 'production' ? (err && err.message) : undefined,
    });
  };
}
module.exports = app;
