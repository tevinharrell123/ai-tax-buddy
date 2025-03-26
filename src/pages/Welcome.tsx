import React, { useEffect, useState } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import FileUploader from '../components/ui/FileUploader';
import AnimatedCard from '../components/ui/AnimatedCard';
import AIProcessingModal from '../components/ui/AIProcessingModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, FileText, Bot, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Welcome: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [showAIModal, setShowAIModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (state.categories.length === 0) {
      dispatch({ type: 'SET_STEP', payload: 1 });
      taxCategories.forEach(category => {
        const updatedCategory = { ...category, badge: null };
        dispatch({ type: 'TOGGLE_CATEGORY', payload: category.id });
      });
    }
  }, []);

  const processDocuments = async () => {
    setShowAIModal(true);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-document-info', {
        body: JSON.stringify({ documents: state.documents })
      });

      if (error) throw error;

      dispatch({ 
        type: 'SET_EXTRACTED_FIELDS', 
        payload: data.extractedFields 
      });
      
      dispatch({ type: 'MARK_STEP_COMPLETED', payload: 1 });
      dispatch({ type: 'SET_STEP', payload: 2 });
      
      setShowAIModal(false);
      navigate('/review');
      
      toast({
        title: "Scan Complete!",
        description: "We've extracted information from your documents. Please review for accuracy.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: "Processing Error",
        description: "There was an error processing your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (state.documents.length > 0) {
      processDocuments();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Layout 
      showBackButton={false}
      disableNext={state.documents.length === 0 || loading}
      onNext={handleNext}
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-800/10 to-transparent rounded-3xl blur-3xl -z-10"></div>
        
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
        
        <AnimatedCard delay={100} className="text-center mb-8">
          <div className="relative">
            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-4 py-1 rounded-full">
              AI-Powered
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-purple-600 via-blue-500 to-tax-blue bg-clip-text text-transparent">
              Welcome to your Tax Experience
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6 text-lg">
            Let's make Tax Season Magic
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-110">
              <div className="bg-gradient-to-br from-purple-500 to-tax-blue text-white rounded-full p-4 mb-3 shadow-lg shadow-purple-500/30">
                <FileText size={28} />
              </div>
              <span className="text-sm font-medium">Upload Documents</span>
            </div>
            
            <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-110">
              <div className="bg-gradient-to-br from-gray-600 to-gray-400 text-white rounded-full p-4 mb-3">
                <Bot size={28} />
              </div>
              <span className="text-sm text-gray-500">AI Processing</span>
            </div>
            
            <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-110">
              <div className="bg-gradient-to-br from-gray-600 to-gray-400 text-white rounded-full p-4 mb-3">
                <Sparkles size={28} />
              </div>
              <span className="text-sm text-gray-500">Tax Magic</span>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-tax-blue/20 rounded-full -m-2"></div>
              
              <div className="absolute -top-16 -right-10 bg-white p-3 rounded-xl shadow-md before:content-[''] before:absolute before:bottom-0 before:right-5 before:w-4 before:h-4 before:bg-white before:transform before:rotate-45 before:translate-y-2">
                <p className="text-sm font-medium text-gray-700">Hi{user ? ` ${user.email?.split('@')[0]}` : ''}! I'll help you with your taxes!</p>
              </div>
              
              <img 
                src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
                alt="Tax Assistant" 
                className="w-40 h-40 object-cover rounded-full shadow-xl border-4 border-white animate-bounce-gentle"
              />
              
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-tax-blue/20 rounded-full blur-md -z-10 animate-pulse-light"></div>
            </div>
          </div>
        </AnimatedCard>
        
        <AnimatedCard delay={300} className="backdrop-blur-sm bg-white/80 border border-gray-200/50 shadow-xl rounded-xl">
          <div className="p-2">
            <div className="bg-gradient-to-br from-purple-900/5 to-blue-900/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">Upload Your Tax Documents</h2>
              <FileUploader />
            </div>
          </div>
        </AnimatedCard>
      </div>
      
      <AIProcessingModal 
        open={showAIModal} 
        onOpenChange={setShowAIModal} 
      />
    </Layout>
  );
};

export default Welcome;
