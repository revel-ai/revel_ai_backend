# API Testing Payloads - RevelAi Health Backend

Complete collection of API payloads for testing all endpoints.

## 🚀 Quick Start

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Server should be running on**: `http://localhost:3000`

3. **Test with curl commands below or use Swagger UI**: `http://localhost:3000/api-docs`

---

## 📋 **1. Health Check**

### GET /health
```bash
curl -X GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

## 🏥 **2. Journey Management APIs**

### POST /api/journeys - Create Simple Journey

```bash
curl -X POST http://localhost:3000/api/journeys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Simple Test Journey",
    "start_node_id": "welcome",
    "nodes": [
      {
        "id": "welcome",
        "type": "MESSAGE",
        "message": "Welcome to your test journey!",
        "next_node_id": "wait"
      },
      {
        "id": "wait",
        "type": "DELAY",
        "duration_seconds": 3,
        "next_node_id": "followup"
      },
      {
        "id": "followup",
        "type": "MESSAGE",
        "message": "How are you feeling after the wait?",
        "next_node_id": null
      }
    ]
  }'
```

### POST /api/journeys - Create Complex Journey with Conditionals

```bash
curl -X POST http://localhost:3000/api/journeys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hip Replacement Recovery Journey",
    "start_node_id": "welcome",
    "nodes": [
      {
        "id": "welcome",
        "type": "MESSAGE",
        "message": "Welcome to your hip replacement recovery journey!",
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
        "on_true_next_node_id": "senior_program",
        "on_false_next_node_id": "standard_program"
      },
      {
        "id": "senior_program",
        "type": "MESSAGE",
        "message": "You have been enrolled in our Senior Care Program with additional support.",
        "next_node_id": "language_check"
      },
      {
        "id": "standard_program",
        "type": "MESSAGE",
        "message": "You have been enrolled in our Standard Recovery Program.",
        "next_node_id": "language_check"
      },
      {
        "id": "language_check",
        "type": "CONDITIONAL",
        "condition": {
          "field": "language",
          "operator": "eq",
          "value": "es"
        },
        "on_true_next_node_id": "spanish_resources",
        "on_false_next_node_id": "english_resources"
      },
      {
        "id": "spanish_resources",
        "type": "MESSAGE",
        "message": "Hemos preparado recursos en español para apoyar su recuperación.",
        "next_node_id": "delay_before_followup"
      },
      {
        "id": "english_resources",
        "type": "MESSAGE",
        "message": "We have prepared comprehensive resources to support your recovery.",
        "next_node_id": "delay_before_followup"
      },
      {
        "id": "delay_before_followup",
        "type": "DELAY",
        "duration_seconds": 5,
        "next_node_id": "followup_message"
      },
      {
        "id": "followup_message",
        "type": "MESSAGE",
        "message": "Day 1: How are you feeling? Remember to take your medication as prescribed.",
        "next_node_id": null
      }
    ]
  }'
```

### GET /api/journeys - List All Journeys

```bash
curl -X GET http://localhost:3000/api/journeys
```

### GET /api/journeys/{journeyId} - Get Specific Journey

```bash
# Replace {journeyId} with actual UUID from create response
curl -X GET http://localhost:3000/api/journeys/123e4567-e89b-12d3-a456-426614174000
```

---

## 🎯 **3. Journey Execution APIs**

### POST /api/journeys/{journeyId}/trigger - Senior Patient (Age-based branching)

```bash
# Replace {journeyId} with actual UUID from create journey response
curl -X POST http://localhost:3000/api/journeys/123e4567-e89b-12d3-a456-426614174000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "patient-001",
    "age": 72,
    "language": "en",
    "condition": "liver_replacement"
  }'
```

### POST /api/journeys/{journeyId}/trigger - Young Spanish Patient

```bash
# Replace {journeyId} with actual UUID from create journey response
curl -X POST http://localhost:3000/api/journeys/123e4567-e89b-12d3-a456-426614174000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "patient-002",
    "age": 45,
    "language": "es",
    "condition": "knee_replacement"
  }'
