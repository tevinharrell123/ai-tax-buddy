
import React from 'react';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';
import ProgressBar from '../ui/ProgressBar';
import { Check } from 'lucide-react';
import { useLayoutNavigation } from '../../hooks/useLayoutNavigation';

type HeaderProps = {
  showProgress?: boolean;
};

const Header: React.FC<HeaderProps> = ({ showProgress = true }) => {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container py-4 px-6 mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-tax-blue text-white p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">AI Tax Organizer</h1>
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

  return (
    <div className="hidden md:flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((step) => (
        <div 
          key={step} 
          onClick={() => navigateToStep(step)}
          className={`progress-step flex items-center justify-center w-8 h-8 rounded-full transition-all ${
            step < state.step 
              ? 'bg-tax-blue text-white cursor-pointer'
              : step === state.step 
                ? 'border-2 border-tax-blue text-tax-blue'
                : state.completedSteps.includes(step)
                  ? 'bg-tax-blue text-white cursor-pointer'
                  : 'bg-gray-100 text-gray-400'
          } ${state.completedSteps.includes(step) || step === state.step ? 'hover:scale-110 cursor-pointer' : ''}`}
        >
          {step < state.step ? <Check size={16} /> : step}
        </div>
      ))}
    </div>
  );
};

export default Header;
