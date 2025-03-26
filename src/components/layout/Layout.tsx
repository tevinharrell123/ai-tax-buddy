
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';
import { Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  showProgress?: boolean;
  showBackButton?: boolean;
  showNextButton?: boolean;
  nextButtonText?: string;
  onNext?: () => void;
  onBack?: () => void;
  disableNext?: boolean;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  showProgress = true,
  showBackButton = true,
  showNextButton = true,
  nextButtonText = 'Continue',
  onNext,
  onBack,
  disableNext = false,
}) => {
  const { state, dispatch } = useTaxOrganizer();
  const navigate = useNavigate();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      dispatch({ type: 'MARK_STEP_COMPLETED', payload: state.step });
      dispatch({ type: 'SET_STEP', payload: state.step + 1 });
      
      // Navigate based on step
      switch (state.step) {
        case 1:
          navigate('/review');
          break;
        case 2:
          navigate('/highlight');
          break;
        case 3:
          navigate('/categories');
          break;
        case 4:
          navigate('/questions');
          break;
        case 5:
          navigate('/summary');
          break;
        default:
          break;
      }
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      dispatch({ type: 'SET_STEP', payload: Math.max(1, state.step - 1) });
      
      // Navigate back based on step
      switch (state.step) {
        case 2:
          navigate('/');
          break;
        case 3:
          navigate('/review');
          break;
        case 4:
          navigate('/highlight');
          break;
        case 5:
          navigate('/categories');
          break;
        case 6:
          navigate('/questions');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white shadow-sm">
        <div className="container py-4 px-6 mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-tax-blue text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">AI Tax Organizer</h1>
          </div>
          {showProgress && (
            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div 
                  key={step} 
                  className={`progress-step flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                    step < state.step 
                      ? 'bg-tax-blue text-white'
                      : step === state.step 
                        ? 'border-2 border-tax-blue text-tax-blue'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step < state.step ? <Check size={16} /> : step}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="border-t bg-white shadow-sm mt-auto">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            {showBackButton && state.step > 1 && (
              <button
                onClick={handleBack}
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
                onClick={handleNext}
                disabled={disableNext}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg bg-tax-blue text-white ${
                  disableNext 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-600 transform hover:-translate-y-1 transition-all'
                }`}
              >
                {state.step === 1 ? (
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
    </div>
  );
};

export default Layout;
