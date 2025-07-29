#!/bin/bash

echo "🔐 Generating client certificates for MTLS authentication..."

# Check if CA certificate and key exist
if [ ! -f "ca.crt" ]; then
    echo "❌ CA certificate (ca.crt) not found"
    echo "   Please ensure you have the CA certificate in the current directory"
    exit 1
fi

if [ ! -f "ca.key" ]; then
    # Check if ca.key exists in legacy folder
    if [ -f "legacy/ca.key" ]; then
        echo "📋 Found CA key in legacy folder, copying it..."
        cp legacy/ca.key .
    else
        echo "❌ CA private key (ca.key) not found"
        echo "   The CA private key is required to generate client certificates"
        echo "   Please ensure you have the CA private key or create a new CA"
        exit 1
    fi
fi

# Generate client private key
echo "📝 Generating client private key..."
openssl genrsa -out client.key 2048

# Create client certificate signing request
echo "📝 Creating client certificate signing request..."
openssl req -new -key client.key -out client.csr -subj "/C=US/ST=Demo/L=Demo/O=WireMock Demo/OU=Client/CN=client.wiremock-demo.com"

# Create client certificate extensions file
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

# Generate client certificate signed by CA
echo "📝 Generating client certificate signed by CA..."
openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out client.crt -days 365 -extfile client.ext

# Create combined PEM file for WireMock CLI
echo "📝 Creating combined client certificate file for WireMock CLI..."
cat client.crt client.key > client-combined.pem

# Clean up temporary files
rm client.csr client.ext

# Verify certificates
echo "✅ Verifying client certificate..."
if openssl verify -CAfile ca.crt client.crt > /dev/null 2>&1; then
    echo "✅ Client certificate verified successfully"
else
    echo "❌ Client certificate verification failed"
    exit 1
fi

# Test certificate chain
echo "✅ Testing certificate chain..."
if openssl verify -CAfile ca.crt -purpose sslclient client.crt > /dev/null 2>&1; then
    echo "✅ Certificate chain valid for client authentication"
else
    echo "⚠️  Certificate chain verification warning (may still work for MTLS)"
fi

# Set appropriate permissions
chmod 600 client.key ca.key
chmod 644 client.crt client-combined.pem ca.crt

echo "🎉 Client certificates generated successfully!"
echo ""
echo "Generated files:"
echo "  - client.key (private key)"
echo "  - client.crt (certificate)" 
echo "  - client-combined.pem (combined cert+key for WireMock CLI)"
echo ""
echo "Certificate details:"
openssl x509 -in client.crt -noout -subject -issuer -dates
echo ""
echo "You can now use these certificates for MTLS authentication!"
echo ""
echo "To test the client certificate:"
echo "  curl -k --cert client.crt --key client.key https://localhost:8443/health"
echo ""
echo "To use with WireMock CLI recording:"
echo "  wiremock record https://localhost:8443 --client-certificate ./client-combined.pem"