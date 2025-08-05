#!/bin/sh
# Entrypoint script for frontend

# Replace environment variables in built files if needed
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "Replacing environment variables in frontend files..."
    # Add environment variable replacement logic here if needed
fi

# Start nginx
exec "$@"
