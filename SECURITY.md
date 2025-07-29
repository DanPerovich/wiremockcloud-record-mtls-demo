# Security Guidelines

## 🔒 Certificate Security

This demo application uses MTLS (Mutual TLS) authentication, which requires careful handling of cryptographic materials.

### ⚠️ CRITICAL: Never Commit Private Keys

The following file types contain sensitive cryptographic material and must NEVER be committed to version control:

- `*.key` - Private keys
- `*.pem` - Combined certificate/key files
- `*.p12` / `*.pfx` - PKCS#12 keystores
- `*.jks` - Java keystores
- `.env` - Environment files with secrets

### 🛡️ Safe to Commit

These certificate-related files are generally safe to include in public repositories:

- `*.crt` - Public certificates (but may contain identifying information)
- Certificate generation scripts
- Documentation and examples

### 📋 Repository Configuration

The `.gitignore` file is configured to prevent accidental commits of sensitive files:

```gitignore
# Certificate files (SECURITY: Never commit private keys!)
*.key
*.pem
*.crt
*.csr
*.jks
*.p12
*.pfx
ca.srl

# Environment variables
.env
```

## 🔧 Setup Security

### Certificate Generation

1. **Always generate certificates locally**:
   ```bash
   ./generate-ca-and-certs.sh
   ```

2. **Use unique certificates for each environment**:
   - Development: Local self-signed CA
   - Staging: Separate certificate authority
   - Production: Proper certificate authority

3. **Protect certificate files**:
   ```bash
   chmod 600 *.key *.pem    # Private keys: owner read/write only
   chmod 644 *.crt          # Public certificates: world readable
   ```

### Environment Variables

1. **Copy example configuration**:
   ```bash
   cp .env.example .env
   ```

2. **Customize for your environment**:
   - Update API URLs
   - Set appropriate certificate paths
   - Configure logging levels

3. **Never commit `.env` files** to version control

## 🚨 Security Best Practices

### For Demo/Development Use

✅ **DO**:
- Generate certificates locally using provided scripts
- Use system-trusted certificates (mkcert) for development
- Keep private keys secure with proper file permissions
- Use separate certificates for different environments
- Rotate certificates regularly

❌ **DON'T**:
- Commit private keys to version control
- Share private keys via insecure channels
- Use demo certificates in production
- Reuse certificates across multiple projects
- Use weak passwords for certificate stores

### For Production Use

If adapting this demo for production:

1. **Use proper certificate authorities**
2. **Implement certificate rotation**
3. **Monitor certificate expiration**
4. **Use hardware security modules (HSMs) for key storage**
5. **Implement proper access controls**
6. **Enable audit logging for certificate operations**

## 🔍 Security Verification

### Check for Sensitive Files

Before committing to public repositories:

```bash
# Check for private keys
find . -name "*.key" -o -name "*.pem" -o -name "*.p12"

# Check git status
git status

# Verify gitignore is working
git check-ignore *.key *.pem .env
```

### Certificate Validation

Verify certificates are properly configured:

```bash
# Verify certificate chain
openssl verify -CAfile ca.crt client.crt

# Check certificate details
openssl x509 -in client.crt -text -noout

# Test MTLS connection
curl -k --cert client.crt --key client.key https://localhost:8443/health
```

## 📞 Reporting Security Issues

If you discover security vulnerabilities in this demo:

1. **DO NOT** open a public GitHub issue
2. Contact the maintainers privately
3. Allow time for assessment and remediation
4. Follow responsible disclosure practices

---

**Remember**: This is a DEMO application. Never use demo certificates or configurations in production environments!