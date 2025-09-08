import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemoryRequest {
  action: 'store' | 'retrieve' | 'search' | 'consolidate' | 'update' | 'delete';
  agentId: string;
  userId?: string;
  memory?: {
    memoryType: 'episodic' | 'semantic' | 'procedural' | 'working';
    content: Record<string, any>;
    importanceScore: number;
    expiresAt?: string;
  };
  query?: {
    memoryType?: string;
    searchTerms?: string[];
    importanceThreshold?: number;
    limit?: number;
  };
  memoryId?: string;
  updateData?: Partial<{
    content: Record<string, any>;
    importanceScore: number;
    expiresAt: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: MemoryRequest = await req.json();
    const { action, agentId, userId } = requestData;

    console.log(`Memory service request:`, { action, agentId, userId });

    let result: any;

    switch (action) {
      case 'store':
        result = await storeMemory(supabaseClient, requestData);
        break;
      case 'retrieve':
        result = await retrieveMemories(supabaseClient, requestData);
        break;
      case 'search':
        result = await searchMemories(supabaseClient, requestData);
        break;
      case 'consolidate':
        result = await consolidateMemories(supabaseClient, requestData);
        break;
      case 'update':
        result = await updateMemory(supabaseClient, requestData);
        break;
      case 'delete':
        result = await deleteMemory(supabaseClient, requestData);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Memory service error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function storeMemory(supabaseClient: any, request: MemoryRequest) {
  if (!request.memory) {
    throw new Error('Memory data is required for store action');
  }

  const { data, error } = await supabaseClient
    .from('enhanced_agent_memory')
    .insert({
      agent_id: request.agentId,
      user_id: request.userId,
      memory_type: request.memory.memoryType,
      content: request.memory.content,
      importance_score: request.memory.importanceScore,
      expires_at: request.memory.expiresAt
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store memory: ${error.message}`);
  }

  return { memoryId: data.id };
}

async function retrieveMemories(supabaseClient: any, request: MemoryRequest) {
  let query = supabaseClient
    .from('enhanced_agent_memory')
    .select('*')
    .eq('agent_id', request.agentId);

  if (request.userId) {
    query = query.eq('user_id', request.userId);
  }

  if (request.query?.memoryType) {
    query = query.eq('memory_type', request.query.memoryType);
  }

  if (request.query?.importanceThreshold) {
    query = query.gte('importance_score', request.query.importanceThreshold);
  }

  query = query.order('importance_score', { ascending: false });

  if (request.query?.limit) {
    query = query.limit(request.query.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to retrieve memories: ${error.message}`);
  }

  // Update access count for retrieved memories
  if (data && data.length > 0) {
    const memoryIds = data.map(m => m.id);
    await updateAccessCounts(supabaseClient, memoryIds);
  }

  return { memories: data || [] };
}

async function searchMemories(supabaseClient: any, request: MemoryRequest) {
  if (!request.query?.searchTerms || request.query.searchTerms.length === 0) {
    throw new Error('Search terms are required for search action');
  }

  const { data, error } = await supabaseClient
    .from('enhanced_agent_memory')
    .select('*')
    .eq('agent_id', request.agentId)
    .eq('user_id', request.userId || '')
    .order('importance_score', { ascending: false });

  if (error) {
    throw new Error(`Failed to search memories: ${error.message}`);
  }

  // Filter memories based on search terms
  const filteredMemories = data?.filter((memory: any) => {
    const contentText = JSON.stringify(memory.content).toLowerCase();
    return request.query!.searchTerms!.some(term => contentText.includes(term.toLowerCase()));
  }) || [];

  return { memories: filteredMemories };
}

async function consolidateMemories(supabaseClient: any, request: MemoryRequest) {
  // Get all memories for the agent/user
  const { data: memories, error } = await supabaseClient
    .from('enhanced_agent_memory')
    .select('*')
    .eq('agent_id', request.agentId)
    .eq('user_id', request.userId || '');

  if (error) {
    throw new Error(`Failed to retrieve memories for consolidation: ${error.message}`);
  }

  let consolidated = 0;
  let removed = 0;

  // Remove expired memories
  const now = new Date();
  const expiredMemories = memories?.filter((m: any) => 
    m.expires_at && new Date(m.expires_at) < now
  ) || [];

  for (const memory of expiredMemories) {
    await supabaseClient
      .from('enhanced_agent_memory')
      .delete()
      .eq('id', memory.id);
    removed++;
  }

  // Remove low-importance, rarely accessed memories
  const lowValueMemories = memories?.filter((m: any) => 
    m.importance_score < 0.3 && m.access_count < 2 && !expiredMemories.includes(m)
  ) || [];

  for (const memory of lowValueMemories) {
    await supabaseClient
      .from('enhanced_agent_memory')
      .delete()
      .eq('id', memory.id);
    consolidated++;
  }

  return { consolidated, removed, totalProcessed: memories?.length || 0 };
}

async function updateMemory(supabaseClient: any, request: MemoryRequest) {
  if (!request.memoryId || !request.updateData) {
    throw new Error('Memory ID and update data are required for update action');
  }

  const updateFields: any = {};

  if (request.updateData.content) {
    updateFields.content = request.updateData.content;
  }

  if (request.updateData.importanceScore !== undefined) {
    updateFields.importance_score = request.updateData.importanceScore;
  }

  if (request.updateData.expiresAt) {
    updateFields.expires_at = request.updateData.expiresAt;
  }

  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await supabaseClient
    .from('enhanced_agent_memory')
    .update(updateFields)
    .eq('id', request.memoryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update memory: ${error.message}`);
  }

  return { memory: data };
}

async function deleteMemory(supabaseClient: any, request: MemoryRequest) {
  if (!request.memoryId) {
    throw new Error('Memory ID is required for delete action');
  }

  const { error } = await supabaseClient
    .from('enhanced_agent_memory')
    .delete()
    .eq('id', request.memoryId);

  if (error) {
    throw new Error(`Failed to delete memory: ${error.message}`);
  }

  return { deleted: true };
}

async function updateAccessCounts(supabaseClient: any, memoryIds: string[]) {
  for (const id of memoryIds) {
    await supabaseClient
      .from('enhanced_agent_memory')
      .update({
        access_count: supabaseClient.raw('access_count + 1'),
        last_accessed: new Date().toISOString()
      })
      .eq('id', id);
  }
}