
import React, { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { handleNext, handleBack } = useLayoutNavigation();
  
  // Set the current step based on the route when component mounts
  useEffect(() => {
    let currentStep = 1;
    
    switch (location.pathname) {
      case '/':
        currentStep = 1;
        break;
      case '/review':
        currentStep = 2;
        break;
      case '/categories':
        currentStep = 3;
        break;
      case '/questions':
        currentStep = 4;
        break;
      case '/summary':
        currentStep = 5;
        break;
      default:
        break;
    }
    
    if (currentStep !== state.step) {
      dispatch({ type: 'SET_STEP', payload: currentStep });
    }
  }, [location.pathname, dispatch, state.step]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showProgress={showProgress} />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl relative">
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
