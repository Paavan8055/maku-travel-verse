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
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  title: string;
  content?: string;
  document_type: string;
  category?: string;
  tags: string[];
  status: string;
  version_number: number;
  is_template: boolean;
  access_level: string;
  created_at: string;
  updated_at: string;
  file_size?: number;
  mime_type?: string;
}

interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty_level: string;
  source_type: string;
  confidence_score: number;
  usage_count: number;
  created_at: string;
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
    document_type: 'general',
    category: '',
    tags: [] as string[],
    access_level: 'private',
    is_template: false
  });

  const [newKBEntry, setNewKBEntry] = useState({
    title: '',
    content: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    difficulty_level: 'beginner'
  });

  useEffect(() => {
    loadDocuments();
    loadKnowledgeBase();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setKnowledgeBase(data || []);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const { error } = await supabase
        .from('documents')
        .insert([newDocument]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document created successfully"
      });

      setShowDocDialog(false);
      setNewDocument({
        title: '',
        content: '',
        document_type: 'general',
        category: '',
        tags: [],
        access_level: 'private',
        is_template: false
      });
      loadDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive"
      });
    }
  };

  const handleCreateKBEntry = async () => {
    try {
      const { error } = await supabase
        .from('knowledge_base_entries')
        .insert([{
          ...newKBEntry,
          source_type: 'manual'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Knowledge base entry created successfully"
      });

      setShowKBDialog(false);
      setNewKBEntry({
        title: '',
        content: '',
        category: '',
        subcategory: '',
        tags: [],
        difficulty_level: 'beginner'
      });
      loadKnowledgeBase();
    } catch (error) {
      console.error('Error creating knowledge base entry:', error);
      toast({
        title: "Error",
        description: "Failed to create knowledge base entry",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
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
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredKnowledgeBase = knowledgeBase.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set([
    ...documents.map(d => d.category).filter(Boolean),
    ...knowledgeBase.map(k => k.category)
  ]));

  const templates = documents.filter(doc => doc.is_template);
  const recentDocs = documents.slice(0, 5);

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

                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="template">Template</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doc-access">Access Level</Label>
                    <Select 
                      value={newDocument.access_level} 
                      onValueChange={(value) => setNewDocument({...newDocument, access_level: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="doc-category">Category</Label>
                  <Input
                    id="doc-category"
                    value={newDocument.category}
                    onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
                    placeholder="e.g., project_management, meetings, procedures"
                  />
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

                <div>
                  <Label htmlFor="doc-tags">Tags (comma-separated)</Label>
                  <Input
                    id="doc-tags"
                    value={newDocument.tags.join(', ')}
                    onChange={(e) => setNewDocument({
                      ...newDocument, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., template, meeting, important"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-template"
                    checked={newDocument.is_template}
                    onChange={(e) => setNewDocument({...newDocument, is_template: e.target.checked})}
                  />
                  <Label htmlFor="is-template">Mark as template</Label>
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
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {documents.filter(d => d.status === 'published').length} published
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
                  {categories.length} categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ready to use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentDocs.length}</div>
                <p className="text-xs text-muted-foreground">
                  Updated this week
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
                  {recentDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                      <div>
                        <p className="font-medium">{entry.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Used {entry.usage_count} times
                        </p>
                      </div>
                      <Badge className={getDifficultyColor(entry.difficulty_level)}>
                        {entry.difficulty_level}
                      </Badge>
                    </div>
                  ))}
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
                Manage your document library
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
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                        {doc.is_template && (
                          <Badge variant="secondary">Template</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        v{doc.version_number} • {new Date(doc.updated_at).toLocaleDateString()}
                        {doc.category && ` • ${doc.category}`}
                      </p>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {doc.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Organizational knowledge and procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredKnowledgeBase.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{entry.title}</h3>
                        <Badge variant="outline">{entry.category}</Badge>
                        <Badge className={getDifficultyColor(entry.difficulty_level)}>
                          {entry.difficulty_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Used {entry.usage_count} times • Confidence: {(entry.confidence_score * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {entry.content.substring(0, 150)}...
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entry.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Reusable templates for quick document creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      <CardDescription>
                        {template.category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {template.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}