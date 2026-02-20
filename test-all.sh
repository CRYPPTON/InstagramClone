#!/bin/bash

# Instagram Clone - Test Suite Runner

echo "🚀 Starting Full Test Suite..."

# --- 1. Auth Service ---
echo -e "

--- 🔐 Testing Auth Service ---"
cd microservices/auth-service
# Initialize test DB before running integration tests
node init-test-db.js
npm test
cd ../..

# --- 2. Post Service ---
echo -e "

--- 📸 Testing Post Service ---"
cd microservices/post-service
npm test
cd ../..

# --- 3. Interaction Service ---
echo -e "

--- 💬 Testing Interaction Service ---"
cd microservices/interaction-service
npm test
cd ../..

# --- 4. Frontend ---
echo -e "

--- 🖥️  Testing Frontend ---"
cd frontend
npm test -- --watchAll=false --coverage
cd ..

echo -e "

✅ All tests completed!"
