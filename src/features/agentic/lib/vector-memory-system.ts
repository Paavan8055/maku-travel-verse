import { supabase } from '@/integrations/supabase/client';

export interface VectorMemory {
  id: string;
  agent_id: string;
  memory_content: string;
  memory_type: 'conversation' | 'task_result' | 'insight' | 'pattern' | 'strategy';
  embedding: number[];
  metadata: {
    timestamp: string;
    context_tags: string[];
    importance_score: number;
    access_count: number;
    last_accessed: string;
    related_memories?: string[];
  };
  created_at: string;
  expires_at?: string;
}

export interface MemoryCluster {
  id: string;
  cluster_label: string;
  memory_ids: string[];
  centroid_embedding: number[];
  coherence_score: number;
  representative_memory: string;
  cluster_tags: string[];
  created_at: string;
}

export interface SemanticSearchResult {
  memory: VectorMemory;
  similarity_score: number;
  relevance_explanation: string;
}

export interface MemoryInsight {
  insight_type: 'frequent_pattern' | 'knowledge_gap' | 'correlation' | 'trend';
  description: string;
  supporting_memories: string[];
  confidence: number;
  actionable_recommendations: string[];
}

export class VectorMemorySystem {
  private memories: Map<string, VectorMemory> = new Map();
  private clusters: Map<string, MemoryCluster> = new Map();
  private indexUpdateQueue: string[] = [];
  private embeddingDimension = 1536; // OpenAI embedding dimension

  constructor() {
    this.initializeSystem();
  }

  private async initializeSystem(): Promise<void> {
    await this.loadExistingMemories();
    this.startBackgroundIndexing();
  }

