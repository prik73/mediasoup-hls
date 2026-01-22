#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting MediaSoup Backend Deployment...${NC}"

# 1. Update System
echo -e "${GREEN}Updating system packages...${NC}"
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You might need to log out and back in for group changes."
else
    echo "Docker already installed."
fi

# 3. Setup Firewall (UFW)
echo -e "${GREEN}Configuring Firewall (UFW)...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 10000:10100/udp
sudo ufw --force enable

# 4. Create Directories if not exist
mkdir -p public/hls
mkdir -p data
mkdir -p letsencrypt

# 5. Start Services
echo -e "${GREEN}Starting Docker Containers...${NC}"
sudo docker compose up -d --build

echo -e "${BLUE}Deployment Complete! 🚀${NC}"
echo -e "Logs: sudo docker compose logs -f"
