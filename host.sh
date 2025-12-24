#!/bin/bash

echo "Starting continuous hosting for CPR Training Website..."
echo "Building project..."
npm run build

echo "Starting server..."
while true; do
    echo "Hosting website at http://localhost:3000"
    npx serve dist -p 3000
    echo "Server stopped. Restarting in 5 seconds..."
    sleep 5
done