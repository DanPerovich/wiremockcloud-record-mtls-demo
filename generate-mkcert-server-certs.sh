#!/bin/bash

echo "🔐 Generating server certificates using mkcert CA..."

# Generate server private key
echo "📝 Generating server private key..."
openssl genrsa -out server-mkcert.key 2048

# Create server certificate signing request
echo "📝 Creating server certificate signing request..."
openssl req -new -key server-mkcert.key -out server-mkcert.csr -subj "/C=US/ST=Demo/L=Demo/O=mkcert/CN=localhost"

# Create server certificate extensions file for localhost
cat > server-mkcert.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate server certificate signed by mkcert CA
echo "📝 Generating server certificate signed by mkcert CA..."
openssl x509 -req -in server-mkcert.csr -CA mkcert-ca.crt -CAkey mkcert-ca.key -CAcreateserial -out server-mkcert.crt -days 365 -extfile server-mkcert.ext

# Clean up temporary files
rm server-mkcert.csr server-mkcert.ext

# Verify certificates
echo "✅ Verifying server certificate..."
if openssl verify -CAfile mkcert-ca.crt server-mkcert.crt > /dev/null 2>&1; then
    echo "✅ Server certificate verified successfully"
else
    echo "❌ Server certificate verification failed"
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