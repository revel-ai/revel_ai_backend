#!/bin/bash

# RevelAi Health API Quick Test Script
# Make sure the server is running on localhost:3000 before running this script

BASE_URL="http://localhost:3000"
echo "🚀 RevelAi Health API Testing"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Health Check
print_step "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json $BASE_URL/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Health check passed"
    echo "   Response: $(cat /tmp/health_response.json)"
else
    print_error "Health check failed (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

echo ""

# Step 2: Create Simple Journey
print_step "2. Creating Simple Journey..."
JOURNEY_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/journey_response.json -X POST $BASE_URL/api/journeys \
  -H "Content-Type: application/json" \
  -d @test-payloads/simple-journey.json)

if [ "$JOURNEY_RESPONSE" = "201" ]; then
    print_success "Journey created successfully"
    JOURNEY_ID=$(grep -o '"journeyId":"[^"]*' /tmp/journey_response.json | cut -d'"' -f4)
    echo "   Journey ID: $JOURNEY_ID"
else
    print_error "Journey creation failed (HTTP $JOURNEY_RESPONSE)"
    echo "   Response: $(cat /tmp/journey_response.json)"
    exit 1
fi

echo ""

# Step 3: List Journeys
print_step "3. Listing All Journeys..."
LIST_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/list_response.json $BASE_URL/api/journeys)
if [ "$LIST_RESPONSE" = "200" ]; then
    print_success "Journey list retrieved"
    echo "   Found $(grep -o '"id"' /tmp/list_response.json | wc -l) journeys"
else
    print_error "Journey list failed (HTTP $LIST_RESPONSE)"
fi

echo ""

# Step 4: Get Specific Journey
print_step "4. Getting Specific Journey..."
GET_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/get_response.json $BASE_URL/api/journeys/$JOURNEY_ID)
if [ "$GET_RESPONSE" = "200" ]; then
    print_success "Journey details retrieved"
    echo "   Journey name: $(grep -o '"name":"[^"]*' /tmp/get_response.json | cut -d'"' -f4)"
else
    print_error "Journey retrieval failed (HTTP $GET_RESPONSE)"
fi

echo ""

# Step 5: Trigger Journey with Senior Patient
print_step "5. Triggering Journey with Senior Patient..."
TRIGGER_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/trigger_response.json -X POST $BASE_URL/api/journeys/$JOURNEY_ID/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-patient-001",
    "age": 72,
    "language": "en",
    "condition": "liver_replacement"
  }')

if [ "$TRIGGER_RESPONSE" = "202" ]; then
    print_success "Journey triggered successfully"
    RUN_ID=$(grep -o '"runId":"[^"]*' /tmp/trigger_response.json | cut -d'"' -f4)
    echo "   Run ID: $RUN_ID"
else
    print_error "Journey trigger failed (HTTP $TRIGGER_RESPONSE)"
    echo "   Response: $(cat /tmp/trigger_response.json)"
    exit 1
fi

echo ""

# Step 6: Monitor Journey Run
print_step "6. Monitoring Journey Run..."
for i in {1..5}; do
    echo "   Check #$i:"
    MONITOR_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/monitor_response.json $BASE_URL/api/journeys/runs/$RUN_ID)
    if [ "$MONITOR_RESPONSE" = "200" ]; then
        STATUS=$(grep -o '"status":"[^"]*' /tmp/monitor_response.json | cut -d'"' -f4)
        CURRENT_NODE=$(grep -o '"currentNodeId":"[^"]*' /tmp/monitor_response.json | cut -d'"' -f4)
        echo "     Status: $STATUS, Current Node: $CURRENT_NODE"
        
        if [ "$STATUS" = "completed" ]; then
            print_success "Journey completed!"
            break
        elif [ "$STATUS" = "failed" ]; then
            print_error "Journey failed!"
            break
        fi
    else
        print_error "Monitor request failed (HTTP $MONITOR_RESPONSE)"
    fi
    
    if [ $i -lt 5 ]; then
        echo "     Waiting 2 seconds..."
        sleep 2
    fi
done

echo ""

# Step 7: Test Error Cases
print_step "7. Testing Error Cases..."

# Test invalid journey
echo "   Testing invalid journey creation..."
INVALID_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/invalid_response.json -X POST $BASE_URL/api/journeys \
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
  }')

if [ "$INVALID_RESPONSE" = "400" ]; then
    print_success "Invalid journey correctly rejected"
else
    print_error "Invalid journey should have been rejected (HTTP $INVALID_RESPONSE)"
fi

# Test non-existent journey trigger
echo "   Testing non-existent journey trigger..."
NOTFOUND_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/notfound_response.json -X POST $BASE_URL/api/journeys/00000000-0000-0000-0000-000000000000/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-patient",
    "age": 50,
    "language": "en",
    "condition": "liver_replacement"
  }')

if [ "$NOTFOUND_RESPONSE" = "404" ]; then
    print_success "Non-existent journey correctly returned 404"
else
    print_error "Non-existent journey should return 404 (HTTP $NOTFOUND_RESPONSE)"
fi

echo ""

# Final Summary
print_step "🎉 Test Summary"
echo "================================"
print_success "All basic tests completed!"
echo ""
echo "💡 Next Steps:"
echo "   - Check server logs to see MESSAGE and DELAY node executions"
echo "   - Visit http://localhost:3000/api-docs for Swagger UI"
echo "   - Run 'node demo.js' for a complete demonstration"
echo "   - Use the payloads in test-payloads/ directory for more testing"

# Cleanup
rm -f /tmp/*_response.json

echo ""
echo "🚀 Happy Testing!"