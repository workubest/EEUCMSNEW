const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(require('compression')());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// GAS URL from environment or default
const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbzU_uootxaTnkyicoySBNmZH6NGXcnbk2yTN5IC2Px8dhOMe9TvmHQUTZEy1C1aJiab/exec';

// Proxy all API requests to GAS
app.all('/api/*', async (req, res) => {
  try {
    const path = req.path.replace('/api/', '');
    const action = req.query.action || path.split('/')[0];

    // Prepare the request body for GAS
    const gasPayload = {
      path: path,
      action: action,
      method: req.method,
      data: req.body || {},
      query: req.query || {}
    };

    console.log('Proxying to GAS:', { path, action, method: req.method });

    // Forward request to GAS
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gasPayload)
    });

    const responseText = await response.text();

    try {
      // Try to parse as JSON
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (parseError) {
      // If not JSON, return as text with error status
      console.error('GAS returned non-JSON response:', responseText);
      res.status(500).json({
        success: false,
        error: 'Invalid response from GAS',
        raw: responseText
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'netlify'
  });
});

// Export for Netlify Functions
module.exports.handler = serverless(app);
