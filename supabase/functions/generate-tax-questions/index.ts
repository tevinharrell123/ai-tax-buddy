
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
    const defaultQuestions = generateDefaultQuestions(selectedCategories, documents, extractedFields);

    try {
      // Try to get AI-generated questions if API key exists
      const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
      
      if (!claudeApiKey) {
        console.log("Claude API key not found, using default questions");
        return new Response(
          JSON.stringify({ questions: defaultQuestions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format the context for Claude
      let prompt = `You are an expert tax professional and AI assistant that generates personalized tax questions to help users maximize their tax returns. 
      
I'm going to provide you with detailed information about a taxpayer, including:
1. Tax categories they've selected as relevant to their situation
2. Documents they've already uploaded
3. Information extracted from those documents
4. Previous answers to tax-related questions
5. Details about their selections

Your task is to generate 3-5 HIGHLY RELEVANT AND SPECIFIC tax questions that will:
- Help identify additional tax deductions or credits they qualify for
- Determine if any critical tax documents are missing
- Gather information necessary for maximizing their refund
- Provide tailored follow-up questions based on their answers

===== TAXPAYER INFORMATION =====

Selected Categories (and subcategories):
${JSON.stringify(selectedCategories, null, 2)}

Uploaded Documents:
${JSON.stringify(documents, null, 2)}

Extracted Information from Documents:
${JSON.stringify(extractedFields, null, 2)}

Previous Category-Related Answers:
${JSON.stringify(categoryAnswers, null, 2)}

Previous Question Answers:
${JSON.stringify(previousAnswers, null, 2)}

===== IMPORTANT INSTRUCTIONS =====

1. DO NOT ask questions that duplicate information we already have from their documents or previous answers.

2. DO generate specific, personalized questions based on their exact tax situation.

3. Focus on specific details that could lead to tax benefits, not general questions like "How many jobs did you have?"

4. For any appropriate question, include detailed follow-up questions that appear when certain answers are selected.

5. If you detect a missing tax document, specify exactly what document is missing, what form number it is, and why it's needed.

6. Examples of GOOD questions:
   - "Your W-2 shows you contributed $2,500 to your 401(k). Did you make any additional retirement contributions to an IRA?"
   - "Based on your homeowner status, do you have mortgage interest statements (Form 1098) to claim the mortgage interest deduction?"
   - "You indicated having a child. What is their age and did they attend college or childcare during the tax year?"

7. Examples of BAD questions:
   - "Did you have any income?" (Too vague, we already know from documents)
   - "How many dependents do you have?" (If they already indicated this in categories)

Output valid JSON in this format:
[
  {
    "id": "question-uuid",
    "text": "Question text here - be specific and personalized",
    "categoryId": "related-category-id",
    "options": ["Option 1", "Option 2", "Option 3"],
    "missingDocument": null or { 
      "name": "Document Name", 
      "description": "Brief description of what this document is",
      "formNumber": "1098", 
      "requiredFor": "Mortgage Interest Deduction" 
    },
    "followUpQuestions": {
      "Option 1": [
        {
          "id": "follow-up-question-uuid",
          "text": "Follow-up question text here - be detailed",
          "categoryId": "related-category-id",
          "options": ["Option A", "Option B", "Option C"]
        }
      ]
    }
  }
]`;

      console.log("Sending request to Claude API");
      
      // Set timeout to avoid waiting too long for the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 4000,
            messages: [
              { role: "user", content: prompt }
            ]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle rate limiting or other API errors
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Claude API error:", errorData);
          throw new Error(`Claude API returned ${response.status}: ${JSON.stringify(errorData)}`);
        }

        const claudeResponse = await response.json();
        console.log("Received Claude response status:", response.status);
        
        if (!claudeResponse.content || claudeResponse.content.length === 0) {
          throw new Error("Invalid response from Claude API");
        }
        
        // Extract the JSON from Claude's response
        const content = claudeResponse.content[0].text;
        let extractedQuestions;
        
        try {
          // Look for JSON array in the response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            extractedQuestions = JSON.parse(jsonMatch[0]);
            
            // Log success and return Claude-generated questions
            console.log(`Successfully generated ${extractedQuestions.length} personalized questions`);
            
            return new Response(
              JSON.stringify({ questions: extractedQuestions }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            throw new Error("Could not extract JSON from Claude response");
          }
        } catch (parseError) {
          console.error("Error parsing Claude response:", parseError);
          throw parseError;
        }
      } catch (fetchError) {
        console.error("Error calling Claude API:", fetchError);
        throw fetchError;
      }
    } catch (claudeError) {
      console.error("Claude API error, falling back to default questions:", claudeError);
      // Fall back to default questions in case of any error with Claude
      return new Response(
        JSON.stringify({ questions: defaultQuestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

  // Generate questions based on selected categories
  if (isCategorySelected('income')) {
    questions.push({
      "id": generateId(),
      "text": "Do you have any income from investments, dividends, or capital gains?",
      "categoryId": "income",
      "options": ["Yes", "No", "I'm not sure"],
      "followUpQuestions": {
        "Yes": [
          {
            "id": generateId(),
            "text": "Do you have documentation such as Form 1099-DIV or 1099-B for these investment earnings?",
            "categoryId": "income",
            "options": ["Yes, I have all documents", "I have some documents", "No, I need to obtain them"]
          }
        ]
      }
    });
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
    questions.push({
      "id": generateId(),
      "text": "Did you pay for childcare expenses for your dependent(s) under age 13?",
      "categoryId": "family",
      "options": ["Yes", "No"],
      "missingDocument": {
        "name": "Childcare Provider Information",
        "description": "Documentation showing childcare payments and provider's tax ID",
        "formNumber": null,
        "requiredFor": "Child and Dependent Care Credit"
      },
      "followUpQuestions": {
        "Yes": [
          {
            "id": generateId(),
            "text": "Do you have the tax identification number (SSN or EIN) of your childcare provider?",
            "categoryId": "family",
            "options": ["Yes", "No", "I can obtain it"]
          }
        ]
      }
    });
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
      },
      "followUpQuestions": {
        "Yes": [
          {
            "id": generateId(),
            "text": "Did you pay any points when obtaining or refinancing your mortgage?",
            "categoryId": "home",
            "options": ["Yes", "No", "I'm not sure"]
          }
        ]
      }
    });
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

  // If we still don't have at least 3 questions, add some general ones
  if (questions.length < 3) {
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
    
    questions.push({
      "id": generateId(),
      "text": "Did you have any student loan payments during the tax year?",
      "categoryId": "education",
      "options": ["Yes", "No"],
      "followUpQuestions": {
        "Yes": [
          {
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
          }
        ]
      }
    });
  }
  
  return questions;
}
