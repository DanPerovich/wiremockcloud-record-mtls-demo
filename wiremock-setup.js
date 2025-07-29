#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class WireMockSetup {
    constructor() {
        this.recordingProcess = null;
        this.isRecording = false;
    }

    log(message) {
        console.log(`🎬 [WireMock Setup] ${message}`);
    }

    error(message) {
        console.error(`❌ [WireMock Setup] ${message}`);
    }

    success(message) {
        console.log(`✅ [WireMock Setup] ${message}`);
    }

    checkCertificates() {
        const requiredFiles = ['client.crt', 'client.key', 'ca.crt'];
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
        
        if (missingFiles.length > 0) {
            this.error(`Missing certificate files: ${missingFiles.join(', ')}`);
            return false;
        }
        
        this.success('All required certificates found');
        return true;
    }

    startRecording(targetUrl, mockApiId = null, port = 8000) {
        if (this.isRecording) {
            this.error('Recording is already in progress');
            return;
        }

        if (!this.checkCertificates()) {
            return;
        }

        this.log(`Starting WireMock CLI recording for: ${targetUrl}`);
        this.log(`Proxy will be available at: http://localhost:${port}`);
        
        const args = [
            'record', 
            targetUrl,
            '--reverse-proxy-port', port.toString(),
            '--client-certificate', './client-combined.pem',
            '--import-config-file', './wiremock-advanced-config.json'
        ];

        if (mockApiId) {
            args.push('--to', `cloud:${mockApiId}`);
        }

        // Use default Java SSL settings since we have system-trusted certificates
        const env = {
            ...process.env
        };

        this.recordingProcess = spawn('wiremock', args, {
            stdio: 'inherit',
            env: env
        });

        this.recordingProcess.on('spawn', () => {
            this.isRecording = true;
            this.success('WireMock CLI recording started successfully');
            this.log(`Command: wiremock ${args.join(' ')}`);
            this.log(`Proxy server running at: http://localhost:${port}`);
            this.log('Switch your demo app to "WireMock Recorder" mode to route requests through the proxy');
        });

        this.recordingProcess.on('error', (error) => {
            this.error(`Failed to start recording: ${error.message}`);
            this.isRecording = false;
        });

        this.recordingProcess.on('exit', (code) => {
            this.isRecording = false;
            if (code === 0) {
                this.success('Recording stopped successfully');
            } else {
                this.error(`Recording process exited with code ${code}`);
            }
        });
    }

    stopRecording() {
        if (!this.isRecording || !this.recordingProcess) {
            this.error('No recording in progress');
            return;
        }

        this.log('Stopping WireMock recording...');
        this.recordingProcess.kill('SIGTERM');
    }

    getStatus() {
        if (this.isRecording) {
            this.log('Status: WireMock CLI recording in progress');
            this.log('Proxy URL: http://localhost:8000');
        } else {
            this.log('Status: Not recording');
        }
    }

    showHelp() {
        console.log(`
🎬 WireMock CLI MTLS Demo Setup Helper

Usage:
  node wiremock-setup.js <command> [options]

Commands:
  start <target-url> [mock-api-id] [port]  Start CLI recording from target URL
  stop                                     Stop current recording
  status                                   Show recording status
  help                                     Show this help message

Examples:
  # Start recording from local MTLS API (proxy on default port 8000)
  node wiremock-setup.js start https://localhost:8443

  # Start recording and save to specific Mock API
  node wiremock-setup.js start https://localhost:8443 my-mock-api-id

  # Start recording on custom port
  node wiremock-setup.js start https://localhost:8443 my-mock-api-id 8080

  # Stop recording
  node wiremock-setup.js stop

  # Check status
  node wiremock-setup.js status

Requirements:
  - WireMock CLI installed: npm install -g wiremock
  - MTLS certificates including client-combined.pem in project directory
  - Valid WireMock Cloud account and authentication

Setup Instructions:
  1. Install WireMock CLI: npm install -g wiremock
  2. Login to WireMock Cloud: wiremock login
  3. Ensure client-combined.pem exists (combines client cert and key)
  4. Start recording: node wiremock-setup.js start <your-api-url>
  5. Run your demo app: npm start
  6. Switch to "WireMock Recorder" mode in the web interface
  7. Make requests through the demo interface
  8. Stop recording: node wiremock-setup.js stop

The WireMock CLI recorder creates a proxy server that forwards requests to your
target API while recording the interactions for later playback.

Configuration Features:
- Uses wiremock-advanced-config.json for sophisticated request matching
- POST requests will use JSON schema pattern matching
- Flexible matching for better stub reusability in WireMock Cloud
- Supports MTLS authentication with client certificates
        `);
    }
}

// CLI handling
const setup = new WireMockSetup();
const [,, command, ...args] = process.argv;

switch (command) {
    case 'start':
        if (args.length === 0) {
            setup.error('Target URL is required');
            setup.showHelp();
            process.exit(1);
        }
        const port = args[2] ? parseInt(args[2]) : 8000;
        setup.startRecording(args[0], args[1], port);
        break;
    
    case 'stop':
        setup.stopRecording();
        break;
    
    case 'status':
        setup.getStatus();
        break;
    
    case 'help':
    default:
        setup.showHelp();
        break;
}

// Handle process termination
process.on('SIGINT', () => {
    setup.log('Received SIGINT, stopping recording...');
    setup.stopRecording();
    process.exit(0);
});

process.on('SIGTERM', () => {
    setup.log('Received SIGTERM, stopping recording...');
    setup.stopRecording();
    process.exit(0);
});