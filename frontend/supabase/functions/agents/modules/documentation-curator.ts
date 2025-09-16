import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseAgent, StructuredLogger, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory
) => {
  const agent = new BaseAgent(supabaseClient, 'documentation-curator');
  
  try {
    StructuredLogger.info('Documentation curator processing request', {
      userId,
      intent,
      agentId: 'documentation-curator'
    });

    switch (intent) {
      case 'create_documentation':
        return await createDocumentation(agent, userId, params);
      
      case 'update_documentation':
        return await updateDocumentation(agent, userId, params);
      
      case 'track_changes':
        return await trackChanges(agent, userId, params);
      
      case 'review_documentation':
        return await reviewDocumentation(agent, userId, params);
      
      case 'search_knowledge_base':
        return await searchKnowledgeBase(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for documentation curator', { intent });
        return {
          success: false,
          error: 'Unknown intent for documentation curator'
        };
    }
  } catch (error) {
    StructuredLogger.error('Documentation curator error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function createDocumentation(
  agent: BaseAgent,
  userId: string,
  params: { documentId: string; title: string; content: string; category?: string }
): Promise<any> {
  try {
    // Create new documentation version
    const { data: newVersion, error: versionError } = await agent['supabase']
      .from('documentation_versions')
      .insert({
        document_id: params.documentId,
        version_number: '1.0.0',
        title: params.title,
        content: params.content,
        author_id: userId,
        status: 'draft'
      })
      .select()
      .single();

    if (versionError) throw versionError;

    // Create knowledge base entry
    const { data: kbEntry, error: kbError } = await agent['supabase']
      .from('knowledge_base_entries')
      .insert({
        entry_key: params.documentId,
        title: params.title,
        content: params.content,
        category: params.category || 'general',
        created_by: userId,
        last_updated_by: userId
      })
      .select()
      .single();

    if (kbError) throw kbError;

    await agent.logActivity(userId, 'documentation_created', {
      documentId: params.documentId,
      title: params.title
    });

    return {
      success: true,
      result: {
        version: newVersion,
        knowledgeBaseEntry: kbEntry
      },
      memoryUpdates: [{
        key: 'recent_documentation',
        data: { documentId: params.documentId, action: 'created', timestamp: new Date().toISOString() }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to create documentation', { error: error.message, userId });
    throw error;
  }
}

async function updateDocumentation(
  agent: BaseAgent,
  userId: string,
  params: { documentId: string; newContent: string; changeSummary?: string }
): Promise<any> {
  try {
    // Get current version
    const { data: currentVersion, error: currentError } = await agent['supabase']
      .from('documentation_versions')
      .select('*')
      .eq('document_id', params.documentId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (currentError) throw currentError;

    // Calculate content diff
    const contentDiff = calculateContentDiff(currentVersion.content, params.newContent);
    
    // Generate new version number
    const newVersionNumber = incrementVersion(currentVersion.version_number);

    // Create new version
    const { data: newVersion, error: versionError } = await agent['supabase']
      .from('documentation_versions')
      .insert({
        document_id: params.documentId,
        version_number: newVersionNumber,
        title: currentVersion.title,
        content: params.newContent,
        content_diff: contentDiff,
        change_summary: params.changeSummary,
        author_id: userId,
        status: 'draft'
      })
      .select()
      .single();

    if (versionError) throw versionError;

    // Update knowledge base entry
    const { error: kbUpdateError } = await agent['supabase']
      .from('knowledge_base_entries')
      .update({
        content: params.newContent,
        last_updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('entry_key', params.documentId);

    if (kbUpdateError) throw kbUpdateError;

    await agent.logActivity(userId, 'documentation_updated', {
      documentId: params.documentId,
      versionNumber: newVersionNumber,
      changesSummary: params.changeSummary
    });

    return {
      success: true,
      result: {
        newVersion,
        contentDiff,
        changesCount: contentDiff?.changes?.length || 0
      },
      memoryUpdates: [{
        key: 'recent_updates',
        data: { 
          documentId: params.documentId, 
          version: newVersionNumber,
          timestamp: new Date().toISOString() 
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to update documentation', { error: error.message, userId });
    throw error;
  }
}

async function trackChanges(
  agent: BaseAgent,
  userId: string,
  params: { documentId?: string; timeframe?: string }
): Promise<any> {
  try {
    let query = agent['supabase']
      .from('documentation_versions')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.documentId) {
      query = query.eq('document_id', params.documentId);
    }

    if (params.timeframe) {
      const date = new Date();
      switch (params.timeframe) {
        case 'week':
          date.setDate(date.getDate() - 7);
          break;
        case 'month':
          date.setMonth(date.getMonth() - 1);
          break;
        case 'quarter':
          date.setMonth(date.getMonth() - 3);
          break;
      }
      query = query.gte('created_at', date.toISOString());
    }

    const { data: changes, error } = await query.limit(100);

    if (error) throw error;

    const changesSummary = {
      totalChanges: changes?.length || 0,
      documentsAffected: new Set(changes?.map(c => c.document_id)).size || 0,
      recentChanges: changes?.slice(0, 10) || []
    };

    return {
      success: true,
      result: {
        changes: changes || [],
        summary: changesSummary
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to track changes', { error: error.message, userId });
    throw error;
  }
}

async function reviewDocumentation(
  agent: BaseAgent,
  userId: string,
  params: { versionId: string; approved: boolean; reviewComments?: string }
): Promise<any> {
  try {
    const status = params.approved ? 'published' : 'rejected';
    
    const { data: updatedVersion, error } = await agent['supabase']
      .from('documentation_versions')
      .update({
        status,
        reviewed_by: userId,
        published_at: params.approved ? new Date().toISOString() : null
      })
      .eq('id', params.versionId)
      .select()
      .single();

    if (error) throw error;

    await agent.logActivity(userId, 'documentation_reviewed', {
      versionId: params.versionId,
      approved: params.approved,
      reviewComments: params.reviewComments
    });

    return {
      success: true,
      result: {
        version: updatedVersion,
        reviewStatus: status
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to review documentation', { error: error.message, userId });
    throw error;
  }
}

async function searchKnowledgeBase(
  agent: BaseAgent,
  userId: string,
  params: { query: string; category?: string; limit?: number }
): Promise<any> {
  try {
    let searchQuery = agent['supabase']
      .from('knowledge_base_entries')
      .select('*');

    if (params.category) {
      searchQuery = searchQuery.eq('category', params.category);
    }

    // Use full-text search if available
    if (params.query) {
      searchQuery = searchQuery.textSearch('search_vector', params.query);
    }

    const { data: results, error } = await searchQuery
      .limit(params.limit || 20);

    if (error) throw error;

    await agent.logActivity(userId, 'knowledge_base_searched', {
      query: params.query,
      resultsCount: results?.length || 0
    });

    return {
      success: true,
      result: {
        results: results || [],
        totalResults: results?.length || 0,
        searchQuery: params.query
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to search knowledge base', { error: error.message, userId });
    throw error;
  }
}

function calculateContentDiff(oldContent: string, newContent: string): any {
  // Simple diff calculation - in production, you might use a more sophisticated diff library
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const changes = [];
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';
    
    if (oldLine !== newLine) {
      changes.push({
        lineNumber: i + 1,
        oldContent: oldLine,
        newContent: newLine,
        changeType: !oldLine ? 'added' : !newLine ? 'removed' : 'modified'
      });
    }
  }
  
  return {
    changes,
    totalChanges: changes.length,
    addedLines: changes.filter(c => c.changeType === 'added').length,
    removedLines: changes.filter(c => c.changeType === 'removed').length,
    modifiedLines: changes.filter(c => c.changeType === 'modified').length
  };
}

function incrementVersion(currentVersion: string): string {
  const parts = currentVersion.split('.');
  const patch = parseInt(parts[2] || '0') + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}