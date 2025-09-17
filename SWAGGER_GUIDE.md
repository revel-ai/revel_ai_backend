# Swagger API Documentation Guide

## 🚀 Quick Start with Swagger UI

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open Swagger UI**:
   Navigate to http://localhost:3000/api-docs in your browser

3. **Explore the API**:
   - Browse all available endpoints
   - View detailed request/response schemas
   - Test endpoints directly from the browser

## 📖 Using Swagger UI

### Key Features

- **Interactive Testing**: Click "Try it out" on any endpoint to test it
- **Request Examples**: Pre-filled examples for all request bodies
- **Response Schemas**: Detailed response structure documentation
- **Authentication**: Ready for future auth implementation
- **Export Options**: Download OpenAPI specification

### Testing Workflow

#### 1. Create a Journey
1. Navigate to **Journeys** → `POST /api/journeys`
2. Click "Try it out"
3. Use this example request body:
```json
{
  "name": "Test Journey",
  "start_node_id": "welcome",
  "nodes": [
    {
      "id": "welcome",
      "type": "MESSAGE",
      "message": "Welcome to your journey!",
      "next_node_id": "age_check"
    },
    {
      "id": "age_check",
      "type": "CONDITIONAL",
      "condition": {
        "field": "age",
        "operator": "gte",
        "value": 65
      },
      "on_true_next_node_id": "senior_message",
      "on_false_next_node_id": "standard_message"
    },
    {
      "id": "senior_message",
      "type": "MESSAGE",
      "message": "You qualify for senior care!",
      "next_node_id": null
    },
    {
      "id": "standard_message",
      "type": "MESSAGE",
      "message": "Welcome to standard care!",
      "next_node_id": null
    }
  ]
}
```
4. Click "Execute"
5. Copy the `journeyId` from the response

#### 2. Trigger the Journey
1. Navigate to **Execution** → `POST /api/journeys/{journeyId}/trigger`
2. Click "Try it out"
3. Paste the `journeyId` in the path parameter
4. Use this patient context:
```json
{
  "id": "patient-test-001",
  "age": 72,
  "language": "en",
  "condition": "liver_replacement"
}
```
5. Click "Execute"
6. Copy the `runId` from the response

#### 3. Monitor Execution
1. Navigate to **Execution** → `GET /api/journeys/runs/{runId}`
2. Click "Try it out"
3. Paste the `runId` in the path parameter
4. Click "Execute" to check status
5. Repeat to see status changes

## 🎯 API Endpoint Overview

### Journey Management
- `POST /api/journeys` - Create new journey
- `GET /api/journeys` - List all journeys
- `GET /api/journeys/{journeyId}` - Get specific journey

### Journey Execution
- `POST /api/journeys/{journeyId}/trigger` - Start journey for patient
- `GET /api/journeys/runs/{runId}` - Monitor execution status

### System
- `GET /health` - Health check
- `GET /api-docs` - This documentation

## 📝 Node Types Reference

### MESSAGE Node
```json
{
  "id": "unique_id",
  "type": "MESSAGE",
  "message": "Text to send to patient",
  "next_node_id": "next_node_or_null"
}
```

### DELAY Node
```json
{
  "id": "unique_id",
  "type": "DELAY",
  "duration_seconds": 300,
  "next_node_id": "next_node_or_null"
}
```

### CONDITIONAL Node
```json
{
  "id": "unique_id",
  "type": "CONDITIONAL",
  "condition": {
    "field": "age",
    "operator": "gt",
    "value": 60
  },
  "on_true_next_node_id": "node_if_true",
  "on_false_next_node_id": "node_if_false"
}
```

### Supported Operators
- `eq` - Equal to
- `ne` - Not equal to
- `gt` - Greater than
- `gte` - Greater than or equal to
- `lt` - Less than
- `lte` - Less than or equal to
- `in` - Value is in array
- `nin` - Value is not in array

## 🔍 Advanced Usage

### Custom Patient Fields
The patient context supports additional fields for conditional logic:
```json
{
  "id": "patient-001",
  "age": 65,
  "language": "en",
  "condition": "liver_replacement",
  "insurance_type": "premium",
  "mobility_score": 8
}
```

### Complex Journey Example
Check `examples/sample-journeys.json` for complete journey definitions with:
- Multiple conditional branches
- Language-specific messages
- Age-based care programs
- Timed follow-ups

### Response Status Codes
- `200` - Success (GET requests)
- `201` - Created (POST journey)
- `202` - Accepted (POST trigger)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## 🛠️ Troubleshooting

### Common Issues

1. **Journey not found**: Ensure the journeyId exists
2. **Validation errors**: Check required fields and data types
3. **Node reference errors**: Ensure all referenced node IDs exist
4. **Database errors**: Check server logs for connection issues

### Server Logs
Monitor the server console for:
- MESSAGE node executions
- DELAY node timing
- CONDITIONAL node evaluations
- Journey completion/failure status

## 🎨 Customization

The Swagger UI can be customized by modifying `src/config/swagger.ts`:
- Server URLs
- API descriptions
- Examples
- Schema definitions
- Response templates

## 📊 Monitoring

Use the journey run status endpoint to track:
- Current execution status
- Active node being processed
- Patient context
- Timestamps (created, updated, completed)
- Error states and messages

---

**Happy API Testing! 🎉**

For more information, visit the main [README.md](./README.md) file.