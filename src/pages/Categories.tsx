
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, MinusCircle, Gift, Users, Home, Heart, TrendingUp, Briefcase, Check,
  Plus, Minus, ChevronRight, Loader2
} from 'lucide-react';
import { taxCategories, taxQuestions } from '../data/taxCategories';
import { toast } from '@/components/ui/use-toast';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import AIProcessingModal from '../components/ui/AIProcessingModal';

const Categories: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  useEffect(() => {
    // Initialize categories if not already done
    if (state.categories.length === 0) {
      // Import all categories first
      dispatch({ 
        type: 'SET_CATEGORIES', 
        payload: taxCategories 
      });
      
      // Then initialize questions
      taxQuestions.forEach(question => {
        dispatch({ 
          type: 'ANSWER_QUESTION', 
          payload: { id: question.id, answer: '' } 
        });
      });
    }
  }, []);
  
  const getIconForCategory = (iconName: string) => {
    switch (iconName) {
      case 'dollar-sign':
        return <DollarSign size={24} />;
      case 'minus-circle':
        return <MinusCircle size={24} />;
      case 'gift':
        return <Gift size={24} />;
      case 'users':
        return <Users size={24} />;
      case 'home':
        return <Home size={24} />;
      case 'heart':
        return <Heart size={24} />;
      case 'trending-up':
        return <TrendingUp size={24} />;
      case 'briefcase':
        return <Briefcase size={24} />;
      default:
        return <DollarSign size={24} />;
    }
  };
  
  const toggleCategory = (categoryId: string) => {
    dispatch({ type: 'TOGGLE_CATEGORY', payload: categoryId });
    
    // Get the category that was toggled
    const category = state.categories.find(c => c.id === categoryId);
    
    if (category) {
      // Show different toast messages based on selection state
      if (!category.selected) {
        // If the category is being selected
        toast({
          title: `${category.name} Selected`,
          description: "You can now specify which items apply to you.",
          variant: "default",
        });
      } else {
        // If the category is being deselected
        toast({
          title: `${category.name} Removed`,
          description: "This category has been removed from your selections.",
          variant: "destructive",
        });
      }
    }
  };
  
  const toggleSubcategory = (categoryId: string, subcategoryId: string) => {
    dispatch({ 
      type: 'TOGGLE_SUBCATEGORY', 
      payload: { categoryId, subcategoryId } 
    });
    
    // Get the subcategory that was toggled
    const category = state.categories.find(c => c.id === categoryId);
    const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);
    
    if (subcategory) {
      // Show toast message for subcategory toggle
      toast({
        title: subcategory.selected ? `${subcategory.name} Removed` : `${subcategory.name} Added`,
        description: subcategory.selected 
          ? "This item has been removed from your selections." 
          : "This item has been added to your selections.",
        variant: subcategory.selected ? "destructive" : "default",
      });
    }
  };

  const updateQuantity = (categoryId: string, subcategoryId: string, change: number) => {
    const category = state.categories.find(c => c.id === categoryId);
    const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);
    
    if (subcategory) {
      const currentQuantity = subcategory.quantity || 1;
      const newQuantity = Math.max(1, currentQuantity + change); // Ensure quantity is at least 1
      
      dispatch({
        type: 'UPDATE_SUBCATEGORY_QUANTITY',
        payload: { categoryId, subcategoryId, quantity: newQuantity }
      });
    }
  };
  
  const handleContinue = async () => {
    // Check if any categories are selected
    const hasSelectedCategories = state.categories.some(category => category.selected);
    
    if (!hasSelectedCategories) {
      toast({
        title: "No Categories Selected",
        description: "Please select at least one tax category to continue.",
        variant: "destructive",
      });
      return;
    }

    // Mark the current step as completed
    dispatch({ type: 'MARK_STEP_COMPLETED', payload: state.step });
    
    // Show AI processing modal
    setShowAIModal(true);
    setIsProcessing(true);
    
    // Simulate AI processing documents
    setTimeout(() => {
      setIsProcessing(false);
      setShowAIModal(false);
      
      // Navigate to review page
      navigate('/review');
    }, 3000);
  };
  
  return (
    <Layout
      onNext={handleContinue}
      nextButtonText="Continue to Review"
    >
      <div className="max-w-4xl mx-auto">
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Select Your Tax Categories</h1>
          <p className="text-gray-600">
            Choose the tax categories that apply to you.
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {state.categories.length > 0 ? (
            state.categories.map((category, index) => (
              <Popover key={category.id}>
                <PopoverTrigger asChild>
                  <div 
                    className={`
                      cursor-pointer rounded-xl border p-4 h-full transition-all duration-300
                      ${category.selected 
                        ? 'border-tax-blue bg-white shadow-md' 
                        : 'border-gray-200 bg-white hover:border-tax-blue hover:shadow-sm'}
                    `}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`
                        p-2 rounded-lg transition-all duration-300 
                        ${category.selected 
                          ? 'bg-tax-blue text-white' 
                          : 'bg-gray-100 text-gray-600'}
                      `}>
                        {getIconForCategory(category.icon)}
                      </div>
                      
                      {category.selected && (
                        <div className="text-tax-blue">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium mt-3 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {category.description}
                    </p>
                  </div>
                </PopoverTrigger>
                
                {category.selected && category.subcategories && (
                  <PopoverContent className="w-72 p-0" align="center">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Select what applies to you:</h4>
                    </div>
                    <div className="p-2">
                      {category.subcategories.map(sub => (
                        <div 
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <div 
                            className="flex items-center space-x-2 flex-1 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubcategory(category.id, sub.id);
                            }}
                          >
                            <div className={`
                              w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                              ${sub.selected 
                                ? 'bg-tax-blue border-tax-blue text-white' 
                                : 'border-gray-300'}
                            `}>
                              {sub.selected && <Check size={12} />}
                            </div>
                            <span className="text-sm">{sub.name}</span>
                          </div>
                          
                          {sub.selected && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(category.id, sub.id, -1);
                                }}
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="w-5 text-center text-sm font-medium">
                                {sub.quantity || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(category.id, sub.id, 1);
                                }}
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p>Loading categories...</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-tax-lightBlue rounded-lg p-4">
          <div className="flex items-center">
            <div className="mr-4 text-tax-blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Tax Tip</h3>
              <p className="text-sm text-gray-600">
                For each selected category, click to see and select specific items that apply to you.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <AIProcessingModal 
        open={showAIModal} 
        onOpenChange={setShowAIModal}
      />
    </Layout>
  );
};

export default Categories;
