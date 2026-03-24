#!/bin/bash
# Initial server setup for Ubuntu 24.04 on Hetzner CX22
# Run as root: bash setup-server.sh

set -e

DOMAIN="storecheckai.com"
EMAIL="your@email.com"   # <-- thay email của bạn vào đây

echo "=== [1/7] Update system ==="
apt-get update && apt-get upgrade -y

echo "=== [2/7] Install Docker ==="
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== [3/7] Start Docker ==="
systemctl enable docker
systemctl start docker

echo "=== [4/7] Create app directory ==="
mkdir -p /opt/storecheckai/nginx/conf.d
cd /opt/storecheckai

echo "=== [5/7] Get SSL certificate (HTTP-01 challenge) ==="
# Tạm dùng nginx plain để lấy cert trước
docker run --rm -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" -d "www.$DOMAIN"

echo "=== [6/7] Set up cron for cert renewal ==="
echo "0 3 * * * certbot renew --quiet && docker exec storecheckai-nginx-1 nginx -s reload" | crontab -

echo "=== [7/7] Configure firewall ==="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "=== Setup complete! ==="
echo "Now copy your app files to /opt/storecheckai/ and run:"
echo "  cd /opt/storecheckai && docker compose up -d"
