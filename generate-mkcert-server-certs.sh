#!/bin/bash

echo "🔐 Generating server certificates using mkcert..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Please install it first:"
    echo "   macOS: brew install mkcert"
    echo "   Linux: See https://github.com/FiloSottile/mkcert#linux"
    echo "   Windows: choco install mkcert"
    exit 1
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

# Verify certificates exist
if [ -f "server-mkcert.crt" ] && [ -f "server-mkcert.key" ]; then
    echo "✅ Server certificates generated successfully"
else
    echo "❌ Failed to generate server certificates"
    exit 1
fi

# Set appropriate permissions
chmod 600 server-mkcert.key
chmod 644 server-mkcert.crt

echo "🎉 mkcert-based server certificates generated successfully!"
echo ""
echo "Generated files:"
echo "  - server-mkcert.key (private key)"
echo "  - server-mkcert.crt (certificate)"
echo "  - mkcert-ca.crt (CA certificate - system trusted)"
echo ""
echo "These certificates are trusted by your system!"
echo ""
echo "You can now start the MTLS API server with:"
echo "  node api-server.js"
echo ""
echo "The API will be available at: https://localhost:8443"