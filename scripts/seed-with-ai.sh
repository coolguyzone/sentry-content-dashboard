#!/bin/bash

# Load only OPENAI_API_KEY from .env.local
if [ -f .env.local ]; then
  export $(grep OPENAI_API_KEY .env.local | xargs)
fi

# Load only YOUTUBE_API_KEY from .env.local
if [ -f .env.local ]; then
  export $(grep YOUTUBE_API_KEY .env.local | xargs)
fi

# Don't load GITHUB_TOKEN to avoid authentication issues

echo "🔑 Environment variables loaded (OpenAI only)"
echo ""

# Run the seed script
node scripts/seed-docs-changelog.js

