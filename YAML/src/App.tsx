import React, { useState } from 'react';
import { MessageSquarePlus, Send, Copy, Download, Trash2, LogIn, BookTemplate as Template } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChatMessage, generateYaml, templates, validateYaml } from './utils';

SyntaxHighlighter.registerLanguage('yaml', yaml);

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [yamlContent, setYamlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedYaml = await generateYaml(input);
      setYamlContent(generatedYaml);
      
      const botResponse: ChatMessage = {
        type: 'bot',
        content: 'I\'ve generated a YAML configuration based on your request. You can view, copy, or download it using the controls below.'
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate YAML');
      const errorMessage: ChatMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error while generating the YAML configuration.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const downloadYaml = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spheron-config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([]);
    setYamlContent('');
    setError(null);
  };

  const applyTemplate = (templateYaml: string) => {
    setYamlContent(templateYaml);
    setShowTemplates(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquarePlus className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Spheron YAML Generator</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="inline-flex items-center px-3 py-2 border border-indigo-500 text-indigo-500 shadow-sm text-sm leading-4 font-medium rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Template className="h-4 w-4 mr-2" />
              Templates
            </button>
            <button
              onClick={() => setIsAuthenticated(!isAuthenticated)}
              className="inline-flex items-center px-3 py-2 border border-indigo-500 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isAuthenticated ? 'Logout' : 'Login'}
            </button>
            <button
              onClick={clearChat}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chat Section */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center">
                    <div className="animate-pulse text-indigo-600">
                      Generating YAML...
                    </div>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your deployment needs..."
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* YAML Preview Section */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Generated YAML</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyYaml}
                  disabled={!yamlContent}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </button>
                <button
                  onClick={downloadYaml}
                  disabled={!yamlContent}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
            <div className="p-4">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {error}
                </div>
              )}
              <SyntaxHighlighter
                language="yaml"
                style={docco}
                className="rounded-md"
              >
                {yamlContent || 'No YAML generated yet...'}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Template Gallery</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:border-indigo-500 cursor-pointer"
                    onClick={() => applyTemplate(template.yaml)}
                  >
                    <h4 className="font-medium mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;