  async storeMemory(
    agentId: string,
    content: string,
    memoryType: VectorMemory['memory_type'],
    contextTags: string[] = [],
    importanceScore: number = 0.5,
    expiresAt?: string
  ): Promise<string> {
    const memoryId = crypto.randomUUID();
    
    // Generate embedding for the content
    const embedding = await this.generateEmbedding(content);
    
    const memory: VectorMemory = {
      id: memoryId,
      agent_id: agentId,
      memory_content: content,
      memory_type: memoryType,
      embedding,
      metadata: {
        timestamp: new Date().toISOString(),
        context_tags: contextTags,
        importance_score: importanceScore,
        access_count: 0,
        last_accessed: new Date().toISOString()
      },
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    // Store in local cache
    this.memories.set(memoryId, memory);
    
    // Store in Supabase
    await this.persistMemory(memory);
    
    // Queue for clustering update
    this.indexUpdateQueue.push(memoryId);
    
    return memoryId;
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    try {
      // Call the vector-memory-service edge function
      const { data, error } = await supabase.functions.invoke('vector-memory-service', {
        body: { action: 'generate_embedding', content }
      });

      if (error) {
        console.error('Error generating embedding:', error);
        return this.generateMockEmbedding(content);
      }

      return data.embedding;
    } catch (error) {
      console.error('Error calling embedding service:', error);
      return this.generateMockEmbedding(content);
    }
  }

  private generateMockEmbedding(content: string): number[] {
    // Generate a deterministic mock embedding based on content
    const hash = this.simpleHash(content);
    const embedding: number[] = [];
    
    for (let i = 0; i < this.embeddingDimension; i++) {
      embedding.push((Math.sin(hash + i) + 1) / 2);
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  async semanticSearch(
    query: string,
    agentId?: string,
    memoryTypes?: VectorMemory['memory_type'][],
    limit: number = 10,
    minSimilarity: number = 0.7
  ): Promise<SemanticSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: SemanticSearchResult[] = [];

    for (const memory of this.memories.values()) {
      // Filter by agent and memory types if specified
      if (agentId && memory.agent_id !== agentId) continue;
      if (memoryTypes && !memoryTypes.includes(memory.memory_type)) continue;

      // Calculate similarity
      const similarity = this.calculateCosineSimilarity(queryEmbedding, memory.embedding);
      
      if (similarity >= minSimilarity) {
        // Update access statistics
        memory.metadata.access_count += 1;
        memory.metadata.last_accessed = new Date().toISOString();

        results.push({
          memory,
          similarity_score: similarity,
          relevance_explanation: await this.generateRelevanceExplanation(query, memory, similarity)
        });
      }
    }

    // Sort by similarity and importance
    results.sort((a, b) => {
      const scoreA = a.similarity_score * 0.7 + a.memory.metadata.importance_score * 0.3;
      const scoreB = b.similarity_score * 0.7 + b.memory.metadata.importance_score * 0.3;
      return scoreB - scoreA;
    });

    return results.slice(0, limit);
  }

  private calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private async generateRelevanceExplanation(
    query: string,
    memory: VectorMemory,
    similarity: number
  ): Promise<string> {
    const queryWords = query.toLowerCase().split(/\s+/);
    const memoryWords = memory.memory_content.toLowerCase().split(/\s+/);
    
    const commonWords = queryWords.filter(word => 
      memoryWords.some(mWord => mWord.includes(word) || word.includes(mWord))
    );

    let explanation = `Similarity score: ${(similarity * 100).toFixed(1)}%`;
    
    if (commonWords.length > 0) {
      explanation += `. Common concepts: ${commonWords.slice(0, 3).join(', ')}`;
    }

    if (memory.metadata.context_tags.length > 0) {
      const relevantTags = memory.metadata.context_tags.filter(tag =>
        query.toLowerCase().includes(tag.toLowerCase())
      );
      
      if (relevantTags.length > 0) {
        explanation += `. Matching contexts: ${relevantTags.join(', ')}`;
      }
    }

    return explanation;
  }

  async clusterMemories(agentId?: string, forceReclustering: boolean = false): Promise<MemoryCluster[]> {
    const memoriesToCluster = Array.from(this.memories.values())
      .filter(memory => !agentId || memory.agent_id === agentId);

    if (memoriesToCluster.length < 3) {
      return []; // Need at least 3 memories to cluster
    }

    // Simple k-means clustering implementation
    const numClusters = Math.min(Math.ceil(memoriesToCluster.length / 5), 10);
    const clusters = await this.kMeansClustering(memoriesToCluster, numClusters);

    // Store clusters
    for (const cluster of clusters) {
      this.clusters.set(cluster.id, cluster);
      await this.persistCluster(cluster);
    }

    return clusters;
  }

  private async kMeansClustering(memories: VectorMemory[], k: number): Promise<MemoryCluster[]> {
    const embeddings = memories.map(m => m.embedding);
    const memoryIds = memories.map(m => m.id);

    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * embeddings.length);
      centroids.push([...embeddings[randomIndex]]);
    }

    let assignments: number[] = new Array(memories.length);
    let hasConverged = false;
    let iterations = 0;
    const maxIterations = 100;

    while (!hasConverged && iterations < maxIterations) {
      // Assign points to nearest centroid
      const newAssignments: number[] = [];
      
      for (let i = 0; i < embeddings.length; i++) {
        let bestCluster = 0;
        let bestDistance = Infinity;
        
        for (let j = 0; j < centroids.length; j++) {
          const distance = this.calculateEuclideanDistance(embeddings[i], centroids[j]);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestCluster = j;
          }
        }
        
        newAssignments.push(bestCluster);
      }

      // Check for convergence
      hasConverged = newAssignments.every((assignment, i) => assignment === assignments[i]);
      assignments = newAssignments;

      // Update centroids
      const newCentroids: number[][] = [];
      for (let j = 0; j < k; j++) {
        const clusterPoints = embeddings.filter((_, i) => assignments[i] === j);
        
        if (clusterPoints.length === 0) {
          newCentroids.push(centroids[j]); // Keep old centroid if no points assigned
          continue;
        }

        const centroid = new Array(this.embeddingDimension).fill(0);
        for (const point of clusterPoints) {
          for (let dim = 0; dim < this.embeddingDimension; dim++) {
            centroid[dim] += point[dim];
          }
        }
        
        for (let dim = 0; dim < this.embeddingDimension; dim++) {
          centroid[dim] /= clusterPoints.length;
        }
        
        newCentroids.push(centroid);
      }
      
      centroids = newCentroids;
      iterations++;
    }

    // Create cluster objects
    const clusters: MemoryCluster[] = [];
    for (let j = 0; j < k; j++) {
      const clusterMemoryIds = memoryIds.filter((_, i) => assignments[i] === j);
      
      if (clusterMemoryIds.length === 0) continue;

      const clusterMemories = clusterMemoryIds.map(id => this.memories.get(id)!);
      const representativeMemory = this.findRepresentativeMemory(clusterMemories, centroids[j]);
      
      const cluster: MemoryCluster = {
        id: crypto.randomUUID(),
        cluster_label: await this.generateClusterLabel(clusterMemories),
        memory_ids: clusterMemoryIds,
        centroid_embedding: centroids[j],
        coherence_score: this.calculateClusterCoherence(clusterMemories, centroids[j]),
        representative_memory: representativeMemory.memory_content.substring(0, 200),
        cluster_tags: this.extractClusterTags(clusterMemories),
        created_at: new Date().toISOString()
      };
      
      clusters.push(cluster);
    }

