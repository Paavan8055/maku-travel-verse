import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Plus, Users, Bot, Settings, Search, Paperclip, Phone, Video, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface ChatSession {
  id: string;
  title: string;
  agent_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export function UnifiedChatModule() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [newSession, setNewSession] = useState({
    title: '',
    agent_type: 'general',
  });

  const availableAgents = [
    { id: 'travel', name: 'Travel Assistant', description: 'Helps with travel planning and bookings' },
    { id: 'documentation', name: 'Documentation Helper', description: 'Assists with document management' },
    { id: 'analytics', name: 'Analytics Assistant', description: 'Provides data insights and analysis' },
    { id: 'general', name: 'General Assistant', description: 'General purpose AI assistant' }
  ];

  useEffect(() => {
    loadMockData();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMockData = async () => {
    try {
      setIsLoading(true);

      // Mock chat sessions
      const mockSessions: ChatSession[] = [
        {
          id: '1',
          title: 'Travel Planning Assistant',
          agent_type: 'travel',
          user_id: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Document Helper',
          agent_type: 'documentation',
          user_id: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setChatSessions(mockSessions);

      // Load active session messages if exists
      if (mockSessions.length > 0) {
        setActiveSessionId(mockSessions[0].id);
        loadMessages(mockSessions[0].id);
      }

    } catch (error) {
      console.error('Error loading chat data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      // Mock messages
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          session_id: sessionId,
          content: 'Hello! How can I help you today?',
          role: 'assistant',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          session_id: sessionId,
          content: 'I need help planning a trip to Japan',
          role: 'user',
          created_at: new Date().toISOString(),
        },
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSessionId) return;

    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        session_id: activeSessionId,
        content: newMessage,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      // Simulate AI response
      setTimeout(() => {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          session_id: activeSessionId,
          content: 'I understand you want to plan a trip to Japan. Let me help you with that!',
          role: 'assistant',
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSession = async () => {
    try {
      const newChatSession: ChatSession = {
        id: Date.now().toString(),
        title: newSession.title,
        agent_type: newSession.agent_type,
        user_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setChatSessions(prev => [newChatSession, ...prev]);
      setActiveSessionId(newChatSession.id);
      setMessages([]);

      toast({
        title: 'Success',
        description: 'New chat session created',
      });

      setShowNewChatDialog(false);
      setNewSession({
        title: '',
        agent_type: 'general',
      });

    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat session',
        variant: 'destructive',
      });
    }
  };

  const getAgentInfo = (agentType: string) => {
    return availableAgents.find(agent => agent.id === agentType) || availableAgents[0];
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const activeSession = chatSessions.find(session => session.id === activeSessionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Unified AI Chat</h2>
          <p className="text-muted-foreground">
            Central communication hub for human-AI collaboration
          </p>
        </div>
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Create a new chat with AI agents for collaboration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="chat-title">Conversation Title</Label>
                <Input
                  id="chat-title"
                  value={newSession.title}
                  onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                  placeholder="Enter conversation title"
                />
              </div>

              <div>
                <Label htmlFor="agent-type">AI Assistant Type</Label>
                <Select 
                  value={newSession.agent_type} 
                  onValueChange={(value) => setNewSession({...newSession, agent_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} - {agent.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSession}>
                Start Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Sessions Sidebar */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversations</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="space-y-1 p-3">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeSessionId === session.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{session.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getAgentInfo(session.agent_type).name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatMessageTime(session.updated_at)}
                      </p>
                    </div>
                  ))}
                  {chatSessions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No conversations yet. Start a new chat!
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="col-span-9">
          {activeSession ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{activeSession.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{getAgentInfo(activeSession.agent_type).name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {messages.length} messages
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-400px)] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 max-w-xs lg:max-w-md ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active chat sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messages.length * chatSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Messages exchanged
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableAgents.length}</div>
                <p className="text-xs text-muted-foreground">
                  AI assistants available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground">
                  Average response time
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {availableAgents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {agent.name}
                  </CardTitle>
                  <CardDescription>
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Available</Badge>
                    <Button variant="outline" size="sm">
                      Start Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Settings</CardTitle>
              <CardDescription>
                Configure your chat preferences and AI behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-save conversations</Label>
                  <p className="text-sm text-muted-foreground">Automatically save chat history</p>
                </div>
                <Button variant="outline" size="sm">
                  Enabled
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI response speed</Label>
                  <p className="text-sm text-muted-foreground">Control how fast AI responds</p>
                </div>
                <Select defaultValue="normal">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}