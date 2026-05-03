import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Copy, Check, Settings, Send, Database, AlertCircle } from 'lucide-react';
import axios from 'axios';
import API from '../api';

interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
}

interface APIResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  time: number;
}

interface ApiKeyData {
  _id: string;
  name: string;
  key: string;
  api?: {
    _id: string;
    name: string;
    baseUrl: string;
  };
  usage?: number;
}

const APIPlayground: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [useGateway, setUseGateway] = useState(false);
  
  const [request, setRequest] = useState<APIRequest>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: {
      'Content-Type': 'application/json'
    },
    body: ''
  });

  // Load API keys on component mount
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const response = await API.get('/mems/keys');
        setApiKeys(response.data);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      }
    };
    fetchKeys();
  }, []);
  
  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'headers'>('request');

  const commonEndpoints = [
    { name: 'JSONPlaceholder - Get Posts', url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET' },
    { name: 'JSONPlaceholder - Create Post', url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST' },
    { name: 'Pokemon API - Get Pikachu', url: 'https://pokeapi.co/api/v2/pokemon/pikachu', method: 'GET' },
    { name: 'DummyJSON - Get Products', url: 'https://dummyjson.com/products', method: 'GET' },
    { name: 'Weather API - Current', url: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=your_api_key', method: 'GET' }
  ];

  const executeRequest = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      // If gateway mode is enabled, route through MeterFlow gateway
      let finalUrl = request.url;
      let finalHeaders = { ...request.headers };
      
      if (useGateway && selectedKeyId) {
        const selectedKey = apiKeys.find(k => k._id === selectedKeyId);
        if (!selectedKey) {
          throw new Error('Selected API key not found');
        }
        
        if (!selectedKey.api?._id) {
          throw new Error('API not found for this key');
        }
        
        // Add API key header for gateway authentication
        finalHeaders['x-api-key'] = selectedKey.key;
        
        // Route through MeterFlow gateway using the actual API ID
        // Remove protocol from URL and use the API's base URL path
        const pathOnly = request.url.replace(/^https?:\/\/[^\/]+/, '');
        finalUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '')}/gateway/${selectedKey.api._id}${pathOnly}`;
        
        console.log('🚀 Gateway Request:', { finalUrl, apiId: selectedKey.api._id, keyId: selectedKeyId });
      }
      
      const config: any = {
        method: request.method,
        url: finalUrl,
        headers: finalHeaders,
        timeout: 10000
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          config.data = JSON.parse(request.body);
        } catch (e) {
          config.data = request.body;
        }
      }

      const axiosResponse = await axios(config);
      const endTime = Date.now();

      setResponse({
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        data: axiosResponse.data,
        headers: axiosResponse.headers as Record<string, string>,
        time: endTime - startTime
      });
    } catch (error: any) {
      const endTime = Date.now();
      
      console.error('Request error:', error.message);
      setResponse({
        status: error.response?.status || 0,
        statusText: error.response?.statusText || error.message,
        data: error.response?.data || { error: error.message },
        headers: (error.response?.headers as Record<string, string>) || {},
        time: endTime - startTime
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    if (status >= 400 && status < 500) return 'text-orange-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            API Playground
          </h1>
          <p className="text-gray-400">Test your APIs with real-time requests and responses</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-800"
          >
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Send className="w-5 h-5 text-red-500" />
                Request
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Gateway Mode Toggle */}
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="gateway-mode"
                    checked={useGateway}
                    onChange={(e) => setUseGateway(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <label htmlFor="gateway-mode" className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Route through MeterFlow Gateway
                  </label>
                </div>
                {useGateway && (
                  <select
                    value={selectedKeyId}
                    onChange={(e) => setSelectedKeyId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300"
                  >
                    <option value="">Select API Key to track usage...</option>
                    {apiKeys.map(key => (
                      <option key={key._id} value={key._id}>
                        {key.name} - API: {key.api?.name || 'Unknown'} (Usage: {key.usage || 0})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Method and URL */}
              <div className="flex gap-2">
                <select
                  value={request.method}
                  onChange={(e) => setRequest({ ...request, method: e.target.value as any })}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                <input
                  type="text"
                  value={request.url}
                  onChange={(e) => setRequest({ ...request, url: e.target.value })}
                  placeholder="Enter API URL..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Common Endpoints */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Examples:</label>
                <div className="space-y-1">
                  {commonEndpoints.map((endpoint, index) => (
                    <button
                      key={index}
                      onClick={() => setRequest({
                        ...request,
                        url: endpoint.url,
                        method: endpoint.method as any
                      })}
                      className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded px-3 py-2 text-sm transition-colors"
                    >
                      <span className="text-red-400 font-medium">{endpoint.method}</span>
                      <span className="ml-2 text-gray-300">{endpoint.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Headers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Headers:</label>
                  <button
                    onClick={() => copyToClipboard(formatJSON(request.headers))}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <textarea
                  value={formatJSON(request.headers)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setRequest({ ...request, headers });
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="w-full h-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Body */}
              {['POST', 'PUT', 'PATCH'].includes(request.method) && (
                <div>
                  <label className="block text-sm font-medium mb-2">Body (JSON):</label>
                  <textarea
                    value={request.body}
                    onChange={(e) => setRequest({ ...request, body: e.target.value })}
                    placeholder='{"key": "value"}'
                    className="w-full h-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={executeRequest}
                disabled={loading || !request.url}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Request
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Response Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-800"
          >
            <div className="p-4 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-500" />
                  Response
                </h2>
                {response && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getStatusColor(response.status)}`}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-xs text-gray-400">
                      {response.time}ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              {response ? (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-gray-800">
                    <button
                      onClick={() => setActiveTab('response')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'response'
                          ? 'text-red-400 border-b-2 border-red-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Body
                    </button>
                    <button
                      onClick={() => setActiveTab('headers')}
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'headers'
                          ? 'text-red-400 border-b-2 border-red-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Headers
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'response' && (
                    <div className="relative">
                      <button
                        onClick={() => copyToClipboard(formatJSON(response.data))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <pre className="bg-gray-800 rounded p-4 text-sm font-mono overflow-auto max-h-96">
                        {formatJSON(response.data)}
                      </pre>
                    </div>
                  )}

                  {activeTab === 'headers' && (
                    <div className="relative">
                      <button
                        onClick={() => copyToClipboard(formatJSON(response.headers))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <pre className="bg-gray-800 rounded p-4 text-sm font-mono overflow-auto max-h-96">
                        {formatJSON(response.headers)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Execute a request to see the response</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default APIPlayground;
