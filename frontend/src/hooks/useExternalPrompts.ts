import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExternalPrompt {
  id: string;
  external_id: string;
  title: string;
  description?: string;
  content: string;
  version: string;
  category: string;
  tags: string[];
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface PromptUsage {
  success: boolean;
  responseTime?: number;
  error?: string;
  context?: Record<string, any>;
}

export const useExternalPrompts = () => {
  const [prompts, setPrompts] = useState<ExternalPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      
      setPrompts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompts';
      setError(errorMessage);
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalPrompt = async (
    externalId: string, 
    source: 'promptfoo' | 'langchain' | 'custom' = 'custom'
  ): Promise<ExternalPrompt | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('prompt-manager', {
        body: {
          action: 'fetch',
          externalId,
          source
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.prompt) {
        return data.prompt;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching external prompt:', err);
      throw err;
    }
  };

  const recordUsage = async (promptId: string, usage: PromptUsage) => {
    try {
      await supabase.functions.invoke('prompt-manager', {
        body: {
          action: 'analytics',
          analyticsData: {
            promptId,
            responseTime: usage.responseTime,
            success: usage.success,
            errorMessage: usage.error,
            context: usage.context
          }
        }
      });
    } catch (err) {
      console.error('Error recording prompt usage:', err);
    }
  };

  const cachePrompt = async (externalId: string, promptData: Partial<ExternalPrompt>) => {
    try {
      const { data, error } = await supabase
        .from('prompt_templates')
        .insert({
          external_id: externalId,
          title: promptData.title || 'Untitled Prompt',
          description: promptData.description,
          content: promptData.content || '',
          version: promptData.version || '1.0.0',
          category: promptData.category || 'general',
          tags: promptData.tags || [],
          metadata: promptData.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the prompts list
      await fetchPrompts();
      
      return data;
    } catch (err) {
      console.error('Error caching prompt:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  return {
    prompts,
    loading,
    error,
    fetchPrompts,
    fetchExternalPrompt,
    recordUsage,
    cachePrompt
  };
};