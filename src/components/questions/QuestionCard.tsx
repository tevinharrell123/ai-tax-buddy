
import React, { useState } from 'react';
import { Check, AlertCircle, Upload, Loader2, X, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from '@/components/ui/FollowUpQuestions';
import { Question } from '@/context/TaxOrganizerContext';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';

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
  isLoading?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  categoryName,
  onAnswer,
  isExpanded,
  followUpQuestions,
  parentAnswers,
  currentAnswer,
  onUploadMissingDocument,
  isLoading = false
}) => {
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showDependentDialog, setShowDependentDialog] = useState(false);
  const [dependentName, setDependentName] = useState('');
  const [dependentBirthdate, setDependentBirthdate] = useState('');

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

  const handleDependentSubmit = () => {
    // Capture the dependent info and close the dialog
    if (dependentName && dependentBirthdate) {
      onAnswer(question.id, `Yes - ${dependentName} (${dependentBirthdate})`);
      setShowDependentDialog(false);
      // Reset form
      setDependentName('');
      setDependentBirthdate('');
    }
  };

  // Special handling for dependent-related questions
  const isDependentQuestion = question.text.toLowerCase().includes('dependent') && 
    question.text.toLowerCase().includes('age');

  // Document upload dialog
  const DocumentDialog = () => (
    <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Missing Tax Document</DialogTitle>
          <DialogDescription>
            {question.missingDocument ? (
              <>
                <p className="mb-2">You're missing: <strong>{question.missingDocument.name}</strong></p>
                <p>{question.missingDocument.description}</p>
                {question.missingDocument.formNumber && (
                  <p className="text-sm mt-2">Form number: {question.missingDocument.formNumber}</p>
                )}
                {question.missingDocument.requiredFor && (
                  <p className="text-sm mt-1">Required for: {question.missingDocument.requiredFor}</p>
                )}
              </>
            ) : (
              <p>Please upload the required document</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center p-6 bg-gray-50 rounded-lg my-4">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Click below to upload the document</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            setShowDocumentDialog(false);
            onUploadMissingDocument();
          }}>
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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

  if (isLoading) {
    return (
      <AnimatedCard className="min-h-[300px] flex flex-col">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-full mb-6" />
          
          <div className="space-y-3 mb-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-tax-blue animate-spin" />
          </div>
        </div>
      </AnimatedCard>
    );
  }

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
                  onClick={() => setShowDocumentDialog(true)}
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
            const isSelected = currentAnswer === option || 
              (currentAnswer && currentAnswer.startsWith(`${option} - `));
            const hasFollowUps = question.followUpQuestions?.[option]?.length > 0;
            
            const handleOptionClick = () => {
              // For dependent questions that ask for age or details, show dialog
              if (isDependentQuestion && option.toLowerCase().includes('under 17')) {
                setShowDependentDialog(true);
              } else {
                onAnswer(question.id, option);
              }
            };
            
            return (
              <div key={option} className="flex flex-col">
                <button
                  onClick={handleOptionClick}
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
      
      {/* Render dialogs */}
      {DocumentDialog()}
      {DependentDialog()}
    </AnimatedCard>
  );
};

export default QuestionCard;
