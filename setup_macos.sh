#!/bin/bash

echo "Starting setup for macOS..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "Homebrew already installed. Updating..."
    brew update
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    brew install node
else
    echo "Node.js already installed"
fi

# Install project dependencies
echo "Installing npm dependencies..."
npm install

# Verify installations
echo "Setup complete! Versions installed:"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo "Don't forget to create your .env file if you haven't already."
