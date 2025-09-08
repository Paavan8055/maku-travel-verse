/**
 * Enhanced Memory & Learning System
 * Implements episodic, semantic, and procedural memory with learning mechanisms
 */

export interface MemoryItem {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural';
  content: any;
  embedding?: number[];
  relevanceScore?: number;
  accessCount: number;
  lastAccessed: string;
  created: string;
  expires?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  successRate: number;
  usageCount: number;
  lastUsed: string;
  contexts: string[];
  improvements: string[];
}

export interface MemoryQuery {
  query: string;
  type?: 'episodic' | 'semantic' | 'procedural';
  limit?: number;
  threshold?: number;
  contextFilter?: string[];
}

export interface ConsolidationResult {
  consolidated: MemoryItem[];
  archived: MemoryItem[];
  strengthened: MemoryItem[];
  patterns: LearningPattern[];
}

export class EnhancedMemorySystem {
  private episodicMemory: Map<string, MemoryItem> = new Map();
  private semanticMemory: Map<string, MemoryItem> = new Map();
  private proceduralMemory: Map<string, MemoryItem> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private agentId: string;
  private userId: string;

  constructor(agentId: string, userId: string) {
    this.agentId = agentId;
    this.userId = userId;
  }

  /**
   * Store memory with automatic type classification
   */
  async storeMemory(
    content: any,
    type?: 'episodic' | 'semantic' | 'procedural',
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const memoryType = type || this.classifyMemoryType(content);
    const id = crypto.randomUUID();
    
    const memoryItem: MemoryItem = {
      id,
      type: memoryType,
      content,
      embedding: await this.generateEmbedding(content),
      accessCount: 0,
      lastAccessed: new Date().toISOString(),
      created: new Date().toISOString(),
      tags,
      metadata: {
        ...metadata,
        agentId: this.agentId,
        userId: this.userId
      }
    };

    // Store in appropriate memory type
    switch (memoryType) {
      case 'episodic':
        this.episodicMemory.set(id, memoryItem);
        break;
      case 'semantic':
        this.semanticMemory.set(id, memoryItem);
        break;
      case 'procedural':
        this.proceduralMemory.set(id, memoryItem);
        break;
    }

    // Trigger learning pattern detection
    await this.detectLearningPattern(memoryItem);

    return id;
  }

  /**
   * Retrieve memories based on semantic similarity
   */
  async retrieveMemories(query: MemoryQuery): Promise<MemoryItem[]> {
    const queryEmbedding = await this.generateEmbedding(query.query);
    const allMemories = this.getAllMemories(query.type);
    const threshold = query.threshold || 0.7;

    const scoredMemories = allMemories
      .map(memory => ({
        ...memory,
        relevanceScore: this.calculateSimilarity(queryEmbedding, memory.embedding || [])
      }))
      .filter(memory => (memory.relevanceScore || 0) >= threshold)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, query.limit || 10);

    // Update access counts
    scoredMemories.forEach(memory => {
      memory.accessCount++;
      memory.lastAccessed = new Date().toISOString();
    });

