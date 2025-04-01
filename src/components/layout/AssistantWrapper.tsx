
import React from 'react';
import { useLocation } from 'react-router-dom';
import AIAssistantButton from '../ui/AIAssistantButton';

const AssistantWrapper: React.FC = () => {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/';

  return (
    <div className="fixed bottom-24 right-10 z-50">
      {isWelcomePage ? (
        <img 
          src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
          alt="Tax Assistant" 
          className="w-24 h-24 object-cover rounded-full shadow-xl border-4 border-white animate-bounce-gentle"
        />
      ) : (
        <AIAssistantButton />
      )}
    </div>
  );
};

export default AssistantWrapper;
