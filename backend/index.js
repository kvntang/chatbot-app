// backend/index.js

const express = require('express');
const cors = require('cors'); // To handle CORS
const bodyParser = require('body-parser'); // To parse incoming JSON
require('dotenv').config(); // Load environment variables

const chatRoutes = require('./routes'); // Import the router from routes.js

const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable for PORT or default to 5000

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(bodyParser.json()); // Parse incoming JSON requests

// Use the routes defined in routes.js
app.use(chatRoutes); // This mounts all the routes in routes.js

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
