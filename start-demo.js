#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DemoStarter {
    constructor() {
        this.demoProcess = null;
        this.apiProcess = null;
        this.isRunning = false;
    }

    log(message) {
        console.log(`🚀 [Demo Starter] ${message}`);
    }

    error(message) {
        console.error(`❌ [Demo Starter] ${message}`);
    }

    success(message) {
        console.log(`✅ [Demo Starter] ${message}`);
    }

    checkRequiredFiles() {
        const requiredFiles = [
            'server.js',
            'api-server.js',
            'package.json',
            'client.crt',
            'client.key',
            'ca.crt',
            'server-mkcert.crt',
            'server-mkcert.key'
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
        
        if (missingFiles.length > 0) {
            this.error(`Missing required files: ${missingFiles.join(', ')}`);
            return false;
        }
        
        return true;
    }

    startServers() {
        if (this.isRunning) {
            this.error('Servers are already running');
            return;
        }

        if (!this.checkRequiredFiles()) {
            return;
        }

        this.log('Starting WireMock MTLS Demo...');
        
        // Start API Server
        this.log('Starting MTLS API Server on https://localhost:8443...');
        this.apiProcess = spawn('node', ['api-server.js'], {
            stdio: ['inherit', 'pipe', 'pipe'],
            cwd: __dirname
        });

        // Redirect API server output to log file
        const apiLogStream = fs.createWriteStream(path.join(__dirname, 'api.log'), { flags: 'a' });
        this.apiProcess.stdout.pipe(apiLogStream);
        this.apiProcess.stderr.pipe(apiLogStream);

        // Start Demo Server with a slight delay
        setTimeout(() => {
            this.log('Starting Demo Web Server on http://localhost:3000...');
            this.demoProcess = spawn('node', ['server.js'], {
                stdio: ['inherit', 'pipe', 'pipe'],
                cwd: __dirname
            });

            // Redirect demo server output to log file
            const demoLogStream = fs.createWriteStream(path.join(__dirname, 'demo.log'), { flags: 'a' });
            this.demoProcess.stdout.pipe(demoLogStream);
            this.demoProcess.stderr.pipe(demoLogStream);

            this.demoProcess.on('spawn', () => {
                this.isRunning = true;
                this.success('Both servers started successfully!');
                console.log('\n📋 Demo Information:');
                console.log('🌐 Web Interface:    http://localhost:3000');
                console.log('🔒 MTLS API Server:  https://localhost:8443');
                console.log('📊 Server Logs:      tail -f demo.log api.log');
                console.log('\n🎬 To start WireMock recording:');
                console.log('   node wiremock-setup.js start https://localhost:8443');
                console.log('\n⏹️  To stop servers: Ctrl+C or node start-demo.js stop');
            });

        }, 2000);

        this.apiProcess.on('spawn', () => {
            this.success('MTLS API Server started');
        });

        this.apiProcess.on('error', (error) => {
            this.error(`Failed to start API server: ${error.message}`);
        });

        this.demoProcess?.on('error', (error) => {
            this.error(`Failed to start demo server: ${error.message}`);
        });

        this.apiProcess.on('exit', (code) => {
            this.log(`API server exited with code ${code}`);
            if (this.isRunning) {
                this.stopServers();
            }
        });

        this.demoProcess?.on('exit', (code) => {
            this.log(`Demo server exited with code ${code}`);
            if (this.isRunning) {
                this.stopServers();
            }
        });
    }

    stopServers() {
        if (!this.isRunning) {
            this.error('No servers are running');
            return;
        }

        this.log('Stopping servers...');
        
        if (this.demoProcess) {
            this.demoProcess.kill('SIGTERM');
        }
        
        if (this.apiProcess) {
            this.apiProcess.kill('SIGTERM');
        }

        this.isRunning = false;
        this.success('Servers stopped');
    }

    getStatus() {
        if (this.isRunning) {
            this.log('Status: Both servers are running');
            console.log('🌐 Demo Server:     http://localhost:3000');
            console.log('🔒 API Server:      https://localhost:8443');
        } else {
            this.log('Status: Servers are not running');
        }
    }

    showHelp() {
        console.log(`
🚀 WireMock MTLS Demo Starter

Usage:
  node start-demo.js [command]

Commands:
  start    Start both demo and API servers (default)
  stop     Stop all running servers
  status   Show server status
  help     Show this help message

What gets started:
  📱 Demo Web Server    - http://localhost:3000  (Express web interface)
  🔒 MTLS API Server    - https://localhost:8443 (Target API with MTLS)

After starting:
  1. Open http://localhost:3000 in your browser
  2. Use the web interface to test different endpoint modes
  3. Optionally start WireMock recording: node wiremock-setup.js start https://localhost:8443

Logs are written to:
  - demo.log (web server logs)
  - api.log (API server logs)

Requirements:
  - Node.js installed
  - All certificate files present (client.crt, client.key, ca.crt, server-mkcert.*)
  - Dependencies installed: npm install
        `);
    }
}

// Handle CLI
const starter = new DemoStarter();
const [,, command] = process.argv;

switch (command) {
    case 'stop':
        starter.stopServers();
        break;
    
    case 'status':
        starter.getStatus();
        break;
    
    case 'help':
        starter.showHelp();
        break;
    
    case 'start':
    default:
        starter.startServers();
        break;
}

// Handle process termination
process.on('SIGINT', () => {
    starter.log('Received SIGINT, stopping servers...');
    starter.stopServers();
    process.exit(0);
});

process.on('SIGTERM', () => {
    starter.log('Received SIGTERM, stopping servers...');
    starter.stopServers();
    process.exit(0);
});