
import { TaxCategory, Question } from '../context/TaxOrganizerContext';

export const taxCategories: TaxCategory[] = [
  {
    id: 'income',
    name: 'Income',
    icon: 'dollar-sign',
    selected: false,
    description: 'Employment, investments, and other sources of income',
    badge: null,
    subcategories: [
      { id: 'w2', name: 'W-2 Employment', selected: false },
      { id: 'freelance', name: 'Freelance / 1099', selected: false },
      { id: 'investments', name: 'Investment Income', selected: false },
      { id: 'retirement', name: 'Retirement Income', selected: false },
      { id: 'rental', name: 'Rental Income', selected: false },
    ]
  },
  {
    id: 'deductions',
    name: 'Deductions',
    icon: 'minus-circle',
    selected: false,
    description: 'Tax deductions that may reduce your taxable income',
    badge: null,
    subcategories: [
      { id: 'mortgage', name: 'Mortgage Interest', selected: false },
      { id: 'charity', name: 'Charitable Donations', selected: false },
      { id: 'medical', name: 'Medical Expenses', selected: false },
      { id: 'education', name: 'Education Expenses', selected: false },
      { id: 'business', name: 'Business Expenses', selected: false },
    ]
  },
  {
    id: 'credits',
    name: 'Tax Credits',
    icon: 'gift',
    selected: false,
    description: 'Tax credits that may reduce your tax bill directly',
    badge: null,
    subcategories: [
      { id: 'child', name: 'Child Tax Credit', selected: false },
      { id: 'education_credit', name: 'Education Credits', selected: false },
      { id: 'energy', name: 'Energy Credits', selected: false },
      { id: 'eitc', name: 'Earned Income Credit', selected: false },
    ]
  },
  {
    id: 'family',
    name: 'Family',
    icon: 'users',
    selected: false,
    description: 'Family-related tax situations and dependents',
    badge: null,
    subcategories: [
      { id: 'dependents', name: 'Dependents', selected: false },
      { id: 'childcare', name: 'Child Care Expenses', selected: false },
      { id: 'adoption', name: 'Adoption', selected: false },
    ]
  },
  {
    id: 'home',
    name: 'Home',
    icon: 'home',
    selected: false,
    description: 'Home ownership, sale, or rental property',
    badge: null,
    subcategories: [
      { id: 'homeowner', name: 'Homeowner', selected: false },
      { id: 'sale', name: 'Home Sale', selected: false },
      { id: 'improvements', name: 'Home Improvements', selected: false },
    ]
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'heart',
    selected: false,
    description: 'Health insurance and medical expenses',
    badge: null,
    subcategories: [
      { id: 'insurance', name: 'Health Insurance', selected: false },
      { id: 'hsa', name: 'HSA Contributions', selected: false },
      { id: 'medical_expenses', name: 'Medical Expenses', selected: false },
    ]
  },
  {
    id: 'investments',
    name: 'Investments',
    icon: 'trending-up',
    selected: false,
    description: 'Stocks, cryptocurrency, and other investments',
    badge: null,
    subcategories: [
      { id: 'stocks', name: 'Stocks & Bonds', selected: false },
      { id: 'crypto', name: 'Cryptocurrency', selected: false },
      { id: 'retirement_accounts', name: 'Retirement Accounts', selected: false },
    ]
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'briefcase',
    selected: false,
    description: 'Self-employment and business-related taxes',
    badge: null,
    subcategories: [
      { id: 'self_employed', name: 'Self-Employed', selected: false },
      { id: 'business_expenses', name: 'Business Expenses', selected: false },
      { id: 'home_office', name: 'Home Office', selected: false },
    ]
  },
];

export const taxQuestions: Question[] = [
  {
    id: 'q1',
    text: 'Did you receive any W-2 forms from employers this year?',
    categoryId: 'income',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'income', selected: true }
  },
  {
    id: 'q2',
    text: 'Did you have any freelance or self-employment income?',
    categoryId: 'income',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'income', selected: true }
  },
  {
    id: 'q3',
    text: 'Did you receive any income from investments?',
    categoryId: 'income',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'income', selected: true }
  },
  {
    id: 'q4',
    text: 'Did you pay mortgage interest this year?',
    categoryId: 'deductions',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'deductions', selected: true }
  },
  {
    id: 'q5',
    text: 'Did you make any charitable donations?',
    categoryId: 'deductions',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'deductions', selected: true }
  },
  {
    id: 'q6',
    text: 'Do you have children or dependents?',
    categoryId: 'family',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'family', selected: true }
  },
  {
    id: 'q7',
    text: 'Did you pay for childcare this year?',
    categoryId: 'family',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'family', selected: true }
  },
  {
    id: 'q8',
    text: 'Did you have significant medical expenses this year?',
    categoryId: 'health',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'health', selected: true }
  },
  {
    id: 'q9',
    text: 'Did you contribute to an HSA this year?',
    categoryId: 'health',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'health', selected: true }
  },
  {
    id: 'q10',
    text: 'Did you sell any stocks, bonds, or cryptocurrency this year?',
    categoryId: 'investments',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'investments', selected: true }
  },
  {
    id: 'q11',
    text: 'Did you contribute to a retirement account?',
    categoryId: 'investments',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'investments', selected: true }
  },
  {
    id: 'q12',
    text: 'Do you own a home?',
    categoryId: 'home',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'home', selected: true }
  },
  {
    id: 'q13',
    text: 'Did you sell a home this year?',
    categoryId: 'home',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'home', selected: true }
  },
  {
    id: 'q14',
    text: 'Did you use part of your home exclusively for business?',
    categoryId: 'business',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'business', selected: true }
  },
  {
    id: 'q15',
    text: 'Did you have any business expenses?',
    categoryId: 'business',
    answer: null,
    options: ['Yes', 'No'],
    condition: { categoryId: 'business', selected: true }
  }
];

export const sampleExtractedFields = [
  {
    id: 'field1',
    name: 'First Name',
    value: 'John',
    isCorrect: null,
    originalValue: 'John'
  },
  {
    id: 'field2',
    name: 'Last Name',
    value: 'Smith',
    isCorrect: null,
    originalValue: 'Smith'
  },
  {
    id: 'field3',
    name: 'SSN',
    value: 'XXX-XX-1234',
    isCorrect: null,
    originalValue: 'XXX-XX-1234'
  },
  {
    id: 'field4',
    name: 'Employer',
    value: 'Acme Inc.',
    isCorrect: null,
    originalValue: 'Acme Inc.'
  },
  {
    id: 'field5',
    name: 'W2 Income',
    value: '$72,000',
    isCorrect: null,
    originalValue: '$72,000'
  },
  {
    id: 'field6',
    name: 'Federal Tax Withheld',
    value: '$12,350',
    isCorrect: null,
    originalValue: '$12,350'
  }
];
