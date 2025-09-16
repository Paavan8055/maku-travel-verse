export interface OpenAIRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface OpenAIResponse {
  content: string;
  success: boolean;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIServiceWrapper {
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gpt-5-2025-08-07') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  private isNewerModel(model: string): boolean {
    const newerModels = [
      'gpt-5-2025-08-07',
      'gpt-5-mini-2025-08-07', 
      'gpt-5-nano-2025-08-07',
      'gpt-4.1-2025-04-14',
      'gpt-4.1-mini-2025-04-14',
      'o3-2025-04-16',
      'o4-mini-2025-04-16'
    ];
    return newerModels.includes(model);
  }

  async chat(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      const model = request.model || this.defaultModel;
      const isNewer = this.isNewerModel(model);

      // Build request body based on model capabilities
      const requestBody: any = {
        model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt }
        ],
      };

      // Use appropriate token parameter for model
      if (request.maxTokens) {
        if (isNewer) {
          requestBody.max_completion_tokens = request.maxTokens;
        } else {
          requestBody.max_tokens = request.maxTokens;
        }
      }

      // Only add temperature for legacy models
      if (request.temperature !== undefined && !isNewer) {
        requestBody.temperature = request.temperature;
      }

      // Add response format if specified
      if (request.responseFormat === 'json') {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        content,
        success: true,
        usage: data.usage
      };

    } catch (error) {
      console.error('OpenAI Service Error:', error);
      return {
        content: '',
        success: false,
        error: error.message
      };
    }
  }

  async analyze(
    subject: string,
    data: any,
    analysisType: string = 'general',
    specificInstructions?: string
  ): Promise<OpenAIResponse> {
    const systemPrompt = `You are an expert analyst for MAKU.Travel specializing in ${analysisType} analysis.
    
Your task is to analyze the provided ${subject} data and provide comprehensive insights.

ANALYSIS TYPE: ${analysisType.toUpperCase()}
${specificInstructions ? `SPECIFIC INSTRUCTIONS: ${specificInstructions}` : ''}

Provide detailed analysis including:
1. Key findings and patterns
2. Risk assessment and opportunities
3. Actionable recommendations
4. Metrics and performance indicators
5. Strategic implications

Be thorough, data-driven, and focused on actionable insights.`;

    const userPrompt = `Please analyze the following ${subject} data:

${JSON.stringify(data, null, 2)}

Provide comprehensive analysis with specific recommendations.`;

    return this.chat({
      systemPrompt,
      userPrompt,
      maxTokens: 2000
    });
  }

  async generateReport(
    reportType: string,
    data: any,
    audience: string = 'management',
    format: 'executive' | 'detailed' | 'technical' = 'executive'
  ): Promise<OpenAIResponse> {
    const systemPrompt = `You are a business analyst creating a ${reportType} report for ${audience} at MAKU.Travel.

REPORT FORMAT: ${format.toUpperCase()}
AUDIENCE: ${audience.toUpperCase()}

Create a comprehensive ${format} report including:

${format === 'executive' ? `
- Executive Summary (key highlights)
- Critical Metrics and KPIs
- Strategic Recommendations
- Risk Assessment
- Next Steps
` : format === 'detailed' ? `
- Detailed Analysis and Findings
- Comprehensive Data Review
- Trend Analysis and Patterns
- Detailed Recommendations
- Implementation Plan
- Risk Mitigation Strategies
` : `
- Technical Specifications
- Data Architecture and Quality
- Performance Metrics
- System Recommendations
- Technical Implementation Details
`}

Make the report professional, data-driven, and actionable for the intended audience.`;

    const userPrompt = `Generate a ${reportType} report based on the following data:

${JSON.stringify(data, null, 2)}

Format: ${format}
Target Audience: ${audience}`;

    return this.chat({
      systemPrompt,
      userPrompt,
      maxTokens: 3000
    });
  }
}