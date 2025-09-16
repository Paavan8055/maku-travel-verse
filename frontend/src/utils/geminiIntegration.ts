/**
 * MAKU.Travel Gemini Integration Utilities
 * Connects CLI-generated content with React components and app state
 */

import { geminiBot, GeminiResponse } from '@/lib/gemini';
import { toast } from 'sonner';

export interface GeneratedContent {
  id: string;
  type: 'destination' | 'itinerary' | 'hotel' | 'activity' | 'marketing';
  title: string;
  content: string;
  metadata: Record<string, any>;
  generatedAt: Date;
  source: 'cli' | 'app' | 'api';
}

export interface ContentImportOptions {
  validate?: boolean;
  transform?: (content: string) => string;
  metadata?: Record<string, any>;
}

/**
 * Import CLI-generated content into the application
 */
export const importCliContent = async (
  cliOutput: string,
  type: GeneratedContent['type'],
  title: string,
  options: ContentImportOptions = {}
): Promise<GeneratedContent> => {
  const { validate = true, transform, metadata = {} } = options;
  
  let processedContent = cliOutput;
  
  // Apply content transformation if provided
  if (transform) {
    processedContent = transform(cliOutput);
  }
  
  // Validate content quality if requested
  if (validate) {
    const validation = await validateContent(processedContent, type);
    if (!validation.isValid) {
      toast.error('Content Quality Issue', {
        description: validation.issues.join(', ')
      });
    }
  }
  
  const content: GeneratedContent = {
    id: crypto.randomUUID(),
    type,
    title,
    content: processedContent,
    metadata: {
      ...metadata,
      wordCount: countWords(processedContent),
      readingTime: calculateReadingTime(processedContent),
      generatedBy: 'gemini-cli'
    },
    generatedAt: new Date(),
    source: 'cli'
  };
  
  // Store in local storage for persistence
  storeContent(content);
  
  toast.success('Content Imported', {
    description: `${title} has been successfully imported`
  });
  
  return content;
};

/**
 * Validate generated content quality
 */
export const validateContent = async (
  content: string,
  type: GeneratedContent['type']
): Promise<{ isValid: boolean; issues: string[]; score: number }> => {
  const issues: string[] = [];
  let score = 100;
  
  // Basic content validation
  if (!content || content.trim().length < 50) {
    issues.push('Content too short');
    score -= 30;
  }
  
  // Check for MAKU.Travel brand alignment
  const brandKeywords = ['MAKU.Travel', 'booking', 'travel', 'experience'];
  const hasBrandContext = brandKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (!hasBrandContext) {
    issues.push('Missing brand context');
    score -= 20;
  }
  
  // Type-specific validation
  switch (type) {
    case 'destination':
      if (!content.includes('attractions') && !content.includes('visit')) {
        issues.push('Missing key destination elements');
        score -= 15;
      }
      break;
      
    case 'itinerary':
      if (!content.includes('day') && !content.includes('Day')) {
        issues.push('Missing day-by-day structure');
        score -= 15;
      }
      break;
      
    case 'hotel':
      if (!content.includes('amenities') && !content.includes('rooms')) {
        issues.push('Missing hotel-specific details');
        score -= 15;
      }
      break;
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, score)
  };
};

/**
 * Transform CLI markdown output for React component usage
 */
