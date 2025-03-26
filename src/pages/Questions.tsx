
import React, { useEffect, useState } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { taxQuestions } from '../data/taxCategories';

const Questions: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [filteredQuestions, setFilteredQuestions] = useState<typeof taxQuestions>([]);
  const [showConfetti, setShowConfetti] = useState(false);

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

  useEffect(() => {
    // Filter questions based on selected categories
    const selectedCategoryIds = state.categories
      .filter(c => c.selected)
      .map(c => c.id);
      
    const relevantQuestions = taxQuestions.filter(q => 
      !q.condition || selectedCategoryIds.includes(q.condition.categoryId)
    );
    
    setFilteredQuestions(relevantQuestions);
    
    // Initialize questions in state if not already done
    if (state.questions.length === 0) {
      taxQuestions.forEach(question => {
        dispatch({ 
          type: 'ANSWER_QUESTION', 
          payload: { id: question.id, answer: '' } 
        });
      });
    }
  }, [state.categories]);

  const handleAnswer = (questionId: string, answer: string) => {
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { id: questionId, answer }
    });
    
    // Add confetti effect
    createConfetti();
    
    // Move to next question after a brief delay
    setTimeout(() => {
      if (activeQuestion < filteredQuestions.length - 1) {
        setActiveQuestion(activeQuestion + 1);
      }
    }, 800);
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (direction === 'next' && activeQuestion < filteredQuestions.length - 1) {
      setActiveQuestion(activeQuestion + 1);
    } else if (direction === 'prev' && activeQuestion > 0) {
      setActiveQuestion(activeQuestion - 1);
    }
  };

  const currentQuestion = filteredQuestions[activeQuestion];
  const answeredCount = filteredQuestions.filter(
    q => state.questions.find(sq => sq.id === q.id)?.answer
  ).length;
  const progress = (answeredCount / filteredQuestions.length) * 100;

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
          <div className="w-full bg-gray-100 h-2 rounded-full mb-6">
            <div 
              className="bg-tax-green h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600">Question {activeQuestion + 1} of {filteredQuestions.length}</span>
            <span className="text-tax-green font-medium">{answeredCount} answered</span>
          </div>
          
          {currentQuestion && (
            <AnimatedCard key={currentQuestion.id} className="min-h-[300px] flex flex-col">
              <div className="flex-1">
                <div className="text-sm text-tax-blue font-medium mb-2">
                  {state.categories.find(c => c.id === currentQuestion.categoryId)?.name || 'General'}
                </div>
                
                <h2 className="text-xl font-bold mb-6">{currentQuestion.text}</h2>
                
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
                  {filteredQuestions.map((_, idx) => (
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
                  disabled={activeQuestion === filteredQuestions.length - 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                    activeQuestion === filteredQuestions.length - 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </AnimatedCard>
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
