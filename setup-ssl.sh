#!/bin/bash

# This script helps set up SSL certificates for lastbytebar.com
# Make sure to run this script on your production server, not locally

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Get the domain name from args or use default
DOMAIN=${1:-lastbytebar.com}
EMAIL=${2:-admin@lastbytebar.com}

echo "Setting up SSL certificates for $DOMAIN using email $EMAIL"

# Install Certbot
echo "Installing Certbot..."
apt-get update
apt-get install -y certbot

# Stop services that might be using port 80
echo "Stopping services that might be using port 80..."
docker-compose down || true
systemctl stop nginx || true

# Get the certificate
echo "Obtaining SSL certificate for $DOMAIN..."
certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --email $EMAIL \
  -d $DOMAIN \
  -d www.$DOMAIN

# Check if the certificates were obtained successfully
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "Failed to obtain certificates. Please check the certbot output above."
  exit 1
fi

# Copy the certificates to the right location
echo "Copying certificates to the ssl directory..."
mkdir -p ./ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/$DOMAIN.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/$DOMAIN.key
chmod -R 755 ./ssl

# Start the services with production configuration
echo "Starting services with production configuration..."
docker-compose -f docker-compose.prod.yml up -d

echo "SSL setup complete!"
echo "Add a cronjob to renew your certificates automatically:"
echo "0 3 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /path/to/your/app/ssl/$DOMAIN.crt && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /path/to/your/app/ssl/$DOMAIN.key && docker-compose -f /path/to/your/app/docker-compose.prod.yml restart ui" 