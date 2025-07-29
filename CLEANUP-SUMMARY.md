# Project Cleanup Summary

## Files Moved to `legacy/` Folder

The following files were moved to the `legacy/` folder as they are no longer needed for the current mkcert-based implementation:

### Java SSL Workaround Files
- `TrustAllCerts.java` + compiled `.class` files
- `create-truststore.sh`
- `disable-ssl-verification.properties` 
- `wiremock-truststore.jks`

**Reason**: No longer needed since we use system-trusted mkcert certificates

### Unused Certificate Files
- `server.crt` / `server.key` (self-signed certificates)
- `mkcert-ca.*` files (mkcert manages these automatically)
- `ca.key` / `ca.srl` / `client.csr` (intermediate/private files)

**Reason**: Current implementation only needs specific certificate files

### Old Scripts
- `start-demo.sh` (bash script)
- `generate-server-certs.sh` (self-signed cert generation)

**Reason**: Replaced with Node.js implementations

## Files Removed
- `*.log` files (regenerated at runtime)

## Files Added
- `.gitignore` - Proper gitignore for Node.js projects
- `legacy/README-LEGACY.md` - Documentation for moved files

## Current Clean Structure

```
wiremockcloud-record-mtls-demo/
├── README.md                           # Main documentation
├── DEMO-INSTRUCTIONS.md                # Step-by-step demo guide
├── RECORDING-CONFIG.md                 # WireMock configuration docs
├── package.json                        # Node.js dependencies
├── .gitignore                         # Git ignore rules
├── start-demo.js                      # Unified startup script
├── server.js                          # Demo web server
├── api-server.js                      # MTLS API server
├── wiremock-setup.js                  # WireMock CLI helper
├── wiremock-advanced-config.json      # Recording configuration
├── generate-mkcert-server-certs.sh    # mkcert certificate generation
├── public/                            # Web interface assets
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── favicon.svg
├── certificates (in root):            # Required certificates only
│   ├── ca.crt                         # Certificate Authority
│   ├── client.crt                     # Client certificate  
│   ├── client.key                     # Client private key
│   ├── client-combined.pem            # Combined for WireMock CLI
│   ├── server-mkcert.crt              # System-trusted server cert
│   └── server-mkcert.key              # System-trusted server key
└── legacy/                            # Archived files
    └── README-LEGACY.md               # Legacy files documentation
```

## Benefits of Cleanup

✅ **Cleaner repository**: Only essential files in root directory  
✅ **Better documentation**: Clear separation of current vs legacy approaches  
✅ **Easier onboarding**: New users see only relevant files  
✅ **Maintained history**: Legacy files preserved for reference  
✅ **Proper gitignore**: Prevents committing logs and temporary files  

The project is now optimized with only the files necessary for the mkcert-based MTLS demo implementation.