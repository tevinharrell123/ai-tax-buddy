
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
import FollowUpQuestions from '@/components/ui/FollowUpQuestions';
import QuestionCard from '@/components/questions/QuestionCard';
import { Question as TaxQuestion } from '@/context/TaxOrganizerContext';

interface MissingDocument {
  name: string;
  description: string;
  formNumber?: string;
  requiredFor?: string;
}

interface CustomQuestion {
  id: string;
  text: string;
  categoryId: string;
  options: string[];
  answer?: string | null;
  missingDocument?: MissingDocument | null;
  followUpQuestions?: {
    [answer: string]: CustomQuestion[];
  };
}

// Using TaxQuestion alias for clarity to distinguish from the internal Question interface
interface Question {
  id: string;
  text: string;
  categoryId: string;
  options: string[];
  missingDocument?: MissingDocument | null;
  followUpQuestions?: {
    [answer: string]: CustomQuestion[];
  };
  answer: string | null;
}

const Questions: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const [parentAnswers] = useState(new Map<string, string>());
  const [displayedFollowUps, setDisplayedFollowUps] = useState<{[questionId: string]: CustomQuestion[]}>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);
  const [isFetchFailed, setIsFetchFailed] = useState(false);

  const fetchPersonalizedQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsFetchFailed(false);

    try {
      // Get all selected categories with their subcategories
      const selectedCategories = state.categories.filter(cat => cat.selected).map(category => {
        // Include quantity information for subcategories
        return {
          ...category,
          subcategories: category.subcategories?.filter(sub => sub.selected)
        };
      });
      
      // Format documents with more detail
      const documents = state.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        category: doc.category,
        status: doc.status
      }));

      // Include extracted fields for context
      const extractedFields = state.extractedFields.map(field => ({
        id: field.id,
        name: field.name,
        value: field.value,
        category: field.category
      }));

      // Create a mapping of category selections
      const categoryAnswers = selectedCategories.map(cat => {
        const subcategoriesInfo = cat.subcategories?.map(sub => ({
          id: sub.id,
          name: sub.name,
          quantity: sub.quantity || 1
        })) || [];
        
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          selected: true,
          subcategories: subcategoriesInfo
        };
      });

      // Include previous question answers
      const previousAnswers = state.questions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        answer: q.answer,
        categoryId: q.categoryId
      })).filter(q => q.answer !== null && q.answer !== '');

      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000);
      });

      const fetchPromise = supabase.functions.invoke('generate-tax-questions', {
        body: { 
          selectedCategories, 
          documents, 
          extractedFields,
          categoryAnswers,
          previousAnswers
        }
      });

      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => {
          throw new Error('Request timeout after 15 seconds');
        })
      ]) as any;

      if (error) {
        console.error('Error calling generate-tax-questions:', error);
        throw new Error(`Error calling generate-tax-questions: ${error.message}`);
      }

      if (data?.questions && Array.isArray(data.questions)) {
        console.log("Received custom questions:", data.questions);
        
        const processedQuestions = data.questions.map(q => ({
          ...q,
          id: q.id || uuidv4()
        }));
        
        setCustomQuestions(processedQuestions);
        
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
      setError(`Failed to generate personalized questions. Please try again.`);
      setIsFetchFailed(true);
      
      // Use default questions as fallback
      const defaultQuestions = taxQuestions.map(q => ({
        id: q.id,
        text: q.text,
        categoryId: q.categoryId,
        options: q.options || ["Yes", "No"]
      }));
      
      setCustomQuestions(defaultQuestions);
      
      defaultQuestions.forEach(question => {
        dispatch({ 
          type: 'ANSWER_QUESTION', 
          payload: { id: question.id, answer: '' } 
        });
      });
    } finally {
      setIsLoading(false);
    }
  }, [state.categories, state.documents, state.extractedFields, state.questions, dispatch, retryCount]);

  useEffect(() => {
    fetchPersonalizedQuestions();
  }, [fetchPersonalizedQuestions]);

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
    
    parentAnswers.set(questionId, answer);
    
    createConfetti();
    
    // Handle follow-up questions
    const currentQuestion = customQuestions.find(q => q.id === questionId);
    if (currentQuestion?.followUpQuestions?.[answer]) {
      const followUps = currentQuestion.followUpQuestions[answer];
      setDisplayedFollowUps(prev => ({
        ...prev,
        [questionId]: followUps
      }));
      
      setExpandedQuestions(prev => {
        const next = new Set(prev);
        next.add(questionId);
        return next;
      });
      
      followUps.forEach(followUpQ => {
        dispatch({ 
          type: 'ANSWER_QUESTION', 
          payload: { id: followUpQ.id, answer: '' } 
        });
      });
    }
    
    // Auto-advance to next question after a delay if no follow-ups
    const hasFollowUps = currentQuestion?.followUpQuestions?.[answer];
    if (!hasFollowUps) {
      setTimeout(() => {
        if (activeQuestion < customQuestions.length - 1) {
          setActiveQuestion(activeQuestion + 1);
        }
      }, 800);
    }
    
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
    setRetryCount(prev => prev + 1);
    setActiveQuestion(0);
    setDisplayedFollowUps({});
    setExpandedQuestions(new Set());
    toast({
      title: "Refreshing questions",
      description: "Generating new questions based on your selections.",
    });
  };

  const handleUploadMissingDocument = () => {
    dispatch({
      type: 'SET_STEP',
      payload: 1
    });
    
    toast({
      title: "Document upload needed",
      description: "You'll be redirected to upload the required document.",
    });
  };

  const currentQuestion = customQuestions[activeQuestion];
  
  // Calculate answered count including follow-up questions
  const allQuestionIds = new Set<string>();
  
  // Add main questions
  customQuestions.forEach(q => allQuestionIds.add(q.id));
  
  // Add follow-up questions that are displayed
  Object.values(displayedFollowUps).forEach(questions => {
    questions.forEach(q => allQuestionIds.add(q.id));
  });
  
  const answeredCount = Array.from(allQuestionIds).filter(
    qId => {
      const answer = state.questions.find(sq => sq.id === qId)?.answer;
      return answer && answer !== '';
    }
  ).length;
  
  const progress = allQuestionIds.size > 0 ? (answeredCount / allQuestionIds.size) * 100 : 0;

  const getQuestionFollowUps = (questionId: string): CustomQuestion[] => {
    return displayedFollowUps[questionId] || [];
  };

  const isQuestionExpanded = (questionId: string): boolean => {
    return expandedQuestions.has(questionId);
  };

  const convertToQuestions = (customQuestions: CustomQuestion[]): TaxQuestion[] => {
    const convertQuestion = (q: CustomQuestion): TaxQuestion => {
      let processedFollowUps: { [answer: string]: TaxQuestion[] } | undefined;
      
      if (q.followUpQuestions) {
        processedFollowUps = {};
        Object.entries(q.followUpQuestions).forEach(([key, questions]) => {
          processedFollowUps![key] = questions.map(nestedQ => convertQuestion(nestedQ));
        });
      }
      
      return {
        ...q,
        answer: q.answer || null,
        followUpQuestions: processedFollowUps
      };
    };
    
    return customQuestions.map(convertQuestion);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto relative">
        <div id="confetti-container" className="absolute inset-0 overflow-hidden pointer-events-none"></div>
        
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Personalized Tax Questions</h1>
          <p className="text-gray-600">
            Based on your tax situation, we have some specific questions to help maximize your refund.
          </p>
        </AnimatedCard>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              {customQuestions.length > 0 && `Question ${activeQuestion + 1} of ${customQuestions.length}`}
            </div>
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
              <p className="mt-4 text-gray-600">Generating personalized tax questions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow">
              <AlertCircle className="h-10 w-10 text-amber-500" />
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
            <QuestionCard
              question={currentQuestion}
              categoryName={state.categories.find(c => c.id === currentQuestion.categoryId)?.name}
              onAnswer={handleAnswer}
              isExpanded={isQuestionExpanded(currentQuestion.id)}
              followUpQuestions={getQuestionFollowUps(currentQuestion.id)}
              parentAnswers={parentAnswers}
              currentAnswer={state.questions.find(q => q.id === currentQuestion.id)?.answer}
              onUploadMissingDocument={handleUploadMissingDocument}
            />
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
          
          {customQuestions.length > 0 && (
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => navigateQuestion('prev')}
                disabled={activeQuestion === 0}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigateQuestion('next')}
                disabled={activeQuestion === customQuestions.length - 1}
                className="flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
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
              <h3 className="font-medium">How These Questions Help You</h3>
              <p className="text-sm text-gray-600">
                These questions are personalized based on your tax situation and help identify potential deductions, credits, and missing documents that could maximize your refund.
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default Questions;
