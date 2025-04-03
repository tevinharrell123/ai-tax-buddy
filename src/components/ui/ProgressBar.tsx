
import React from 'react';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';
import { Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLayoutNavigation } from '../../hooks/useLayoutNavigation';

const ProgressBar: React.FC = () => {
  const { state } = useTaxOrganizer();
  const location = useLocation();
  const { navigateToStep } = useLayoutNavigation();
  
  const steps = [
    { id: 1, name: 'Upload', path: '/' },
    { id: 2, name: 'Import', path: '/import-options' },
    { id: 3, name: 'Categories', path: '/categories' },
    { id: 4, name: 'Review', path: '/review' },
    { id: 5, name: 'Questions', path: '/questions' },
    { id: 6, name: 'Summary', path: '/summary' },
  ];

  // Helper function to determine if a step is active based on the current path
  const isStepActive = (path: string) => location.pathname === path;

  const handleStepClick = (step: number) => {
    // Only allow navigation to completed steps or the current step
    if (state.completedSteps.includes(step) || step === state.step) {
      navigateToStep(step);
    }
  };

  return (
    <div className="w-full py-4 px-6">
      <div className="flex justify-between mb-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            disabled={!state.completedSteps.includes(step.id) && step.id !== state.step}
            aria-label={`Go to ${step.name}`}
            className={`flex flex-col items-center relative ${
              step.id <= state.step ? 'text-tax-blue' : 'text-gray-400'
            } ${isStepActive(step.path) ? 'text-tax-blue font-medium' : ''} ${
              state.completedSteps.includes(step.id) || step.id === state.step 
                ? 'cursor-pointer hover:opacity-80' 
                : 'cursor-not-allowed'
            }`}
          >
            <div 
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                state.completedSteps.includes(step.id)
                  ? 'bg-tax-blue text-white shadow-md'
                  : step.id === state.step
                    ? 'border-2 border-tax-blue text-tax-blue'
                    : 'bg-gray-100 text-gray-400'
              } ${isStepActive(step.path) ? 'ring-2 ring-offset-2 ring-tax-blue/30' : ''}`}
            >
              {state.completedSteps.includes(step.id) ? (
                <Check size={16} />
              ) : (
                step.id
              )}
            </div>
            <span className={`text-xs mt-1 font-medium ${
              step.id === state.step || isStepActive(step.path) ? 'text-tax-blue' : ''
            }`}>
              {step.name}
            </span>
          </button>
        ))}
      </div>
      
      <div className="relative w-full h-3 bg-gray-100 rounded-full mt-2">
        <div 
          className="absolute top-0 left-0 h-3 bg-tax-blue rounded-full transition-all duration-500"
          style={{ width: `${((state.step - 1) / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`absolute top-0 h-3 w-3 rounded-full transition-all ${
              step.id <= state.step ? 'bg-tax-blue' : 'bg-gray-100'
            }`}
            style={{ left: `${(index / (steps.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
