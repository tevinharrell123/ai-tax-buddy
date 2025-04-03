
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
          }],
          'Somewhat': [{
            id: uuidv4(),
            text: 'Do you have a separate business bank account?',
            categoryId: 'income',
            options: ['Yes', 'No']
          }],
          'No, I need help with this': [{
            id: uuidv4(),
            text: 'What type of freelance work do you primarily do?',
            categoryId: 'income',
            options: ['Creative work', 'Consulting', 'Digital services', 'Physical services', 'Other']
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
          }],
          'Donated goods/items': [{
            id: uuidv4(),
            text: 'What types of items did you donate?',
            categoryId: 'deductions',
            options: ['Clothing', 'Household goods', 'Electronics', 'Vehicles', 'Mixed items']
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
          }],
          'I need help calculating this': [{
            id: uuidv4(),
            text: 'What was your approximate adjusted gross income?',
            categoryId: 'deductions',
            options: ['Under $50,000', '$50,000-$100,000', '$100,000-$200,000', 'Over $200,000']
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
          }],
          'No': [{
            id: uuidv4(),
            text: 'Was your home sale due to a job relocation, health reasons, or other unforeseen circumstances?',
            categoryId: 'home',
            options: ['Yes, job relocation', 'Yes, health reasons', 'Yes, other circumstances', 'No']
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
          'All under 17': [
            {
              id: uuidv4(),
              text: 'Do you have Social Security numbers for all dependents?',
              categoryId: 'family',
              options: ['Yes', 'No, need help with this']
            },
            {
              id: uuidv4(),
              text: 'Did you pay for childcare expenses for any of your dependents?',
              categoryId: 'family',
              options: ['Yes', 'No']
            }
          ],
          'Some under 17, some 17+': [
            {
              id: uuidv4(),
              text: 'Are any of your dependents full-time students?',
              categoryId: 'family',
              options: ['Yes', 'No']
            },
            {
              id: uuidv4(),
              text: 'Did you contribute to any education expenses for your 17+ dependents?',
              categoryId: 'family',
              options: ['Yes, tuition payments', 'Yes, other education expenses', 'No']
            }
          ],
          'All 17+': [
            {
              id: uuidv4(),
              text: 'Do any of your dependents have income of their own?',
              categoryId: 'family',
              options: ['Yes', 'No']
            }
          ]
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
          }],
          'Yes, but missing some information': [{
            id: uuidv4(),
            text: 'What information are you missing about your childcare provider?',
            categoryId: 'family',
            options: ['Tax ID number', 'Complete address', 'Total amount paid', 'Multiple items']
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
        }, {
          id: uuidv4(),
          text: 'Is this your first four years of post-secondary education?',
          categoryId: 'credits',
          options: ['Yes', 'No']
        }],
        'Yes, for my dependent': [{
          id: uuidv4(),
          text: 'What year of college is your dependent in?',
          categoryId: 'credits',
          options: ['First year', 'Second year', 'Third year', 'Fourth year', 'Graduate school']
        }, {
          id: uuidv4(),
          text: 'Did you pay for all of the education expenses, or did your dependent contribute?',
          categoryId: 'credits',
          options: ['I paid all expenses', 'Dependent contributed partially', 'We split costs equally']
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
          }, {
            id: uuidv4(),
            text: 'Do you have a family HSA plan or an individual plan?',
            categoryId: 'health',
            options: ['Family plan', 'Individual plan']
          }],
          'Both employer and personal contributions': [{
            id: uuidv4(),
            text: 'Do you know the total combined contribution amount?',
            categoryId: 'health',
            options: ['Yes', 'No, need to calculate']
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
        },
        followUpQuestions: {
          'Yes': [{
            id: uuidv4(),
            text: 'Did you receive advance payments of the premium tax credit?',
            categoryId: 'health',
            options: ['Yes', 'No', 'I\'m not sure']
          }, {
            id: uuidv4(),
            text: 'Was everyone in your tax household covered by the marketplace plan for the full year?',
            categoryId: 'health',
            options: ['Yes', 'No, partial year coverage', 'No, some people had other coverage']
          }]
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
        }, {
          id: uuidv4(),
          text: 'Are you and your spouse filing a joint return for the first time?',
          categoryId: 'general',
          options: ['Yes', 'No']
        }],
        'Head of household': [{
          id: uuidv4(),
          text: 'Did you provide more than half the cost of keeping up a home for the year?',
          categoryId: 'general',
          options: ['Yes', 'No', 'I\'m not sure']
        }, {
          id: uuidv4(),
          text: 'Did a qualifying person live with you for more than half the year?',
          categoryId: 'general',
          options: ['Yes', 'No']
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
        }, {
          id: uuidv4(),
          text: 'Did your employer reimburse you for any home office expenses?',
          categoryId: 'general',
          options: ['Yes, fully reimbursed', 'Yes, partially reimbursed', 'No reimbursement']
        }],
        'Yes, partially remotely': [{
          id: uuidv4(),
          text: 'How many days per week did you typically work from home?',
          categoryId: 'general',
          options: ['1 day', '2 days', '3 days', '4 days', 'Varies significantly']
        }]
      }
    });
    
    questions.push({
      id: uuidv4(),
      text: 'Did you move to a different state during the tax year?',
      categoryId: 'general',
      options: ['Yes', 'No'],
      followUpQuestions: {
        'Yes': [{
          id: uuidv4(),
          text: 'Was your move related to a new job or work location?',
          categoryId: 'general',
          options: ['Yes', 'No']
        }, {
          id: uuidv4(),
          text: 'Have you updated your address with all your employers and financial institutions?',
          categoryId: 'general',
          options: ['Yes', 'No', 'Only some']
        }]
      }
    });
  }

  // Always add a student loan question if we have education categories
  if (isCategorySelected('credits')) {
    questions.push({
      id: uuidv4(),
      text: 'Did you make any student loan interest payments during the tax year?',
      categoryId: 'credits',
      options: ['Yes', 'No'],
      missingDocument: {
        name: 'Student Loan Interest Statement',
        description: 'Form showing interest paid on qualified student loans',
        formNumber: '1098-E',
        requiredFor: 'Student Loan Interest Deduction'
      },
      followUpQuestions: {
        'Yes': [{
          id: uuidv4(),
          text: 'How much student loan interest did you pay?',
          categoryId: 'credits',
          options: ['Less than $600', '$600-$2,000', '$2,000-$2,500', 'More than $2,500']
        }]
      }
    });
  }

  // Always add retirement question
  questions.push({
    id: uuidv4(),
    text: 'Did you contribute to any retirement accounts this year?',
    categoryId: 'general',
    options: ['Yes', 'No'],
    followUpQuestions: {
      'Yes': [{
        id: uuidv4(),
        text: 'Which type of retirement accounts did you contribute to?',
        categoryId: 'general',
        options: ['Traditional IRA', 'Roth IRA', '401(k)/403(b)', 'Multiple types']
      }, {
        id: uuidv4(),
        text: 'Are you eligible for the Retirement Savings Contributions Credit (Saver\'s Credit)?',
        categoryId: 'general',
        options: ['Yes', 'No', 'I\'m not sure']
      }]
    }
  });

  return questions;
};
