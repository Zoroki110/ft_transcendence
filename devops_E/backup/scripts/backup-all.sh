#!/bin/bash
# Complete backup script

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_BASE_DIR="$PROJECT_ROOT/backup/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="transcendence_backup_$TIMESTAMP"
BACKUP_DIR="$BACKUP_BASE_DIR/$BACKUP_NAME"

echo "💾 Starting complete backup: $BACKUP_NAME"
echo "============================================"
echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Backup location: $BACKUP_DIR"

# Create backup directory
echo "📁 Creating backup directory..."
mkdir -p "$BACKUP_DIR"

# Change to project root for docker-compose commands
cd "$PROJECT_ROOT/devops"

# Check if docker-compose is running
if ! docker-compose ps | grep -q "Up"; then
    echo "⚠️  Warning: No running containers detected"
    echo "   Starting containers for backup..."
    docker-compose up -d database
    sleep 10
fi

# Backup database
echo "📊 Backing up database..."
if docker-compose exec -T database pg_isready -U transcendence; then
    docker-compose exec -T database pg_dump -U transcendence transcendence > "$BACKUP_DIR/database.sql"
    echo "   ✅ Database backup completed"
else
    echo "   ❌ Database not accessible, skipping database backup"
fi

# Backup uploaded files (if any)
echo "📁 Backing up application files..."
if [ -d "$PROJECT_ROOT/uploads" ]; then
    cp -r "$PROJECT_ROOT/uploads" "$BACKUP_DIR/"
    echo "   ✅ Uploaded files backed up"
else
    echo "   ℹ️  No uploads directory found"
fi

# Backup configuration
echo "⚙️ Backing up configuration..."
cp -r environments "$BACKUP_DIR/"
cp docker/docker-compose*.yml "$BACKUP_DIR/" 2>/dev/null || echo "   ⚠️  Some docker-compose files not found"
echo "   ✅ Configuration backed up"

# Backup SSL certificates if they exist
if [ -d "docker/nginx/ssl/certs" ] && [ "$(ls -A docker/nginx/ssl/certs)" ]; then
    echo "🔐 Backing up SSL certificates..."
    mkdir -p "$BACKUP_DIR/ssl"
    cp -r docker/nginx/ssl/certs "$BACKUP_DIR/ssl/"
    echo "   ✅ SSL certificates backed up"
fi

# Create backup info file
echo "📝 Creating backup info..."
cat > "$BACKUP_DIR/backup_info.txt" << BACKUP_EOF
Backup Created: $(date)
Project Root: $PROJECT_ROOT
Database Size: $(du -sh "$BACKUP_DIR/database.sql" 2>/dev/null | cut -f1 || echo "N/A")
Configuration Size: $(du -sh "$BACKUP_DIR/environments" 2>/dev/null | cut -f1 || echo "N/A")
Total Size: $(du -sh "$BACKUP_DIR" | cut -f1)
Git Commit: $(cd "$PROJECT_ROOT" && git rev-parse HEAD 2>/dev/null || echo "Not available")
Git Branch: $(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null || echo "Not available")
Docker Containers: $(docker-compose ps --services | tr '\n' ' ')
BACKUP_EOF

# Compress backup
echo "🗜️  Compressing backup..."
cd "$BACKUP_BASE_DIR"
if [ -d "$BACKUP_NAME" ]; then
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    rm -rf "$BACKUP_NAME"
    echo "   ✅ Backup compressed: ${BACKUP_NAME}.tar.gz"
else
    echo "   ❌ Backup directory not found for compression"
    exit 1
fi

echo "✅ Backup completed: $BACKUP_BASE_DIR/${BACKUP_NAME}.tar.gz"

# Clean old backups (keep last 7 days)
echo "🧹 Cleaning old backups..."
find "$BACKUP_BASE_DIR" -name "transcendence_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
echo "   ✅ Old backups cleaned"

echo ""
echo "📊 Backup Summary:"
echo "   Location: $BACKUP_BASE_DIR/${BACKUP_NAME}.tar.gz"
echo "   Size: $(du -sh "$BACKUP_BASE_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"
echo "   Contents: Database, Configuration, SSL certs (if present)"

echo "✅ Backup process completed successfully!"
