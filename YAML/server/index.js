import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || AIzaSyDZJdWJoDWDciOHg6adrZqLXS8wedcmeF8 );

// In-memory storage (replace with a proper database in production)
const users = [];
const configurations = [];

app.use(express.json());

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// YAML routes
app.post('/api/yaml/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    console.log('Received prompt:', prompt); // Debug log

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const systemPrompt = `You are a YAML configuration generator for infrastructure deployment. 
    Generate valid YAML based on the following requirements. 
    Only respond with the YAML content, no additional text.
    Make sure the YAML is properly formatted and includes appropriate indentation.
    Requirements: ${prompt}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const yamlContent = response.text();

    console.log('Generated YAML:', yamlContent); // Debug log

    if (!yamlContent) {
      throw new Error('No YAML content generated');
    }

    res.json({ yaml: yamlContent });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      message: 'Error generating YAML',
      error: error.message 
    });
  }
});

app.post('/api/yaml/save', authenticateToken, (req, res) => {
  try {
    const { yaml, name } = req.body;
    const config = {
      id: configurations.length + 1,
      userId: req.user.id,
      name,
      yaml,
      createdAt: new Date()
    };
    
    configurations.push(config);
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error saving configuration' });
  }
});

app.get('/api/yaml/configurations', authenticateToken, (req, res) => {
  try {
    const userConfigs = configurations.filter(c => c.userId === req.user.id);
    res.json(userConfigs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching configurations' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});