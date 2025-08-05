#!/bin/sh
# Entrypoint script for backend development

# Wait for database to be ready
./wait-for-it.sh database:5432 --timeout=60 --strict -- echo "Database is ready"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run database migrations
echo "Running database migrations..."
npm run migration:run

# Start the application
echo "Starting backend application..."
exec "$@"
