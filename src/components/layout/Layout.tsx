
import React, { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';

import Header from './Header';
import Footer from './Footer';
import AssistantWrapper from './AssistantWrapper';
import { useLayoutNavigation } from '../../hooks/useLayoutNavigation';

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
  const location = useLocation();
  const navigate = useNavigate();
  const { handleNext, handleBack } = useLayoutNavigation();
  
  // Set the correct step based on the route when component mounts
  useEffect(() => {
    let currentStep = 1;
    
    switch (location.pathname) {
      case '/':
        currentStep = 1;
        break;
      case '/import-options':
        currentStep = 2;
        break;
      case '/categories':
        currentStep = 3;
        break;
      case '/review':
        currentStep = 4;
        break;
      case '/questions':
        currentStep = 5;
        break;
      case '/summary':
        currentStep = 6;
        break;
      default:
        break;
    }
    
    if (currentStep !== state.step) {
      dispatch({ type: 'SET_STEP', payload: currentStep });
    }
    
    // If we're on the review page but haven't completed the categories step,
    // redirect to categories
    if (location.pathname === '/review' && !state.completedSteps.includes(3)) {
      navigate('/categories');
    }
  }, [location.pathname, dispatch, state.step, state.completedSteps]);

  return (
    <div className="min-h-screen bg-background tax-container flex flex-col">
      <Header showProgress={showProgress} />

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-5xl relative">
        <div className="animate-fade-in">
          {children}
        </div>
        
        <AssistantWrapper />
      </main>

      <Footer 
        step={state.step}
        showBackButton={showBackButton}
        showNextButton={showNextButton}
        nextButtonText={nextButtonText}
        disableNext={disableNext}
        onBack={() => handleBack(onBack)}
        onNext={() => handleNext(onNext)}
      />
    </div>
  );
};

export default Layout;
