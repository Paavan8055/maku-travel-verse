import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Download, Upload, Eye, Edit, Trash2, History, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  content?: string;
  document_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty_level: string;
  source_type: string;
  confidence_score: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export function DocsModule() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [showKBDialog, setShowKBDialog] = useState(false);
  const { toast } = useToast();

  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    document_type: 'note',
  });

  const [newKBEntry, setNewKBEntry] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    difficulty_level: 'beginner'
  });

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    try {
      setIsLoading(true);

      // Mock documents
      const mockDocs: Document[] = [
        {
          id: '1',
          title: 'Project Proposal',
          content: 'This is a project proposal document...',
          document_type: 'proposal',
          created_by: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Meeting Notes',
          content: 'Notes from the weekly team meeting...',
          document_type: 'notes',
          created_by: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock knowledge base entries
      const mockKB: KnowledgeBaseEntry[] = [
        {
          id: '1',
          title: 'API Documentation',
          content: 'Complete API documentation for the platform...',
          category: 'technical',
          tags: ['api', 'documentation'],
          difficulty_level: 'intermediate',
          source_type: 'internal',
          confidence_score: 0.95,
          usage_count: 42,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setDocuments(mockDocs);
      setKnowledgeBase(mockKB);

    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      // Mock creating document
      const mockDoc: Document = {
        id: Date.now().toString(),
        ...newDocument,
        created_by: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setDocuments(prev => [mockDoc, ...prev]);

      toast({
        title: 'Success',
        description: 'Document created successfully',
      });

      setShowDocDialog(false);
      setNewDocument({
        title: '',
        content: '',
        document_type: 'note',
      });

    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document',
        variant: 'destructive',
      });
    }
  };

  const handleCreateKBEntry = async () => {
    try {
      // Mock creating knowledge base entry
      const mockEntry: KnowledgeBaseEntry = {
        id: Date.now().toString(),
        ...newKBEntry,
        source_type: 'manual',
        confidence_score: 0.9,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setKnowledgeBase(prev => [mockEntry, ...prev]);

      toast({
        title: 'Success',
        description: 'Knowledge base entry created successfully',
      });

      setShowKBDialog(false);
      setNewKBEntry({
        title: '',
        content: '',
        category: '',
        tags: [],
        difficulty_level: 'beginner'
      });

    } catch (error) {
      console.error('Error creating knowledge base entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to create knowledge base entry',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredKnowledgeBase = knowledgeBase.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(knowledgeBase.map(k => k.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents & Knowledge</h2>
          <p className="text-muted-foreground">
            Manage documents, templates, and organizational knowledge
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showKBDialog} onOpenChange={setShowKBDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Knowledge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Knowledge Base Entry</DialogTitle>
                <DialogDescription>
                  Create a new entry for the organizational knowledge base.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kb-title">Title</Label>
                  <Input
                    id="kb-title"
                    value={newKBEntry.title}
                    onChange={(e) => setNewKBEntry({...newKBEntry, title: e.target.value})}
                    placeholder="Knowledge entry title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kb-category">Category</Label>
                    <Input
                      id="kb-category"
                      value={newKBEntry.category}
                      onChange={(e) => setNewKBEntry({...newKBEntry, category: e.target.value})}
                      placeholder="e.g., procedures, technical, training"
                    />
                  </div>
                  <div>
                    <Label htmlFor="kb-difficulty">Difficulty Level</Label>
                    <Select 
                      value={newKBEntry.difficulty_level} 
                      onValueChange={(value) => setNewKBEntry({...newKBEntry, difficulty_level: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="kb-content">Content</Label>
                  <Textarea
                    id="kb-content"
                    value={newKBEntry.content}
                    onChange={(e) => setNewKBEntry({...newKBEntry, content: e.target.value})}
                    placeholder="Knowledge content and instructions"
                    rows={8}
                  />
                </div>

                <div>
                  <Label htmlFor="kb-tags">Tags (comma-separated)</Label>
                  <Input
                    id="kb-tags"
                    value={newKBEntry.tags.join(', ')}
                    onChange={(e) => setNewKBEntry({
                      ...newKBEntry, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., process, automation, guidelines"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateKBEntry}>
                  Create Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
                <DialogDescription>
                  Create a new document or template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-title">Title</Label>
                  <Input
                    id="doc-title"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    placeholder="Document title"
                  />
                </div>

                <div>
                  <Label htmlFor="doc-type">Type</Label>
                  <Select 
                    value={newDocument.document_type} 
                    onValueChange={(value) => setNewDocument({...newDocument, document_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="doc-content">Content</Label>
                  <Textarea
                    id="doc-content"
                    value={newDocument.content}
                    onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                    placeholder="Document content"
                    rows={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateDocument}>
                  Create Document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search documents and knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Entries</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{knowledgeBase.length}</div>
                <p className="text-xs text-muted-foreground">
                  Knowledge base entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">
                  Knowledge categories
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type} • {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {knowledgeBase.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(entry.difficulty_level)} variant="secondary">
                            {entry.difficulty_level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {entry.usage_count} uses
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {knowledgeBase.length === 0 && (
                    <p className="text-sm text-muted-foreground">No knowledge entries yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                Manage all organizational documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{doc.title}</h3>
                        <Badge variant="outline">{doc.document_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {doc.content?.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(doc.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredDocuments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No documents found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Organizational knowledge and best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredKnowledgeBase.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{entry.title}</h3>
                        <Badge className={getDifficultyColor(entry.difficulty_level)} variant="secondary">
                          {entry.difficulty_level}
                        </Badge>
                        <Badge variant="outline">{entry.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {entry.usage_count} uses
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(entry.confidence_score * 100).toFixed(0)}% confidence
                        </span>
                        {entry.tags.length > 0 && (
                          <div className="flex gap-1">
                            {entry.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredKnowledgeBase.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No knowledge entries found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}