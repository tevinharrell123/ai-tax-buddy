
import React, { useEffect, useState } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, ChevronDown, ChevronUp, FileText, Edit2, Award } from 'lucide-react';

const Summary: React.FC = () => {
  const { state } = useTaxOrganizer();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    documents: true,
    categories: true,
    highlights: false,
    questions: false,
  });
  const [showFinalConfetti, setShowFinalConfetti] = useState(false);

  useEffect(() => {
    // Create a confetti celebration when the component mounts
    setTimeout(() => {
      setShowFinalConfetti(true);
      createFinalConfetti();
    }, 500);
  }, []);

  const createFinalConfetti = () => {
    const container = document.getElementById('final-confetti-container');
    if (!container) return;
    
    const colors = ['#1A85FF', '#44C4A1', '#FFCE73', '#FF6370', '#6C5DD3'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${Math.random() * 20}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 1.5}s`;
      
      container.appendChild(confetti);
      
      // Remove confetti after animation completes
      setTimeout(() => {
        if (confetti.parentNode === container) {
          container.removeChild(confetti);
        }
      }, 3000);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getAnsweredQuestionsCount = () => {
    return state.questions.filter(q => q.answer && q.answer !== '').length;
  };

  const getSelectedCategoriesCount = () => {
    return state.categories.filter(c => c.selected).length;
  };

  const getCompletionScore = () => {
    const documentScore = state.documents.length > 0 ? 25 : 0;
    const fieldScore = state.extractedFields.filter(f => f.isCorrect !== null).length / state.extractedFields.length * 25;
    const categoryScore = getSelectedCategoriesCount() / Math.min(5, state.categories.length) * 25;
    const questionScore = getAnsweredQuestionsCount() / Math.min(10, state.questions.length) * 25;
    
    return Math.min(100, Math.round(documentScore + fieldScore + categoryScore + questionScore));
  };

  const getBadgeCount = () => {
    // Count categories with badges and add base badges
    return state.categories.filter(c => c.badge).length + 2; // +2 for completion & upload badges
  };

  return (
    <Layout showNextButton={false}>
      <div className="max-w-3xl mx-auto relative">
        <div id="final-confetti-container" className="absolute inset-0 overflow-hidden pointer-events-none"></div>
        
        <AnimatedCard delay={100} className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-tax-lightGreen text-tax-green p-4 rounded-full">
              <Check size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Organizer Complete!</h1>
          <p className="text-gray-600">
            Great job! Your tax information has been organized and is ready for review.
          </p>
        </AnimatedCard>
        
        <AnimatedCard delay={200} className="mb-8 bg-gradient-to-br from-tax-lightBlue to-tax-lightPurple p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold mb-2">Your Tax Profile</h2>
              <div className="flex flex-wrap gap-2 md:max-w-md">
                {state.categories.filter(c => c.selected).map(category => (
                  <div 
                    key={category.id} 
                    className="badge bg-white text-tax-blue border border-tax-blue"
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-tax-blue">
                <div>
                  <div className="text-2xl font-bold text-tax-blue">{getCompletionScore()}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <AnimatedCard delay={300} className="flex flex-col items-center text-center p-6">
            <div className="bg-tax-lightBlue p-3 rounded-full mb-3">
              <FileText size={24} className="text-tax-blue" />
            </div>
            <h3 className="font-semibold mb-1">{state.documents.length}</h3>
            <p className="text-sm text-gray-600">Documents Uploaded</p>
          </AnimatedCard>
          
          <AnimatedCard delay={400} className="flex flex-col items-center text-center p-6">
            <div className="bg-tax-lightPurple p-3 rounded-full mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag text-tax-purple"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            </div>
            <h3 className="font-semibold mb-1">{getSelectedCategoriesCount()}</h3>
            <p className="text-sm text-gray-600">Categories Selected</p>
          </AnimatedCard>
          
          <AnimatedCard delay={500} className="flex flex-col items-center text-center p-6">
            <div className="bg-tax-lightYellow p-3 rounded-full mb-3">
              <Award size={24} className="text-tax-yellow" />
            </div>
            <h3 className="font-semibold mb-1">{getBadgeCount()}</h3>
            <p className="text-sm text-gray-600">Badges Earned</p>
          </AnimatedCard>
        </div>
        
        <AnimatedCard delay={600}>
          <div 
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleSection('documents')}
          >
            <h2 className="text-lg font-semibold">Uploaded Documents</h2>
            {expandedSections.documents ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.documents && (
            <div className="px-4 pb-4 space-y-3">
              {state.documents.map(doc => (
                <div key={doc.id} className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <div className="bg-gray-100 p-2 rounded mr-3">
                    <FileText size={18} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-green-600 flex items-center">
                      <Check size={12} className="mr-1" />
                      Processed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AnimatedCard>
        
        <AnimatedCard delay={700} className="mt-4">
          <div 
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleSection('categories')}
          >
            <h2 className="text-lg font-semibold">Selected Categories</h2>
            {expandedSections.categories ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.categories && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {state.categories.filter(c => c.selected).map(category => (
                  <div key={category.id} className="border rounded-lg p-3">
                    <h3 className="font-medium text-sm mb-2">{category.name}</h3>
                    <div className="space-y-1">
                      {category.subcategories?.filter(s => s.selected).map(sub => (
                        <div key={sub.id} className="flex items-center text-sm text-gray-600">
                          <Check size={12} className="mr-2 text-tax-green" />
                          <span>{sub.name}</span>
                        </div>
                      ))}
                      {category.subcategories?.filter(s => s.selected).length === 0 && (
                        <p className="text-xs text-gray-500">No subcategories selected</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnimatedCard>
        
        <AnimatedCard delay={800} className="mt-4">
          <div 
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleSection('highlights')}
          >
            <h2 className="text-lg font-semibold">Document Highlights</h2>
            {expandedSections.highlights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.highlights && (
            <div className="px-4 pb-4">
              {state.highlights.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {state.highlights.map(highlight => (
                    <div 
                      key={highlight.id} 
                      className="border rounded-lg p-3"
                      style={{ borderLeftColor: highlight.color, borderLeftWidth: '4px' }}
                    >
                      <p className="font-medium text-sm">{highlight.label}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        From: {state.documents.find(d => d.id === highlight.documentId)?.name || 'Unknown document'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No highlights added</p>
              )}
            </div>
          )}
        </AnimatedCard>
        
        <AnimatedCard delay={900} className="mt-4">
          <div 
            className="flex justify-between items-center p-4 cursor-pointer"
            onClick={() => toggleSection('questions')}
          >
            <h2 className="text-lg font-semibold">Answered Questions</h2>
            {expandedSections.questions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.questions && (
            <div className="px-4 pb-4 space-y-3">
              {state.questions.filter(q => q.answer && q.answer !== '').map(question => (
                <div key={question.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium">{question.text}</p>
                  <div className="flex items-center mt-2">
                    <div className="bg-tax-lightBlue text-tax-blue px-3 py-1 rounded-full text-xs font-medium">
                      {question.answer}
                    </div>
                  </div>
                </div>
              ))}
              
              {state.questions.filter(q => q.answer && q.answer !== '').length === 0 && (
                <p className="text-gray-500 text-sm">No questions answered</p>
              )}
            </div>
          )}
        </AnimatedCard>
        
        <div className="mt-8 flex justify-center">
          <button className="btn-primary px-8 py-3 text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            Submit to Tax Professional
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          Your tax information will be securely shared with your tax professional
        </div>
      </div>
    </Layout>
  );
};

export default Summary;
