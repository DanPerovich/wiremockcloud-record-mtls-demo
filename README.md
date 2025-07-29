# WireMock Cloud MTLS Demo Application

A demonstration application showcasing WireMock Cloud's CLI MTLS recording capabilities. This app features a simple web interface that can seamlessly switch between calling a live MTLS-secured API, a WireMock Cloud recorder, and a WireMock Mock API.

## 🚀 Features

- **Simple Web Interface**: Clean, responsive UI for testing API interactions
- **MTLS Support**: Full mutual TLS authentication with configurable certificates
- **Triple Mode Operation**: Switch between Live API, WireMock Recorder, and Mock API endpoints
- **User-Configurable Endpoints**: Set any API URL directly through the web interface
- **Custom WireMock Ports**: Specify recorder port for multiple concurrent recordings
- **Persistent Configuration**: Settings saved automatically with localStorage
- **Real-time Recording**: Capture MTLS API traffic for testing and development
- **Request/Response Display**: View API responses in real-time with proper formatting

## 📋 Prerequisites

1. **Node.js** (v14 or higher)
2. **WireMock CLI**: `npm install -g wiremock`
3. **WireMock Cloud Account**: Sign up at [WireMock Cloud](https://cloud.wiremock.com)
4. **mkcert**: For generating system-trusted certificates
   - **macOS**: `brew install mkcert`
   - **Linux**: `sudo apt install libnss3-tools` + download from [GitHub](https://github.com/FiloSottile/mkcert/releases)
   - **Windows**: `choco install mkcert` or download from GitHub
5. **MTLS Certificates**: Client certificate, private key, and CA certificate

## 🛠️ Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd wiremockcloud-record-mtls-demo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your specific configuration
   ```

4. **Set up certificates**:
   
   **Option A: Complete setup (recommended for new installations)**:
   ```bash
   # Generate complete MTLS certificate infrastructure
   ./generate-ca-and-certs.sh
   ```
   
   **Option B: Individual certificate generation**:
   ```bash
   # Install mkcert CA (run once per system)
   mkcert -install
   
   # Generate server certificates (system-trusted)
   ./generate-mkcert-server-certs.sh
   
   # Generate client certificates (if needed)
   ./generate-client-certs.sh
   ```

5. **Verify certificates are generated**:
   
   After running the certificate generation scripts, you should have:
   - `client.crt` - Client certificate
   - `client.key` - Client private key  
   - `client-combined.pem` - Combined client cert+key for WireMock CLI
   - `ca.crt` - Certificate Authority certificate
   - `server-mkcert.crt` - System-trusted server certificate
   - `server-mkcert.key` - Server private key
   
   ⚠️ **Security Note**: Certificate files are not included in this repository and must be generated locally.

## 🎬 Usage

### Quick Start (All-in-One)

```bash
# Start both the MTLS API server and demo web interface
npm start
```

This will start:
- MTLS API server on `https://localhost:8443`
- Demo web interface on `http://localhost:3000`

### Manual Start (Individual Services)

```bash
# Terminal 1: Start the MTLS API server
npm run api

# Terminal 2: Start the demo web interface  
npm start
```

The demo application will be available at `http://localhost:3000`

### Step 2: Test the System

The system comes with a built-in MTLS API server, so you can test immediately without external APIs:

1. **Direct MTLS Calls**: Use "Live API Endpoint" mode to call `https://localhost:8443` directly
2. **WireMock Recording**: Use the CLI recorder to capture and replay the interactions

To use your own MTLS API instead, edit the `.env` file:

```env
LIVE_API_URL=https://your-secure-api.example.com
```

### Step 3: Start WireMock CLI Recording

Use the provided helper script to start the WireMock CLI recorder:

```bash
# Start CLI recording from the local MTLS API (creates proxy on port 8000)
node wiremock-setup.js start https://localhost:8443

# Or save directly to a specific Mock API in WireMock Cloud
node wiremock-setup.js start https://localhost:8443 your-mock-api-id

# Use custom proxy port
node wiremock-setup.js start https://localhost:8443 your-mock-api-id 8080
```

### Step 4: Test the Application

1. Open `http://localhost:3000` in your browser
2. Use the **Live API Endpoint** option to test direct MTLS calls to your real API
3. Switch to **WireMock Recorder** to route requests through the WireMock CLI proxy
4. Use the **Fetch Data** and **Post Data** buttons to generate traffic
5. The WireMock CLI will record all interactions and can save them to WireMock Cloud

### Step 5: Stop Recording

```bash
node wiremock-setup.js stop
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Web Browser   │    │   Demo Server    │    │   Target API /      │
│                 │    │   (Express)      │    │   WireMock Recorder │
│  ┌───────────┐  │    │                  │    │                     │
│  │    UI     │──┼────┼──HTTP Requests───┼────┼──MTLS Requests──────│
│  │(HTML/CSS/ │  │    │                  │    │                     │
│  │   JS)     │  │    │  ┌─────────────┐ │    │                     │
│  └───────────┘  │    │  │Certificate  │ │    │                     │
│                 │    │  │Management   │ │    │                     │
└─────────────────┘    │  └─────────────┘ │    │                     │
                       └──────────────────┘    └─────────────────────┘
```

## 📁 Project Structure

```
wiremockcloud-record-mtls-demo/
├── public/                 # Frontend assets
│   ├── index.html         # Main web interface
│   ├── styles.css         # Application styling
│   └── app.js             # Frontend JavaScript
├── server.js              # Express server with MTLS support
├── api-server.js          # MTLS-enabled backend API server
├── wiremock-setup.js               # WireMock recording helper script
├── generate-ca-and-certs.sh       # Complete certificate infrastructure setup
├── generate-client-certs.sh       # Client certificate generation script  
├── generate-mkcert-server-certs.sh # System-trusted server certificate script
├── start-demo.js                   # All-in-one startup script
├── package.json           # Node.js dependencies
├── .env.example           # Environment configuration template
├── README.md              # This file
└── certificates/          # Certificate files directory
    └── README.md          # Certificate setup instructions
    
Note: Certificate files (*.crt, *.key, *.pem) are generated locally and not included in the repository for security reasons.
```

## 🔧 API Endpoints

### Demo Application Endpoints

- `GET /` - Web interface
- `GET /api/data?mode={live|wiremock}` - Fetch data from configured endpoint
- `POST /api/data?mode={live|wiremock}` - Send data to configured endpoint
- `GET /api/config` - View current configuration
- `GET /api/health` - Health check and certificate status

### Built-in MTLS API Server Endpoints

The included MTLS API server (`https://localhost:8443`) provides these endpoints:

- `GET /health` - Health check with TLS and certificate information
- `GET /api/info` - API information and available endpoints
- `GET /api/users` - List all users (sample data)
- `GET /api/users/:id` - Get specific user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/data` - Generic data endpoint for testing
- `POST /api/data` - Generic data submission endpoint

All endpoints require valid MTLS client certificates and return JSON responses with metadata about the authenticated client.

## ⚙️ Web Interface Configuration

The web interface supports three endpoint modes with user-configurable settings:

### 🔴 Live API Endpoint
- **Purpose**: Direct MTLS calls to your production or development API
- **Configuration**: Set custom base URL (default: `https://localhost:8443`)
- **Use Case**: Test against real API with full MTLS authentication

### 🔵 WireMock Recorder 
- **Purpose**: Route requests through WireMock CLI proxy for recording
- **Configuration**: Set custom port (default: `8000`)
- **URL Format**: Always `http://localhost:{port}`
- **Use Case**: Record API interactions for later playback/testing

### 🟢 Mock API Endpoint
- **Purpose**: Test against WireMock Cloud or other mock services
- **Configuration**: Set any mock API URL (e.g., `https://your-api.wiremock.cloud`)
- **Use Case**: Test against recorded/mocked API responses

### Configuration Features
- ✅ **Persistent Settings**: Automatically saved to browser localStorage
- ✅ **Real-time Updates**: URL and port changes reflected immediately  
- ✅ **Validation**: Input validation for URLs and port numbers
- ✅ **Visual Feedback**: Current endpoint displayed with full URL

### Configuration Options

The application supports two modes:

1. **Live Mode** (`mode=live`): Direct calls to your MTLS-secured API
2. **WireMock Mode** (`mode=wiremock`): Calls routed through WireMock recorder

## 🛡️ Security Considerations

⚠️ **IMPORTANT**: Read [SECURITY.md](SECURITY.md) for comprehensive security guidelines.

**Key Security Points**:
- **Never commit private keys** (`.key`, `.pem` files) to version control
- **Generate certificates locally** using the provided scripts
- **Use unique certificates** for each environment
- **Set proper file permissions** (600 for private keys, 644 for certificates)
- **Environment Variables**: Use `.env` files for sensitive configuration
- **HTTPS Only**: Always use HTTPS in production environments

## 🎯 Use Cases

1. **API Development**: Test MTLS APIs during development
2. **Testing**: Create reliable test doubles from real MTLS interactions  
3. **Documentation**: Generate API documentation from recorded traffic
4. **Debugging**: Analyze MTLS communication patterns
5. **Integration Testing**: Test client applications against recorded API behaviors

## 🔍 Troubleshooting

### Common Issues

**Certificate Errors**:
```bash
# Verify certificate files exist and are readable
ls -la *.crt *.key *.pem

# Check certificate validity
openssl x509 -in client.crt -text -noout
openssl x509 -in server-mkcert.crt -text -noout

# Regenerate system-trusted certificates if needed
./generate-mkcert-server-certs.sh

# Verify mkcert CA is installed
mkcert -CAROOT
```

**mkcert Java Keystore Issues**:
```bash
# If you see "keytool error: java.lang.Exception: Keystore file does not exist"
# This is a known issue but doesn't affect certificate generation
# The scripts are configured to bypass Java keystore integration

# To manually fix if certificates are missing:
JAVA_HOME="" mkcert -key-file server-mkcert.key -cert-file server-mkcert.crt localhost 127.0.0.1 ::1
```

**Connection Refused**:
- Ensure target API is accessible
- Check firewall and network settings
- Verify WireMock recorder is running on correct port

**WireMock CLI Issues**:
```bash
# Verify WireMock CLI installation
wiremock --version

# Check authentication status
wiremock auth status

# Re-authenticate if needed
wiremock login
```

## 📚 Additional Resources

- [WireMock Cloud Documentation](https://docs.wiremock.io)
- [MTLS Configuration Guide](https://docs.wiremock.io/wiremock-cloud/mtls)
- [Node.js HTTPS Documentation](https://nodejs.org/api/https.html)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This demo application is provided as-is for educational and demonstration purposes.

---

**Happy Testing with WireMock Cloud! 🎉**