
import React from 'react';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';
import ProgressBar from '../ui/ProgressBar';
import { Check, FileText } from 'lucide-react';
import { useLayoutNavigation } from '../../hooks/useLayoutNavigation';

type HeaderProps = {
  showProgress?: boolean;
};

const Header: React.FC<HeaderProps> = ({ showProgress = true }) => {
  return (
    <header className="border-b bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="container py-4 px-6 mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-tax-blue text-white p-2 rounded-lg shadow-md transform hover:rotate-3 transition-transform">
            <FileText size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-tax-blue to-tax-skyBlue bg-clip-text text-transparent">2024 Tax Return</h1>
        </div>
        {showProgress && <StepIndicators />}
      </div>
      {showProgress && <ProgressBar />}
    </header>
  );
};

// Step Indicators Component
const StepIndicators: React.FC = () => {
  const { state } = useTaxOrganizer();
  const { navigateToStep } = useLayoutNavigation();

  // Define step labels for better accessibility
  const stepLabels = [
    "Upload Documents", 
    "Import Options", 
    "Categories", 
    "Review", 
    "Questions", 
    "Summary"
  ];

  const handleStepClick = (step: number) => {
    // Only allow navigation to completed steps or the current step
    if (state.completedSteps.includes(step) || step === state.step) {
      navigateToStep(step);
    }
  };

  return (
    <div className="hidden md:flex items-center gap-3">
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <button
          key={step}
          onClick={() => handleStepClick(step)}
          aria-label={`Go to ${stepLabels[step - 1]}`}
          title={stepLabels[step - 1]}
          disabled={!state.completedSteps.includes(step) && step !== state.step}
          className={`progress-step flex items-center justify-center w-9 h-9 rounded-full transition-all ${
            step < state.step 
              ? 'bg-tax-blue text-white shadow-md cursor-pointer'
              : step === state.step 
                ? 'border-2 border-tax-blue text-tax-blue animate-pulse-light'
                : state.completedSteps.includes(step)
                  ? 'bg-tax-blue text-white shadow-md cursor-pointer'
                  : 'bg-gray-100 text-gray-400'
          } ${state.completedSteps.includes(step) || step === state.step ? 'hover:scale-110' : ''}`}
        >
          {step < state.step ? <Check size={16} /> : step}
        </button>
      ))}
    </div>
  );
};

export default Header;
