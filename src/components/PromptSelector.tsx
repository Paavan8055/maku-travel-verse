import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExternalPrompts } from '@/hooks/useExternalPrompts';
import { Loader2, ExternalLink, Tag, Calendar, CheckCircle2 } from 'lucide-react';

interface PromptSelectorProps {
  selectedPromptId?: string | null;
  onPromptSelect: (promptId: string | null) => void;
  className?: string;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({
  selectedPromptId,
  onPromptSelect,
  className = ""
}) => {
  const { prompts, loading, error, fetchExternalPrompt } = useExternalPrompts();

  const handleExternalPromptLoad = async () => {
    const promptId = 'pmpt_68c0155d4b14819387229a2d6447ebf30d949ad177073d99';
    try {
      const prompt = await fetchExternalPrompt(promptId, 'custom');
      if (prompt) {
        onPromptSelect(prompt.external_id);
      }
    } catch (err) {
      console.error('Failed to load external prompt:', err);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading prompts...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Prompt Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Default/No Prompt Option */}
          <div 
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              !selectedPromptId 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:bg-muted/50'
            }`}
            onClick={() => onPromptSelect(null)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Default Assistant</h4>
                <p className="text-sm text-muted-foreground">
                  Use built-in prompts based on query type
                </p>
              </div>
              {!selectedPromptId && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>

          {/* External Prompt Button */}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExternalPromptLoad}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Load External Prompt (pmpt_68c0...)
          </Button>

          {/* Cached Prompts */}
          {prompts.length > 0 && (
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPromptId === prompt.external_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => onPromptSelect(prompt.external_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{prompt.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            v{prompt.version}
                          </Badge>
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prompt.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {prompt.category}
                          </Badge>
                          {prompt.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {prompt.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{prompt.tags.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(prompt.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {selectedPromptId === prompt.external_id && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {prompts.length === 0 && (
            <div className="text-center p-6 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No cached prompts available</p>
              <p className="text-sm">Load external prompts to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptSelector;