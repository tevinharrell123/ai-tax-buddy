
import React from 'react';
import { Check, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from '@/components/ui/FollowUpQuestions';
import { Question } from '@/context/TaxOrganizerContext';
import AnimatedCard from '@/components/ui/AnimatedCard';

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

interface QuestionCardProps {
  question: CustomQuestion;
  categoryName: string | undefined;
  onAnswer: (questionId: string, answer: string) => void;
  isExpanded: boolean;
  followUpQuestions: CustomQuestion[];
  parentAnswers: Map<string, string>;
  currentAnswer: string | null | undefined;
  onUploadMissingDocument: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  categoryName,
  onAnswer,
  isExpanded,
  followUpQuestions,
  parentAnswers,
  currentAnswer,
  onUploadMissingDocument
}) => {
  // Create a proper compatibility layer that ensures all required fields for Question[] are present
  const convertToQuestion = (q: CustomQuestion): Question => {
    // Handle followUpQuestions recursively
    let convertedFollowUpQuestions: { [answer: string]: Question[] } | undefined;
    
    if (q.followUpQuestions) {
      convertedFollowUpQuestions = {};
      Object.entries(q.followUpQuestions).forEach(([key, questions]) => {
        convertedFollowUpQuestions![key] = questions.map(followUpQ => convertToQuestion(followUpQ));
      });
    }

    return {
      ...q,
      answer: q.answer || null, // Ensure answer is not undefined
      followUpQuestions: convertedFollowUpQuestions
    };
  };

  const convertedFollowUps: Question[] = followUpQuestions?.map(convertToQuestion) || [];

  return (
    <AnimatedCard key={question.id} className="min-h-[300px] flex flex-col">
      <div className="flex-1">
        <div className="text-sm text-tax-blue font-medium mb-2">
          {categoryName || 'General'}
        </div>
        
        <h2 className="text-xl font-bold mb-6">{question.text}</h2>
        
        {question.missingDocument && (
          <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">
                  Missing Document: {question.missingDocument.name}
                  {question.missingDocument.formNumber && ` (Form ${question.missingDocument.formNumber})`}
                </h3>
                <p className="text-sm text-amber-700">{question.missingDocument.description}</p>
                {question.missingDocument.requiredFor && (
                  <p className="text-xs text-amber-600 mt-1">Required for: {question.missingDocument.requiredFor}</p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-amber-800 border-amber-300 hover:bg-amber-100"
                  onClick={onUploadMissingDocument}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3 mb-6">
          {question.options?.map(option => {
            const isSelected = currentAnswer === option;
            const hasFollowUps = question.followUpQuestions?.[option]?.length > 0;
            
            return (
              <div key={option} className="flex flex-col">
                <button
                  onClick={() => onAnswer(question.id, option)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-tax-blue bg-tax-lightBlue' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    <div className="flex items-center">
                      {hasFollowUps && isSelected && (
                        <span className="text-xs bg-tax-blue text-white px-2 py-0.5 rounded-full mr-2">
                          Follow-up
                        </span>
                      )}
                      {isSelected && (
                        <div className="bg-tax-blue text-white rounded-full p-1">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                
                {/* Show follow-up questions if this option is selected */}
                {isSelected && 
                 hasFollowUps && 
                 isExpanded && 
                 convertedFollowUps.length > 0 && (
                  <FollowUpQuestions 
                    questions={convertedFollowUps} 
                    onAnswer={onAnswer}
                    parentAnswers={parentAnswers}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default QuestionCard;
