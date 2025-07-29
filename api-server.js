require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const API_PORT = process.env.API_PORT || 8443;

// Middleware
app.use(express.json());

// In-memory data store for demo purposes
const users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', created: '2024-01-15' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', created: '2024-02-20' },
    { id: 3, name: 'Carol Davis', email: 'carol@example.com', role: 'user', created: '2024-03-10' }
];

let nextUserId = 4;

// HTTPS/TLS configuration for MTLS with system-trusted certificates
const tlsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'server-mkcert.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server-mkcert.crt')),
    ca: fs.readFileSync(path.join(__dirname, 'ca.crt')), // Still use original CA for client cert validation
    requestCert: true,
    rejectUnauthorized: true
};

// Middleware to validate client certificates
function validateClientCertificate(req, res, next) {
    const clientCert = req.socket.getPeerCertificate();
    
    if (!clientCert || !Object.keys(clientCert).length) {
        return res.status(401).json({
            error: 'Client certificate required',
            message: 'MTLS authentication failed - no client certificate provided'
        });
    }

    // Validate certificate properties
    if (!clientCert.subject || !clientCert.issuer) {
        return res.status(401).json({
            error: 'Invalid client certificate',
            message: 'Client certificate missing required fields'
        });
    }

    // Log certificate info for demo purposes
    console.log('✅ Valid client certificate:', {
        subject: clientCert.subject.CN || clientCert.subject,
        issuer: clientCert.issuer.CN || clientCert.issuer,
        fingerprint: clientCert.fingerprint,
        valid_from: clientCert.valid_from,
        valid_to: clientCert.valid_to
    });

    // Attach certificate info to request for potential use in endpoints
    req.clientCert = {
        subject: clientCert.subject.CN || 'Unknown',
        fingerprint: clientCert.fingerprint,
        issuer: clientCert.issuer.CN || 'Unknown'
    };

    next();
}

// Apply MTLS validation to all routes
app.use(validateClientCertificate);

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'MTLS-enabled API',
        client_cert: req.clientCert,
        tls_info: {
            cipher: req.socket.getCipher(),
            protocol: req.socket.getProtocol()
        }
    });
});

// Get all users
app.get('/api/users', (req, res) => {
    console.log(`📥 GET /api/users from client: ${req.clientCert.subject}`);
    
    const response = {
        success: true,
        data: users,
        meta: {
            count: users.length,
            timestamp: new Date().toISOString(),
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID()
        }
    };
    
    res.json(response);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    
    console.log(`📥 GET /api/users/${userId} from client: ${req.clientCert.subject}`);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
            meta: {
                timestamp: new Date().toISOString(),
                authenticated_client: req.clientCert.subject,
                request_id: crypto.randomUUID()
            }
        });
    }
    
    res.json({
        success: true,
        data: user,
        meta: {
            timestamp: new Date().toISOString(),
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID()
        }
    });
});

// Create new user
app.post('/api/users', (req, res) => {
    console.log(`📥 POST /api/users from client: ${req.clientCert.subject}`, req.body);
    
    const { name, email, role = 'user' } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            success: false,
            error: 'Name and email are required',
            meta: {
                timestamp: new Date().toISOString(),
                authenticated_client: req.clientCert.subject,
                request_id: crypto.randomUUID()
            }
        });
    }
    
    const newUser = {
        id: nextUserId++,
        name,
        email,
        role,
        created: new Date().toISOString().split('T')[0]
    };
    
    users.push(newUser);
    
    res.status(201).json({
        success: true,
        data: newUser,
        meta: {
            timestamp: new Date().toISOString(),
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID()
        }
    });
});

// Update user
app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    console.log(`📥 PUT /api/users/${userId} from client: ${req.clientCert.subject}`, req.body);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
            meta: {
                timestamp: new Date().toISOString(),
                authenticated_client: req.clientCert.subject,
                request_id: crypto.randomUUID()
            }
        });
    }
    
    const { name, email, role } = req.body;
    const updatedUser = {
        ...users[userIndex],
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role })
    };
    
    users[userIndex] = updatedUser;
    
    res.json({
        success: true,
        data: updatedUser,
        meta: {
            timestamp: new Date().toISOString(),
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID()
        }
    });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);
    
    console.log(`📥 DELETE /api/users/${userId} from client: ${req.clientCert.subject}`);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found',
            meta: {
                timestamp: new Date().toISOString(),
                authenticated_client: req.clientCert.subject,
                request_id: crypto.randomUUID()
            }
        });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    res.json({
        success: true,
        data: deletedUser,
        message: 'User deleted successfully',
        meta: {
            timestamp: new Date().toISOString(),
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID()
        }
    });
});

// Generic data endpoint for testing
app.get('/api/data', (req, res) => {
    console.log(`📥 GET /api/data from client: ${req.clientCert.subject}`);
    
    res.json({
        success: true,
        data: {
            message: 'Hello from MTLS-secured API',
            timestamp: new Date().toISOString(),
            random_value: Math.floor(Math.random() * 1000),
            server_info: {
                version: '1.0.0',
                environment: 'demo'
            }
        },
        meta: {
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID(),
            endpoint: '/api/data'
        }
    });
});

// Generic data POST endpoint
app.post('/api/data', (req, res) => {
    console.log(`📥 POST /api/data from client: ${req.clientCert.subject}`, req.body);
    
    res.json({
        success: true,
        data: {
            message: 'Data received successfully',
            received_data: req.body,
            processed_at: new Date().toISOString(),
            echo: `Hello ${req.clientCert.subject}, your data was processed`
        },
        meta: {
            authenticated_client: req.clientCert.subject,
            request_id: crypto.randomUUID(),
            endpoint: '/api/data'
        }
    });
});

// API info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        api: {
            name: 'MTLS Demo API',
            version: '1.0.0',
            description: 'Demonstration API with mutual TLS authentication',
            endpoints: {
                'GET /health': 'Health check and TLS info',
                'GET /api/users': 'List all users',
                'GET /api/users/:id': 'Get user by ID',
                'POST /api/users': 'Create new user',
                'PUT /api/users/:id': 'Update user',
                'DELETE /api/users/:id': 'Delete user',
                'GET /api/data': 'Generic data endpoint',
                'POST /api/data': 'Generic data submission',
                'GET /api/info': 'This endpoint'
            }
        },
        security: {
            mtls_enabled: true,
            client_cert_required: true,
            authenticated_as: req.clientCert.subject
        },
        meta: {
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID()
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 API Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        meta: {
            timestamp: new Date().toISOString(),
            request_id: crypto.randomUUID()
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        meta: {
            timestamp: new Date().toISOString(),
            authenticated_client: req.clientCert?.subject || 'Unknown',
            request_id: crypto.randomUUID()
        }
    });
});

// Start HTTPS server with MTLS
const server = https.createServer(tlsOptions, app);

server.listen(API_PORT, () => {
    console.log(`🔒 MTLS-enabled API Server running on https://localhost:${API_PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  - GET  /health');
    console.log('  - GET  /api/info');
    console.log('  - GET  /api/users');
    console.log('  - POST /api/users');
    console.log('  - GET  /api/data');
    console.log('  - POST /api/data');
    console.log('🔐 MTLS certificate validation: ENABLED');
    console.log('🎯 Use this as your target API for WireMock recording');
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${API_PORT} is already in use`);
        console.error('   Try a different port: API_PORT=8444 node api-server.js');
    } else if (error.code === 'ENOENT') {
        console.error('❌ Certificate files not found');
        console.error('   Make sure server.crt, server.key, and ca.crt exist');
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MTLS API server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});