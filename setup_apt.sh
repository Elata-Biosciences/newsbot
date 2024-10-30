#!/bin/bash

echo "Starting setup..."

# Update package lists
sudo apt-get update

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Install project dependencies
echo "Installing project dependencies..."
npm install

echo "Setup complete! Don't forget to create your .env file if you haven't already." 