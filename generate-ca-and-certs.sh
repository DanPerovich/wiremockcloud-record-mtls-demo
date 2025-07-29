#!/bin/bash

echo "🏗️  Setting up complete MTLS certificate infrastructure..."

# Function to generate CA
generate_ca() {
    echo "📜 Generating Certificate Authority (CA)..."
    
    # Generate CA private key
    openssl genrsa -out ca.key 4096
    
    # Generate CA certificate
    openssl req -new -x509 -key ca.key -sha256 -subj "/C=US/ST=Demo/L=Demo/O=WireMock Demo/CN=WireMock Demo CA" -days 3650 -out ca.crt
    
    echo "✅ CA generated successfully"
}

# Function to generate client certificates
generate_client() {
    echo "👤 Generating client certificates..."
    
    # Generate client private key
    openssl genrsa -out client.key 2048
    
    # Create client certificate signing request
    openssl req -new -key client.key -out client.csr -subj "/C=US/ST=Demo/L=Demo/O=WireMock Demo/OU=Client/CN=client.wiremock-demo.com"
    
    # Create client certificate extensions
    cat > client.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = client.wiremock-demo.com
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF
    
    # Generate client certificate
    openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365 -extfile client.ext
    
    # Create combined PEM for WireMock CLI
    cat client.crt client.key > client-combined.pem
    
    # Clean up
    rm client.csr client.ext
    
    echo "✅ Client certificates generated successfully"
}

# Function to generate mkcert server certificates
generate_mkcert_server() {
    echo "🖥️  Generating mkcert-based server certificates..."
    
    # Check if mkcert is installed
    if ! command -v mkcert &> /dev/null; then
        echo "❌ mkcert is not installed. Please install it first:"
        echo "   macOS: brew install mkcert"
        echo "   Linux: See https://github.com/FiloSottile/mkcert#linux"
        echo "   Windows: choco install mkcert"
        return 1
    fi
    
    # Install mkcert CA if not already done
    echo "📋 Installing mkcert CA..."
    JAVA_HOME="" mkcert -install
    
    # Generate server certificates using mkcert (disable Java keystore integration)
    echo "📝 Generating system-trusted server certificate..."
    JAVA_HOME="" mkcert -key-file server-mkcert.key -cert-file server-mkcert.crt localhost 127.0.0.1 ::1
    
    # Copy mkcert CA for reference
    CAROOT=$(mkcert -CAROOT)
    if [ -f "$CAROOT/rootCA.pem" ]; then
        cp "$CAROOT/rootCA.pem" mkcert-ca.crt
        echo "📋 Copied mkcert CA certificate to mkcert-ca.crt"
    fi
    
    echo "✅ mkcert server certificates generated successfully"
}

# Main execution
echo "🚀 MTLS Certificate Generation Script"
echo "=====================================)"
echo ""

# Check what already exists
existing_files=()
if [ -f "ca.crt" ]; then existing_files+=("ca.crt"); fi
if [ -f "ca.key" ]; then existing_files+=("ca.key"); fi
if [ -f "client.crt" ]; then existing_files+=("client.crt"); fi
if [ -f "client.key" ]; then existing_files+=("client.key"); fi
if [ -f "server-mkcert.crt" ]; then existing_files+=("server-mkcert.crt"); fi

if [ ${#existing_files[@]} -gt 0 ]; then
    echo "⚠️  Found existing certificate files: ${existing_files[*]}"
    echo ""
    read -p "Do you want to regenerate all certificates? This will overwrite existing files. (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Existing certificates preserved."
        exit 0
    fi
    echo ""
fi

# Generate CA
if [ ! -f "ca.crt" ] || [ ! -f "ca.key" ]; then
    generate_ca
else
    echo "📜 Using existing CA certificates"
fi

# Generate client certificates
generate_client

# Generate mkcert server certificates
generate_mkcert_server

# Verify all certificates
echo ""
echo "🔍 Verifying certificate chain..."

# Verify client cert
if openssl verify -CAfile ca.crt client.crt > /dev/null 2>&1; then
    echo "✅ Client certificate verification: PASSED"
else
    echo "❌ Client certificate verification: FAILED"
fi

# Verify server cert (system trust)
if openssl verify server-mkcert.crt > /dev/null 2>&1; then
    echo "✅ Server certificate system trust: PASSED"
else
    echo "⚠️  Server certificate system trust: Check manually"
fi

# Set permissions
chmod 600 *.key
chmod 644 *.crt *.pem

echo ""
echo "🎉 Complete MTLS certificate infrastructure generated!"
echo ""
echo "📁 Generated files:"
echo "   Certificate Authority:"
echo "     - ca.crt (CA certificate)"
echo "     - ca.key (CA private key)"
echo ""
echo "   Client Authentication:"
echo "     - client.crt (client certificate)"
echo "     - client.key (client private key)"
echo "     - client-combined.pem (combined for WireMock CLI)"
echo ""
echo "   Server (System-Trusted):"
echo "     - server-mkcert.crt (server certificate)"
echo "     - server-mkcert.key (server private key)"
echo "     - mkcert-ca.crt (mkcert CA for reference)"
echo ""
echo "🚀 You can now run the demo:"
echo "   npm start"
echo ""
echo "🎬 To record with WireMock CLI:"
echo "   node wiremock-setup.js start https://localhost:8443"