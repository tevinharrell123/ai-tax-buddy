
import React, { useState, useEffect } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, X, Edit2, ChevronLeft, ChevronRight, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const AIReview: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Ensure we're on step 2 when this component loads
  useEffect(() => {
    if (state.step !== 2) {
      dispatch({ type: 'SET_STEP', payload: 2 });
    }
  }, []);
  
  // Group fields by category
  const fieldsByCategory = state.extractedFields.reduce((acc, field) => {
    const category = field.category || 'Other Information';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {});
  
  // Get all categories with fields
  const categories = Object.keys(fieldsByCategory).sort();
  
  // Get current fields based on active tab and pagination
  const fieldsPerSection = 6;
  let currentFields = [];
  
  if (activeTab === "all") {
    // All fields, paginated
    currentFields = state.extractedFields.slice(
      currentSection * fieldsPerSection, 
      (currentSection + 1) * fieldsPerSection
    );
  } else {
    // Category-specific fields, paginated
    const categoryFields = fieldsByCategory[activeTab] || [];
    currentFields = categoryFields.slice(
      currentSection * fieldsPerSection, 
      (currentSection + 1) * fieldsPerSection
    );
  }
  
  // Calculate pagination info based on active tab
  const totalFields = activeTab === "all" 
    ? state.extractedFields.length 
    : (fieldsByCategory[activeTab] || []).length;
    
  const totalSections = Math.max(1, Math.ceil(totalFields / fieldsPerSection));
  
  const handleFieldStatus = (fieldId: string, isCorrect: boolean) => {
    dispatch({
      type: 'UPDATE_EXTRACTED_FIELD',
      payload: {
        id: fieldId,
        updates: { isCorrect }
      }
    });
  };

  const startEditing = (fieldId: string, currentValue: string) => {
    setEditingField(fieldId);
    setEditValue(currentValue);
  };

  const saveEdit = (fieldId: string) => {
    dispatch({
      type: 'UPDATE_EXTRACTED_FIELD',
      payload: {
        id: fieldId,
        updates: { value: editValue, isCorrect: true }
      }
    });
    setEditingField(null);
    
    toast({
      title: "Field Updated",
      description: "The field has been successfully updated",
      variant: "success",
    });
  };
  
  const cancelEdit = () => {
    setEditingField(null);
  };
  
  const verifyAll = () => {
    state.extractedFields.forEach(field => {
      dispatch({
        type: 'UPDATE_EXTRACTED_FIELD',
        payload: {
          id: field.id,
          updates: { isCorrect: true }
        }
      });
    });
    
    toast({
      title: "All fields verified",
      description: "All extracted information has been verified",
      variant: "success"
    });
  };
  
  const goToNextSection = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
    }
  };
  
  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    setCurrentSection(0); // Reset pagination when changing tabs
  };

  const isReviewComplete = state.extractedFields.every(field => field.isCorrect !== null);

  const handleNextStep = () => {
    if (isReviewComplete) {
      // Mark this step as completed
      dispatch({ type: 'MARK_STEP_COMPLETED', payload: 2 });
      // Skip step 3 and go directly to step 4
      dispatch({ type: 'SET_STEP', payload: 4 });
      // Navigate directly to the categories page
      navigate('/categories');
      
      toast({
        title: "Review Complete!",
        description: "Moving to tax categories",
        variant: "success",
      });
    }
  };

  const getProgressPercentage = () => {
    const reviewedCount = state.extractedFields.filter(f => f.isCorrect !== null).length;
    return (reviewedCount / state.extractedFields.length) * 100;
  };

  return (
    <Layout 
      disableNext={!isReviewComplete}
      onNext={handleNextStep}
    >
      <div className="max-w-4xl mx-auto">
        <AnimatedCard delay={100} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Review AI-Extracted Information</h1>
          <p className="text-gray-600">
            Our AI has analyzed your documents. Please review the extracted information and confirm if it's correct.
          </p>
        </AnimatedCard>
        
        <AnimatedCard delay={300}>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="mr-2 text-tax-blue" size={20} />
                <h2 className="text-lg font-medium text-gray-800">Document Analysis Results</h2>
              </div>
              <Button 
                onClick={verifyAll}
                className="bg-green-500 hover:bg-green-600"
              >
                <Check className="mr-2 h-4 w-4" /> Verify All
              </Button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                Please confirm each field is correct by clicking the checkmark, or edit if needed
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={changeTab} className="mb-4">
              <TabsList className="w-full mb-4 overflow-x-auto flex-nowrap whitespace-nowrap max-w-[100%]">
                <TabsTrigger value="all">All Information</TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab}>
                {totalSections > 1 && (
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <span>Page {currentSection + 1} of {totalSections}</span>
                    <div className="flex gap-2">
                      <Button 
                        onClick={goToPrevSection}
                        variant="outline"
                        size="sm"
                        disabled={currentSection === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={goToNextSection}
                        variant="outline"
                        size="sm"
                        disabled={currentSection === totalSections - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div 
                  className="divide-y touch-pan-y" 
                  onTouchStart={(e) => {
                    const touchStartX = e.touches[0].clientX;
                    const handleTouchEnd = (e: TouchEvent) => {
                      const touchEndX = e.changedTouches[0].clientX;
                      const diff = touchStartX - touchEndX;
                      
                      if (diff > 50) { // Swiped left
                        goToNextSection();
                      } else if (diff < -50) { // Swiped right
                        goToPrevSection();
                      }
                      
                      document.removeEventListener('touchend', handleTouchEnd);
                    };
                    
                    document.addEventListener('touchend', handleTouchEnd);
                  }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentFields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{field.name}</p>
                              <p className="text-xs text-gray-500">{field.category || 'Other'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingField === field.id ? (
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="border rounded-md px-2 py-1 text-sm w-full max-w-xs"
                                  autoFocus
                                />
                                <div className="flex gap-2 ml-2">
                                  <button
                                    onClick={() => saveEdit(field.id)}
                                    className="bg-tax-green text-white p-1 rounded-md hover:bg-green-600 transition-colors"
                                    title="Save"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="bg-gray-300 text-gray-700 p-1 rounded-md hover:bg-gray-400 transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`text-base ${field.value === 'Not found' ? 'text-gray-400 italic' : ''}`}>
                                {field.value}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingField !== field.id && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleFieldStatus(field.id, true)}
                                  className={`p-2 rounded-full transition-all ${
                                    field.isCorrect === true 
                                      ? 'bg-tax-green text-white' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                  title="Correct"
                                >
                                  <Check size={16} />
                                </button>
                                
                                <button
                                  onClick={() => startEditing(field.id, field.value)}
                                  className={`p-2 rounded-full transition-all ${
                                    field.isCorrect === false 
                                      ? 'bg-tax-blue text-white' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </button>
                                
                                <button
                                  onClick={() => handleFieldStatus(field.id, false)}
                                  className={`p-2 rounded-full transition-all ${
                                    field.isCorrect === false && editingField !== field.id
                                      ? 'bg-tax-red text-white' 
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                  title="Incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 flex items-center">
              <div className="relative flex-1 rounded-full bg-gray-200 h-2">
                <div 
                  className="absolute top-0 left-0 rounded-full bg-tax-green h-2 transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <span className="ml-4 text-sm text-gray-600">
                {state.extractedFields.filter(f => f.isCorrect !== null).length} of {state.extractedFields.length} reviewed
              </span>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </Layout>
  );
};

export default AIReview;
