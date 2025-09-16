# MAKU.Travel Gemini CLI Integration Guide

## Overview

The Gemini CLI integration provides powerful command-line tools for rapid travel content generation, AI prompt testing, and development workflow enhancement. This guide covers setup, usage, and best practices for the MAKU.Travel development team.

## Setup & Installation

### Prerequisites
- Node.js 18+ installed
- MAKU.Travel project cloned locally
- Gemini API key configured in `.env` file

### Configuration
1. **API Key Setup**: Ensure `VITE_GEMINI_API_KEY` is set in your `.env` file
2. **CLI Installation**: The `@google/gemini-cli` is already installed as a dev dependency
3. **Permissions**: Make sure `scripts/gemini-cli.js` is executable

## Available Commands

### Content Generation Commands

#### `generate-destination <destination>`
Creates comprehensive destination descriptions optimized for MAKU.Travel platform.

```bash
node scripts/gemini-cli.js generate-destination "Tokyo, Japan"
```

**Output Format**: Markdown with sections for attractions, best time to visit, cuisine, and cultural experiences.

#### `create-itinerary <destination> <days>`
Generates detailed day-by-day travel itineraries with booking integration focus.

```bash
node scripts/gemini-cli.js create-itinerary "Paris" "5"
```

**Output Format**: Structured markdown with daily activities, restaurants, transportation, and cost estimates.

#### `generate-hotel-desc <hotelName> <location>`
Creates engaging hotel descriptions for booking platform integration.

```bash
node scripts/gemini-cli.js generate-hotel-desc "Hotel Magnificent" "Paris, France"
```

### Travel Intelligence Commands

#### `flight-search-tips <origin> <destination> <dateRange>`
Provides flight booking optimization strategies and alerts.

```bash
node scripts/gemini-cli.js flight-search-tips "Sydney" "Tokyo" "December 2025"
```

#### `activity-recommendations <destination> <interests> <budget>`
Suggests activities and experiences with booking integration opportunities.

```bash
node scripts/gemini-cli.js activity-recommendations "Bali" "adventure,culture" "moderate"
```

#### `travel-tips <destination>`
Generates practical travel advice and local insights.

```bash
node scripts/gemini-cli.js travel-tips "Bali, Indonesia"
```

### Business Operations Commands

#### `customer-service-response <scenario> [tone]`
Creates customer support templates aligned with MAKU.Travel brand voice.

```bash
node scripts/gemini-cli.js customer-service-response "flight cancellation due to weather" "empathetic"
```

**Available Tones**: helpful, empathetic, professional, urgent

#### `marketing-content <type> <destination> [audience]`
Generates marketing materials for different channels and audiences.

```bash
node scripts/gemini-cli.js marketing-content "social-post" "Tokyo" "millennials"
```

**Content Types**: social-post, email-campaign, blog-intro, newsletter, landing-page

### Development & Testing Commands

#### `test-prompt <promptText> [context]`
Tests AI prompts for quality and provides improvement suggestions.

```bash
node scripts/gemini-cli.js test-prompt "Help me find budget hotels in Tokyo" "flight booking context"
```

#### `batch-destinations <destination1,destination2,...>`
Generates content for multiple destinations in bulk.

```bash
node scripts/gemini-cli.js batch-destinations "Tokyo,Paris,Bali,Sydney,New York"
```

## Development Workflow Integration

### Content Pipeline Workflow

1. **Content Planning**: Use CLI to generate initial content drafts
2. **Review & Refinement**: Edit generated content for brand consistency
3. **Integration**: Import content into React components or CMS
4. **Quality Assurance**: Use `test-prompt` for ongoing optimization

### Recommended npm Scripts

Add these to your `package.json` scripts section for quick access:

```json
{
  "scripts": {
    "gemini:destination": "node scripts/gemini-cli.js generate-destination",
    "gemini:itinerary": "node scripts/gemini-cli.js create-itinerary",
    "gemini:hotels": "node scripts/gemini-cli.js generate-hotel-desc",
    "gemini:tips": "node scripts/gemini-cli.js travel-tips",
    "gemini:test": "node scripts/gemini-cli.js test-prompt",
    "gemini:batch": "node scripts/gemini-cli.js batch-destinations"
  }
}
```

### Integration with Existing Gemini Setup

The CLI shares the same API key (`VITE_GEMINI_API_KEY`) as the programmatic Gemini integration in `src/lib/gemini.ts`. This ensures:

- **Unified Configuration**: Single API key management
- **Consistent Context**: Same project context across CLI and app
- **Cost Optimization**: Shared rate limits and billing

## Best Practices

### Content Generation
- **Be Specific**: Provide detailed destination names and context
- **Brand Alignment**: Review all generated content for MAKU.Travel brand voice
- **Batch Operations**: Use batch commands for efficiency when generating multiple pieces

### Prompt Testing
- **Iterative Improvement**: Use `test-prompt` to refine AI interactions
- **Context Awareness**: Always provide relevant context for better results
- **Documentation**: Keep track of successful prompt patterns

### Team Collaboration
- **Shared Templates**: Document successful prompts in team knowledge base
- **Version Control**: Commit generated content to appropriate directories
- **Quality Standards**: Establish review process for AI-generated content

## Troubleshooting

### Common Issues

#### API Key Not Configured
```
❌ Error: VITE_GEMINI_API_KEY not configured in .env file
```
**Solution**: Add your Gemini API key to the `.env` file.

#### Gemini CLI Command Failed
```
❌ Gemini CLI Error: [error message]
```
**Solutions**:
- Check internet connection
- Verify API key validity
- Check Gemini API rate limits
- Ensure `@google/gemini-cli` is installed

#### Permission Denied
**Solution**: Make the script executable:
```bash
chmod +x scripts/gemini-cli.js
```

### Performance Optimization

- **Batch Processing**: Use batch commands for multiple destinations
- **Rate Limiting**: Be mindful of API rate limits during bulk operations
- **Caching**: Consider caching frequently used prompts locally

## Advanced Usage

### Custom Prompt Templates

Create custom prompt templates by extending the `commands` object in `scripts/gemini-cli.js`:

```javascript
'custom-command': (param1, param2) => {
  const prompt = `Your custom prompt template with ${param1} and ${param2}`;
  return runGeminiCommand(prompt, { model: 'gemini-pro' });
}
```

### Integration with CI/CD

Add CLI commands to your deployment pipeline for automated content generation:

```yaml
# Example GitHub Actions step
- name: Generate Travel Content
  run: |
    npm run gemini:batch "Tokyo,Paris,Sydney"
    # Process and commit generated content
```

## Support & Resources

- **Internal Documentation**: Check the `src/lib/gemini.ts` implementation
- **Gemini API Docs**: [Google Gemini API Documentation](https://ai.google.dev/docs)
- **CLI Tool Docs**: [Gemini CLI Tool](https://www.npmjs.com/package/@google/gemini-cli)

For questions or improvements, contact the development team or create an issue in the project repository.