
import React, { useEffect, useState } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import FileUploader from '../components/ui/FileUploader';
import AnimatedCard from '../components/ui/AnimatedCard';
import AIProcessingModal from '../components/ui/AIProcessingModal';
import { taxCategories, taxQuestions, sampleExtractedFields } from '../data/taxCategories';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, FileText, Bot } from 'lucide-react';

const Welcome: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [showAIModal, setShowAIModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize categories and questions on first load
    if (state.categories.length === 0) {
      // Explicitly set to step 1 when on welcome page
      dispatch({ type: 'SET_STEP', payload: 1 });
      
      // Initialize with sample data for demo purposes
      // In a real application, this would come from a backend
      taxCategories.forEach(category => {
        const updatedCategory = { ...category, badge: null };
        dispatch({ type: 'TOGGLE_CATEGORY', payload: category.id });
      });
    }
  }, []);

  const handleNext = () => {
    if (state.documents.length > 0) {
      // Show AI processing modal
      setShowAIModal(true);
      
      // Simulate AI processing with a timeout
      setTimeout(() => {
        // Simulate AI extraction by adding sample extracted fields
        dispatch({ type: 'SET_EXTRACTED_FIELDS', payload: sampleExtractedFields });
        dispatch({ type: 'MARK_STEP_COMPLETED', payload: 1 });
        
        // Set step to 2 before navigating
        dispatch({ type: 'SET_STEP', payload: 2 });
        
        // Close modal and navigate to review page
        setShowAIModal(false);
        navigate('/review');
        
        // Show success toast
        toast({
          title: "Scan Complete!",
          description: "We've extracted information from your documents. Please review for accuracy.",
          variant: "success",
        });
      }, 7000); // 7 seconds of "AI processing"
    }
  };

  return (
    <Layout 
      showBackButton={false}
      disableNext={state.documents.length === 0}
      onNext={handleNext}
    >
      <div className="relative max-w-4xl mx-auto">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-800/10 to-transparent rounded-3xl blur-3xl -z-10"></div>
        
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
            <img 
              src="/lovable-uploads/00fda3a3-b9f1-4a0c-9c28-a94b4adcd6eb.png" 
              alt="AI Tax Concept" 
              className="w-52 h-auto rounded-lg shadow-xl transform -rotate-6 opacity-80"
            />
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
      
      {/* AI Processing Modal */}
      <AIProcessingModal 
        open={showAIModal} 
        onOpenChange={setShowAIModal} 
      />
    </Layout>
  );
};

export default Welcome;
