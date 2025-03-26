
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface AIProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIProcessingModal: React.FC<AIProcessingModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [progress, setProgress] = React.useState(0);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      // Reset progress when modal opens
      setProgress(0);
      
      // Simulate AI processing with increasing progress
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          
          // Show different messages at different stages
          if (prev === 20) {
            toast({
              title: "Reading documents...",
              description: "AI is analyzing your tax forms",
            });
          } else if (prev === 50) {
            toast({
              title: "Finding tax information...",
              description: "Extracting relevant fields from your documents",
            });
          } else if (prev === 80) {
            toast({
              title: "Almost there!",
              description: "Finalizing your tax information",
            });
          }
          
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [open, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="text-center p-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="animate-pulse w-20 h-20 rounded-full bg-tax-lightBlue flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-tax-blue">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                </svg>
              </div>
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-tax-blue border-opacity-20"></div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2">AI Magic in Progress</h2>
          <p className="text-gray-600 mb-6">
            Our AI assistant is scanning your documents and extracting tax information. This will only take a moment...
          </p>

          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-tax-blue">{progress}% Complete</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIProcessingModal;
