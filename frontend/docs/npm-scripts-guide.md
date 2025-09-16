# Gemini CLI Integration - npm Scripts Guide

## Overview
Since `package.json` is managed by the system, here are the equivalent commands you can run directly for Gemini CLI operations:

## Available Commands

### 1. Generate Destination Guide
```bash
node scripts/gemini-cli.js generate-destination "Tokyo, Japan"
```

### 2. Create Travel Itinerary
```bash
node scripts/gemini-cli.js create-itinerary "Paris" 7
```

### 3. Generate Hotel Description
```bash
node scripts/gemini-cli.js generate-hotel-desc "Grand Hotel" "Sydney"
```

### 4. Get Travel Tips
```bash
node scripts/gemini-cli.js travel-tips "Thailand"
```

### 5. Flight Search Tips
```bash
node scripts/gemini-cli.js flight-search-tips "Sydney" "Tokyo" "March 2025"
```

### 6. Activity Recommendations
```bash
node scripts/gemini-cli.js activity-recommendations "Bali" "adventure,culture" "moderate"
```

### 7. Customer Service Response
```bash
node scripts/gemini-cli.js customer-service-response "flight-delay" "empathetic"
```

### 8. Marketing Content
```bash
node scripts/gemini-cli.js marketing-content "social-post" "Santorini" "millennials"
```

### 9. Test Custom Prompt
```bash
node scripts/gemini-cli.js test-prompt "Your custom prompt here" "travel-context"
```

### 10. Batch Process Destinations
```bash
node scripts/gemini-cli.js batch-destinations "Tokyo,Paris,London,Sydney"
```

## Web Interface Alternative

For a more user-friendly experience, you can use the admin dashboard:
1. Navigate to `/admin/operations/testing`
2. Use the Gemini CLI Interface component
3. Select operations and fill in parameters through the UI

## Environment Setup

Make sure your Gemini API key is configured:
- The key is securely stored in Supabase secrets as `GEMINI_API_KEY`
- Edge functions automatically have access to this secret
- CLI commands use the key from your local environment

## Workflow Integration

### Development Workflow
1. Use CLI commands for quick content generation during development
2. Test prompts using the web interface for validation
3. Import generated content into components using the integration utilities

### Content Management
1. Generate content using CLI or web interface
2. Review and edit generated content
3. Import into your React components
4. Version control through git

## Troubleshooting

### Common Issues
- **API Key Error**: Ensure `VITE_GEMINI_API_KEY` is set in your local `.env` file
- **Command Not Found**: Run commands from the project root directory
- **Network Issues**: Check internet connection and API key validity

### Getting Help
- Check the console output for detailed error messages
- Use the test-prompt command to validate your API key
- Review the generated logs in the admin dashboard

## Advanced Usage

### Custom Prompt Templates
Modify `scripts/travel-prompt-templates.js` to add your own prompt templates.

### Batch Operations
Use the workflow automation script for processing multiple items:
```bash
node scripts/workflow-automation.js batch-generate destinations destinations.json
```

### Integration with Components
Use the `geminiIntegration.ts` utility to import CLI-generated content into your React components.