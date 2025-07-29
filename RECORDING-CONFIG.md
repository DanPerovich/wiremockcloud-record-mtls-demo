# WireMock Recording Configuration

This directory contains advanced recording configuration files that enhance the WireMock CLI recording process for better stub generation and matching.

## Configuration Files

### `wiremock-advanced-config.json`
The primary recording configuration file that:

- **POST Request Matching**: Uses `matchesJsonPath` for flexible JSON body matching
- **Field Validation**: Ensures POST requests contain expected fields using JSONPath expressions
- **Path-Based Filtering**: Matches `/api/users` and `/api/data` endpoints
- **Flexible Matching**: Allows any JSON structure that contains the required fields

## How It Works

### 1. Recording with JSONPath Matching
When you start recording with:
```bash
node wiremock-setup.js start https://localhost:8443
```

The CLI automatically uses `wiremock-advanced-config.json` which generates stubs that:
- Match POST requests using JSONPath patterns instead of exact body matching
- Allow flexible matching for different user data while ensuring required fields exist
- Create more reusable stubs in WireMock Cloud

### 2. Generated Stub Example
Instead of exact matching like:
```json
{
  "request": {
    "method": "POST",
    "url": "/api/users",
    "bodyPatterns": [
      {
        "equalToJson": {
          "name": "Jordan Smith",
          "email": "jordan.smith@wiremock.com",
          "role": "user",
          "department": "Engineering",
          "timestamp": "2025-07-29T17:03:51.208Z",
          "source": "WireMock Demo (live mode)"
        }
      }
    ]
  }
}
```

The configuration generates flexible matching:
```json
{
  "request": {
    "method": "POST",
    "url": "/api/users",
    "bodyPatterns": [
      {
        "matchesJsonPath": "$.name"
      },
      {
        "matchesJsonPath": "$.email"
      },
      {
        "matchesJsonPath": "$.role"
      }
    ]
  }
}
```

### 3. Benefits in WireMock Cloud

✅ **Flexible Matching**: Stubs match any JSON that contains the required fields  
✅ **Better Reusability**: Same stub works for different test scenarios  
✅ **Field Validation**: Ensures required fields are present without strict value matching  
✅ **Reduced Maintenance**: Fewer stubs needed for comprehensive testing  

## Testing the Configuration

1. **Start Recording**:
   ```bash
   node wiremock-setup.js start https://localhost:8443
   ```

2. **Generate POST Requests**:
   - Use the web interface at `http://localhost:3000`
   - Click "Post Data" multiple times to create different users
   - Each request generates different data but contains the same required fields

3. **Verify Stub Generation**:
   - Check WireMock Cloud for generated stubs
   - POST stubs should use JSONPath pattern matching
   - Test with different user data to confirm flexibility

## Current Configuration

The `wiremock-advanced-config.json` contains rules for:

### `/api/users` Endpoint
```json
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
```

### `/api/data` Endpoint  
```json
{
  "filter": {
    "request": {
      "method": "POST",
      "urlPath": "/api/data"
    }
  },
  "template": {
    "request": {
      "bodyPatterns": [
        {"matchesJsonPath": "$.name"},
        {"matchesJsonPath": "$.email"}
      ]
    }
  }
}
```

## Customization

### Adding New Endpoints
To add JSONPath matching for new endpoints, add a new rule to `stubTemplateTransformationRules`:

```json
{
  "filter": {
    "request": {
      "method": "POST",
      "urlPath": "/api/orders"
    }
  },
  "template": {
    "request": {
      "bodyPatterns": [
        {"matchesJsonPath": "$.orderId"},
        {"matchesJsonPath": "$.amount"},
        {"matchesJsonPath": "$.customerId"}
      ]
    }
  }
}
```

### Modifying Field Requirements
Edit the `bodyPatterns` array to adjust which fields must be present:
- Add new JSONPath expressions for additional required fields
- Remove expressions to make fields optional
- Use complex JSONPath expressions for nested field validation

### Advanced JSONPath Examples
```json
{
  "bodyPatterns": [
    {"matchesJsonPath": "$.user.profile.name"},
    {"matchesJsonPath": "$.items[*].id"},
    {"matchesJsonPath": "$.metadata[?(@.type == 'required')]"}
  ]
}
```

This configuration ensures your recorded stubs are flexible and reusable in WireMock Cloud using JSONPath matching!