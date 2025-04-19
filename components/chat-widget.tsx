"use client"

import { useState, useEffect, useRef } from 'react';
import { sendMessage, getChatHistory, type ChatMessage } from '@/lib/chat-service';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { auth } from '@/lib/firebase';

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history when component mounts
  useEffect(() => {
    const loadInitialHistory = async () => {
      try {
        const history = await getChatHistory();
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Set welcome message if no history
          setMessages([{
            role: 'assistant',
            content: "Hi there! How can I help you today?",
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
        });
      }
    };

    loadInitialHistory();
  }, [toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        loadChatHistory();
      } else {
        setMessages([{
          role: 'assistant',
          content: "Please sign in to use the chat feature.",
          timestamp: new Date()
        }]);
      }
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory();
      // Ensure timestamps are Date objects
      const formattedHistory = history.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(formattedHistory);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !isAuthenticated) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    // Immediately add user message to state
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendMessage(input);
      
      // Add assistant message to state
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Chat Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[370px] px-4">
          <div className="space-y-4 pt-1">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                    <div className="flex gap-1">
                      <span className="animate-bounce">•</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>•</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0">
        <form 
          onSubmit={handleSendMessage} 
          className="flex w-full items-center space-x-2"
          suppressHydrationWarning
        >
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off" // Prevents browser autofill
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isTyping}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
