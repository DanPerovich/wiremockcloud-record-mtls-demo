require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configuration for different endpoints (fallback defaults)
const defaultConfig = {
    live: {
        baseUrl: process.env.LIVE_API_URL || 'https://localhost:8443',
        description: 'Live API Endpoint'
    },
    wiremock: {
        baseUrl: process.env.WIREMOCK_RECORDER_URL || 'http://localhost:8000',
        description: 'WireMock CLI Recorder Proxy'
    },
    mock: {
        baseUrl: null,
        description: 'Mock API Endpoint'
    }
};

// MTLS certificate configuration
const tlsOptions = {
    cert: fs.readFileSync(path.join(__dirname, 'client.crt')),
    key: fs.readFileSync(path.join(__dirname, 'client.key')),
    ca: fs.readFileSync(path.join(__dirname, 'ca.crt')),
    rejectUnauthorized: false // Set to true in production with proper CA validation
};

// Helper function to make requests (HTTPS with MTLS or HTTP for proxy)
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const requestModule = isHttps ? https : http;
        
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WireMock-MTLS-Demo/1.0',
                ...options.headers
            }
        };

        // Only add TLS options for HTTPS requests (live API)
        if (isHttps) {
            Object.assign(requestOptions, tlsOptions);
        }

        const req = requestModule.request(url, requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        rawData: data
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: { raw: data },
                        rawData: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Helper function to get configuration for request
function getRequestConfig(mode, queryParams) {
    const baseConfig = defaultConfig[mode];
    if (!baseConfig) {
        return null;
    }

    // Use URL from query params if provided, otherwise use default
    const baseUrl = queryParams.url || baseConfig.baseUrl;
    
    // For WireMock mode, handle custom port
    if (mode === 'wiremock' && queryParams.port) {
        const port = parseInt(queryParams.port);
        return {
            baseUrl: `http://localhost:${port}`,
            description: `${baseConfig.description} (Port ${port})`
        };
    }
    
    return {
        baseUrl: baseUrl,
        description: baseConfig.description
    };
}

// API Routes
app.get('/api/data', async (req, res) => {
    const mode = req.query.mode || 'live';
    const targetConfig = getRequestConfig(mode, req.query);
    
    if (!targetConfig) {
        return res.status(400).json({ error: 'Invalid mode specified' });
    }

    if (!targetConfig.baseUrl) {
        return res.status(400).json({ 
            error: 'Endpoint not configured',
            message: `Please configure the ${mode} endpoint URL`,
            mode: mode
        });
    }

    try {
        console.log(`Making GET request to ${targetConfig.baseUrl}/api/users`);
        
        const response = await makeRequest(`${targetConfig.baseUrl}/api/users`, {
            method: 'GET'
        });

        // Add metadata about the request
        const result = {
            meta: {
                endpoint: targetConfig.description,
                mode: mode,
                timestamp: new Date().toISOString(),
                statusCode: response.statusCode
            },
            data: response.data
        };

        res.json(result);
    } catch (error) {
        console.error('MTLS request failed:', error);
        res.status(500).json({
            error: 'MTLS request failed',
            message: error.message,
            mode: mode,
            endpoint: targetConfig.description
        });
    }
});

app.post('/api/data', async (req, res) => {
    const mode = req.query.mode || 'live';
    const targetConfig = getRequestConfig(mode, req.query);
    
    if (!targetConfig) {
        return res.status(400).json({ error: 'Invalid mode specified' });
    }

    if (!targetConfig.baseUrl) {
        return res.status(400).json({ 
            error: 'Endpoint not configured',
            message: `Please configure the ${mode} endpoint URL`,
            mode: mode
        });
    }

    try {
        console.log(`Making POST request to ${targetConfig.baseUrl}/api/users`);
        
        const response = await makeRequest(`${targetConfig.baseUrl}/api/users`, {
            method: 'POST',
            body: req.body
        });

        // Add metadata about the request
        const result = {
            meta: {
                endpoint: targetConfig.description,
                mode: mode,
                timestamp: new Date().toISOString(),
                statusCode: response.statusCode,
                requestBody: req.body
            },
            data: response.data
        };

        res.json(result);
    } catch (error) {
        console.error('MTLS request failed:', error);
        res.status(500).json({
            error: 'MTLS request failed',
            message: error.message,
            mode: mode,
            endpoint: targetConfig.description,
            requestBody: req.body
        });
    }
});

// Configuration endpoints
app.get('/api/config', (req, res) => {
    res.json({
        availableEndpoints: Object.keys(defaultConfig).map(key => ({
            key,
            ...defaultConfig[key]
        })),
        defaultConfig: defaultConfig
    });
});

// Save/update configuration endpoint
app.post('/api/config', (req, res) => {
    const { mode, config: newConfig } = req.body;
    
    if (!mode || !newConfig) {
        return res.status(400).json({ 
            error: 'Mode and config are required',
            received: { mode, config: newConfig }
        });
    }
    
    // Note: In a real application, you might want to persist this to a database
    // For now, we just acknowledge the configuration
    res.json({
        success: true,
        message: 'Configuration received',
        mode: mode,
        config: newConfig,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        certificates: {
            client_cert: fs.existsSync(path.join(__dirname, 'client.crt')),
            client_key: fs.existsSync(path.join(__dirname, 'client.key')),
            ca_cert: fs.existsSync(path.join(__dirname, 'ca.crt'))
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 WireMock MTLS Demo Server running on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  - GET  /api/data?mode={live|wiremock}');
    console.log('  - POST /api/data?mode={live|wiremock}');
    console.log('  - GET  /api/config');
    console.log('  - GET  /api/health');
    console.log('🔒 MTLS certificates loaded successfully');
    console.log('🌐 Web interface: http://localhost:' + PORT);
});