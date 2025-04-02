#!/bin/bash

# Exit on any error
set -e

# Display colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting AI Chatbot Application...${NC}"

# Check if backend venv exists
if [ ! -d "../backend/venv" ]; then
  echo -e "${YELLOW}Setting up backend virtual environment...${NC}"
  cd ../backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  deactivate
  cd ../scripts
fi

# Start the backend server in a new terminal window
echo -e "${GREEN}Starting backend server on port 8000...${NC}"

# Use a different approach based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  osascript -e '
    tell application "Terminal"
      do script "cd '$(pwd)'/../backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    end tell
  '
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  gnome-terminal -- bash -c "cd $(pwd)/../backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload; exec bash"
else
  # Windows or others - show instructions
  echo -e "${YELLOW}Please start the backend server manually in a new terminal:${NC}"
  echo -e "cd ../backend"
  echo -e "source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
  echo -e "uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
fi

# Wait a moment for the backend to start initializing
sleep 3  # Increased wait time to allow backend to start fully

# Start the frontend development server
echo -e "${GREEN}Starting frontend server...${NC}"
cd ../frontend
npm start 