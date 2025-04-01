import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type TaxDocument = {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  uploadProgress: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'processed' | 'error';
  category?: string;
};

export type ExtractedField = {
  id: string;
  name: string;
  value: string;
  isCorrect: boolean | null;
  originalValue: string;
  category?: string;
};

export type TaxCategory = {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
  description: string;
  badge: string | null;
  subcategories?: { 
    id: string; 
    name: string; 
    selected: boolean;
    quantity?: number;
  }[];
};

export type Question = {
  id: string;
  text: string;
  categoryId: string;
  answer: string | null;
  options?: string[];
  condition?: {
    categoryId: string;
    selected: boolean;
  };
  followUpQuestions?: {
    [answer: string]: Question[];
  };
  parentQuestionId?: string;
};

export type TaxOrganizerState = {
  step: number;
  documents: TaxDocument[];
  extractedFields: ExtractedField[];
  categories: TaxCategory[];
  questions: Question[];
  highlights: {
    id: string;
    documentId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color: string;
  }[];
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  completedSteps: number[];
};

type Action =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'ADD_DOCUMENT'; payload: TaxDocument }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; updates: Partial<TaxDocument> } }
  | { type: 'REMOVE_DOCUMENT'; payload: string }
  | { type: 'SET_EXTRACTED_FIELDS'; payload: ExtractedField[] }
  | { type: 'UPDATE_EXTRACTED_FIELD'; payload: { id: string; updates: Partial<ExtractedField> } }
  | { type: 'SET_CATEGORIES'; payload: TaxCategory[] }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'TOGGLE_SUBCATEGORY'; payload: { categoryId: string; subcategoryId: string } }
  | { type: 'UPDATE_SUBCATEGORY_QUANTITY'; payload: { categoryId: string; subcategoryId: string; quantity: number } }
  | { type: 'ADD_HIGHLIGHT'; payload: TaxOrganizerState['highlights'][0] }
  | { type: 'REMOVE_HIGHLIGHT'; payload: string }
  | { type: 'ANSWER_QUESTION'; payload: { id: string; answer: string } }
  | { type: 'ADD_FOLLOW_UP_QUESTIONS'; payload: { parentId: string; questions: Question[] } }
  | { type: 'UPDATE_PERSONAL_INFO'; payload: Partial<TaxOrganizerState['personalInfo']> }
  | { type: 'MARK_STEP_COMPLETED'; payload: number }
  | { type: 'RESET' };

const initialState: TaxOrganizerState = {
  step: 1,
  documents: [],
  extractedFields: [],
  categories: [],
  questions: [],
  highlights: [],
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  completedSteps: [],
};

const reducer = (state: TaxOrganizerState, action: Action): TaxOrganizerState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'ADD_DOCUMENT':
      return { 
        ...state, 
        documents: [...state.documents, action.payload] 
      };
    
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === action.payload.id 
            ? { ...doc, ...action.payload.updates } 
            : doc
        )
      };
    
    case 'REMOVE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload)
      };
    
    case 'SET_EXTRACTED_FIELDS':
      return { ...state, extractedFields: action.payload };
    
    case 'UPDATE_EXTRACTED_FIELD':
      return {
        ...state,
        extractedFields: state.extractedFields.map(field => 
          field.id === action.payload.id 
            ? { ...field, ...action.payload.updates } 
            : field
        )
      };
      
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    
    case 'TOGGLE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload 
            ? { ...cat, selected: !cat.selected } 
            : cat
        )
      };
    
    case 'TOGGLE_SUBCATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.categoryId 
            ? { 
                ...cat, 
                subcategories: cat.subcategories?.map(sub => 
                  sub.id === action.payload.subcategoryId 
                    ? { 
                        ...sub, 
                        selected: !sub.selected,
                        quantity: sub.selected ? undefined : sub.quantity || 1 // Initialize quantity when selected
                      } 
                    : sub
                ) 
              } 
            : cat
        )
      };
    
    case 'UPDATE_SUBCATEGORY_QUANTITY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.categoryId 
            ? { 
                ...cat, 
                subcategories: cat.subcategories?.map(sub => 
                  sub.id === action.payload.subcategoryId 
                    ? { ...sub, quantity: action.payload.quantity } 
                    : sub
                ) 
              } 
            : cat
        )
      };
    
    case 'ADD_HIGHLIGHT':
      return {
        ...state,
        highlights: [...state.highlights, action.payload]
      };
    
    case 'REMOVE_HIGHLIGHT':
      return {
        ...state,
        highlights: state.highlights.filter(h => h.id !== action.payload)
      };
    
    case 'ANSWER_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q => 
          q.id === action.payload.id 
            ? { ...q, answer: action.payload.answer } 
            : q
        )
      };
    
    case 'ADD_FOLLOW_UP_QUESTIONS':
      return {
        ...state,
        questions: [
          ...state.questions,
          ...action.payload.questions.map(q => ({
            ...q,
            parentQuestionId: action.payload.parentId
          }))
        ]
      };
    
    case 'UPDATE_PERSONAL_INFO':
      return {
        ...state,
        personalInfo: { ...state.personalInfo, ...action.payload }
      };
    
    case 'MARK_STEP_COMPLETED':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.payload) 
          ? state.completedSteps 
          : [...state.completedSteps, action.payload]
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

type TaxOrganizerContextType = {
  state: TaxOrganizerState;
  dispatch: React.Dispatch<Action>;
};

const TaxOrganizerContext = createContext<TaxOrganizerContextType | undefined>(undefined);

export const TaxOrganizerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <TaxOrganizerContext.Provider value={{ state, dispatch }}>
      {children}
    </TaxOrganizerContext.Provider>
  );
};

export const useTaxOrganizer = () => {
  const context = useContext(TaxOrganizerContext);
  if (!context) {
    throw new Error('useTaxOrganizer must be used within a TaxOrganizerProvider');
  }
  return context;
};
