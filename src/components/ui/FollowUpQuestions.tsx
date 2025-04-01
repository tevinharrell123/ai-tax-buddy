
import React from 'react';
import { Question } from '@/context/TaxOrganizerContext';
import { Check } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: Question[];
  onAnswer: (questionId: string, answer: string) => void;
  parentAnswers: Map<string, string>;
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  questions,
  onAnswer,
  parentAnswers
}) => {
  if (!questions.length) return null;
  
  return (
    <div className="space-y-4 mt-3 pl-4 border-l-2 border-tax-lightBlue">
      {questions.map(question => (
        <div key={question.id} className="animate-fade-in">
          <h3 className="text-lg font-medium mb-2">{question.text}</h3>
          
          <div className="space-y-2">
            {question.options?.map(option => {
              const isSelected = parentAnswers.get(question.id) === option;
              
              return (
                <button
                  key={option}
                  onClick={() => onAnswer(question.id, option)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-tax-blue bg-tax-lightBlue' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isSelected && (
                      <div className="bg-tax-blue text-white rounded-full p-1">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FollowUpQuestions;
