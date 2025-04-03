
import React, { useState } from 'react';
import { Question } from '@/context/TaxOrganizerContext';
import { Check, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [showDependentDialog, setShowDependentDialog] = useState(false);
  const [activeDependentQuestion, setActiveDependentQuestion] = useState<string | null>(null);
  const [dependentName, setDependentName] = useState('');
  const [dependentBirthdate, setDependentBirthdate] = useState('');
  
  if (!questions.length) return null;
  
  const handleDependentSubmit = () => {
    if (dependentName && dependentBirthdate && activeDependentQuestion) {
      onAnswer(activeDependentQuestion, `Yes - ${dependentName} (${dependentBirthdate})`);
      setShowDependentDialog(false);
      // Reset form
      setDependentName('');
      setDependentBirthdate('');
      setActiveDependentQuestion(null);
    }
  };
  
  const handleOptionClick = (questionId: string, option: string) => {
    // Check if this is a dependent question that needs the dialog
    const question = questions.find(q => q.id === questionId);
    if (
      question && 
      (question.text.toLowerCase().includes('dependent') || question.text.toLowerCase().includes('child')) && 
      option.toLowerCase().includes('yes') &&
      !question.text.toLowerCase().includes('how many')
    ) {
      setActiveDependentQuestion(questionId);
      setShowDependentDialog(true);
    } else {
      onAnswer(questionId, option);
    }
  };
  
  // Dependent info dialog
  const DependentDialog = () => (
    <Dialog open={showDependentDialog} onOpenChange={setShowDependentDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dependent Information</DialogTitle>
          <DialogDescription>
            Please provide details about your dependent for tax credit eligibility.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <User className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <label htmlFor="dependent-name" className="text-sm font-medium">
                Dependent's Full Name
              </label>
              <Input 
                id="dependent-name"
                value={dependentName}
                onChange={(e) => setDependentName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <label htmlFor="dependent-birthdate" className="text-sm font-medium">
                Date of Birth
              </label>
              <Input 
                id="dependent-birthdate"
                type="date"
                value={dependentBirthdate}
                onChange={(e) => setDependentBirthdate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDependentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleDependentSubmit}>Save Information</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <div className="space-y-4 mt-3 pl-4 border-l-2 border-tax-lightBlue">
      {questions.map(question => (
        <div key={question.id} className="animate-fade-in">
          <h3 className="text-lg font-medium mb-2">{question.text}</h3>
          
          <div className="space-y-2">
            {question.options?.map(option => {
              const isSelected = parentAnswers.get(question.id) === option || 
                (parentAnswers.get(question.id)?.startsWith(`${option} - `));
              
              return (
                <button
                  key={option}
                  onClick={() => handleOptionClick(question.id, option)}
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
      
      {/* Render dialog */}
      {DependentDialog()}
    </div>
  );
};

export default FollowUpQuestions;
