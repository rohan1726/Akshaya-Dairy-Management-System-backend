/**
 * Vercel serverless entry point.
 * All requests are rewritten here so the full Express app runs as one function.
 */
const app = require('../dist/app').default;
module.exports = app;
