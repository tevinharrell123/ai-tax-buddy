import React, { useState, useEffect } from 'react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Check, X, Edit2, ChevronLeft, ChevronRight, Save, FileText, User } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState("Personal Information");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (state.step !== 4) {
      dispatch({ type: 'SET_STEP', payload: 4 });
      
      if (!state.completedSteps.includes(3) && location.pathname === '/review') {
        navigate('/categories');
      }
    }
  }, []);
  
  const fieldsByCategory = state.extractedFields.reduce((acc, field) => {
    const category = field.category || 'Other Information';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {});
  
  const categories = Object.keys(fieldsByCategory).sort((a, b) => {
    if (a === "Personal Information" || a === "Personal Identification Information") return -1;
    if (b === "Personal Information" || b === "Personal Identification Information") return 1;
    return a.localeCompare(b);
  });
  
  const fieldsPerSection = 6;
  let currentFields = [];
  
  if (activeTab === "all") {
    const personalInfoFields = state.extractedFields.filter(
      field => field.category === "Personal Information" || field.category === "Personal Identification Information"
    );
    const otherFields = state.extractedFields.filter(
      field => field.category !== "Personal Information" && field.category !== "Personal Identification Information"
    );
    
    const sortedFields = [...personalInfoFields, ...otherFields];
    
    currentFields = sortedFields.slice(
      currentSection * fieldsPerSection, 
      (currentSection + 1) * fieldsPerSection
    );
  } else {
    const categoryFields = fieldsByCategory[activeTab] || [];
    
    if (activeTab === "Personal Information" || activeTab === "Personal Identification Information") {
      prioritizeSourceForPersonalInfo(categoryFields);
    }
    
    currentFields = categoryFields.slice(
      currentSection * fieldsPerSection, 
      (currentSection + 1) * fieldsPerSection
    );
  }
  
  const prioritizeSourceForPersonalInfo = (fields) => {
    const fieldsByName = {};
    fields.forEach(field => {
      if (!fieldsByName[field.name]) {
        fieldsByName[field.name] = [];
      }
      fieldsByName[field.name].push(field);
    });
    
    Object.keys(fieldsByName).forEach(name => {
      if (fieldsByName[name].length > 1) {
        const from1040 = fieldsByName[name].find(f => 
          f.originalValue && (f.originalValue.includes('1040') || f.originalValue.includes('tax'))
        );
        
        const fromID = fieldsByName[name].find(f => 
          f.originalValue && (f.originalValue.includes('license') || f.originalValue.includes('id') || 
          f.originalValue.includes('passport'))
        );
        
        if (from1040 && fromID) {
          fromID.isDuplicate = true;
        }
      }
    });
    
    return fields.filter(field => !field.isDuplicate);
  };
  
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
    setCurrentSection(0);
  };

  const isReviewComplete = state.extractedFields.every(field => field.isCorrect !== null);

  const handleNextStep = () => {
    if (isReviewComplete) {
      dispatch({ type: 'MARK_STEP_COMPLETED', payload: 4 });
      dispatch({ type: 'SET_STEP', payload: 5 });
      navigate('/questions');
      
      toast({
        title: "Review Complete!",
        description: "Moving to tax questions",
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
                <User className="mr-2 text-tax-blue" size={20} />
                <h2 className="text-lg font-medium text-gray-800">Personal Information</h2>
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
              <p className="text-xs text-gray-500 mt-1">
                <i>Personal information is sourced from your 1040 tax form when available, otherwise from your ID documents</i>
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={changeTab} className="mb-4">
              <TabsList className="w-full mb-4 overflow-x-auto flex-nowrap whitespace-nowrap max-w-[100%]">
                {categories.filter(cat => cat === "Personal Information" || cat === "Personal Identification Information").map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
                {categories.filter(cat => cat !== "Personal Information" && cat !== "Personal Identification Information").map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="all">All Information</TabsTrigger>
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
                      
                      if (diff > 50) {
                        goToNextSection();
                      } else if (diff < -50) {
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
                        <TableRow key={field.id} className={field.category === "Personal Information" || field.category === "Personal Identification Information" ? "bg-blue-50" : ""}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{field.name}</p>
                              <p className="text-xs text-gray-500">{field.category || 'Other'}</p>
                              {field.originalValue && field.originalValue.includes('1040') && 
                                <span className="text-xs text-green-600">(From 1040)</span>
                              }
                              {field.originalValue && !field.originalValue.includes('1040') && 
                                (field.originalValue.includes('license') || field.originalValue.includes('id')) && 
                                <span className="text-xs text-blue-600">(From ID)</span>
                              }
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
