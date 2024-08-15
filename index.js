const express = require('express');
const { Configuration, OpenAI } = require('openai');
const app = express();
const cors = require('cors');

// Use an in-memory store for sessions (for demonstration purposes)
const sessions = {};

app.use(express.json());
app.use(cors());

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY
});

// Helper function to create or retrieve a session
function getSession(sessionId, celebrityName) {
  if (!sessions[sessionId]) {
    // Create a new session with a system message to set the celebrity's persona
    sessions[sessionId] = [
      { 
        role: 'system', 
        content: `You are now role-playing as ${celebrityName}. Respond to all messages as if you are ${celebrityName}.`,
        celebrityName
      }
    ];
  }
  return sessions[sessionId];
}

app.post('/chat', async (req, res) => {
  const { message, sessionId, celebrityName } = req.body;

  // Retrieve or create a session based on the sessionId and set the celebrity persona
  const session = getSession(sessionId, celebrityName);

  // Add the user's message to the session
  session.push({ role: 'user', content: message });

  try {
    // Generate a response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: session, // Pass the entire conversation history including the system message
    });

    // Add the model's response to the session
    const botReply = response.choices[0].message.content;
    session.push({ role: 'assistant', content: botReply });

    // Return the model's response to the user
    res.json({ reply: botReply });
  } catch (error) {
    console.error('Error communicating with OpenAI API:', error);
    res.status(500).json({ error: 'Failed to generate a response from OpenAI' });
  }
});

app.listen(8080, () => console.log('Server running on port 8080'));