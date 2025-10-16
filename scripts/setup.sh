#!/usr/bin/env bash

# Development script for building and testing the GitHub Action

set -e

echo "🔧 Installing dependencies..."
npm ci

echo "🎨 Formatting code..."
npm run format

echo "🔍 Linting code..."
npm run lint

echo "🧪 Running tests..."
npm run test

echo "📦 Building action..."
npm run build

echo "✅ All checks passed!"

echo ""
echo "💡 Available commands:"
echo "  npm run dev     - Watch mode for development"
echo "  npm run build   - Build the action"
echo "  npm run test    - Run tests"
echo "  npm run lint    - Run linter"
echo "  npm run format  - Format code"