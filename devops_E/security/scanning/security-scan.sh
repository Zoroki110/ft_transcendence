#!/bin/bash
# Security scanning script

echo "🔒 Transcendence Security Scan"
echo "=============================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Docker containers for vulnerabilities
echo "🐳 Scanning Docker containers for vulnerabilities..."

if command_exists docker; then
    # Get list of images
    images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")
    
    for image in $images; do
        echo "  Scanning $image..."
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$PWD":/tmp aquasec/trivy image --quiet "$image" || echo "    ⚠️  Could not scan $image"
    done
else
    echo "❌ Docker not available"
fi

# Check for exposed secrets
echo ""
echo "🔍 Checking for exposed secrets..."

# Check environment files
echo "  Checking environment files..."
if find . -name "*.env*" -not -path "./environments/.env.example" -exec grep -l "password\|secret\|key" {} \; | grep -v ".example"; then
    echo "    ⚠️  Found potential secrets in environment files"
else
    echo "    ✅ No exposed secrets found"
fi

# Check for hardcoded secrets in code
echo "  Checking for hardcoded secrets..."
if find . -type f -name "*.js" -o -name "*.ts" -o -name "*.yml" -o -name "*.yaml" | \
   xargs grep -l "password.*=.*['\"].*['\"]" 2>/dev/null; then
    echo "    ⚠️  Found potential hardcoded secrets"
else
    echo "    ✅ No hardcoded secrets found"
fi

# Check SSL/TLS configuration
echo ""
echo "🔐 Checking SSL/TLS configuration..."

if [ -f "docker/nginx/ssl/certs/server.crt" ]; then
    echo "  SSL certificate found"
    expiry=$(openssl x509 -enddate -noout -in docker/nginx/ssl/certs/server.crt | cut -d= -f2)
    echo "    Expires: $expiry"
else
    echo "    ⚠️  No SSL certificate found"
fi

# Check file permissions
echo ""
echo "📋 Checking file permissions..."

# Check for world-writable files
world_writable=$(find . -type f -perm -002 2>/dev/null | head -5)
if [ -n "$world_writable" ]; then
    echo "    ⚠️  World-writable files found:"
    echo "$world_writable" | sed 's/^/      /'
else
    echo "    ✅ No world-writable files found"
fi

# Check Docker daemon socket exposure
echo ""
echo "🐋 Checking Docker security..."

if [ -S "/var/run/docker.sock" ]; then
    socket_perms=$(ls -la /var/run/docker.sock)
    echo "  Docker socket permissions: $socket_perms"
    if echo "$socket_perms" | grep -q "rw-rw----"; then
        echo "    ✅ Docker socket has appropriate permissions"
    else
        echo "    ⚠️  Docker socket may have overly permissive permissions"
    fi
fi

echo ""
echo "✅ Security scan completed!"
echo ""
echo "📋 Security Checklist:"
echo "  □ Regular security updates"
echo "  □ Strong passwords and secrets rotation"
echo "  □ SSL/TLS certificates up to date"
echo "  □ Proper file permissions"
echo "  □ Network security (firewall, VPN)"
echo "  □ Container security scanning"
echo "  □ Dependency vulnerability scanning"
