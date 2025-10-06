#!/bin/bash

# Ngrok Setup Script for CrisisLens
echo "🚀 Setting up ngrok for CrisisLens..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Ngrok Configuration
NGROK_AUTHTOKEN=your_authtoken_here
NGROK_DOMAIN=crisislens.ngrok-free.app

# Add your authtoken from https://dashboard.ngrok.com/
# Replace 'your_authtoken_here' with your actual token
EOF
    echo "⚠️  Please update .env with your ngrok authtoken!"
    echo "   Get it from: https://dashboard.ngrok.com/"
    exit 1
fi

# Check if authtoken is set
if grep -q "your_authtoken_here" .env; then
    echo "⚠️  Please update .env with your actual ngrok authtoken!"
    echo "   Get it from: https://dashboard.ngrok.com/"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '#' | awk '/=/ {print $1}')

# Configure ngrok
echo "🔧 Configuring ngrok..."
ngrok config add-authtoken $NGROK_AUTHTOKEN

echo "✅ Ngrok setup complete!"
echo "🌐 Your consistent URL will be: https://$NGROK_DOMAIN"
echo "🚀 Run 'npm run ngrok' to start the tunnel"
