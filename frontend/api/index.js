const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const chatRoutes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(chatRoutes); // Use the routes defined in routes.js

// Export as a Vercel serverless function
module.exports = app;
