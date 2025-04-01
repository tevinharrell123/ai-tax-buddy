
import React, { useEffect, useState, useCallback } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, ChevronRight, ChevronLeft, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { taxQuestions } from '../data/taxCategories';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";

interface MissingDocument {
  name: string;
  description: string;
}

interface CustomQuestion {
  id: string;
  text: string;
  categoryId: string;
  options: string[];
  missingDocument?: MissingDocument | null;
}

const Questions: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);

  // Create a function to fetch personalized questions
  const fetchPersonalizedQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Only send selected categories to the Claude API
      const selectedCategories = state.categories.filter(cat => cat.selected);
      
      // Map documents to a simplified format
      const documents = state.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        category: doc.category
      }));

      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-tax-questions', {
        body: { selectedCategories, documents }
      });

      if (error) {
        throw new Error(`Error calling generate-tax-questions: ${error.message}`);
      }

      if (data?.questions && Array.isArray(data.questions)) {
        console.log("Received custom questions:", data.questions);
        
        // Ensure each question has a valid ID and process them
        const processedQuestions = data.questions.map(q => ({
          ...q,
          id: q.id || uuidv4()
        }));
        
        setCustomQuestions(processedQuestions);
        
        // Initialize questions in state
        processedQuestions.forEach(question => {
          dispatch({ 
            type: 'ANSWER_QUESTION', 
            payload: { id: question.id, answer: '' } 
          });
        });

        if (processedQuestions.length === 0) {
          setError("No relevant questions were generated. Please try selecting more categories or uploading more documents.");
        }
      } else {
        throw new Error("Invalid response format from generate-tax-questions function");
      }
    } catch (err) {
      console.error("Failed to fetch personalized questions:", err);
      setError(`Failed to generate personalized questions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Fallback to default questions if there's an error
      const defaultQuestions = taxQuestions.map(q => ({
        id: q.id,
        text: q.text,
        categoryId: q.categoryId,
        options: q.options || ["Yes", "No"]
      }));
      
      setCustomQuestions(defaultQuestions);
      
      // Initialize questions in state with defaults
      defaultQuestions.forEach(question => {
        dispatch({ 
          type: 'ANSWER_QUESTION', 
          payload: { id: question.id, answer: '' } 
        });
      });
    } finally {
      setIsLoading(false);
    }
  }, [state.categories, state.documents, dispatch]);

  useEffect(() => {
    // Fetch personalized questions when the component mounts
    fetchPersonalizedQuestions();
  }, [fetchPersonalizedQuestions]);

  // Apply confetti effect when answering a question
  const createConfetti = () => {
    setShowConfetti(true);
    
    const container = document.getElementById('confetti-container');
    if (!container) return;
    
    const colors = ['#1A85FF', '#44C4A1', '#FFCE73', '#FF6370', '#6C5DD3'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      
      container.appendChild(confetti);
      
      // Remove confetti after animation completes
      setTimeout(() => {
        if (confetti.parentNode === container) {
          container.removeChild(confetti);
        }
      }, 2000);
    }
    
    setTimeout(() => {
      setShowConfetti(false);
    }, 2000);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { id: questionId, answer }
    });
    
    // Add confetti effect
    createConfetti();
    
    // Move to next question after a brief delay
    setTimeout(() => {
      if (activeQuestion < customQuestions.length - 1) {
        setActiveQuestion(activeQuestion + 1);
      }
    }, 800);
    
    toast({
      title: "Answer recorded",
      description: "Your response has been saved.",
      variant: "success",
    });
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (direction === 'next' && activeQuestion < customQuestions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
    } else if (direction === 'prev' && activeQuestion > 0) {
      setActiveQuestion(activeQuestion - 1);
    }
  };

  const handleRefreshQuestions = () => {
    fetchPersonalizedQuestions();
    setActiveQuestion(0);
    toast({
      title: "Refreshing questions",
      description: "Generating new questions based on your selections.",
    });
  };

  const handleUploadMissingDocument = () => {
    // Navigate to document upload page
    dispatch({
      type: 'SET_STEP',
      payload: 1 // Assuming 1 is the upload document step
    });
    
    toast({
      title: "Document upload needed",
      description: "You'll be redirected to upload the required document.",
    });
  };

  const currentQuestion = customQuestions[activeQuestion];
  const answeredCount = customQuestions.filter(
    q => state.questions.find(sq => sq.id === q.id)?.answer
  ).length;
  const progress = customQuestions.length > 0 ? (answeredCount / customQuestions.length) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto relative">
        <div id="confetti-container" className="absolute inset-0 overflow-hidden pointer-events-none"></div>
        
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">A Few More Questions</h1>
          <p className="text-gray-600">
            Based on your selections, we have a few more questions to better organize your tax information.
          </p>
        </AnimatedCard>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Question {activeQuestion + 1} of {customQuestions.length}</div>
            <div className="flex items-center">
              <span className="text-tax-green font-medium mr-2">{answeredCount} answered</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshQuestions}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="h-2 mb-6" />
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow">
              <Loader2 className="h-10 w-10 text-tax-blue animate-spin" />
              <p className="mt-4 text-gray-600">Generating personalized questions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="mt-4 text-gray-600">{error}</p>
              <Button 
                variant="default"
                onClick={handleRefreshQuestions}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : currentQuestion ? (
            <AnimatedCard key={currentQuestion.id} className="min-h-[300px] flex flex-col">
              <div className="flex-1">
                <div className="text-sm text-tax-blue font-medium mb-2">
                  {state.categories.find(c => c.id === currentQuestion.categoryId)?.name || 'General'}
                </div>
                
                <h2 className="text-xl font-bold mb-6">{currentQuestion.text}</h2>
                
                {currentQuestion.missingDocument && (
                  <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-800">Missing Document: {currentQuestion.missingDocument.name}</h3>
                        <p className="text-sm text-amber-700">{currentQuestion.missingDocument.description}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-amber-800 border-amber-300 hover:bg-amber-100"
                          onClick={handleUploadMissingDocument}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Document
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3 mb-6">
                  {currentQuestion.options?.map(option => {
                    const isSelected = state.questions.find(
                      q => q.id === currentQuestion.id
                    )?.answer === option;
                    
                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(currentQuestion.id, option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? 'border-tax-blue bg-tax-lightBlue' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          {isSelected && (
                            <div className="bg-tax-blue text-white rounded-full p-1">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  onClick={() => navigateQuestion('prev')}
                  disabled={activeQuestion === 0}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    activeQuestion === 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {customQuestions.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full ${
                        idx === activeQuestion 
                          ? 'bg-tax-blue' 
                          : idx < activeQuestion 
                            ? 'bg-tax-green' 
                            : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => navigateQuestion('next')}
                  disabled={activeQuestion === customQuestions.length - 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    activeQuestion === customQuestions.length - 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </AnimatedCard>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <p className="mt-4 text-gray-600">No questions available. Try selecting more categories or refreshing.</p>
              <Button 
                variant="default"
                onClick={handleRefreshQuestions}
                className="mt-4"
              >
                Generate Questions
              </Button>
            </div>
          )}
        </div>
        
        <AnimatedCard delay={300} className="mt-6 bg-gray-50">
          <div className="flex items-center">
            <div className="bg-tax-lightBlue text-tax-blue p-2 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h3 className="font-medium">Why we ask these questions</h3>
              <p className="text-sm text-gray-600">
                Your answers help us organize your tax documents more efficiently and identify potential deductions or credits you might qualify for.
              </p>
            </div>
          </div>
        </AnimatedCard>
        
        {/* Add styles for confetti animation */}
        <style jsx>{`
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0.8;
            border-radius: 50%;
            animation: fall 2s ease-in-out forwards;
          }
          
          @keyframes fall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(600px) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default Questions;
