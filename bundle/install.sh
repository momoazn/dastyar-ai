#!/bin/bash
set -e

echo "Installing AI App as systemd service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create installation directory
INSTALL_DIR="/opt/ai-app"
mkdir -p "$INSTALL_DIR"

# Copy executable
cp ai-app "$INSTALL_DIR/ai-app"
chmod +x "$INSTALL_DIR/ai-app"

# Create systemd service file
cat > /etc/systemd/system/ai-app.service << EOF
[Unit]
Description=AI Application Suite
After=network.target

[Service]
Type=simple
User=ai-app
Group=ai-app
ExecStart=$INSTALL_DIR/ai-app
Restart=always
RestartSec=5
Environment=AI_APP_DATA_DIR=/var/lib/ai-app

[Install]
WantedBy=multi-user.target
EOF

# Create user for the service
useradd -r -s /bin/false ai-app 2>/dev/null || true

# Create data directory
mkdir -p /var/lib/ai-app
chown ai-app:ai-app /var/lib/ai-app

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable ai-app

echo "AI App installed successfully!"
echo ""
echo "To start the service:"
echo "  sudo systemctl start ai-app"
echo ""
echo "To check status:"
echo "  sudo systemctl status ai-app"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u ai-app -f"
echo ""
echo "To uninstall:"
echo "  sudo systemctl stop ai-app"
echo "  sudo systemctl disable ai-app"
echo "  sudo rm /etc/systemd/system/ai-app.service"
echo "  sudo systemctl daemon-reload"
