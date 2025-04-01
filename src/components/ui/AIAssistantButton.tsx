
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, X, MessageCircle, Sparkles, Robot } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const AIAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<{type: 'user' | 'assistant', content: string}[]>([
    {type: 'assistant', content: 'Hey there! 👋 I\'m your AI tax assistant. How can I help you today?'}
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  
  // Determine context based on current route
  const getContextFromRoute = () => {
    switch(location.pathname) {
      case '/review':
        return "You're reviewing extracted document information.";
      case '/categories':
        return "You're selecting tax categories that apply to you.";
      case '/questions':
        return "You're answering tax-related questions.";
      case '/summary':
        return "You're reviewing a summary of your tax information.";
      default:
        return "You're organizing your tax documents.";
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    
    // Add user message
    setMessages(prev => [...prev, {type: 'user', content: question}]);
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a response
      const context = getContextFromRoute();
      
      setTimeout(() => {
        const newAnswer = `Based on ${context}, here's what I can tell you about "${question}": 
        
This is a simulated AI response that would actually call a backend API in production. The assistant would provide helpful tax guidance related to your question and the current section of the application you're using.`;
        
        setMessages(prev => [...prev, {type: 'assistant', content: newAnswer}]);
        setQuestion('');
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error asking AI assistant:', error);
      toast({
        title: 'Error',
        description: 'Unable to get an answer right now. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          className="rounded-full h-16 w-16 bg-gradient-to-br from-tax-purple to-tax-blue hover:shadow-xl transition-all"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative">
            <img 
              src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
              alt="Tax Assistant" 
              className="w-12 h-12 object-cover rounded-full border-2 border-white"
            />
            <span className="absolute -top-1 -right-1 bg-tax-purple text-white text-xs p-1 rounded-full animate-pulse">
              <Sparkles size={12} />
            </span>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md bg-pink-50 border-l border-pink-200">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-tax-blue to-tax-purple p-2 rounded-full">
              <Robot size={24} className="text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-tax-blue to-tax-purple bg-clip-text text-transparent">
                SmartWiz Assistant
              </span>
            </div>
          </SheetTitle>
          <SheetDescription>
            I'm here to help with your tax questions!
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                {message.type === 'assistant' && (
                  <div className="flex items-end gap-2">
                    <img 
                      src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
                      alt="Assistant" 
                      className="w-8 h-8 object-cover rounded-full border-2 border-white mb-1"
                    />
                    <div className="robot-chat-bubble">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                )}

                {message.type === 'user' && (
                  <div className="user-chat-bubble">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <img 
                    src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
                    alt="Assistant" 
                    className="w-8 h-8 object-cover rounded-full border-2 border-white mb-1"
                  />
                  <div className="robot-chat-bubble">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-white rounded-t-2xl border-t border-pink-200">
            <div className="flex gap-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about taxes or how to use this app..."
                className="resize-none rounded-xl border-pink-200 focus:border-tax-blue"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
              />
              <Button 
                className="self-end rounded-xl bg-gradient-to-r from-tax-blue to-tax-purple hover:shadow-lg"
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
              >
                {isLoading ? (
                  <div className="animate-spin">⟳</div>
                ) : (
                  <MessageCircle size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistantButton;
