import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AIAssistantButton from '../ui/AIAssistantButton';
import { Bot, ArrowRight } from 'lucide-react';

const AssistantWrapper: React.FC = () => {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/';
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Show contextual messages based on the current page
    if (isWelcomePage) {
      setShowMessage(false);
      return;
    }
    
    setTimeout(() => {
      setShowMessage(true);
      
      switch(location.pathname) {
        case '/review':
          setMessage("Let me help you review your document info! Click if you need assistance.");
          break;
        case '/categories':
          setMessage("Not sure what categories apply to you? I can help you decide!");
          break;
        case '/questions':
          setMessage("Having trouble with any questions? I'm here to help explain!");
          break;
        case '/summary':
          setMessage("You did it! Click if you want me to explain anything in your summary.");
          break;
        default:
          setMessage("Need help? I'm here for you!");
      }
    }, 1000);
    
    // Hide the message after 8 seconds
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [location.pathname, isWelcomePage]);

  return (
    <div className="fixed bottom-24 right-10 z-50 flex flex-col items-end gap-3">
      {showMessage && (
        <div className="robot-chat-bubble bg-tax-blue text-white p-3 rounded-2xl animate-fade-in mb-2 max-w-xs">
          <p className="text-sm">{message}</p>
          <ArrowRight size={16} className="absolute bottom-2 right-3 animate-bounce-gentle" />
        </div>
      )}
      
      {isWelcomePage ? (
        <div className="relative">
          <img 
            src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
            alt="Tax Assistant" 
            className="w-24 h-24 object-cover rounded-full shadow-xl border-4 border-white animate-float"
          />
          <div className="absolute -top-2 -right-2 bg-tax-purple text-white p-2 rounded-full animate-pulse">
            <Bot size={16} />
          </div>
        </div>
      ) : (
        <AIAssistantButton />
      )}
    </div>
  );
};

export default AssistantWrapper;
