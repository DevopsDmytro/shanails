#!/bin/bash

echo "=== Multi-Service Booking Flow Test ==="
echo ""

BASE_URL="http://localhost:3000/api/v1"

echo "1. Testing available services..."
curl -s "$BASE_URL/services" | jq -r '.data.services[] | "\(.id): \(.name) (\(.duration)min, \(.price)грн)"'

echo ""
echo "2. Testing duration validation..."

# Test case 1: Services that exceed 120 minutes (should fail)
echo "Test 1: Services 13 (60min) + 14 (90min) = 150min (should fail)"
response=$(curl -s "$BASE_URL/masters/5/availability?serviceIds=13,14&date=2025-11-06")
echo "$response" | jq -r '.success // .error'

# Test case 2: Services within 120 minutes (should succeed)
echo "Test 2: Services 13 (60min) + 17 (30min) = 90min (should succeed)"
response=$(curl -s "$BASE_URL/masters/5/availability?serviceIds=13,17&date=2025-11-06")
echo "$response" | jq -r '.success // .error'

# Test case 3: Single service (should succeed)
echo "Test 3: Service 15 (120min) = 120min (should succeed)"
response=$(curl -s "$BASE_URL/masters/5/availability?serviceIds=15&date=2025-11-06")
echo "$response" | jq -r '.success // .error'

echo ""
echo "3. Testing master availability for multiple services..."

# Get available masters
echo "Available masters:"
curl -s "$BASE_URL/masters" | jq -r '.data.masters[] | "ID: \(.id), Name: \(.user.firstName) \(.user.lastName)"'

echo ""
echo "4. Testing complete booking flow..."

# Test a valid multi-service combination
echo "Testing booking with services 13 (60min) + 17 (30min) + 18 (30min) = 120min"
response=$(curl -s "$BASE_URL/masters/5/availability?serviceIds=13,17,18&date=2025-11-06")
echo "$response" | jq '.'

echo ""
echo "=== Test Complete ==="