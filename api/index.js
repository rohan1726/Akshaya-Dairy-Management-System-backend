/**
 * Vercel serverless entry. Runs when Vercel Root Directory = backend.
 */
let app;
try {
  app = require('../dist/app').default;
} catch (err) {
  app = (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server failed to start',
      error: process.env.NODE_ENV !== 'production' ? (err && err.message) : undefined,
    });
  };
}
module.exports = app;
