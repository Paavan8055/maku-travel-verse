import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Upload, Search, Filter, AlertCircle, 
  Shield, Calendar, Tag, Eye, Download, Trash2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_path?: string;
  ai_analysis: any;
  classification_confidence: number;
  expiry_date?: string;
  tags: any;
  security_level: string;
  auto_categorized: boolean;
  created_at: string;
}

export function DocumentModule() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);

  useEffect(() => {
    loadDocuments();
    checkExpiringDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_intelligence')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const checkExpiringDocuments = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('document-intelligence', {
        body: {
          action: 'check_expiry',
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;
      setExpiringDocs(data.expiring_documents || []);
    } catch (error) {
      console.error('Error checking expiring documents:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Mock file upload and analysis
      const mockDocumentData = {
        fileName: file.name,
        fileContent: 'base64_encoded_content',
        fileType: file.type,
        filePath: `/documents/${file.name}`
      };

      const { data, error } = await supabase.functions.invoke('document-intelligence', {
        body: {
          action: 'analyze_document',
          userId: (await supabase.auth.getUser()).data.user?.id,
          documentData: mockDocumentData
        }
      });

      if (error) throw error;

      toast.success(`Document analyzed with ${Math.round(data.analysis.confidence * 100)}% confidence`);
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload and analyze document');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('document-intelligence', {
        body: {
          action: 'search_documents',
          userId: (await supabase.auth.getUser()).data.user?.id,
          searchQuery: {
            query: searchQuery,
            filters: selectedType !== 'all' ? { document_type: selectedType } : {}
          }
        }
      });

      if (error) throw error;
      setDocuments(data.results || []);
      toast.success(`Found ${data.total_found} documents`);
    } catch (error) {
      console.error('Error searching documents:', error);
      toast.error('Failed to search documents');
    }
  };

  const extractDocumentData = async (documentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('document-intelligence', {
        body: {
          action: 'extract_data',
          userId: (await supabase.auth.getUser()).data.user?.id,
          documentData: { documentId }
        }
      });

      if (error) throw error;
      toast.success('Enhanced data extraction completed');
      loadDocuments();
    } catch (error) {
      console.error('Error extracting document data:', error);
      toast.error('Failed to extract document data');
    }
  };

  const getSecurityIcon = (level: string) => {
    const icons = {
      confidential: <Shield className="h-4 w-4 text-red-500" />,
      sensitive: <Shield className="h-4 w-4 text-orange-500" />,
      standard: <Shield className="h-4 w-4 text-green-500" />
    };
    return icons[level] || icons.standard;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      passport: 'bg-blue-100 text-blue-800',
      visa: 'bg-green-100 text-green-800',
      insurance: 'bg-purple-100 text-purple-800',
      ticket: 'bg-orange-100 text-orange-800',
      accommodation: 'bg-pink-100 text-pink-800',
      health_certificate: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredDocuments = documents.filter(doc => 
    selectedType === 'all' || doc.document_type === selectedType
  );

  const documentTypes = [...new Set(documents.map(doc => doc.document_type))];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span>Document Intelligence</span>
              </CardTitle>
              <CardDescription>
                AI-powered document management with automatic categorization and data extraction
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <span>Documents Expiring Soon</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              {expiringDocs.length} document{expiringDocs.length > 1 ? 's require' : ' requires'} attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringDocs.slice(0, 3).map(doc => (
                <div key={doc.document_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{doc.document_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires in {doc.days_until_expiry} days - {doc.action_required}
                    </p>
                  </div>
                  <Badge variant={doc.urgency === 'critical' ? 'destructive' : 'secondary'}>
                    {doc.urgency}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents by name, content, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Types</option>
              {documentTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} in your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No documents found</h3>
              <p className="text-muted-foreground">
                Upload your first document or adjust your search criteria
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map(doc => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium truncate mb-1">{doc.document_name}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(doc.document_type)}>
                            {doc.document_type.replace('_', ' ')}
                          </Badge>
                          {getSecurityIcon(doc.security_level)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span>{Math.round(doc.classification_confidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${doc.classification_confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      {doc.expiry_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expires:</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(doc.expiry_date).toLocaleDateString()}</span>
                            {getDaysUntilExpiry(doc.expiry_date) <= 30 && (
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </div>
                      )}

                      {doc.tags && doc.tags.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-1 mb-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Tags:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {doc.auto_categorized && (
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          AI Categorized
                        </div>
                      )}

                      <div className="flex justify-between pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => extractDocumentData(doc.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Extract
                        </Button>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}