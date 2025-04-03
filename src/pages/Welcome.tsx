import React, { useEffect, useState } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import FileUploader from '../components/ui/FileUploader';
import AnimatedCard from '../components/ui/AnimatedCard';
import AIProcessingModal from '../components/ui/AIProcessingModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, FileText, Bot, LogOut, Building, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { taxCategories } from '../data/taxCategories';
import { v4 as uuidv4 } from 'uuid';

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

  const handleNextStep = () => {
    if (state.documents.length === 0) {
      toast({
        title: "No Documents Found",
        description: "Please upload at least one document to continue.",
        variant: "destructive",
      });
      return;
    }
    
    navigate('/import-options');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Layout 
      showBackButton={false}
      disableNext={state.documents.length === 0 || loading}
      onNext={handleNextStep}
      nextButtonText="Next"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-300/5 to-transparent rounded-3xl blur-3xl -z-10"></div>
        
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
            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-tax-blue text-white text-xs px-4 py-1 rounded-full">
              Claude AI-Powered
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-tax-blue via-tax-mediumBlue to-tax-skyBlue bg-clip-text text-transparent">
              2024 Tax Return
            </h1>
          </div>
          
          <p className="text-gray-600 mb-6 text-lg">
            Let's make filing your taxes simple and efficient
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-110">
              <div className="bg-tax-blue text-white rounded-full p-4 mb-3 shadow-lg shadow-blue-500/30">
                <FileText size={28} />
              </div>
              <span className="text-sm font-medium">Upload Documents</span>
            </div>
            
            <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-110">
              <div className="bg-tax-mediumBlue text-white rounded-full p-4 mb-3">
                <Bot size={28} />
              </div>
              <span className="text-sm font-medium text-tax-blue">AI Processing</span>
            </div>
            
            <div className="flex flex-col items-center transform transition-all duration-300 hover:scale-110">
              <div className="bg-tax-skyBlue text-white rounded-full p-4 mb-3">
                <Sparkles size={28} />
              </div>
              <span className="text-sm font-medium text-tax-blue">Tax Magic</span>
            </div>
          </div>
        </AnimatedCard>
        
        <AnimatedCard delay={300} className="backdrop-blur-sm bg-white/90 border border-gray-200/50 shadow-xl rounded-xl">
          <div className="p-2">
            <div className="bg-light-blue-gradient rounded-lg p-6">
              <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">Upload Your Tax Documents</h2>
              <FileUploader />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={500} className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Get all your money back</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Building className="text-tax-blue" size={28} />
              </div>
              <h3 className="font-medium text-lg mb-2">Business Expenses</h3>
              <p className="text-gray-600 text-sm">Track all your deductible business expenses</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-tax-blue" size={28} />
              </div>
              <h3 className="font-medium text-lg mb-2">Income Sources</h3>
              <p className="text-gray-600 text-sm">Manage multiple income streams easily</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all">
              <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-tax-blue" size={28} />
              </div>
              <h3 className="font-medium text-lg mb-2">Smart Deductions</h3>
              <p className="text-gray-600 text-sm">AI finds every possible deduction</p>
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
