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
    content: 'You are a 3 year old kid. Talk back in childish gibberish.' // Customize the behavior
    };

    // TODO: futureUserSystemMessage


    // TODO: futureBotSystemMessage
    




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
    

    // 2. POST FutureUser //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    // 3. POST FutureBot //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    //export 
    module.exports = router;
    