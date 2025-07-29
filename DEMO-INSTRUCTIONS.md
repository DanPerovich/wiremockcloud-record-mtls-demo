# WireMock Cloud CLI MTLS Recording Demo

This demo showcases WireMock Cloud's CLI recording capabilities with Mutual TLS (MTLS) authentication, advanced stub configuration, and dynamic response templating.

## Prerequisites

### 1. System Requirements
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **WireMock CLI** (installed globally)
- **mkcert** (for generating system-trusted certificates)

### 2. Install Required Tools

#### Install WireMock CLI
```bash
npm install -g wiremock
```

#### Install mkcert (for system-trusted certificates)
**macOS:**
```bash
brew install mkcert
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://dl.filippo.io/mkcert/latest?for=linux/amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

**Windows:**
```bash
# Using Chocolatey
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

### 3. WireMock Cloud Authentication
```bash
# Login to WireMock Cloud (required for recording)
wiremock login

# Verify authentication
wiremock cloud
```

### 4. Environment Setup

#### Generate System-Trusted Certificates
```bash
# Generate complete MTLS certificate infrastructure
./generate-ca-and-certs.sh
```

**Note**: If you see Java keystore errors during certificate generation, this is expected and doesn't affect functionality. The scripts automatically bypass Java keystore integration.

#### Install Dependencies
```bash
npm install
```

#### Verify Certificate Files
Ensure these files exist in the project directory:
- `client.crt` - Client certificate for MTLS
- `client.key` - Client private key
- `client-combined.pem` - Combined client cert+key for WireMock CLI
- `ca.crt` - Certificate Authority
- `server-mkcert.crt` - System-trusted server certificate
- `server-mkcert.key` - Server private key

## Demo Walkthrough

### Step 1: Start the Demo Application

```bash
npm start
```

This starts both:
- **Demo Web Server**: `http://localhost:3000` (Express web interface)
- **MTLS API Server**: `https://localhost:8443` (Target API with MTLS)

You should see:
```
✅ [Demo Starter] MTLS API Server started
✅ [Demo Starter] Both servers started successfully!

📋 Demo Information:
🌐 Web Interface:    http://localhost:3000
🔒 MTLS API Server:  https://localhost:8443
📊 Server Logs:      tail -f demo.log api.log

🎬 To start WireMock recording:
   node wiremock-setup.js start https://localhost:8443
```

### Step 2: Test Live API Endpoint

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **Verify Live API Mode**: 
   - Ensure "Live API Endpoint" is selected
   - Current endpoint should show `https://localhost:8443`

3. **Test API Functionality**:
   - Click **"Fetch Data"** - Should return user list with 200 status
   - Click **"Post Data"** - Should create user with random data and return 201 status

4. **Observe Logs**: Check `api.log` for MTLS certificate validation:
   ```
   ✅ Valid client certificate: {
     subject: 'client.wiremock-demo.com',
     issuer: 'WireMock Demo CA',
     ...
   }
   📥 GET /api/users from client: client.wiremock-demo.com
   ```

### Step 3: Start WireMock CLI Recording

```bash
node wiremock-setup.js start https://localhost:8443
```

Expected output:
```
✅ [WireMock Setup] All required certificates found
🎬 [WireMock Setup] Starting WireMock CLI recording for: https://localhost:8443
🎬 [WireMock Setup] Proxy will be available at: http://localhost:8000
✅ [WireMock Setup] WireMock CLI recording started successfully
🎬 [WireMock Setup] Command: wiremock record https://localhost:8443 --reverse-proxy-port 8000 --client-certificate ./client-combined.pem --import-config-file ./wiremock-advanced-config.json
🎬 [WireMock Setup] Proxy server running at: http://localhost:8000
🎬 [WireMock Setup] Switch your demo app to "WireMock Recorder" mode to route requests through the proxy
```

### Step 4: Configure Web App for Recording

1. **Switch to Recorder Mode**:
   - In the web interface, select **"WireMock Recorder"** radio button
   - Endpoint should now show `http://localhost:8000` (the proxy)

2. **Generate Recorded Traffic**:
   - Click **"Fetch Data"** several times
   - Click **"Post Data"** multiple times (generates different user data each time)
   - Each request goes through the WireMock proxy to the MTLS API

3. **Monitor Recording**: Watch the WireMock CLI output for recorded interactions

### Step 5: Review Recorded Stubs in WireMock Cloud

