#!/bin/bash

# Expense Tracker - CloudPanel Deployment Script
# Usage: ./deploy.sh [setup|update]

set -e

APP_NAME="expenses"
APP_DIR="/home/cloudpanel/htdocs/expenses.4tmrw.net"
REPO_URL="https://github.com/colin-cd72/expenses.git"
NODE_VERSION="20"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as correct user
check_user() {
    if [ "$(whoami)" != "cloudpanel" ] && [ "$(whoami)" != "root" ]; then
        warn "Consider running as cloudpanel user or root"
    fi
}

# Initial setup
setup() {
    log "Starting initial setup..."

    # Check if directory exists
    if [ -d "$APP_DIR" ]; then
        if [ -d "$APP_DIR/.git" ]; then
            warn "Repository already exists. Running update instead..."
            update
            return
        fi
    else
        mkdir -p "$APP_DIR"
    fi

    cd "$APP_DIR"

    # Clone repository
    log "Cloning repository..."
    git clone "$REPO_URL" .

    # Install dependencies
    log "Installing dependencies..."
    npm install

    # Check for .env.local
    if [ ! -f ".env.local" ]; then
        warn "No .env.local file found!"
        echo ""
        echo "Please create .env.local with your Anthropic API key:"
        echo ""
        echo "  echo 'ANTHROPIC_API_KEY=your-key-here' > $APP_DIR/.env.local"
        echo ""
        read -p "Enter your ANTHROPIC_API_KEY (or press Enter to skip): " api_key
        if [ -n "$api_key" ]; then
            echo "ANTHROPIC_API_KEY=$api_key" > .env.local
            log "Created .env.local"
        else
            warn "Skipping .env.local - you'll need to create it manually"
        fi
    fi

    # Build the application
    log "Building application..."
    npm run build

    # Setup PM2
    log "Setting up PM2..."
    if command -v pm2 &> /dev/null; then
        pm2 delete "$APP_NAME" 2>/dev/null || true
        pm2 start ecosystem.config.js
        pm2 save
        log "PM2 process started"
    else
        error "PM2 is not installed. Install it with: npm install -g pm2"
    fi

    echo ""
    log "============================================"
    log "Setup complete!"
    log "============================================"
    echo ""
    echo "Next steps:"
    echo "1. Configure Nginx vhost in CloudPanel (see below)"
    echo "2. Enable SSL certificate in CloudPanel"
    echo ""
    echo "Add this to your Nginx vhost configuration:"
    echo ""
    echo "location / {"
    echo "    proxy_pass http://127.0.0.1:3000;"
    echo "    proxy_http_version 1.1;"
    echo "    proxy_set_header Upgrade \$http_upgrade;"
    echo "    proxy_set_header Connection 'upgrade';"
    echo "    proxy_set_header Host \$host;"
    echo "    proxy_set_header X-Real-IP \$remote_addr;"
    echo "    proxy_cache_bypass \$http_upgrade;"
    echo "}"
    echo ""
}

# Update existing installation
update() {
    log "Starting update..."

    if [ ! -d "$APP_DIR/.git" ]; then
        error "Not a git repository. Run './deploy.sh setup' first."
    fi

    cd "$APP_DIR"

    # Pull latest changes
    log "Pulling latest changes..."
    git fetch origin
    git reset --hard origin/main

    # Install dependencies (in case of new packages)
    log "Installing dependencies..."
    npm install

    # Rebuild
    log "Building application..."
    npm run build

    # Restart PM2
    log "Restarting application..."
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 restart "$APP_NAME"
    else
        pm2 start ecosystem.config.js
        pm2 save
    fi

    log "Update complete!"
}

# Show status
status() {
    echo ""
    log "Application Status"
    echo "=================="

    if command -v pm2 &> /dev/null; then
        pm2 show "$APP_NAME" 2>/dev/null || warn "App not running in PM2"
    fi

    echo ""
    echo "Recent logs:"
    pm2 logs "$APP_NAME" --lines 10 --nostream 2>/dev/null || true
}

# Show logs
logs() {
    pm2 logs "$APP_NAME" "${@:2}"
}

# Restart app
restart() {
    log "Restarting application..."
    pm2 restart "$APP_NAME"
    log "Restart complete!"
}

# Stop app
stop() {
    log "Stopping application..."
    pm2 stop "$APP_NAME"
    log "Application stopped"
}

# Show help
show_help() {
    echo ""
    echo "Expense Tracker Deployment Script"
    echo "=================================="
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Initial setup (clone, install, build, start)"
    echo "  update   - Pull latest changes and rebuild"
    echo "  restart  - Restart the application"
    echo "  stop     - Stop the application"
    echo "  status   - Show application status"
    echo "  logs     - Show application logs (use -f for follow)"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh setup     # First time setup"
    echo "  ./deploy.sh update    # Deploy latest changes"
    echo "  ./deploy.sh logs -f   # Follow logs in real-time"
    echo ""
}

# Main
check_user

case "${1:-help}" in
    setup)
        setup
        ;;
    update)
        update
        ;;
    restart)
        restart
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    logs)
        logs "$@"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $1. Use './deploy.sh help' for usage."
        ;;
esac
