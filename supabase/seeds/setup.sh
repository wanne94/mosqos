#!/bin/bash

# MosqOS Seeding Setup Script
# Automated setup for the seeding system

set -e

echo "🌟 MosqOS Seeding System Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from supabase/seeds directory"
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install

# Step 2: Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "🔧 Step 2: Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your SUPABASE_SERVICE_ROLE_KEY"
    echo ""
else
    echo ""
    echo "✅ .env file already exists"
fi

# Step 3: Check Supabase connection
echo ""
echo "🔍 Step 3: Checking Supabase connection..."

if [ -f ".env" ]; then
    source .env
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY not set in .env"
        echo ""
        echo "To get your service role key:"
        echo "  Local: Run 'npx supabase status'"
        echo "  Hosted: Go to Supabase Dashboard → Settings → API"
    else
        echo "✅ SUPABASE_SERVICE_ROLE_KEY is set"
    fi
else
    echo "⚠️  .env file not found"
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and add your SUPABASE_SERVICE_ROLE_KEY"
echo "  2. Run: npm run seed:interactive"
echo ""
echo "For help, see:"
echo "  - QUICK_START.md"
echo "  - README.md"
echo ""
