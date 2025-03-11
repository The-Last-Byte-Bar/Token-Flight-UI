#!/bin/bash

# This script generates self-signed SSL certificates for local testing

# Create the ssl directory if it doesn't exist
mkdir -p ./ssl

# Generate a self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./ssl/nginx-selfsigned.key \
  -out ./ssl/nginx-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=lastbytebar.com"

# Set appropriate permissions
chmod 644 ./ssl/nginx-selfsigned.crt
chmod 600 ./ssl/nginx-selfsigned.key

echo "Self-signed certificates generated successfully!"
echo "To use them, update your docker-compose.yml file to mount these certificates." 