const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables

const PORT = process.env.PORT || 3001;
const chatRoutes = require('./routes');
const app = express();

// Define allowed origins for CORS (localhost and Vercel)
const allowedOrigins = [
  'http://localhost:3000',  // Local frontend
  'https://chatbot-kevin-selin.vercel.app'  // Vercel frontend
];

// CORS Middleware to dynamically allow origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the origin
    } else {
      callback(new Error('Not allowed by CORS')); // Block the origin
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Use body-parser middleware
app.use(bodyParser.json());

// API routes (mounted under /api)
app.use('/api', chatRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Log if the OpenAI API Key is loaded
console.log('Loaded OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Key found' : 'Key missing');

// Export the app (for Vercel serverless deployment)
module.exports = app;
