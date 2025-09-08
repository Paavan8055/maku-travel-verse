import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbeddingRequest {
  action: 'generate_embedding' | 'similarity_search' | 'cluster_analysis';
  content?: string;
  query?: string;
  embeddings?: number[][];
  options?: {
    model?: string;
    dimensions?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const requestData: EmbeddingRequest = await req.json();

    switch (requestData.action) {
      case 'generate_embedding':
        return await handleEmbeddingGeneration(requestData);
      
      case 'similarity_search':
        return await handleSimilaritySearch(requestData);
        
      case 'cluster_analysis':
        return await handleClusterAnalysis(requestData);
        
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in vector-memory-service:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleEmbeddingGeneration(requestData: EmbeddingRequest): Promise<Response> {
  if (!requestData.content) {
    return new Response(
      JSON.stringify({ error: 'Content is required for embedding generation' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const model = requestData.options?.model || 'text-embedding-3-small';
  const dimensions = requestData.options?.dimensions;

  try {
    // Clean and prepare content for embedding
    const cleanContent = requestData.content
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // OpenAI token limit consideration

    const embeddingRequest: any = {
      input: cleanContent,
      model: model
    };

    // Add dimensions only for models that support it
    if (dimensions && (model.includes('text-embedding-3') || model.includes('text-embedding-ada-002'))) {
      embeddingRequest.dimensions = dimensions;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(embeddingRequest),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate embedding',
          details: `OpenAI API error: ${response.status}`,
          openai_error: errorData
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No embedding data returned from OpenAI' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const embedding = data.data[0].embedding;

    return new Response(
      JSON.stringify({ 
        embedding,
        model_used: model,
        dimensions: embedding.length,
        content_length: cleanContent.length,
        usage: data.usage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate embedding',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleSimilaritySearch(requestData: EmbeddingRequest): Promise<Response> {
  if (!requestData.query) {
    return new Response(
      JSON.stringify({ error: 'Query is required for similarity search' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // First generate embedding for the query
    const queryEmbedding = await generateEmbedding(requestData.query);
    
    if (!queryEmbedding) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate query embedding' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // For now, return the query embedding (client can perform similarity calculations)
    // In a full implementation, this would search against a vector database
    return new Response(
      JSON.stringify({ 
        query_embedding: queryEmbedding,
        message: 'Query embedding generated successfully. Implement vector database search for full functionality.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in similarity search:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform similarity search',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleClusterAnalysis(requestData: EmbeddingRequest): Promise<Response> {
  if (!requestData.embeddings || !Array.isArray(requestData.embeddings)) {
    return new Response(
      JSON.stringify({ error: 'Embeddings array is required for cluster analysis' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const embeddings = requestData.embeddings;
    const numClusters = Math.min(Math.ceil(embeddings.length / 5), 10);

    // Simple k-means clustering implementation
    const clusters = performKMeansClustering(embeddings, numClusters);

    return new Response(
      JSON.stringify({ 
        clusters,
        num_clusters: numClusters,
        total_points: embeddings.length,
        algorithm: 'k-means'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in cluster analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to perform cluster analysis',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function generateEmbedding(content: string): Promise<number[] | null> {
  try {
    const cleanContent = content
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: cleanContent,
        model: 'text-embedding-3-small'
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API Error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;

  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

function performKMeansClustering(embeddings: number[][], k: number): any {
  if (embeddings.length === 0 || k <= 0) {
    return { centroids: [], assignments: [] };
  }

  const dimensions = embeddings[0].length;
  
  // Initialize centroids randomly
  let centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const randomIndex = Math.floor(Math.random() * embeddings.length);
    centroids.push([...embeddings[randomIndex]]);
  }

  let assignments: number[] = new Array(embeddings.length).fill(0);
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
        const distance = calculateEuclideanDistance(embeddings[i], centroids[j]);
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

    if (hasConverged) break;

    // Update centroids
    const newCentroids: number[][] = [];
    for (let j = 0; j < k; j++) {
      const clusterPoints = embeddings.filter((_, i) => assignments[i] === j);
      
      if (clusterPoints.length === 0) {
        newCentroids.push(centroids[j]); // Keep old centroid
        continue;
      }

      const centroid = new Array(dimensions).fill(0);
      for (const point of clusterPoints) {
        for (let dim = 0; dim < dimensions; dim++) {
          centroid[dim] += point[dim];
        }
      }
      
      for (let dim = 0; dim < dimensions; dim++) {
        centroid[dim] /= clusterPoints.length;
      }
      
      newCentroids.push(centroid);
    }
    
    centroids = newCentroids;
    iterations++;
  }

  // Calculate cluster statistics
  const clusterStats = centroids.map((centroid, clusterIdx) => {
    const clusterPoints = embeddings.filter((_, i) => assignments[i] === clusterIdx);
    const distances = clusterPoints.map(point => calculateEuclideanDistance(point, centroid));
    
    return {
      cluster_id: clusterIdx,
      centroid: centroid,
      size: clusterPoints.length,
      average_distance: distances.length > 0 
        ? distances.reduce((sum, d) => sum + d, 0) / distances.length 
        : 0,
      cohesion: distances.length > 0 
        ? 1 - (Math.max(...distances) - Math.min(...distances)) / Math.max(...distances)
        : 1
    };
  });

  return {
    centroids: clusterStats,
    assignments: assignments,
    iterations: iterations,
    converged: hasConverged
  };
}

function calculateEuclideanDistance(vector1: number[], vector2: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector1.length; i++) {
    sum += Math.pow(vector1[i] - vector2[i], 2);
  }
  return Math.sqrt(sum);
}

function calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
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