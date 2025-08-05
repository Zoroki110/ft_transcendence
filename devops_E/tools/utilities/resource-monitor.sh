#!/bin/bash
# Real-time resource monitoring

echo "🖥️  Real-time Resource Monitor - Transcendence"
echo "=============================================="
echo "Press Ctrl+C to stop"
echo ""

while true; do
    clear
    echo "📊 System Resources - $(date)"
    echo "=============================="
    
    # CPU Usage
    echo "💻 CPU Usage:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | awk '{print "  Current: " $1 "%"}'
    
    # Memory Usage  
    echo ""
    echo "🧠 Memory Usage:"
    free -h | awk 'NR==2{printf "  Used: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }'
    
    # Disk Usage
    echo ""
    echo "💾 Disk Usage:"
    df -h / | awk 'NR==2{printf "  Used: %s/%s (%s)\n", $3,$2,$5}'
    
    # Docker Containers
    echo ""
    echo "🐳 Container Resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -6
    
    # Network
    echo ""
    echo "🌐 Network Activity:"
    cat /proc/net/dev | grep -E "(eth0|enp|wlp)" | head -1 | awk '{print "  RX: " $2/1024/1024 " MB, TX: " $10/1024/1024 " MB"}'
    
    sleep 5
done
