import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function GPT5NanoTester() {
  const [input, setInput] = useState("write a haiku about ai");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateResponse = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to generate a response.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setOutput("");

    try {
      const { data, error } = await supabase.functions.invoke('gpt5-nano-responses', {
        body: { 
          input: input.trim(),
          model: "gpt-5-nano-2025-08-07",
          store: true
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setOutput(data.output_text);
      toast({
        title: "Response Generated",
        description: "GPT-5 Nano has generated your response successfully!",
      });

    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "write a haiku about ai",
    "explain quantum computing in simple terms",
    "create a short motivational quote",
    "write a brief summary of machine learning"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          GPT-5 Nano Response Tester
        </CardTitle>
        <CardDescription>
          Test the new GPT-5 Nano model using the OpenAI Responses API. Ultra-fast and cost-effective for simple tasks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="input">Input Prompt</Label>
          <Textarea
            id="input"
            placeholder="Enter your prompt here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Label className="text-sm text-muted-foreground">Quick prompts:</Label>
          {quickPrompts.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInput(prompt)}
              className="text-xs"
            >
              {prompt}
            </Button>
          ))}
        </div>

        <Button 
          onClick={generateResponse} 
          disabled={isLoading || !input.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Response
            </>
          )}
        </Button>

        {output && (
          <div className="space-y-2">
            <Label htmlFor="output">GPT-5 Nano Response</Label>
            <div className="p-4 bg-muted rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm font-mono">{output}</pre>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Model:</strong> gpt-5-nano-2025-08-07</p>
          <p><strong>API:</strong> OpenAI Responses API</p>
          <p><strong>Features:</strong> Ultra-fast, cost-effective, optimized for simple tasks</p>
        </div>
      </CardContent>
    </Card>
  );
}