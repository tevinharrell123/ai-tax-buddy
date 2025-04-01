
import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

type FooterProps = {
  step: number;
  showBackButton?: boolean;
  showNextButton?: boolean;
  nextButtonText?: string;
  disableNext?: boolean;
  onBack?: () => void;
  onNext?: () => void;
};

const Footer: React.FC<FooterProps> = ({
  step,
  showBackButton = true,
  showNextButton = true,
  nextButtonText = 'Continue',
  disableNext = false,
  onBack,
  onNext
}) => {
  return (
    <footer className="border-t bg-white shadow-sm mt-auto">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          {showBackButton && step > 1 && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-tax-blue transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
        </div>
        <div>
          {showNextButton && (
            <button
              onClick={onNext}
              disabled={disableNext}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg bg-tax-blue text-white ${
                disableNext 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-600 transform hover:-translate-y-1 transition-all'
              }`}
            >
              {step === 1 ? (
                <>
                  <span>Scan with AI</span>
                  <Sparkles size={16} className="ml-1" />
                </>
              ) : (
                <>
                  {nextButtonText}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
