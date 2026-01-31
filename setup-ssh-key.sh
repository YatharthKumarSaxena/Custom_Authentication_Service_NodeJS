#!/bin/bash

# Automated SSH Key Setup for Termux
# This will enable passwordless SMS sending

echo "🔑 Setting up passwordless SSH to Termux..."
echo ""

# Read .env to get credentials
TERMUX_IP=$(grep "^TERMUX_IP=" .env | cut -d'=' -f2 | tr -d ' ' | cut -d'#' -f1)
TERMUX_USER=$(grep "^TERMUX_USER=" .env | cut -d'=' -f2 | tr -d ' ' | cut -d'#' -f1)
TERMUX_PORT=$(grep "^TERMUX_PORT=" .env | cut -d'=' -f2 | tr -d ' ' | cut -d'#' -f1)

echo "📱 Termux Details:"
echo "   IP: $TERMUX_IP"
echo "   User: $TERMUX_USER"
echo "   Port: $TERMUX_PORT"
echo ""

# Check if public key exists
if [ ! -f ~/.ssh/termux_key.pub ]; then
    echo "❌ SSH key not found!"
    exit 1
fi

# Get public key content
PUB_KEY=$(cat ~/.ssh/termux_key.pub)

echo "📤 Copying SSH key to Termux..."
echo "   Password: termux123"
echo ""

# Copy key to Termux using sshpass
sshpass -p "termux123" ssh -o StrictHostKeyChecking=no -p $TERMUX_PORT $TERMUX_USER@$TERMUX_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUB_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH key successfully added!"
    echo ""
    echo "🧪 Testing passwordless connection..."
    ssh -i ~/.ssh/termux_key -o StrictHostKeyChecking=no -p $TERMUX_PORT $TERMUX_USER@$TERMUX_IP "echo '✅ Passwordless SSH working!'"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Setup Complete!"
        echo "   Now SMS will send without password prompts"
        echo ""
        echo "🔧 Updating SMS service to use SSH key..."
    else
        echo ""
        echo "⚠️ Connection test failed. Manual setup may be needed."
    fi
else
    echo ""
    echo "❌ Failed to copy key. Check if:"
    echo "   1. Mobile is on same WiFi"
    echo "   2. SSH server running (run 'sshd' in Termux)"
    echo "   3. Password is correct (termux123)"
fi