    return scoredMemories;
  }

  /**
   * Cross-agent memory sharing
   */
  async shareMemory(
    memoryIds: string[],
    targetAgentId: string,
    shareType: 'copy' | 'reference' = 'reference'
  ): Promise<boolean> {
    try {
      const memoriesToShare = memoryIds
        .map(id => this.getMemoryById(id))
        .filter(memory => memory !== null) as MemoryItem[];

      if (shareType === 'copy') {
        // Create copies for target agent
        const sharedMemories = memoriesToShare.map(memory => ({
          ...memory,
          id: crypto.randomUUID(),
          metadata: {
            ...memory.metadata,
            originalAgent: this.agentId,
            sharedTo: targetAgentId,
            shareType: 'copy'
          }
        }));

        // Store shared memories (would integrate with database)
        await this.persistSharedMemories(sharedMemories, targetAgentId);
      } else {
        // Create references
        await this.createMemoryReferences(memoriesToShare, targetAgentId);
      }

      return true;
    } catch (error) {
      console.error('Memory sharing failed:', error);
      return false;
    }
  }

  /**
   * Memory consolidation for long-term learning
   */
  async consolidateMemories(): Promise<ConsolidationResult> {
    const result: ConsolidationResult = {
      consolidated: [],
      archived: [],
      strengthened: [],
      patterns: []
    };

    // 1. Identify frequently accessed memories for strengthening
    const frequentMemories = this.getAllMemories()
      .filter(memory => memory.accessCount > 5)
      .sort((a, b) => b.accessCount - a.accessCount);

    result.strengthened = await this.strengthenMemories(frequentMemories.slice(0, 20));

    // 2. Archive old, unused memories
    const oldUnusedMemories = this.getAllMemories()
      .filter(memory => {
        const daysSinceAccess = (Date.now() - new Date(memory.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceAccess > 30 && memory.accessCount < 2;
      });

    result.archived = await this.archiveMemories(oldUnusedMemories);

    // 3. Consolidate similar memories
    result.consolidated = await this.consolidateSimilarMemories();

    // 4. Extract learning patterns
    result.patterns = await this.extractLearningPatterns();

    return result;
  }

  /**
   * Adaptive retrieval based on context and performance
   */
  async adaptiveRetrieve(
    context: {
      intent: string;
      domain: string;
      urgency: 'low' | 'medium' | 'high';
      userPreferences?: any;
    },
    query: string
  ): Promise<MemoryItem[]> {
    // Adjust retrieval strategy based on context
    const baseQuery: MemoryQuery = {
      query,
      limit: context.urgency === 'high' ? 5 : 10,
      threshold: context.urgency === 'high' ? 0.8 : 0.6
    };

    // Get base results
    const baseResults = await this.retrieveMemories(baseQuery);

    // Apply contextual filtering and ranking
    const contextualResults = this.applyContextualRanking(baseResults, context);

    // Learn from retrieval patterns
    await this.learnFromRetrieval(context, query, contextualResults);

    return contextualResults;
  }

  /**
   * Performance-based memory optimization
   */
  async optimizeMemoryPerformance(): Promise<{
    memoryUsage: number;
    retrievalSpeed: number;
    consolidationNeeded: boolean;
    recommendations: string[];
  }> {
    const totalMemories = this.getAllMemories().length;
    const recommendations: string[] = [];

    // Check memory usage
    if (totalMemories > 10000) {
      recommendations.push('Consider archiving old memories');
    }

    // Check retrieval patterns
    const retrievalPatterns = await this.analyzeRetrievalPatterns();
    if (retrievalPatterns.averageTime > 100) {
      recommendations.push('Optimize memory indexing');
    }

    // Check consolidation needs
    const similarityGroups = await this.findSimilarMemoryGroups();
    const consolidationNeeded = similarityGroups.length > 10;

    if (consolidationNeeded) {
      recommendations.push('Run memory consolidation');
    }

    return {
      memoryUsage: totalMemories,
      retrievalSpeed: retrievalPatterns.averageTime,
      consolidationNeeded,
      recommendations
    };
  }

  // Private helper methods

  private classifyMemoryType(content: any): 'episodic' | 'semantic' | 'procedural' {
    if (typeof content === 'object' && content.timestamp) {
      return 'episodic';
    }
    if (typeof content === 'string' && content.includes('procedure') || content.includes('step')) {
      return 'procedural';
    }
    return 'semantic';
  }

  private async generateEmbedding(content: any): Promise<number[]> {
    // Placeholder - would use actual embedding service
    const text = JSON.stringify(content);
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const array = new Uint8Array(hash);
    return Array.from(array.slice(0, 10)).map(x => x / 255);
  }

  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;
    
    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const norm1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const norm2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    
    return dotProduct / (norm1 * norm2);
  }

  private getAllMemories(type?: 'episodic' | 'semantic' | 'procedural'): MemoryItem[] {
    if (type) {
      switch (type) {
        case 'episodic': return Array.from(this.episodicMemory.values());
        case 'semantic': return Array.from(this.semanticMemory.values());
        case 'procedural': return Array.from(this.proceduralMemory.values());
      }
    }
    
    return [
      ...Array.from(this.episodicMemory.values()),
      ...Array.from(this.semanticMemory.values()),
      ...Array.from(this.proceduralMemory.values())
    ];
  }

  private getMemoryById(id: string): MemoryItem | null {
    return this.episodicMemory.get(id) || 
           this.semanticMemory.get(id) || 
           this.proceduralMemory.get(id) || 
           null;
  }

  private async detectLearningPattern(memory: MemoryItem): Promise<void> {
    // Analyze for patterns in successful operations
    const pattern = this.extractPattern(memory);
    if (pattern) {
      const existing = this.learningPatterns.get(pattern.id);
      if (existing) {
        existing.usageCount++;
        existing.lastUsed = new Date().toISOString();
      } else {
        this.learningPatterns.set(pattern.id, pattern);
      }
    }
  }

  private extractPattern(memory: MemoryItem): LearningPattern | null {
    // Simplified pattern extraction
    if (memory.metadata.success && memory.metadata.action) {
      return {
        id: `${memory.metadata.action}_${memory.type}`,
        pattern: memory.metadata.action,
        successRate: 1.0,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
        contexts: [memory.metadata.context || 'general'],
        improvements: []
      };
    }
    return null;
  }

  private async strengthenMemories(memories: MemoryItem[]): Promise<MemoryItem[]> {
    return memories.map(memory => ({
      ...memory,
      metadata: {
        ...memory.metadata,
        strengthened: true,
        strengthenedAt: new Date().toISOString()
      }
    }));
  }

  private async archiveMemories(memories: MemoryItem[]): Promise<MemoryItem[]> {
    // Remove from active memory and mark as archived
    memories.forEach(memory => {
      this.episodicMemory.delete(memory.id);
      this.semanticMemory.delete(memory.id);
      this.proceduralMemory.delete(memory.id);
    });
    
    return memories.map(memory => ({
      ...memory,
      metadata: {
        ...memory.metadata,
        archived: true,
        archivedAt: new Date().toISOString()
      }
    }));
  }

  private async consolidateSimilarMemories(): Promise<MemoryItem[]> {
    const groups = await this.findSimilarMemoryGroups();
    const consolidated: MemoryItem[] = [];

    groups.forEach(group => {
      if (group.length > 1) {
        const consolidated_memory = this.mergeMemories(group);
        consolidated.push(consolidated_memory);
        
        // Remove original memories
        group.forEach(memory => {
          this.episodicMemory.delete(memory.id);
          this.semanticMemory.delete(memory.id);
          this.proceduralMemory.delete(memory.id);
        });
      }
    });

    return consolidated;
  }

  private async findSimilarMemoryGroups(): Promise<MemoryItem[][]> {
    const allMemories = this.getAllMemories();
    const groups: MemoryItem[][] = [];
    const processed = new Set<string>();

    for (const memory of allMemories) {
      if (processed.has(memory.id)) continue;

      const similarMemories = allMemories.filter(other => 
        !processed.has(other.id) && 
        other.id !== memory.id &&
        this.calculateSimilarity(memory.embedding || [], other.embedding || []) > 0.9
      );

      if (similarMemories.length > 0) {
        const group = [memory, ...similarMemories];
        groups.push(group);
        group.forEach(m => processed.add(m.id));
      }
    }

    return groups;
  }

  private mergeMemories(memories: MemoryItem[]): MemoryItem {
    const primary = memories[0];
    const mergedContent = memories.map(m => m.content);
    
    return {
      ...primary,
      id: crypto.randomUUID(),
      content: mergedContent,
      accessCount: memories.reduce((sum, m) => sum + m.accessCount, 0),
      metadata: {
        ...primary.metadata,
        merged: true,
        originalIds: memories.map(m => m.id),
        mergedAt: new Date().toISOString()
      }
    };
  }

  private async extractLearningPatterns(): Promise<LearningPattern[]> {
    return Array.from(this.learningPatterns.values())
      .filter(pattern => pattern.usageCount > 2)
      .sort((a, b) => b.successRate - a.successRate);
  }

  private applyContextualRanking(
    memories: MemoryItem[],
    context: any
  ): MemoryItem[] {
    return memories.map(memory => {
      let boost = 0;
      
      // Domain matching
      if (memory.metadata.domain === context.domain) boost += 0.2;
      
      // Recency boost for urgent requests
      if (context.urgency === 'high') {
        const recency = (Date.now() - new Date(memory.created).getTime()) / (1000 * 60 * 60 * 24);
        boost += Math.max(0, 0.1 - recency * 0.01);
      }
      
      return {
        ...memory,
        relevanceScore: (memory.relevanceScore || 0) + boost
      };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private async learnFromRetrieval(
    context: any,
    query: string,
    results: MemoryItem[]
  ): Promise<void> {
    // Track which memories were most relevant for this context
    if (results.length > 0) {
      const pattern = {
        context: context.intent,
        query,
        topResults: results.slice(0, 3).map(r => r.id),
        timestamp: new Date().toISOString()
      };
      
      // Store retrieval pattern for future optimization
      await this.storeMemory(pattern, 'procedural', ['retrieval', 'pattern']);
    }
  }

  private async analyzeRetrievalPatterns(): Promise<{ averageTime: number }> {
    // Simplified analysis
    return { averageTime: 50 }; // ms
  }

  private async persistSharedMemories(memories: MemoryItem[], targetAgentId: string): Promise<void> {
    // Would integrate with database to persist shared memories
    console.log(`Sharing ${memories.length} memories with agent ${targetAgentId}`);
  }

  private async createMemoryReferences(memories: MemoryItem[], targetAgentId: string): Promise<void> {
    // Would create reference entries in database
    console.log(`Creating references for ${memories.length} memories for agent ${targetAgentId}`);
  }
}