1. **Access WireMock Cloud**: Go to [WireMock Cloud](https://app.wiremock.cloud)

2. **Find Your Mock API**: Look for the auto-created mock API from the recording session

3. **Examine Generated Stubs**:
   - **GET requests**: Simple URL matching
   - **POST requests**: Enhanced with JSONPath matchers (due to `wiremock-advanced-config.json`)

4. **Example Enhanced POST Stub**:
   ```json
   {
     "request": {
       "method": "POST",
       "urlPath": "/api/users",
       "bodyPatterns": [
         {"matchesJsonPath": "$.name"},
         {"matchesJsonPath": "$.email"},
         {"matchesJsonPath": "$.role"}
       ]
     },
     "response": {
       "status": 201,
       "body": "...",
       "headers": {...}
     }
   }
   ```

### Step 6: Understanding Advanced Configuration

**File**: `wiremock-advanced-config.json`

This configuration transforms recorded stubs to use flexible matching:

```json
{
  "import": {
    "stubTemplateTransformationRules": [
      {
        "filter": {
          "request": {
            "method": "POST",
            "urlPath": "/api/users"
          }
        },
        "template": {
          "request": {
            "bodyPatterns": [
              {"matchesJsonPath": "$.name"},
              {"matchesJsonPath": "$.email"},
              {"matchesJsonPath": "$.role"}
            ]
          }
        }
      }
    ]
  }
}
```

**Benefits**:
- ✅ **Flexible Matching**: Stubs match any valid user data, not just recorded examples
- ✅ **Better Reusability**: Same stub works for different test scenarios
- ✅ **Schema Validation**: Ensures API contracts are maintained
- ✅ **Reduced Maintenance**: Fewer stubs needed for comprehensive testing

### Step 7: Test Mock API Endpoint

1. **Get Your Mock API URL**:
   - In WireMock Cloud, copy your Mock API's base URL
   - Example: `https://abc123.wiremockapi.cloud`

2. **Configure Mock Mode**:
   - Select **"Mock API Endpoint"** radio button
   - Paste your Mock API URL in the configuration field
   - Click **"Save Configuration"**

3. **Test Mock Responses**:
   - Click **"Fetch Data"** - Should return recorded responses
   - Click **"Post Data"** - Should match using JSONPath patterns

4. **Verify Flexible Matching**:
   - POST requests with different user data should still match
   - Thanks to JSONPath matchers, any valid user structure works

### Step 8: Enhanced Mock API with Dynamic Response Templating

For advanced scenarios, you can enhance stubs with dynamic response templating:

1. **In WireMock Cloud**, edit a POST stub response:
   ```json
   {
     "status": 201,
     "body": {
       "id": "{{randomValue length=8 type='ALPHANUMERIC'}}",
       "name": "{{jsonPath request.body '$.name'}}",
       "email": "{{jsonPath request.body '$.email'}}",
       "role": "{{jsonPath request.body '$.role'}}",
       "createdAt": "{{now}}",
       "message": "User {{jsonPath request.body '$.name'}} created successfully"
     },
     "headers": {
       "Content-Type": "application/json",
       "Location": "/api/users/{{randomValue length=8 type='ALPHANUMERIC'}}"
     }
   }
   ```

2. **Test Dynamic Responses**:
   - POST requests now return personalized responses
   - User names, emails are extracted from request body
   - Dynamic IDs and timestamps are generated

## Troubleshooting

### Certificate Issues
```bash
# Regenerate certificates if needed
./generate-mkcert-server-certs.sh

# Verify mkcert CA is installed
mkcert -CAROOT
```

### WireMock CLI Issues
```bash
# Check WireMock CLI installation
wiremock --version

# Verify authentication
wiremock cloud
```

### Port Conflicts
```bash
# Check if ports are in use
lsof -i :3000  # Demo server
lsof -i :8443  # MTLS API server
lsof -i :8000  # WireMock proxy
```

### View Server Logs
```bash
# Real-time log monitoring
tail -f demo.log api.log

# Or view specific logs
tail -f api.log    # MTLS API server logs
tail -f demo.log   # Demo web server logs
```

## Advanced Usage

### Custom WireMock Recording
```bash
# Record to specific Mock API
node wiremock-setup.js start https://localhost:8443 your-mock-api-id

# Record on custom port
node wiremock-setup.js start https://localhost:8443 your-mock-api-id 8080

# Stop recording
node wiremock-setup.js stop
```

### Server Management
```bash
# Start both servers
npm start

# Stop servers
npm run stop

# Check server status
npm run status
```

This demo showcases the power of WireMock Cloud's CLI for recording MTLS APIs with advanced configuration for flexible, reusable stub generation!