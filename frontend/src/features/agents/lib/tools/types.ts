import { z } from 'zod';

// Core tool interfaces following OpenAI patterns
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  id: string;
  success: boolean;
  result: any;
  error?: string;
  metadata?: Record<string, any>;
  executionTime?: number;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
  category?: string;
  version?: string;
  dependencies?: string[];
}

export interface Tool {
  definition: ToolDefinition;
  execute: (params: Record<string, any>, context?: any) => Promise<ToolResult>;
  validate?: (params: Record<string, any>) => boolean;
  schema?: z.ZodSchema;
}

export interface ToolExecutionContext {
  userId?: string;
  agentId: string;
  conversationId: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ToolChainStep {
  toolName: string;
  parameters: Record<string, any>;
  condition?: (previousResults: ToolResult[]) => boolean;
  mapPreviousResult?: (previousResults: ToolResult[]) => Record<string, any>;
}

export interface ToolChainDefinition {
  id: string;
  name: string;
  description: string;
  steps: ToolChainStep[];
  rollbackOnFailure?: boolean;
}

export interface ToolMetrics {
  toolName: string;
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecuted: Date;
  errorCounts: Record<string, number>;
}