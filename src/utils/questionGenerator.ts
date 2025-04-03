
import { v4 as uuidv4 } from 'uuid';
import { TaxCategory, TaxDocument, ExtractedField } from '@/context/TaxOrganizerContext';

interface MissingDocument {
  name: string;
  description: string;
  formNumber?: string;
  requiredFor?: string;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  categoryId: string;
  options: string[];
  missingDocument?: MissingDocument | null;
  followUpQuestions?: {
    [answer: string]: GeneratedQuestion[];
  };
}

/**
 * Generates tailored tax questions based on user's selected categories and other data
 */
export const generateLocalQuestions = (
  categories: TaxCategory[],
  documents: TaxDocument[],
  extractedFields: ExtractedField[]
): GeneratedQuestion[] => {
  const questions: GeneratedQuestion[] = [];
  
  // Helper function to check if a category is selected
  const isCategorySelected = (categoryId: string) => {
    return categories.some(cat => cat.id === categoryId && cat.selected);
  };
  
  // Helper function to check if a subcategory is selected
  const isSubcategorySelected = (categoryId: string, subcategoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.subcategories?.some(sub => sub.id === subcategoryId && sub.selected) || false;
  };
  
  // Helper function to get quantity for a subcategory
  const getSubcategoryQuantity = (categoryId: string, subcategoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const subcategory = category?.subcategories?.find(sub => sub.id === subcategoryId);
    return subcategory?.quantity || 0;
  };
  
  // Helper to check if a document type exists
  const hasDocumentType = (docType: string) => {
    return documents.some(doc => doc.type === docType || doc.name.toLowerCase().includes(docType.toLowerCase()));
  };

  // Income Questions
  if (isCategorySelected('income')) {
    // W-2 Employment
    if (isSubcategorySelected('income', 'w2')) {
      const w2Count = getSubcategoryQuantity('income', 'w2');
      const hasW2 = hasDocumentType('W-2');
      
      if (w2Count > 0) {
        questions.push({
          id: uuidv4(),
          text: `You indicated having ${w2Count} W-2${w2Count > 1 ? 's' : ''}. Have you uploaded all your W-2 forms?`,
          categoryId: 'income',
          options: ['Yes', 'No', 'I need to get more W-2s'],
          missingDocument: hasW2 ? null : {
            name: 'W-2 Wage and Tax Statement',
            description: 'Form showing wages earned and taxes withheld from your employer',
            formNumber: 'W-2',
            requiredFor: 'Reporting employment income'
          },
          followUpQuestions: {
            'Yes': [{
              id: uuidv4(),
              text: 'Did you have any job-related expenses that were not reimbursed by your employer?',
              categoryId: 'income',
              options: ['Yes', 'No']
            }],
            'No': [{
              id: uuidv4(),
              text: 'When do you expect to receive your remaining W-2 forms?',
              categoryId: 'income',
              options: ['Within a week', 'Within a month', 'I need to contact my employer']
            }]
          }
        });
      }
    }

    // Freelance / 1099
    if (isSubcategorySelected('income', 'freelance')) {
      const has1099 = hasDocumentType('1099');
      questions.push({
        id: uuidv4(),
        text: 'For your freelance income, do you track your business expenses separately?',
        categoryId: 'income',
        options: ['Yes, detailed records', 'Somewhat', 'No, I need help with this'],
        missingDocument: has1099 ? null : {
          name: 'Form 1099',
          description: 'Form reporting income from freelance work or independent contracting',
          formNumber: '1099-NEC or 1099-MISC',
          requiredFor: 'Reporting freelance/independent contractor income'
        },
        followUpQuestions: {
          'Yes, detailed records': [{
            id: uuidv4(),
            text: 'What percentage of your home do you use exclusively for business?',
            categoryId: 'income',
            options: ['0% (I don\'t work from home)', '1-10%', '11-20%', '21-30%', 'More than 30%']
          }]
        }
      });
    }

    // Investment Income
    if (isSubcategorySelected('income', 'investments')) {
      questions.push({
        id: uuidv4(),
        text: 'What types of investment income did you receive this year?',
        categoryId: 'income',
        options: ['Dividends only', 'Capital gains only', 'Both dividends and capital gains', 'Neither'],
        missingDocument: {
          name: 'Form 1099-DIV and/or 1099-B',
          description: 'Forms reporting dividend income and/or proceeds from broker transactions',
          formNumber: '1099-DIV/1099-B',
          requiredFor: 'Reporting investment income'
        },
        followUpQuestions: {
          'Capital gains only': [{
            id: uuidv4(),
            text: 'Did you sell any investments that you held for less than a year?',
            categoryId: 'income',
            options: ['Yes', 'No', 'I\'m not sure']
          }],
          'Both dividends and capital gains': [{
            id: uuidv4(),
            text: 'Did you reinvest any of your dividends automatically?',
            categoryId: 'income',
            options: ['Yes, all of them', 'Yes, some of them', 'No']
          }]
        }
      });
    }
  }

  // Deductions
  if (isCategorySelected('deductions')) {
    // Charitable Donations
    if (isSubcategorySelected('deductions', 'charity')) {
      questions.push({
        id: uuidv4(),
        text: 'What types of charitable donations did you make this year?',
        categoryId: 'deductions',
        options: ['Cash/check donations', 'Donated goods/items', 'Both cash and goods', 'No donations'],
        followUpQuestions: {
          'Cash/check donations': [{
            id: uuidv4(),
            text: 'Do you have receipts for all donations over $250?',
            categoryId: 'deductions',
            options: ['Yes', 'No', 'Only for some']
          }],
          'Both cash and goods': [{
            id: uuidv4(),
            text: 'For donated items, do you have documentation of their fair market value?',
            categoryId: 'deductions',
            options: ['Yes', 'No', 'Only for some items']
          }]
        }
      });
    }

    // Medical Expenses
    if (isSubcategorySelected('deductions', 'medical')) {
      questions.push({
        id: uuidv4(),
        text: 'Did your total medical expenses exceed 7.5% of your adjusted gross income?',
        categoryId: 'deductions',
        options: ['Yes', 'No', 'I need help calculating this'],
        followUpQuestions: {
          'Yes': [{
            id: uuidv4(),
            text: 'Which types of medical expenses did you have?',
            categoryId: 'deductions',
            options: ['Doctor/hospital bills', 'Prescription medications', 'Health insurance premiums', 'All of these']
          }]
        }
      });
    }
  }

  // Home
  if (isCategorySelected('home')) {
    // Homeowner
    if (isSubcategorySelected('home', 'homeowner')) {
      const has1098 = hasDocumentType('1098');
      questions.push({
        id: uuidv4(),
        text: 'Did you pay mortgage interest on your primary residence this year?',
        categoryId: 'home',
        options: ['Yes', 'No'],
        missingDocument: has1098 ? null : {
          name: 'Mortgage Interest Statement',
          description: 'Statement showing interest paid on your mortgage',
          formNumber: '1098',
          requiredFor: 'Mortgage interest deduction'
        },
        followUpQuestions: {
          'Yes': [{
            id: uuidv4(),
            text: 'Did you pay any points when obtaining or refinancing your mortgage?',
            categoryId: 'home',
            options: ['Yes', 'No', 'I\'m not sure']
          }]
        }
      });

      questions.push({
        id: uuidv4(),
        text: 'Did you make any energy-efficient improvements to your home this year?',
        categoryId: 'home',
        options: ['Yes', 'No'],
        followUpQuestions: {
          'Yes': [{
            id: uuidv4(),
            text: 'What type of energy-efficient improvements did you make?',
            categoryId: 'home',
            options: ['Solar panels', 'Energy-efficient windows/doors', 'Insulation', 'HVAC system', 'Multiple improvements']
          }]
        }
      });
    }
    
    // Home Sale
    if (isSubcategorySelected('home', 'sale')) {
      questions.push({
        id: uuidv4(),
        text: 'Did you live in the home you sold for at least 2 of the last 5 years?',
        categoryId: 'home',
        options: ['Yes', 'No'],
        followUpQuestions: {
          'Yes': [{
            id: uuidv4(),
            text: 'What was the approximate gain on the sale of your home?',
            categoryId: 'home',
            options: ['Less than $250,000', '$250,000 - $500,000', 'More than $500,000', 'I had a loss']
          }]
        }
      });
    }
  }

  // Family
  if (isCategorySelected('family')) {
    // Dependents
    if (isSubcategorySelected('family', 'dependents')) {
      const dependentCount = getSubcategoryQuantity('family', 'dependents');
      const pluralText = dependentCount > 1 ? 'dependents' : 'dependent';
      
      questions.push({
        id: uuidv4(),
        text: `You indicated having ${dependentCount} ${pluralText}. What are their ages?`,
        categoryId: 'family',
        options: ['All under 17', 'Some under 17, some 17+', 'All 17+'],
        followUpQuestions: {
          'All under 17': [{
            id: uuidv4(),
            text: 'Do you have Social Security numbers for all dependents?',
            categoryId: 'family',
            options: ['Yes', 'No, need help with this']
          }],
          'Some under 17, some 17+': [{
            id: uuidv4(),
            text: 'Are any of your dependents full-time students?',
            categoryId: 'family',
            options: ['Yes', 'No']
          }]
        }
      });
    }
    
    // Child Care
    if (isSubcategorySelected('family', 'childcare')) {
      questions.push({
        id: uuidv4(),
        text: 'Do you have records of your childcare expenses with provider information?',
        categoryId: 'family',
        options: ['Yes, complete records', 'Yes, but missing some information', 'No'],
        missingDocument: {
          name: 'Childcare Provider Information',
          description: 'Documentation showing childcare payments and provider\'s tax ID',
          formNumber: null,
          requiredFor: 'Child and Dependent Care Credit'
        },
        followUpQuestions: {
          'Yes, complete records': [{
            id: uuidv4(),
            text: 'What was your total childcare expenses for the year?',
            categoryId: 'family',
            options: ['Less than $3,000', '$3,000 - $6,000', 'More than $6,000']
          }]
        }
      });
    }
  }

  // Education
  if (isCategorySelected('credits') && isSubcategorySelected('credits', 'education_credit')) {
    const has1098T = hasDocumentType('1098-T');
    questions.push({
      id: uuidv4(),
      text: 'Did you or a dependent pay for qualifying education expenses this year?',
      categoryId: 'credits',
      options: ['Yes, for myself', 'Yes, for my dependent', 'Yes, for both', 'No'],
      missingDocument: has1098T ? null : {
        name: 'Tuition Statement',
        description: 'Form showing tuition payments made to an eligible educational institution',
        formNumber: '1098-T',
        requiredFor: 'Education credits'
      },
      followUpQuestions: {
        'Yes, for myself': [{
          id: uuidv4(),
          text: 'Were you enrolled at least half-time in a degree program?',
          categoryId: 'credits',
          options: ['Yes', 'No']
        }],
        'Yes, for my dependent': [{
          id: uuidv4(),
          text: 'What year of college is your dependent in?',
          categoryId: 'credits',
          options: ['First year', 'Second year', 'Third year', 'Fourth year', 'Graduate school']
        }]
      }
    });
  }

  // Health
  if (isCategorySelected('health')) {
    // HSA
    if (isSubcategorySelected('health', 'hsa')) {
      questions.push({
        id: uuidv4(),
        text: 'Did you make contributions to a Health Savings Account (HSA) this year?',
        categoryId: 'health',
        options: ['Yes, through my employer', 'Yes, on my own', 'Both employer and personal contributions', 'No'],
        missingDocument: {
          name: 'HSA Contribution Statement',
          description: 'Form showing contributions to your Health Savings Account',
          formNumber: '5498-SA',
          requiredFor: 'HSA contribution deduction'
        },
        followUpQuestions: {
          'Yes, on my own': [{
            id: uuidv4(),
            text: 'How much did you contribute to your HSA this year?',
            categoryId: 'health',
            options: ['Less than $3,000', '$3,000 - $5,000', 'More than $5,000', 'I\'m not sure']
          }]
        }
      });
    }

    // Health Insurance
    if (isSubcategorySelected('health', 'insurance')) {
      questions.push({
        id: uuidv4(),
        text: 'Did you purchase health insurance through the marketplace (healthcare.gov)?',
        categoryId: 'health',
        options: ['Yes', 'No'],
        missingDocument: {
          name: 'Health Insurance Marketplace Statement',
          description: 'Form showing health insurance coverage and any premium tax credits',
          formNumber: '1095-A',
          requiredFor: 'Premium Tax Credit'
        }
      });
    }
  }

  // Add at least some general questions if we don't have enough
  if (questions.length < 3) {
    questions.push({
      id: uuidv4(),
      text: 'What is your filing status for this tax year?',
      categoryId: 'general',
      options: ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household', 'Qualifying widow(er)'],
      followUpQuestions: {
        'Married filing jointly': [{
          id: uuidv4(),
          text: 'Did your spouse have income during the tax year?',
          categoryId: 'general',
          options: ['Yes', 'No']
        }],
        'Head of household': [{
          id: uuidv4(),
          text: 'Did you provide more than half the cost of keeping up a home for the year?',
          categoryId: 'general',
          options: ['Yes', 'No', 'I\'m not sure']
        }]
      }
    });
    
    questions.push({
      id: uuidv4(),
      text: 'Did you work remotely at any point during the tax year?',
      categoryId: 'general',
      options: ['Yes, full-time remotely', 'Yes, partially remotely', 'No'],
      followUpQuestions: {
        'Yes, full-time remotely': [{
          id: uuidv4(),
          text: 'Did you maintain a dedicated home office space used exclusively for work?',
          categoryId: 'general',
          options: ['Yes', 'No']
        }]
      }
    });
  }

  return questions;
};
