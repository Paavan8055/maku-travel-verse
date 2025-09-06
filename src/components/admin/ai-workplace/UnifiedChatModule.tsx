import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Plus, Users, Bot, Settings, Search, Paperclip, Phone, Video } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface ChatConversation {
  id: string;
  title: string;
  conversation_type: string;
  participants: string[];
  active_agents: string[];
  status: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id?: string;
  sender_type: string;
  agent_id?: string;
  message_type: string;
  content: string;
  attachments: any[];
  reply_to_id?: string;
  is_system_message: boolean;
  processing_status: string;
  created_at: string;
}

export function UnifiedChatModule() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [newConversation, setNewConversation] = useState({
    title: '',
    conversation_type: 'general',
    active_agents: [] as string[]
  });

  const availableAgents = [
    { id: 'calendar-sync-agent', name: 'Calendar Sync Agent', description: 'Manages calendar synchronization' },
    { id: 'ai-content-curator', name: 'AI Content Curator', description: 'Creates and curates content' },
    { id: 'api-orchestration-manager', name: 'API Orchestration Manager', description: 'Manages API interactions' },
    { id: 'automated-testing-coordinator', name: 'Testing Coordinator', description: 'Coordinates automated testing' },
    { id: 'advanced-analytics-processor', name: 'Analytics Processor', description: 'Processes advanced analytics' },
    { id: 'documentation-handler', name: 'Documentation Handler', description: 'Handles travel documentation' }
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setConversations(data || []);
      
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const handleCreateConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([{
          title: newConversation.title,
          conversation_type: newConversation.conversation_type,
          active_agents: JSON.stringify(newConversation.active_agents),
          participants: JSON.stringify([])
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conversation created successfully"
      });

      setShowNewChatDialog(false);
      setNewConversation({
        title: '',
        conversation_type: 'general',
        active_agents: []
      });
      
      loadConversations();
      setSelectedConversation(data);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_type: 'human',
          message_type: 'text',
          content: newMessage,
          attachments: JSON.stringify([]),
          is_system_message: false,
          processing_status: 'completed'
        }]);

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();

      // Simulate agent responses if agents are active
      const activeAgents = Array.isArray(selectedConversation.active_agents) 
        ? selectedConversation.active_agents 
        : JSON.parse(selectedConversation.active_agents || '[]');

      if (activeAgents.length > 0) {
        setTimeout(async () => {
          const agent = availableAgents.find(a => activeAgents.includes(a.id));
          if (agent) {
            await supabase
              .from('chat_messages')
              .insert([{
                conversation_id: selectedConversation.id,
                sender_type: 'agent',
                agent_id: agent.id,
                message_type: 'text',
                content: `Hello! I'm ${agent.name}. How can I assist you with your request?`,
                attachments: JSON.stringify([]),
                is_system_message: false,
                processing_status: 'completed'
              }]);

            loadMessages(selectedConversation.id);
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const getMessageAvatar = (message: ChatMessage) => {
    if (message.sender_type === 'agent' && message.agent_id) {
      const agent = availableAgents.find(a => a.id === message.agent_id);
      return agent ? agent.name.substring(0, 2).toUpperCase() : 'AI';
    }
    return 'U';
  };

  const getMessageSenderName = (message: ChatMessage) => {
    if (message.sender_type === 'agent' && message.agent_id) {
      const agent = availableAgents.find(a => a.id === message.agent_id);
      return agent ? agent.name : 'AI Agent';
    }
    return 'You';
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
                  value={newConversation.title}
                  onChange={(e) => setNewConversation({...newConversation, title: e.target.value})}
                  placeholder="Enter conversation title"
                />
              </div>

              <div>
                <Label htmlFor="chat-type">Type</Label>
                <Select 
                  value={newConversation.conversation_type} 
                  onValueChange={(value) => setNewConversation({...newConversation, conversation_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Chat</SelectItem>
                    <SelectItem value="project">Project Discussion</SelectItem>
                    <SelectItem value="support">Support Request</SelectItem>
                    <SelectItem value="planning">Planning Session</SelectItem>
                    <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select AI Agents</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {availableAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={agent.id}
                        checked={newConversation.active_agents.includes(agent.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewConversation({
                              ...newConversation,
                              active_agents: [...newConversation.active_agents, agent.id]
                            });
                          } else {
                            setNewConversation({
                              ...newConversation,
                              active_agents: newConversation.active_agents.filter(id => id !== agent.id)
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={agent.id} className="text-sm font-medium">
                          {agent.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateConversation}>
                Start Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations Sidebar */}
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
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {conversation.conversation_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.last_message_at
                          ? formatMessageTime(conversation.last_message_at)
                          : 'No messages yet'
                        }
                      </p>
                      {/* Active Agents */}
                      {conversation.active_agents && JSON.parse(conversation.active_agents).length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {JSON.parse(conversation.active_agents).slice(0, 2).map((agentId: string) => {
                            const agent = availableAgents.find(a => a.id === agentId);
                            return agent ? (
                              <Badge key={agentId} variant="secondary" className="text-xs">
                                🤖 {agent.name.split(' ')[0]}
                              </Badge>
                            ) : null;
                          })}
                          {JSON.parse(conversation.active_agents).length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{JSON.parse(conversation.active_agents).length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {conversations.length === 0 && (
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
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedConversation.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{selectedConversation.conversation_type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {messages.length} messages
                      </span>
                      {selectedConversation.active_agents && JSON.parse(selectedConversation.active_agents).length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          • {JSON.parse(selectedConversation.active_agents).length} AI agents active
                        </span>
                      )}
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
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_type === 'human' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={
                            message.sender_type === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }>
                            {getMessageAvatar(message)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-[70%] ${
                          message.sender_type === 'human' ? 'text-right' : 'text-left'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {getMessageSenderName(message)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(message.created_at)}
                            </span>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            message.sender_type === 'human'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    )}
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
                      className="min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Welcome to AI Chat</h3>
                <p className="mb-4">Select a conversation or start a new one to begin collaborating with AI agents.</p>
                <Button onClick={() => setShowNewChatDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}