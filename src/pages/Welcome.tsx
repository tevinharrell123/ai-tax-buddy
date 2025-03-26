
import React, { useEffect } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import FileUploader from '../components/ui/FileUploader';
import AnimatedCard from '../components/ui/AnimatedCard';
import { taxCategories, taxQuestions, sampleExtractedFields } from '../data/taxCategories';

const Welcome: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();

  useEffect(() => {
    // Initialize categories and questions on first load
    if (state.categories.length === 0) {
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
      // Simulate AI extraction by adding sample extracted fields
      dispatch({ type: 'SET_EXTRACTED_FIELDS', payload: sampleExtractedFields });
      dispatch({ type: 'MARK_STEP_COMPLETED', payload: 1 });
    }
  };

  return (
    <Layout 
      showBackButton={false}
      disableNext={state.documents.length === 0}
      onNext={handleNext}
    >
      <div className="max-w-3xl mx-auto">
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Welcome to your AI Tax Organizer</h1>
          <p className="text-gray-600 mb-4">
            Let's make tax preparation simpler and faster. Upload your tax documents, and our AI will help organize everything for you.
          </p>
          
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex flex-col items-center">
              <div className="bg-tax-lightBlue text-tax-blue rounded-full p-3 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
              <span className="text-sm font-medium">Upload Documents</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 text-gray-500 rounded-full p-3 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <span className="text-sm text-gray-500">Verify Information</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 text-gray-500 rounded-full p-3 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-checks"><path d="m3 7 3 3 3-3"/><path d="M3 17l3 3 3-3"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
              </div>
              <span className="text-sm text-gray-500">Complete & Submit</span>
            </div>
          </div>
        </AnimatedCard>
        
        <AnimatedCard delay={300}>
          <FileUploader />
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default Welcome;