```

### POST /api/journeys/{journeyId}/trigger - Edge Case Patient

```bash
# Replace {journeyId} with actual UUID from create journey response
curl -X POST http://localhost:3000/api/journeys/123e4567-e89b-12d3-a456-426614174000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "patient-003",
    "age": 65,
    "language": "en",
    "condition": "liver_replacement",
    "insurance_type": "premium",
    "mobility_score": 8
  }'
```

### GET /api/journeys/runs/{runId} - Monitor Journey Run

```bash
# Replace {runId} with actual UUID from trigger response
curl -X GET http://localhost:3000/api/journeys/runs/456e7890-e89b-12d3-a456-426614174001
```

---

## 🧪 **4. Test Scenarios**

### Scenario 1: Complete Linear Journey Test

```bash
# 1. Create simple journey
JOURNEY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/journeys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Linear Test Journey",
    "start_node_id": "start",
    "nodes": [
      {
        "id": "start",
        "type": "MESSAGE",
        "message": "Starting your journey...",
        "next_node_id": "wait"
      },
      {
        "id": "wait",
        "type": "DELAY",
        "duration_seconds": 2,
        "next_node_id": "end"
      },
      {
        "id": "end",
        "type": "MESSAGE",
        "message": "Journey completed successfully!",
        "next_node_id": null
      }
    ]
  }')

# Extract journeyId (you'll need jq installed or manually copy the ID)
echo "Journey created: $JOURNEY_RESPONSE"

# 2. Trigger journey (replace JOURNEY_ID with actual ID from response)
RUN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/journeys/JOURNEY_ID/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-patient-001",
    "age": 50,
    "language": "en",
    "condition": "liver_replacement"
  }')

echo "Journey triggered: $RUN_RESPONSE"

# 3. Monitor run (replace RUN_ID with actual ID from response)
curl -X GET http://localhost:3000/api/journeys/runs/RUN_ID
```

### Scenario 2: Conditional Branching Test

```bash
# Test different ages to see conditional branching
# Young patient (< 65)
curl -X POST http://localhost:3000/api/journeys/JOURNEY_ID/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "young-patient",
    "age": 35,
    "language": "en",
    "condition": "knee_replacement"
  }'

# Senior patient (>= 65)
curl -X POST http://localhost:3000/api/journeys/JOURNEY_ID/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "senior-patient",
    "age": 75,
    "language": "es",
    "condition": "liver_replacement"
  }'
```

---

## ❌ **5. Error Testing Payloads**

### Invalid Journey Structure

```bash
curl -X POST http://localhost:3000/api/journeys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Journey",
    "start_node_id": "nonexistent",
    "nodes": [
      {
        "id": "valid_node",
        "type": "MESSAGE",
        "message": "This will fail",
        "next_node_id": null
      }
    ]
  }'
```

### Invalid Patient Context

```bash
curl -X POST http://localhost:3000/api/journeys/JOURNEY_ID/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "invalid-patient",
    "age": -5,
    "language": "french",
    "condition": "broken_arm"
  }'
```

### Non-existent Journey

```bash
curl -X POST http://localhost:3000/api/journeys/00000000-0000-0000-0000-000000000000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-patient",
    "age": 50,
    "language": "en",
    "condition": "liver_replacement"
  }'
