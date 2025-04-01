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

interface MissingDocument {
  name: string;
  description: string;
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

  const fetchPersonalizedQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selectedCategories = state.categories.filter(cat => cat.selected);
      
      const documents = state.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        category: doc.category
      }));

      const { data, error } = await supabase.functions.invoke('generate-tax-questions', {
        body: { selectedCategories, documents }
      });

      if (error) {
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
      setError(`Failed to generate personalized questions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
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
  }, [state.categories, state.documents, dispatch]);

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
    fetchPersonalizedQuestions();
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

  const convertToQuestions = (customQuestions: CustomQuestion[]): Question[] => {
    return customQuestions.map(q => ({
      ...q,
      answer: q.answer || null,
    }));
  };

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
      </div>
    </Layout>
  );
};

export default Questions;
