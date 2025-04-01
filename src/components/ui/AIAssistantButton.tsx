
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, X, MessageCircle, Sparkles } from 'lucide-react';
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
    setAnswer('');
    
    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a response
      const context = getContextFromRoute();
      
      setTimeout(() => {
        setAnswer(`Based on ${context}, here's my answer to "${question}": 
        
        This is a simulated AI response that would actually call a backend API in production. The assistant would provide helpful tax guidance related to your question and the current section of the application you're using.`);
        
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
          className="rounded-full h-16 w-16 bg-gradient-to-br from-purple-500 to-tax-blue hover:shadow-lg transition-all"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative">
            <img 
              src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
              alt="Tax Assistant" 
              className="w-12 h-12 object-cover rounded-full border-2 border-white"
            />
            <span className="absolute -top-1 -right-1 bg-tax-purple text-white text-xs p-1 rounded-full">
              <Sparkles size={12} />
            </span>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
              alt="Tax Assistant" 
              className="w-8 h-8 object-cover rounded-full"
            />
            Tax Assistant
          </SheetTitle>
          <SheetDescription>
            Ask me anything about taxes or how to use this application!
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4">
            {answer ? (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm">{answer}</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Ask me any tax-related question!</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about taxes or how to use this app..."
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAskQuestion();
                }
              }}
            />
            <Button 
              className="self-end"
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
      </SheetContent>
    </Sheet>
  );
};

export default AIAssistantButton;
