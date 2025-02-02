import yaml from 'js-yaml';
import axios from 'axios';

export interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
}

export interface User {
  id: string;
  email: string;
  token: string;
}

export const templates = [
  {
    name: 'Node.js App',
    description: 'Basic Node.js application with auto-scaling',
    yaml: `version: 1.0
services:
  app:
    compute:
      instance: basic
      memory: 1GB
    scaling:
      min: 1
      max: 3
    environment:
      NODE_ENV: production`
  },
  {
    name: 'Python Web App',
    description: 'Python web application with PostgreSQL',
    yaml: `version: 1.0
services:
  web:
    compute:
      instance: basic
      memory: 2GB
    scaling:
      min: 2
      max: 5
    environment:
      PYTHON_ENV: production
  
  database:
    type: postgresql
    version: 13
    storage: 10GB`
  }
];

export async function generateYaml(input: string): Promise<string> {
  try {
    console.log('Sending request with input:', input); // Debug log

    const response = await axios.post('http://localhost:3000/api/yaml/generate', { 
      prompt: input 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Received response:', response.data); // Debug log

    if (!response.data || !response.data.yaml) {
      throw new Error('Invalid response from server');
    }

    const yamlContent = response.data.yaml;
    
    // Validate the YAML
    try {
      yaml.load(yamlContent);
      return yamlContent;
    } catch (e) {
      console.error('YAML Validation Error:', e);
      throw new Error('Invalid YAML generated');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to generate YAML configuration');
    }
    console.error('Error generating YAML:', error);
    throw new Error('Failed to generate YAML configuration');
  }
}