// backend/routes.js


//this code handles all the routing, aka POST requests
//we should have 3 different routes
// 1. GenericBot
// 2. FutureUser
// 3. FutureBot

const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

const router = express.Router();



// Define the system message to set the behavior of the assistant
const genericBotSystemMessage = {
  role: 'system',
  content: 'You are a wise historian and philosopher. Use emojis to add liveliness and humor. Provide a concise historical insight or philosophical observation, followed by an intriguing, open-ended question that invites reflection. You may use simple ASCII art occasionally to make points visually engaging. Keep responses under 25 words.' // Customize the behavior
  };

// TODO: mergeSystemMessage (this is the Merge bot )
const mergeSystemMessage = {
  role: 'system',
  content: '"You are a curious conversationalist overhearing two intriguing statements. Use emojis or simple ASCII to add expressiveness. Imagine weaving these two threads into a coherent thought or question that links them together in an unexpected way. Be brief and thought-provoking—less than 25 words.' // Customize the behavior
  };

// TODO: futureBotSystemMessage (this is the Future bot )
const futureBotSystemMessage = {
  role: 'system',
  content: 'You are an eccentric visionary, blending science, history, and speculation. Use emojis to convey futuristic ideas and simple ASCII art to visualize concepts. Respond with scenarios or hypotheses that challenge the understanding of history and technology. Be evocative, imaginative, and under 25 words.' // Customize the behavior
  };


// TODO: futureUserSystemMessage (this is the Future User )
const futureUserSystemMessage = {
  role: 'system',
  content: 'You are a reflection of the user—a mirror of their curiosity and thoughts. Adapt your tone to echo theirs, and respond in a way that deepens their questions, especially those concerning history and the essence of chatbots. Inspire them to continue exploring. Keep responses under 25 words.' // Customize the behavior
  };




// 1. POST GenericBot //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/api/generic_bot', async (req, res) => {
  const messageHistory = req.body.messageHistory; // Extract the message history from the request body
  const API_KEY = process.env.OPENAI_API_KEY; // Load the OpenAI API key from environment variables

  if (!messageHistory || !API_KEY) {
    return res.status(400).json({ error: 'Invalid request, missing message history or API key' });
  }

  // Prepare the API request body with the system message and the message history
  const apiRequestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
        genericBotSystemMessage,     // Include the system message at the start
      ...messageHistory  // Add the message history from the conversation
    ]
  };

  try {
    // Send the request to the OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', apiRequestBody, {
      headers: {
        Authorization: `Bearer ${API_KEY}`, // Include API key in Authorization header
        'Content-Type': 'application/json',
      },
    });

    // Return the AI's response to the frontend
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error fetching reply from OpenAI:', error);
    res.status(500).json({ error: 'Error fetching reply from OpenAI' });
  }
});


// 2. POST  Merge Message  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/api/merge', async (req, res) => {
  const messageHistory = req.body.messageHistory; // Extract the message history from the request body
  const API_KEY = process.env.OPENAI_API_KEY; // Load the OpenAI API key from environment variables

  if (!messageHistory || !API_KEY) {
    return res.status(400).json({ error: 'Invalid request, missing message history or API key' });
  }

  // Prepare the API request body with the system message and the message history
  const apiRequestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      mergeSystemMessage,     // Include the system message at the start
      ...messageHistory  // Add the message history from the conversation
    ]
  };

  try {
    // Send the request to the OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', apiRequestBody, {
      headers: {
        Authorization: `Bearer ${API_KEY}`, // Include API key in Authorization header
        'Content-Type': 'application/json',
      },
    });

    // Return the AI's response to the frontend
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error fetching reply from OpenAI:', error);
    res.status(500).json({ error: 'Error fetching reply from OpenAI' });
  }
});


// 3. POST FutureBot //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/api/bot', async (req, res) => {
  const messageHistory = req.body.messageHistory; // Extract the message history from the request body
  const API_KEY = process.env.OPENAI_API_KEY; // Load the OpenAI API key from environment variables

  if (!messageHistory || !API_KEY) {
    return res.status(400).json({ error: 'Invalid request, missing message history or API key' });
  }

  // Prepare the API request body with the system message and the message history
  const apiRequestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      futureBotSystemMessage,     // Include the system message at the start
      ...messageHistory  // Add the message history from the conversation
    ]
  };

  try {
    // Send the request to the OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', apiRequestBody, {
      headers: {
        Authorization: `Bearer ${API_KEY}`, // Include API key in Authorization header
        'Content-Type': 'application/json',
      },
    });

    // Return the AI's response to the frontend
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error fetching reply from OpenAI:', error);
    res.status(500).json({ error: 'Error fetching reply from OpenAI' });
  }
});



// 3. POST FutureUser //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/api/user', async (req, res) => {
  const messageHistory = req.body.messageHistory; // Extract the message history from the request body
  const API_KEY = process.env.OPENAI_API_KEY; // Load the OpenAI API key from environment variables

  if (!messageHistory || !API_KEY) {
    return res.status(400).json({ error: 'Invalid request, missing message history or API key' });
  }

  // Prepare the API request body with the system message and the message history
  const apiRequestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
        futureUserSystemMessage,     // Include the system message at the start
      ...messageHistory  // Add the message history from the conversation
    ]
  };

  try {
    // Send the request to the OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', apiRequestBody, {
      headers: {
        Authorization: `Bearer ${API_KEY}`, // Include API key in Authorization header
        'Content-Type': 'application/json',
      },
    });

    // Return the AI's response to the frontend
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error fetching reply from OpenAI:', error);
    res.status(500).json({ error: 'Error fetching reply from OpenAI' });
  }
});


//export 
module.exports = router;
