
import { useNavigate } from 'react-router-dom';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';

export const useLayoutNavigation = () => {
  const { state, dispatch } = useTaxOrganizer();
  const navigate = useNavigate();

  const handleNext = (onNext?: () => void) => {
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
          navigate('/categories');
          break;
        case 3:
          navigate('/questions');
          break;
        case 4:
          navigate('/summary');
          break;
        default:
          break;
      }
    }
  };

  const handleBack = (onBack?: () => void) => {
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
          navigate('/categories');
          break;
        case 5:
          navigate('/questions');
          break;
        default:
          break;
      }
    }
  };

  const navigateToStep = (step: number) => {
    // Only allow navigation to completed steps or the current step
    if (state.completedSteps.includes(step) || step === state.step) {
      dispatch({ type: 'SET_STEP', payload: step });
      
      // Navigate based on step number
      switch (step) {
        case 1:
          navigate('/');
          break;
        case 2:
          navigate('/review');
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

  return {
    handleNext,
    handleBack,
    navigateToStep,
    currentStep: state.step
  };
};
