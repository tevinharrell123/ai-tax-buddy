
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, ChevronRight, ChevronLeft, AlertCircle, Upload, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import QuestionCard from '@/components/questions/QuestionCard';
import { Question as TaxQuestion } from '@/context/TaxOrganizerContext';
import { generateLocalQuestions, GeneratedQuestion } from '@/utils/questionGenerator';

interface CustomQuestion {
  id: string;
  text: string;
  categoryId: string;
  options: string[];
  answer?: string | null;
  missingDocument?: {
    name: string;
    description: string;
    formNumber?: string;
    requiredFor?: string;
  } | null;
  followUpQuestions?: {
    [answer: string]: CustomQuestion[];
  };
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
  
  // Generate local questions
  const localQuestions = useMemo(() => {
    console.log("Generating local questions");
    return generateLocalQuestions(
      state.categories,
      state.documents,
      state.extractedFields
    );
  }, [state.categories, state.documents, state.extractedFields]);

  // Always use local questions - avoid API call completely
  useEffect(() => {
    const loadLocalQuestions = () => {
      try {
        console.log("Using local questions:", localQuestions);
        
        if (!localQuestions || localQuestions.length === 0) {
          // If no local questions available, create some default ones
          const defaultQuestions = [
            {
              id: uuidv4(),
              text: "What is your filing status for this tax year?",
              categoryId: "general",
              options: ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Qualifying widow(er)"]
            },
            {
              id: uuidv4(),
              text: "Did you have any dependents in the tax year?",
              categoryId: "general",
              options: ["No", "Yes, one dependent", "Yes, multiple dependents"]
            }
          ];
          
          setCustomQuestions(defaultQuestions);
          
          // Register default questions in state
          defaultQuestions.forEach(question => {
            dispatch({ 
              type: 'ANSWER_QUESTION', 
              payload: { id: question.id, answer: '' } 
            });
          });
        } else {
          setCustomQuestions(localQuestions);
          
          // Register all local questions in state
          localQuestions.forEach(question => {
            dispatch({ 
              type: 'ANSWER_QUESTION', 
              payload: { id: question.id, answer: '' } 
            });
          });
        }
      } catch (err) {
        console.error("Error loading questions:", err);
        setError("Error loading questions. Please try refreshing the page.");
        
        // Ensure we still have some questions to show
        const fallbackQuestions = [
          {
            id: uuidv4(),
            text: "What is your filing status for this tax year?",
            categoryId: "general",
            options: ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Qualifying widow(er)"]
          }
        ];
        
        setCustomQuestions(fallbackQuestions);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Short timeout to give the impression that we're loading questions
    const timer = setTimeout(() => {
      loadLocalQuestions();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [localQuestions, dispatch]);

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
    setActiveQuestion(0);
    setDisplayedFollowUps({});
    setExpandedQuestions(new Set());
    setIsLoading(true);
    
    toast({
      title: "Refreshing questions",
      description: "Generating new questions based on your selections.",
    });
    
    setTimeout(() => {
      setCustomQuestions(localQuestions);
      // Register all local questions in state
      localQuestions.forEach(question => {
        dispatch({ 
          type: 'ANSWER_QUESTION', 
          payload: { id: question.id, answer: '' } 
        });
      });
      setIsLoading(false);
    }, 1000);
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
  
  // Safety check to ensure we don't try to access an invalid question
  if (currentQuestion === undefined && customQuestions.length > 0 && activeQuestion >= customQuestions.length) {
    setActiveQuestion(0);
  }
  
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
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="h-2 mb-6" />
          
          {isLoading ? (
            <QuestionCard
              question={{
                id: "loading",
                text: "Loading personalized tax questions...",
                categoryId: "loading",
                options: ["Loading..."]
              }}
              categoryName="Loading"
              onAnswer={() => {}}
              isExpanded={false}
              followUpQuestions={[]}
              parentAnswers={new Map()}
              currentAnswer={null}
              onUploadMissingDocument={() => {}}
              isLoading={true}
            />
          ) : customQuestions.length > 0 && currentQuestion ? (
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
