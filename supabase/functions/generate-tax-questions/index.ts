
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      selectedCategories, 
      documents, 
      extractedFields = [], 
      categoryAnswers = [],
      previousAnswers = [] 
    } = await req.json();
    
    console.log("Received request with:", { 
      categoriesCount: selectedCategories?.length || 0, 
      documentsCount: documents?.length || 0,
      extractedFieldsCount: extractedFields?.length || 0,
      categoryAnswersCount: categoryAnswers?.length || 0,
      previousAnswersCount: previousAnswers?.length || 0
    });

    // Generate default questions based on selected categories
    const questions = generateDefaultQuestions(selectedCategories, documents, extractedFields);
    
    console.log(`Generated ${questions.length} local questions`);
    
    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    
    // Ultimate fallback - simple tax questions
    const fallbackQuestions = [
      {
        "id": "default-q1",
        "text": "What's your filing status?",
        "categoryId": "general",
        "options": ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Qualifying widow(er)"],
        "followUpQuestions": {
          "Head of household": [
            {
              "id": "follow-up-hoh-1",
              "text": "Did you provide more than half the cost of keeping up a home for the year?",
              "categoryId": "general",
              "options": ["Yes", "No", "I'm not sure"]
            }
          ]
        }
      },
      {
        "id": "default-q2", 
        "text": "Did you have any dependents in the tax year?",
        "categoryId": "general",
        "options": ["No", "Yes, one dependent", "Yes, multiple dependents"],
        "followUpQuestions": {
          "Yes, one dependent": [
            {
              "id": "follow-up-dep-1",
              "text": "What is your dependent's relationship to you?",
              "categoryId": "family",
              "options": ["Child", "Parent", "Other relative", "Non-relative"]
            }
          ],
          "Yes, multiple dependents": [
            {
              "id": "follow-up-deps-1",
              "text": "How many dependents do you have?",
              "categoryId": "family",
              "options": ["2", "3", "4", "5 or more"]
            }
          ]
        }
      }
    ];
    
    return new Response(
      JSON.stringify({ questions: fallbackQuestions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to generate reasonable default questions based on the user's selected categories
function generateDefaultQuestions(selectedCategories = [], documents = [], extractedFields = []) {
  const questions = [];
  
  // Helper function to create question IDs
  const generateId = () => `q-${Math.random().toString(36).substring(2, 9)}`;
  
  // Check if a category is selected
  const isCategorySelected = (categoryId) => {
    return selectedCategories.some(cat => cat.id === categoryId);
  };
  
  // Helper function to check if a subcategory is selected
  const isSubcategorySelected = (categoryId, subcategoryId) => {
    const category = selectedCategories.find(cat => cat.id === categoryId);
    return category?.subcategories?.some(sub => sub.id === subcategoryId);
  };
  
  // Helper function to get quantity for a subcategory
  const getSubcategoryQuantity = (categoryId, subcategoryId) => {
    const category = selectedCategories.find(cat => cat.id === categoryId);
    const subcategory = category?.subcategories?.find(sub => sub.id === subcategoryId);
    return subcategory?.quantity || 0;
  };
  
  // Helper to check if a document type exists
  const hasDocumentType = (docType) => {
    return documents.some(doc => 
      doc.type === docType || 
      (doc.name && doc.name.toLowerCase().includes(docType.toLowerCase()))
    );
  };

  // Filing Status Questions
  questions.push({
    "id": generateId(),
    "text": "What is your filing status for this tax year?",
    "categoryId": "general",
    "options": ["Single", "Married filing jointly", "Married filing separately", "Head of household", "Qualifying widow(er)"],
    "followUpQuestions": {
      "Married filing jointly": [{
        "id": generateId(),
        "text": "Did your spouse have income during the tax year?",
        "categoryId": "general",
        "options": ["Yes", "No"]
      }],
      "Head of household": [{
        "id": generateId(),
        "text": "Did you provide more than half the cost of keeping up a home for the year?",
        "categoryId": "general",
        "options": ["Yes", "No", "I'm not sure"]
      }]
    }
  });

  // Generate questions based on selected categories
  if (isCategorySelected('income')) {
    // W-2 Employment
    if (isSubcategorySelected('income', 'w2')) {
      const w2Count = getSubcategoryQuantity('income', 'w2');
      const hasW2 = hasDocumentType('W-2');
      
      questions.push({
        "id": generateId(),
        "text": `You indicated having ${w2Count} W-2${w2Count > 1 ? 's' : ''}. Have you uploaded all your W-2 forms?`,
        "categoryId": "income",
        "options": ["Yes", "No", "I need to get more W-2s"],
        "missingDocument": hasW2 ? null : {
          "name": "W-2 Wage and Tax Statement",
          "description": "Form showing wages earned and taxes withheld from your employer",
          "formNumber": "W-2",
          "requiredFor": "Reporting employment income"
        }
      });
    }
    
    // Investment Income
    if (isSubcategorySelected('income', 'investments')) {
      questions.push({
        "id": generateId(),
        "text": "What types of investment income did you receive this year?",
        "categoryId": "income",
        "options": ["Dividends only", "Capital gains only", "Both dividends and capital gains", "Neither"],
        "missingDocument": {
          "name": "Form 1099-DIV and/or 1099-B",
          "description": "Forms reporting dividend income and/or proceeds from broker transactions",
          "formNumber": "1099-DIV/1099-B",
          "requiredFor": "Reporting investment income"
        },
        "followUpQuestions": {
          "Capital gains only": [{
            "id": generateId(),
            "text": "Did you sell any investments that you held for less than a year?",
            "categoryId": "income",
            "options": ["Yes", "No", "I'm not sure"]
          }]
        }
      });
    }
  }

  if (isCategorySelected('deductions')) {
    questions.push({
      "id": generateId(),
      "text": "Did you make any charitable contributions this tax year?",
      "categoryId": "deductions",
      "options": ["Yes, monetary donations", "Yes, non-monetary donations", "Yes, both types", "No"],
      "followUpQuestions": {
        "Yes, monetary donations": [
          {
            "id": generateId(),
            "text": "Do you have receipts or acknowledgment letters for donations over $250?",
            "categoryId": "deductions",
            "options": ["Yes, for all donations", "Only for some donations", "No"]
          }
        ],
        "Yes, both types": [
          {
            "id": generateId(),
            "text": "For non-monetary donations, do you have documentation of their fair market value?",
            "categoryId": "deductions",
            "options": ["Yes", "No", "Only for some items"]
          }
        ]
      }
    });
  }

  if (isCategorySelected('family')) {
    // Dependents
    if (isSubcategorySelected('family', 'dependents')) {
      const dependentCount = getSubcategoryQuantity('family', 'dependents');
      const pluralText = dependentCount > 1 ? 'dependents' : 'dependent';
      
      questions.push({
        "id": generateId(),
        "text": `You indicated having ${dependentCount} ${pluralText}. What are their ages?`,
        "categoryId": "family",
        "options": ["All under 17", "Some under 17, some 17+", "All 17+"],
        "followUpQuestions": {
          "All under 17": [
            {
              "id": generateId(),
              "text": "Do you have Social Security numbers for all dependents?",
              "categoryId": "family",
              "options": ["Yes", "No, need help with this"]
            }
          ],
          "Some under 17, some 17+": [
            {
              "id": generateId(),
              "text": "Are any of your dependents full-time students?",
              "categoryId": "family",
              "options": ["Yes", "No"]
            }
          ]
        }
      });
    }
    
    // Child Care
    if (isSubcategorySelected('family', 'childcare')) {
      questions.push({
        "id": generateId(),
        "text": "Do you have records of your childcare expenses with provider information?",
        "categoryId": "family",
        "options": ["Yes, complete records", "Yes, but missing some information", "No"],
        "missingDocument": {
          "name": "Childcare Provider Information",
          "description": "Documentation showing childcare payments and provider's tax ID",
          "formNumber": null,
          "requiredFor": "Child and Dependent Care Credit"
        }
      });
    }
  }

  if (isCategorySelected('home')) {
    questions.push({
      "id": generateId(),
      "text": "Did you pay mortgage interest on your primary residence this year?",
      "categoryId": "home",
      "options": ["Yes", "No"],
      "missingDocument": {
        "name": "Mortgage Interest Statement",
        "description": "Statement from your lender showing mortgage interest paid",
        "formNumber": "1098",
        "requiredFor": "Mortgage Interest Deduction"
      }
    });

    if (isSubcategorySelected('home', 'sale')) {
      questions.push({
        "id": generateId(),
        "text": "Did you sell your primary residence during this tax year?",
        "categoryId": "home",
        "options": ["Yes", "No"],
        "followUpQuestions": {
          "Yes": [
            {
              "id": generateId(),
              "text": "Did you live in the home for at least 2 out of the last 5 years?",
              "categoryId": "home",
              "options": ["Yes", "No"]
            }
          ]
        }
      });
    }
  }

  if (isCategorySelected('health')) {
    questions.push({
      "id": generateId(),
      "text": "Did you have significant medical expenses not covered by insurance?",
      "categoryId": "health",
      "options": ["Yes", "No"],
      "followUpQuestions": {
        "Yes": [
          {
            "id": generateId(),
            "text": "Do your total medical expenses exceed 7.5% of your adjusted gross income?",
            "categoryId": "health",
            "options": ["Yes", "No", "I need to calculate this"]
          }
        ]
      }
    });

    if (isSubcategorySelected('health', 'hsa')) {
      questions.push({
        "id": generateId(),
        "text": "Did you contribute to a Health Savings Account (HSA) this year?",
        "categoryId": "health",
        "options": ["Yes, through my employer", "Yes, on my own", "Both employer and personal contributions", "No"],
        "missingDocument": {
          "name": "HSA Contribution Statement",
          "description": "Form showing contributions to your Health Savings Account",
          "formNumber": "5498-SA",
          "requiredFor": "HSA contribution deduction"
        }
      });
    }
  }

  if (isCategorySelected('investments')) {
    questions.push({
      "id": generateId(),
      "text": "Did you contribute to any retirement accounts (401k, IRA, etc.) this year?",
      "categoryId": "investments",
      "options": ["Yes", "No"],
      "followUpQuestions": {
        "Yes": [
          {
            "id": generateId(),
            "text": "Which type of retirement account(s) did you contribute to?",
            "categoryId": "investments",
            "options": ["Traditional IRA", "Roth IRA", "401(k)/403(b)", "Multiple types"]
          }
        ]
      }
    });
  }

  // Remote Work Question
  questions.push({
    "id": generateId(),
    "text": "Did you work remotely at any point during the tax year?",
    "categoryId": "general",
    "options": ["Yes, full-time remotely", "Yes, partially remotely", "No"],
    "followUpQuestions": {
      "Yes, full-time remotely": [
        {
          "id": generateId(),
          "text": "Did you maintain a dedicated home office space used exclusively for work?",
          "categoryId": "general",
          "options": ["Yes", "No", "Only partially dedicated space"]
        }
      ]
    }
  });
  
  // Education
  if (isCategorySelected('credits') && isSubcategorySelected('credits', 'education_credit')) {
    questions.push({
      "id": generateId(),
      "text": "Did you pay for education expenses for yourself or a dependent this year?",
      "categoryId": "education",
      "options": ["Yes, for myself", "Yes, for my dependent", "Yes, for both", "No"],
      "missingDocument": {
        "name": "Tuition Statement",
        "description": "Statement showing tuition payments made to an eligible educational institution",
        "formNumber": "1098-T",
        "requiredFor": "Education credits and deductions"
      }
    });

    questions.push({
      "id": generateId(),
      "text": "Did you pay any student loan interest?",
      "categoryId": "education",
      "options": ["Yes", "No", "I'm not sure"],
      "missingDocument": {
        "name": "Student Loan Interest Statement",
        "description": "Statement showing interest paid on qualified student loans",
        "formNumber": "1098-E",
        "requiredFor": "Student Loan Interest Deduction"
      }
    });
  }
  
  return questions;
}
