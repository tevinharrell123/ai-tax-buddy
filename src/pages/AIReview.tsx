
import React, { useState, useEffect } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, X, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AIReview: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const navigate = useNavigate();
  
  // Ensure we're on step 2 when this component loads
  useEffect(() => {
    if (state.step !== 2) {
      dispatch({ type: 'SET_STEP', payload: 2 });
    }
  }, []);
  
  // Define how many fields to show per section
  const fieldsPerSection = 5;
  const totalSections = Math.ceil(state.extractedFields.length / fieldsPerSection);
  
  const handleFieldStatus = (fieldId: string, isCorrect: boolean) => {
    dispatch({
      type: 'UPDATE_EXTRACTED_FIELD',
      payload: {
        id: fieldId,
        updates: { isCorrect }
      }
    });
  };

  const startEditing = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    setEditValue(currentValue);
  };

  const saveEdit = (fieldId: string) => {
    dispatch({
      type: 'UPDATE_EXTRACTED_FIELD',
      payload: {
        id: fieldId,
        updates: { value: editValue, isCorrect: true }
      }
    });
    setEditingField(null);
  };
  
  const verifyAll = () => {
    state.extractedFields.forEach(field => {
      dispatch({
        type: 'UPDATE_EXTRACTED_FIELD',
        payload: {
          id: field.id,
          updates: { isCorrect: true }
        }
      });
    });
    
    toast({
      title: "All fields verified",
      description: "All extracted information has been verified",
      variant: "default"
    });
  };
  
  const goToNextSection = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };
  
  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  // Get fields for current section
  const currentFields = state.extractedFields.slice(
    currentSection * fieldsPerSection, 
    (currentSection + 1) * fieldsPerSection
  );

  const isReviewComplete = state.extractedFields.every(field => field.isCorrect !== null);

  const handleNextStep = () => {
    if (isReviewComplete) {
      // Mark this step as completed
      dispatch({ type: 'MARK_STEP_COMPLETED', payload: 2 });
      // Move to step 3
      dispatch({ type: 'SET_STEP', payload: 3 });
      // Navigate to the highlight page
      navigate('/highlight');
      
      toast({
        title: "Review Complete!",
        description: "Moving to document highlighting",
        variant: "success",
      });
    }
  };

  return (
    <Layout 
      disableNext={!isReviewComplete}
      onNext={handleNextStep}
    >
      <div className="max-w-3xl mx-auto">
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Review AI-Extracted Information</h1>
          <p className="text-gray-600">
            Our AI has analyzed your documents. Please review the extracted information and confirm if it's correct.
          </p>
        </AnimatedCard>
        
        <AnimatedCard delay={300}>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Extracted Information</h2>
              <Button 
                onClick={verifyAll}
                className="bg-green-500 hover:bg-green-600"
              >
                <Check className="mr-2 h-4 w-4" /> Verify All
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                Please confirm each field is correct by clicking the checkmark, or edit if needed
              </p>
            </div>
            
            {totalSections > 1 && (
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <span>Section {currentSection + 1} of {totalSections}</span>
                <div className="flex gap-2">
                  <Button 
                    onClick={goToPrevSection}
                    variant="outline"
                    size="sm"
                    disabled={currentSection === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={goToNextSection}
                    variant="outline"
                    size="sm"
                    disabled={currentSection === totalSections - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div 
              className="divide-y touch-pan-y" 
              onTouchStart={(e) => {
                const touchStartX = e.touches[0].clientX;
                const handleTouchEnd = (e: TouchEvent) => {
                  const touchEndX = e.changedTouches[0].clientX;
                  const diff = touchStartX - touchEndX;
                  
                  if (diff > 50) { // Swiped left
                    goToNextSection();
                  } else if (diff < -50) { // Swiped right
                    goToPrevSection();
                  }
                  
                  document.removeEventListener('touchend', handleTouchEnd);
                };
                
                document.addEventListener('touchend', handleTouchEnd);
              }}
            >
              {currentFields.map((field) => (
                <div key={field.id} className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{field.name}</p>
                    
                    {editingField === field.id ? (
                      <div className="mt-1 flex items-center">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="border rounded-md px-2 py-1 text-sm w-full max-w-xs"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(field.id)}
                          className="ml-2 bg-tax-green text-white p-1 rounded-md"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-lg">{field.value}</p>
                    )}
                  </div>
                  
                  {editingField !== field.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFieldStatus(field.id, true)}
                        className={`p-2 rounded-full transition-all ${
                          field.isCorrect === true 
                            ? 'bg-tax-green text-white' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Check size={16} />
                      </button>
                      
                      <button
                        onClick={() => startEditing(field.id, field.value)}
                        className={`p-2 rounded-full transition-all ${
                          field.isCorrect === false 
                            ? 'bg-tax-blue text-white' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleFieldStatus(field.id, false)}
                        className={`p-2 rounded-full transition-all ${
                          field.isCorrect === false && editingField !== field.id
                            ? 'bg-tax-red text-white' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="pt-4 flex items-center">
              <div className="relative flex-1 rounded-full bg-gray-200 h-2">
                <div 
                  className="absolute top-0 left-0 rounded-full bg-tax-green h-2 transition-all duration-500"
                  style={{ 
                    width: `${(state.extractedFields.filter(f => f.isCorrect !== null).length / state.extractedFields.length) * 100}%` 
                  }}
                />
              </div>
              <span className="ml-4 text-sm text-gray-600">
                {state.extractedFields.filter(f => f.isCorrect !== null).length} of {state.extractedFields.length} reviewed
              </span>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default AIReview;
