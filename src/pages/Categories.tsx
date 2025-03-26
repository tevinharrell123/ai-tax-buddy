
import React, { useEffect } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { 
  DollarSign, MinusCircle, Gift, Users, Home, Heart, TrendingUp, Briefcase, Check
} from 'lucide-react';
import { taxCategories, taxQuestions } from '../data/taxCategories';

const Categories: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  
  useEffect(() => {
    // Initialize categories if not already done
    if (state.categories.length === 0) {
      taxCategories.forEach(category => {
        dispatch({ type: 'TOGGLE_CATEGORY', payload: category.id });
      });
    }
    
    // Initialize questions
    if (state.questions.length === 0) {
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
    
    // If a category gets selected, add a badge to it
    const category = state.categories.find(c => c.id === categoryId);
    if (category && !category.selected) {
      // Add a random badge when selecting a new category for gamification
      const badges = ['Expert', 'Fast Learner', 'Detail Oriented', 'Tax Pro', 'Organized'];
      const randomBadge = badges[Math.floor(Math.random() * badges.length)];
      
      // This would be handled by the reducer, but for simplicity we're just logging here
      console.log(`Earned badge: ${randomBadge} for ${category.name}`);
    }
  };
  
  const toggleSubcategory = (categoryId: string, subcategoryId: string) => {
    dispatch({ 
      type: 'TOGGLE_SUBCATEGORY', 
      payload: { categoryId, subcategoryId } 
    });
  };
  
  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Select Your Tax Categories</h1>
          <p className="text-gray-600">
            Choose the tax categories that apply to you. We'll use this to ask more specific questions later.
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taxCategories.map((category, index) => (
            <AnimatedCard 
              key={category.id} 
              delay={200 + index * 100}
              className={`category-item cursor-pointer ${
                category.selected ? 'border-2 border-tax-blue bg-tax-lightBlue' : 'border'
              }`}
            >
              <div 
                className="p-4"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-lg ${
                    category.selected 
                      ? 'bg-tax-blue text-white' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getIconForCategory(category.icon)}
                  </div>
                  
                  {category.selected && (
                    <div className="bg-white text-tax-blue border border-tax-blue rounded-full p-1">
                      <Check size={16} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mt-4 mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {category.description}
                </p>
                
                {category.badge && (
                  <div className="inline-block badge bg-tax-lightBlue text-tax-blue">
                    {category.badge}
                  </div>
                )}
              </div>
              
              {category.selected && category.subcategories && (
                <div className="border-t px-4 py-3 bg-white">
                  <h4 className="text-sm font-medium mb-2">Select what applies to you:</h4>
                  <div className="space-y-2">
                    {category.subcategories.map(sub => (
                      <div 
                        key={sub.id}
                        className="flex items-center text-sm"
                      >
                        <div 
                          className={`w-5 h-5 rounded-md mr-2 flex items-center justify-center border cursor-pointer ${
                            sub.selected 
                              ? 'bg-tax-blue border-tax-blue text-white' 
                              : 'border-gray-300'
                          }`}
                          onClick={() => toggleSubcategory(category.id, sub.id)}
                        >
                          {sub.selected && <Check size={12} />}
                        </div>
                        <span>{sub.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AnimatedCard>
          ))}
        </div>
        
        <div className="mt-8 bg-tax-lightBlue rounded-lg p-6">
          <div className="flex items-center">
            <div className="mr-4 text-tax-blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Tax Tip</h3>
              <p className="text-sm text-gray-600">
                Selecting more categories helps ensure we cover all your tax situations. Don't worry if you're not sure — you can change these later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
