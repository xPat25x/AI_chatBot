#!/bin/bash

# Show a welcome message
echo "🤖 Starting AI Chatbot..."
echo "This script will start both frontend and backend services."

# Make the start script executable (in case it's not)
chmod +x scripts/start.sh

# Run the start script
cd frontend && npm run start:all 