export const transformForReact = (markdownContent: string): string => {
  return markdownContent
    // Convert headers for consistent styling
    .replace(/^# /gm, '## ')
    .replace(/^## /gm, '### ')
    
    // Add CSS classes for styling
    .replace(/\*\*(.*?)\*\*/g, '<strong className="font-semibold text-primary">$1</strong>')
    
    // Format lists for better styling
    .replace(/^- /gm, '• ')
    
    // Clean up extra whitespace
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
};

/**
 * Store content in browser local storage
 */
const storeContent = (content: GeneratedContent): void => {
  try {
    const existingContent = getStoredContent();
    const updatedContent = [content, ...existingContent].slice(0, 50); // Keep last 50 items
    
    localStorage.setItem('maku-generated-content', JSON.stringify(updatedContent));
  } catch (error) {
    console.warn('Failed to store content locally:', error);
  }
};

/**
 * Retrieve stored content from local storage
 */
export const getStoredContent = (): GeneratedContent[] => {
  try {
    const stored = localStorage.getItem('maku-generated-content');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to retrieve stored content:', error);
    return [];
  }
};

/**
 * Connect CLI workflow with existing Gemini bot
 */
export const enhanceGeminiBotWithCli = async (
  prompt: string,
  cliCommand?: string,
  cliArgs?: string[]
): Promise<GeminiResponse> => {
  // If CLI command is provided, suggest using CLI for better results
  if (cliCommand) {
    const cliSuggestion = `
💡 **CLI Suggestion**: For more detailed content, try:
\`\`\`bash
node scripts/gemini-cli.js ${cliCommand} ${cliArgs?.join(' ') || ''}
\`\`\`
    `;
    
    const response = await geminiBot.processQuery(prompt);
    
    return {
      ...response,
      message: response.message + '\n\n' + cliSuggestion,
      suggestions: [
        ...(response.suggestions || []),
        'Use CLI for detailed content',
        'Import CLI results'
      ]
    };
  }
  
  return geminiBot.processQuery(prompt);
};

/**
 * Create content templates for different use cases
 */
export const createContentTemplate = (
  type: GeneratedContent['type'],
  params: Record<string, any>
): string => {
  const templates = {
    destination: `# ${params.name}
    
## Overview
[Generated overview will appear here]

## Top Attractions
[Key attractions and highlights]

## Best Time to Visit
[Seasonal recommendations]

## Local Cuisine
[Food and dining experiences]

## Travel Tips
[Practical advice for visitors]
`,

    itinerary: `# ${params.days}-Day ${params.destination} Itinerary

${Array.from({ length: parseInt(params.days) }, (_, i) => `
## Day ${i + 1}
### Morning (9AM - 12PM)
[Morning activity]

### Afternoon (1PM - 5PM) 
[Afternoon experience]

### Evening (6PM+)
[Evening options and dining]
`).join('\n')}

## Budget Breakdown
[Cost estimates by category]

## Booking Notes
[MAKU.Travel booking recommendations]
`,

    hotel: `# ${params.name}

## Location & Access
[Location advantages and transportation]

## Accommodations
[Room types and features]

## Amenities & Services
[Facilities and services offered]

## Guest Experience
[What makes this hotel special]

## Booking Information
[Rates, policies, and booking notes]
`,

    activity: `# ${params.name}

## Activity Overview
[Description and highlights]

## What's Included
[Services and inclusions]

## Duration & Schedule
[Timing and itinerary]

## Requirements
[Prerequisites and recommendations]

## Booking Details
[Pricing and reservation information]
`,

    marketing: `# ${params.campaign} - ${params.destination}

## Campaign Overview
[Marketing message and positioning]

## Key Benefits
[Value proposition and highlights]

## Call to Action
[Specific actions for customers]

## Success Metrics
[How to measure campaign effectiveness]
`
  };

  return templates[type] || '# Content Template\n\n[Content will be generated here]';
};

/**
 * Utility functions
 */
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = countWords(text);
  return Math.ceil(words / wordsPerMinute);
};

/**
 * Batch processing utilities
 */
export const batchProcessContent = async (
  items: Array<{ type: GeneratedContent['type']; params: Record<string, any> }>,
  onProgress?: (current: number, total: number) => void
): Promise<GeneratedContent[]> => {
  const results: GeneratedContent[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Create template for manual CLI processing
    const template = createContentTemplate(item.type, item.params);
    
    const content = await importCliContent(
      template,
      item.type,
      item.params.name || `${item.type}-${i + 1}`,
      { validate: false, metadata: { batchIndex: i, ...item.params } }
    );
    
    results.push(content);
    
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }
  
  return results;
};