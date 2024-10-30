#!/bin/bash

# Get the absolute path of the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Path to your Node.js script
NODE_SCRIPT="$SCRIPT_DIR/index.js"

# Check if the Node.js script exists
if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Node.js script not found at $NODE_SCRIPT"
    exit 1
fi

# Create a temporary file for the new crontab
TEMP_CRON=$(mktemp)

# Export the current crontab to the temporary file
crontab -l > "$TEMP_CRON"

# Check if the cron job already exists
if grep -q "$NODE_SCRIPT" "$TEMP_CRON"; then
    echo "Cron job already exists. No changes made."
else
    # Add the new cron job to run every 24 hours at noon (12:00 PM)
    echo "0 12 * * * /usr/bin/node $NODE_SCRIPT >> $SCRIPT_DIR/cron.log 2>&1" >> "$TEMP_CRON"

    # Install the new crontab
    crontab "$TEMP_CRON"

    echo "Cron job added successfully. It will run every day at noon."
fi

# Remove the temporary file
rm "$TEMP_CRON"