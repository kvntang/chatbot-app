const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const chatRoutes = require('./routes');

const app = express();

// Middleware
// Update CORS to allow requests from your frontend
app.use(cors({
  origin: 'https://chatbot-kevin-selin.vercel.app', // Replace with your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(chatRoutes); // Use the routes defined in routes.js

// Export as a Vercel serverless function
module.exports = app;