```

### Non-existent Run

```bash
curl -X GET http://localhost:3000/api/journeys/runs/00000000-0000-0000-0000-000000000000
```

---

## 🎛️ **6. Advanced Testing Payloads**

### Journey with All Operators

```bash
curl -X POST http://localhost:3000/api/journeys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Operator Testing",
    "start_node_id": "age_gt",
    "nodes": [
      {
        "id": "age_gt",
        "type": "CONDITIONAL",
        "condition": {
          "field": "age",
          "operator": "gt",
          "value": 50
        },
        "on_true_next_node_id": "age_lte",
        "on_false_next_node_id": "young_message"
      },
      {
        "id": "age_lte",
        "type": "CONDITIONAL",
        "condition": {
          "field": "age",
          "operator": "lte",
          "value": 80
        },
        "on_true_next_node_id": "condition_in",
        "on_false_next_node_id": "very_old_message"
      },
      {
        "id": "condition_in",
        "type": "CONDITIONAL",
        "condition": {
          "field": "condition",
          "operator": "in",
          "value": ["liver_replacement", "knee_replacement"]
        },
        "on_true_next_node_id": "valid_condition_message",
        "on_false_next_node_id": "invalid_condition_message"
      },
      {
        "id": "young_message",
        "type": "MESSAGE",
        "message": "You are under 50 years old.",
        "next_node_id": null
      },
      {
        "id": "very_old_message",
        "type": "MESSAGE",
        "message": "You are over 80 years old - special care program.",
        "next_node_id": null
      },
      {
        "id": "valid_condition_message",
        "type": "MESSAGE",
        "message": "Valid orthopedic condition detected.",
        "next_node_id": null
      },
      {
        "id": "invalid_condition_message",
        "type": "MESSAGE",
        "message": "Condition not in our orthopedic program.",
        "next_node_id": null
      }
    ]
  }'
```

### Patient with Custom Fields

```bash
curl -X POST http://localhost:3000/api/journeys/JOURNEY_ID/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom-patient-001",
    "age": 60,
    "language": "en",
    "condition": "liver_replacement",
    "insurance_type": "premium",
    "mobility_score": 7,
    "previous_surgeries": ["appendectomy", "gallbladder"],
    "risk_level": "medium",
    "preferred_contact": "email"
  }'
```

---

## 🔄 **7. Testing Workflow**

### Step-by-Step Testing Process

```bash
# 1. Check server health
curl -X GET http://localhost:3000/health

# 2. Create a journey and save the ID
curl -X POST http://localhost:3000/api/journeys -H "Content-Type: application/json" -d '...'
# Copy journeyId from response

# 3. List all journeys to verify creation
curl -X GET http://localhost:3000/api/journeys

# 4. Get specific journey details
curl -X GET http://localhost:3000/api/journeys/YOUR_JOURNEY_ID

# 5. Trigger journey and save run ID
curl -X POST http://localhost:3000/api/journeys/YOUR_JOURNEY_ID/trigger -H "Content-Type: application/json" -d '...'
# Copy runId from response

# 6. Monitor journey execution (repeat several times)
curl -X GET http://localhost:3000/api/journeys/runs/YOUR_RUN_ID

# 7. Check server logs to see MESSAGE and DELAY executions
```

---

## 📊 **8. Expected Responses**

### Successful Journey Creation (201)
```json
{
  "journeyId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Successful Journey Trigger (202)
```json
{
  "runId": "456e7890-e89b-12d3-a456-426614174001"
}
```
**Headers**: `Location: /journeys/runs/456e7890-e89b-12d3-a456-426614174001`

### Journey Run Status (200)
```json
{
  "runId": "456e7890-e89b-12d3-a456-426614174001",
  "status": "in_progress",
  "currentNodeId": "welcome",
  "patientContext": {
    "id": "patient-001",
    "age": 72,
    "language": "en",
    "condition": "liver_replacement"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:05.000Z"
}
```

### Error Response (400/404/500)
```json
{
  "error": "Journey not found"
}
```

---

## 🎯 **Quick Test Commands**

Save these as shell variables for quick testing:

```bash
# Set base URL
BASE_URL="http://localhost:3000"

# Test health
curl -X GET $BASE_URL/health

# Create simple journey
curl -X POST $BASE_URL/api/journeys -H "Content-Type: application/json" -d @examples/simple-journey.json

# Test with senior patient
curl -X POST $BASE_URL/api/journeys/JOURNEY_ID/trigger -H "Content-Type: application/json" -d @examples/senior-patient.json
```

---

**💡 Pro Tip**: Use the Swagger UI at `http://localhost:3000/api-docs` for interactive testing with a user-friendly interface!