    return clusters;
  }

  private calculateEuclideanDistance(vector1: number[], vector2: number[]): number {
    let sum = 0;
    for (let i = 0; i < vector1.length; i++) {
      sum += Math.pow(vector1[i] - vector2[i], 2);
    }
    return Math.sqrt(sum);
  }

  private findRepresentativeMemory(memories: VectorMemory[], centroid: number[]): VectorMemory {
    let bestMemory = memories[0];
    let bestDistance = Infinity;

    for (const memory of memories) {
      const distance = this.calculateEuclideanDistance(memory.embedding, centroid);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMemory = memory;
      }
    }

    return bestMemory;
  }

  private async generateClusterLabel(memories: VectorMemory[]): Promise<string> {
    // Extract common themes from memory contents
    const allWords = memories.flatMap(m => 
      m.memory_content.toLowerCase().split(/\s+/)
        .filter(word => word.length > 3)
    );
    
    const wordCounts = new Map<string, number>();
    allWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Find most common words
    const sortedWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    return sortedWords.join(' & ') || 'Mixed Memories';
  }

  private calculateClusterCoherence(memories: VectorMemory[], centroid: number[]): number {
    if (memories.length === 0) return 0;

    const distances = memories.map(memory => 
      this.calculateEuclideanDistance(memory.embedding, centroid)
    );
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    // Normalize to 0-1 range (lower distance = higher coherence)
    return Math.max(0, 1 - (avgDistance / this.embeddingDimension));
  }

  private extractClusterTags(memories: VectorMemory[]): string[] {
    const allTags = memories.flatMap(m => m.metadata.context_tags);
    const tagCounts = new Map<string, number>();
    
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    return Array.from(tagCounts.entries())
      .filter(([_, count]) => count >= 2) // Tags that appear in at least 2 memories
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  async findRelatedMemories(
    memoryId: string,
    limit: number = 5,
    minSimilarity: number = 0.6
  ): Promise<SemanticSearchResult[]> {
    const sourceMemory = this.memories.get(memoryId);
    if (!sourceMemory) return [];

    const results: SemanticSearchResult[] = [];

    for (const memory of this.memories.values()) {
      if (memory.id === memoryId) continue;

      const similarity = this.calculateCosineSimilarity(
        sourceMemory.embedding,
        memory.embedding
      );

      if (similarity >= minSimilarity) {
        results.push({
          memory,
          similarity_score: similarity,
          relevance_explanation: `Related to "${sourceMemory.memory_content.substring(0, 50)}..."`
        });
      }
    }

    results.sort((a, b) => b.similarity_score - a.similarity_score);
    return results.slice(0, limit);
  }

  async generateMemoryInsights(agentId?: string): Promise<MemoryInsight[]> {
    const relevantMemories = Array.from(this.memories.values())
      .filter(memory => !agentId || memory.agent_id === agentId);

    const insights: MemoryInsight[] = [];

    // Identify frequent patterns
    const frequentPatterns = await this.identifyFrequentPatterns(relevantMemories);
    insights.push(...frequentPatterns);

    // Identify knowledge gaps
    const knowledgeGaps = await this.identifyKnowledgeGaps(relevantMemories);
    insights.push(...knowledgeGaps);

    // Identify correlations
    const correlations = await this.identifyCorrelations(relevantMemories);
    insights.push(...correlations);

    // Identify trends
    const trends = await this.identifyTrends(relevantMemories);
    insights.push(...trends);

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  private async identifyFrequentPatterns(memories: VectorMemory[]): Promise<MemoryInsight[]> {
    const patterns: MemoryInsight[] = [];
    
    // Group by memory type and analyze frequency
    const typeGroups = new Map<VectorMemory['memory_type'], VectorMemory[]>();
    memories.forEach(memory => {
      if (!typeGroups.has(memory.memory_type)) {
        typeGroups.set(memory.memory_type, []);
      }
      typeGroups.get(memory.memory_type)!.push(memory);
    });

    typeGroups.forEach((memoryGroup, type) => {
      if (memoryGroup.length >= 5) { // Pattern threshold
        patterns.push({
          insight_type: 'frequent_pattern',
          description: `High frequency of ${type} memories (${memoryGroup.length} instances)`,
          supporting_memories: memoryGroup.slice(0, 5).map(m => m.id),
          confidence: Math.min(memoryGroup.length / 10, 0.95),
          actionable_recommendations: [
            `Analyze ${type} patterns for optimization opportunities`,
            `Create templates for common ${type} scenarios`
          ]
        });
      }
    });

    return patterns;
  }

  private async identifyKnowledgeGaps(memories: VectorMemory[]): Promise<MemoryInsight[]> {
    const gaps: MemoryInsight[] = [];
    
    // Identify underrepresented memory types or contexts
    const typeCounts = new Map<VectorMemory['memory_type'], number>();
    memories.forEach(memory => {
      typeCounts.set(memory.memory_type, (typeCounts.get(memory.memory_type) || 0) + 1);
    });

    const avgCount = memories.length / typeCounts.size;
    
    typeCounts.forEach((count, type) => {
      if (count < avgCount * 0.5) { // Significantly below average
        gaps.push({
          insight_type: 'knowledge_gap',
          description: `Limited ${type} memories (${count} vs average ${avgCount.toFixed(1)})`,
          supporting_memories: [],
          confidence: 0.7,
          actionable_recommendations: [
            `Increase focus on ${type} activities`,
            `Implement systematic ${type} memory capture`
          ]
        });
      }
    });

    return gaps;
  }

  private async identifyCorrelations(memories: VectorMemory[]): Promise<MemoryInsight[]> {
    const correlations: MemoryInsight[] = [];
    
    // Find memories with high tag overlap
    const tagPairs = new Map<string, { count: number; memories: string[] }>();
    
    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const memory1 = memories[i];
        const memory2 = memories[j];
        
        const commonTags = memory1.metadata.context_tags.filter(tag =>
          memory2.metadata.context_tags.includes(tag)
        );
        
        if (commonTags.length >= 2) {
          const key = commonTags.sort().join('|');
          if (!tagPairs.has(key)) {
            tagPairs.set(key, { count: 0, memories: [] });
          }
          const pair = tagPairs.get(key)!;
          pair.count += 1;
          pair.memories.push(memory1.id, memory2.id);
        }
      }
    }

    tagPairs.forEach((data, tags) => {
      if (data.count >= 3) {
        correlations.push({
          insight_type: 'correlation',
          description: `Strong correlation between contexts: ${tags.replace('|', ' and ')}`,
          supporting_memories: [...new Set(data.memories)].slice(0, 5),
          confidence: Math.min(data.count / 10, 0.9),
          actionable_recommendations: [
            `Leverage ${tags.replace('|', ' and ')} connection for cross-domain insights`,
            `Create integrated workflows for these correlated contexts`
          ]
        });
      }
    });

    return correlations;
  }

  private async identifyTrends(memories: VectorMemory[]): Promise<MemoryInsight[]> {
    const trends: MemoryInsight[] = [];
    
    // Analyze importance score trends over time
    const sortedMemories = memories
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    if (sortedMemories.length >= 10) {
      const firstHalf = sortedMemories.slice(0, Math.floor(sortedMemories.length / 2));
      const secondHalf = sortedMemories.slice(Math.floor(sortedMemories.length / 2));
      
      const firstAvgImportance = firstHalf.reduce((sum, m) => sum + m.metadata.importance_score, 0) / firstHalf.length;
      const secondAvgImportance = secondHalf.reduce((sum, m) => sum + m.metadata.importance_score, 0) / secondHalf.length;
      
      const trendDirection = secondAvgImportance > firstAvgImportance ? 'increasing' : 'decreasing';
      const trendStrength = Math.abs(secondAvgImportance - firstAvgImportance);
      
      if (trendStrength > 0.1) {
        trends.push({
          insight_type: 'trend',
          description: `Memory importance is ${trendDirection} over time (${trendStrength.toFixed(2)} change)`,
          supporting_memories: secondHalf.slice(-5).map(m => m.id),
          confidence: Math.min(trendStrength * 5, 0.9),
          actionable_recommendations: 
            trendDirection === 'increasing' 
              ? ['Continue current practices', 'Scale successful patterns']
              : ['Review recent memory quality', 'Improve memory capture processes']
        });
      }
    }

    return trends;
  }

  private async persistMemory(memory: VectorMemory): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: memory.agent_id,
        user_id: memory.agent_id,
        memory_key: `vector_memory_${memory.id}`,
        memory_data: JSON.parse(JSON.stringify({
          id: memory.id,
          content: memory.memory_content,
          type: memory.memory_type,
          metadata: memory.metadata,
          embedding_checksum: memory.embedding.slice(0, 10) // Store partial for validation
        })) as any,
        expires_at: memory.expires_at
      });
    } catch (error) {
      console.error('Error persisting memory:', error);
    }
  }

  private async persistCluster(cluster: MemoryCluster): Promise<void> {
    try {
      await supabase.from('agentic_memory').insert({
        agent_id: 'vector_memory_system',
        user_id: 'system',
        memory_key: `memory_cluster_${cluster.id}`,
        memory_data: JSON.parse(JSON.stringify({
          ...cluster,
          centroid_checksum: cluster.centroid_embedding.slice(0, 10)
        })) as any,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error persisting cluster:', error);
    }
  }

  private async loadExistingMemories(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('agentic_memory')
        .select('*')
        .like('memory_key', 'vector_memory_%')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error loading existing memories:', error);
        return;
      }

      for (const record of data || []) {
        const memoryData = record.memory_data as any;
        if (memoryData?.id && memoryData?.content) {
          // Reconstruct memory object (embedding would need to be regenerated)
          const memory: VectorMemory = {
            id: memoryData.id,
            agent_id: record.agent_id,
            memory_content: memoryData.content,
            memory_type: memoryData.type,
            embedding: [], // Will be regenerated if needed
            metadata: memoryData.metadata || {
              timestamp: record.created_at,
              context_tags: [],
              importance_score: 0.5,
              access_count: 0,
              last_accessed: record.created_at
            },
            created_at: record.created_at,
            expires_at: record.expires_at
          };
          
          this.memories.set(memory.id, memory);
        }
      }
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  }

  private startBackgroundIndexing(): void {
    // Process index updates every 30 seconds
    setInterval(async () => {
      if (this.indexUpdateQueue.length > 0) {
        const memoriesToProcess = [...this.indexUpdateQueue];
        this.indexUpdateQueue = [];
        
        // Update clusters if we have enough new memories
        if (memoriesToProcess.length >= 3) {
          await this.clusterMemories();
        }
      }
    }, 30000);

    // Clean up expired memories every hour
    setInterval(async () => {
      await this.cleanupExpiredMemories();
    }, 60 * 60 * 1000);
  }

  private async cleanupExpiredMemories(): Promise<void> {
    const now = new Date().toISOString();
    const expiredMemories = Array.from(this.memories.values())
      .filter(memory => memory.expires_at && memory.expires_at < now);

    for (const memory of expiredMemories) {
      this.memories.delete(memory.id);
    }

    // Also cleanup from database
    try {
      await supabase
        .from('agentic_memory')
        .delete()
        .like('memory_key', 'vector_memory_%')
        .lt('expires_at', now);
    } catch (error) {
      console.error('Error cleaning up expired memories:', error);
    }
  }

  async getMemoryStats(agentId?: string): Promise<any> {
    const relevantMemories = Array.from(this.memories.values())
      .filter(memory => !agentId || memory.agent_id === agentId);

    const typeDistribution = new Map<VectorMemory['memory_type'], number>();
    let totalImportance = 0;
    let totalAccess = 0;

    relevantMemories.forEach(memory => {
      typeDistribution.set(
        memory.memory_type,
        (typeDistribution.get(memory.memory_type) || 0) + 1
      );
      totalImportance += memory.metadata.importance_score;
      totalAccess += memory.metadata.access_count;
    });

    return {
      total_memories: relevantMemories.length,
      type_distribution: Object.fromEntries(typeDistribution),
      average_importance: relevantMemories.length > 0 ? totalImportance / relevantMemories.length : 0,
      average_access_count: relevantMemories.length > 0 ? totalAccess / relevantMemories.length : 0,
      total_clusters: Array.from(this.clusters.values()).length,
      memory_age_range: {
        oldest: relevantMemories.reduce((oldest, memory) => 
          memory.created_at < oldest ? memory.created_at : oldest, 
          new Date().toISOString()
        ),
        newest: relevantMemories.reduce((newest, memory) => 
          memory.created_at > newest ? memory.created_at : newest, 
          '1970-01-01T00:00:00.000Z'
        )
      }
    };
  }
}

export const vectorMemorySystem = new VectorMemorySystem();