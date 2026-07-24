#!/bin/bash

# ==========================================
# Nova Hosting Panel - Auto VPS Installer
# ==========================================

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit
fi

echo "=========================================="
echo "    Installing Nova Hosting Panel         "
echo "=========================================="

# 1. Update system
echo -e "\n[+] Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git sudo debian-keyring debian-archive-keyring apt-transport-https

# 2. Install Node.js (v20 is required for Inquirer)
echo -e "\n[+] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Docker
echo -e "\n[+] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
else
    echo "Docker is already installed."
fi

# 4. Install PM2
echo -e "\n[+] Installing PM2..."
npm install -g pm2

# 5. Install Caddy (For Auto-SSL & Reverse Proxy)
echo -e "\n[+] Installing Caddy Server..."
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install caddy -y

# 6. Clone the GitHub Repository
echo -e "\n[+] Cloning Panel Repository..."
mkdir -p /var/www
cd /var/www
# Remove existing folder if re-installing
rm -rf nova-panel
# Using your provided github link:
git clone https://github.com/divyangpatel402/novaxhostingerhostingpanel.git nova-panel
cd nova-panel

# 7. Install Node modules
echo -e "\n[+] Installing Panel Dependencies..."
npm install

# 8. Run the interactive installer (install.js)
echo -e "\n[+] Starting Interactive Setup..."
node install.js

# 8.5 Configure Firewall (UFW)
echo -e "\n[+] Configuring Firewall (Unlocking Ports)..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3000/udp
ufw reload

# 9. Configure Caddy for the Domain (Read from .env)
echo -e "\n[+] Configuring Web Server (HTTPS)..."
DOMAIN=$(grep PANEL_DOMAIN .env | cut -d '=' -f2)

if [ -n "$DOMAIN" ]; then
cat <<EOF > /etc/caddy/Caddyfile
$DOMAIN {
    reverse_proxy localhost:3000
}
EOF
    # Stop apache/nginx to free up port 80 for Caddy
    systemctl stop apache2 nginx 2>/dev/null || true
    systemctl disable apache2 nginx 2>/dev/null || true
    
    systemctl restart caddy
    systemctl enable caddy
    echo "✅ SSL Certificate & Domain Configured for $DOMAIN"
else
    echo "❌ Domain not found in .env, skipping SSL setup."
fi

# 10. Start the panel as a background service
echo -e "\n[+] Starting Nova Panel Service..."
pm2 start server.js --name "nova-panel"
pm2 save
pm2 startup

echo -e "\n=========================================="
echo "✅ Nova Hosting Panel successfully installed!"
echo "Aapka panel ab https://$DOMAIN par live hai."
echo "==========================================\n"
