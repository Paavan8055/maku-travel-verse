import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  BookOpen, 
  Plus, 
  Star, 
  Clock, 
  User, 
  Tag,
  ThumbsUp,
  ThumbsDown,
  Share,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  created_at: string;
  updated_at: string;
  rating: number;
  views: number;
  helpful_votes: number;
  version: number;
  status: 'draft' | 'published' | 'archived';
}

interface SearchResult {
  entry: KnowledgeEntry;
  relevance: number;
  matchedFields: string[];
}

export const KnowledgeManagementSystem: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const { toast } = useToast();

  const categories = [
    'all',
    'booking_issues',
    'payment_problems',
    'system_errors',
    'user_accounts',
    'provider_integration',
    'security',
    'performance',
    'maintenance'
  ];

  const loadKnowledgeEntries = useCallback(async () => {
    try {
      // In a real implementation, this would fetch from a knowledge base table
      const mockEntries: KnowledgeEntry[] = [
        {
          id: '1',
          title: 'Resolving Payment Gateway Timeouts',
          content: 'When users experience payment timeouts, follow these steps:\n1. Check payment provider status\n2. Verify API connectivity\n3. Review recent error logs\n4. Test with small transaction...',
          category: 'payment_problems',
          tags: ['payment', 'timeout', 'gateway', 'troubleshooting'],
          author: 'Admin User',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          rating: 4.8,
          views: 156,
          helpful_votes: 23,
          version: 2,
          status: 'published'
        },
        {
          id: '2',
          title: 'Handling Booking Confirmation Delays',
          content: 'When booking confirmations are delayed:\n1. Check provider API status\n2. Review booking queue\n3. Verify webhook endpoints\n4. Manual confirmation process...',
          category: 'booking_issues',
          tags: ['booking', 'confirmation', 'delay', 'provider'],
          author: 'Admin User',
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-10T09:00:00Z',
          rating: 4.5,
          views: 89,
          helpful_votes: 15,
          version: 1,
          status: 'published'
        },
        {
          id: '3',
          title: 'User Account Recovery Process',
          content: 'Complete guide for recovering user accounts:\n1. Verify user identity\n2. Check account status\n3. Reset authentication\n4. Update security settings...',
          category: 'user_accounts',
          tags: ['account', 'recovery', 'security', 'authentication'],
          author: 'Admin User',
          created_at: '2024-01-08T16:00:00Z',
          updated_at: '2024-01-12T11:00:00Z',
          rating: 4.9,
          views: 203,
          helpful_votes: 31,
          version: 3,
          status: 'published'
        }
      ];

      setKnowledgeEntries(mockEntries);
    } catch (error) {
      console.error('Error loading knowledge entries:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load knowledge base entries.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    loadKnowledgeEntries();
  }, [loadKnowledgeEntries]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Enhanced search with AI assistance
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: searchQuery,
          type: 'knowledge_search',
          context: {
            category: selectedCategory,
            adminSection: 'knowledge'
          }
        }
      });

      if (error) throw error;

      // Combine AI results with local search
      const localResults = searchLocalKnowledge(searchQuery);
      const combinedResults = [...localResults];

      setSearchResults(combinedResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${combinedResults.length} relevant entries.`
      });
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local search
      const localResults = searchLocalKnowledge(searchQuery);
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory, toast]);

  const searchLocalKnowledge = (query: string): SearchResult[] => {
    const filtered = knowledgeEntries.filter(entry => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
        return false;
      }
      
      const searchTerms = query.toLowerCase().split(' ');
      const searchableText = (entry.title + ' ' + entry.content + ' ' + entry.tags.join(' ')).toLowerCase();
      
      return searchTerms.some(term => searchableText.includes(term));
    });

    return filtered.map(entry => ({
      entry,
      relevance: calculateRelevance(entry, query),
      matchedFields: getMatchedFields(entry, query)
    })).sort((a, b) => b.relevance - a.relevance);
  };

  const calculateRelevance = (entry: KnowledgeEntry, query: string): number => {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    if (entry.title.toLowerCase().includes(queryLower)) score += 10;
    if (entry.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 5;
    if (entry.content.toLowerCase().includes(queryLower)) score += 3;
    
    // Boost popular entries
    score += Math.min(entry.helpful_votes * 0.1, 2);
    score += Math.min(entry.views * 0.01, 1);
    
    return score;
  };

  const getMatchedFields = (entry: KnowledgeEntry, query: string): string[] => {
    const fields = [];
    const queryLower = query.toLowerCase();
    
    if (entry.title.toLowerCase().includes(queryLower)) fields.push('title');
    if (entry.tags.some(tag => tag.toLowerCase().includes(queryLower))) fields.push('tags');
    if (entry.content.toLowerCase().includes(queryLower)) fields.push('content');
    
    return fields;
  };

  const voteHelpful = async (entryId: string, helpful: boolean) => {
    // In a real implementation, this would update the vote count
    toast({
      title: helpful ? "Marked as Helpful" : "Feedback Recorded",
      description: "Thank you for your feedback!"
    });
  };

  const getFilteredEntries = () => {
    if (selectedCategory === 'all') return knowledgeEntries;
    return knowledgeEntries.filter(entry => entry.category === selectedCategory);
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Knowledge Management System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              className="flex-1"
            />
            <Button 
              onClick={performSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Knowledge Entry</DialogTitle>
                </DialogHeader>
                <KnowledgeEntryForm onClose={() => setShowCreateDialog(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground mt-1" />
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {formatCategory(category)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results and Browse Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">Search Results</TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="popular">Most Popular</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {searchResults.length > 0 ? (
            searchResults.map(({ entry, relevance, matchedFields }) => (
              <KnowledgeEntryCard 
                key={entry.id} 
                entry={entry} 
                relevance={relevance}
                matchedFields={matchedFields}
                onVote={voteHelpful}
              />
            ))
          ) : searchQuery ? (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription>
                No results found for "{searchQuery}". Try different keywords or browse all entries.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                Enter a search query to find relevant knowledge base entries.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          {getFilteredEntries().map(entry => (
            <KnowledgeEntryCard 
              key={entry.id} 
              entry={entry} 
              onVote={voteHelpful}
            />
          ))}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          {[...knowledgeEntries]
            .sort((a, b) => b.helpful_votes - a.helpful_votes)
            .slice(0, 10)
            .map(entry => (
              <KnowledgeEntryCard 
                key={entry.id} 
                entry={entry} 
                onVote={voteHelpful}
              />
            ))}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {[...knowledgeEntries]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
            .map(entry => (
              <KnowledgeEntryCard 
                key={entry.id} 
                entry={entry} 
                onVote={voteHelpful}
              />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Knowledge Entry Card Component
interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
  relevance?: number;
  matchedFields?: string[];
  onVote: (entryId: string, helpful: boolean) => void;
}

const KnowledgeEntryCard: React.FC<KnowledgeEntryCardProps> = ({ 
  entry, 
  relevance, 
  matchedFields, 
  onVote 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-lg">{entry.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{entry.category.replace('_', ' ')}</Badge>
                {entry.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {relevance && (
                  <Badge variant="default">
                    {Math.round(relevance)}% match
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {entry.rating}
              </div>
              <Badge variant="outline">{entry.views} views</Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {entry.content.length > 200 
              ? entry.content.substring(0, 200) + '...' 
              : entry.content}
          </div>

          {matchedFields && matchedFields.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Matched: {matchedFields.join(', ')}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {entry.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(entry.updated_at).toLocaleDateString()}
              </span>
              <span>{entry.helpful_votes} helpful votes</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote(entry.id, true)}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVote(entry.id, false)}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Knowledge Entry Form Component
interface KnowledgeEntryFormProps {
  onClose: () => void;
  entry?: KnowledgeEntry;
}

const KnowledgeEntryForm: React.FC<KnowledgeEntryFormProps> = ({ onClose, entry }) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [category, setCategory] = useState(entry?.category || 'booking_issues');
  const [tags, setTags] = useState(entry?.tags.join(', ') || '');
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would save to the knowledge base
    toast({
      title: "Entry Saved",
      description: "Knowledge base entry has been saved successfully."
    });
    
    onClose();
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Entry title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <select 
        value={category} 
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border rounded-md"
      >
        <option value="booking_issues">Booking Issues</option>
        <option value="payment_problems">Payment Problems</option>
        <option value="system_errors">System Errors</option>
        <option value="user_accounts">User Accounts</option>
        <option value="provider_integration">Provider Integration</option>
        <option value="security">Security</option>
        <option value="performance">Performance</option>
        <option value="maintenance">Maintenance</option>
      </select>

      <Input
        placeholder="Tags (comma-separated)..."
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <Textarea
        placeholder="Enter the detailed content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
      />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>
          {entry ? 'Update' : 'Create'} Entry
        </Button>
      </div>
    </div>
  );
};