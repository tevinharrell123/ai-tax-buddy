
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
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: 'Claude API key not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      })
    });

    const claudeResponse = await response.json();
    console.log("Received Claude response:", claudeResponse);
    
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
      } else {
        throw new Error("Could not extract JSON from Claude response");
      }
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      console.log("Raw response:", content);
      
      // Fallback to default questions with follow-ups
      extractedQuestions = [
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
              },
              {
                "id": "follow-up-dep-2",
                "text": "Was your dependent a full-time student for at least 5 months of the year?",
                "categoryId": "family",
                "options": ["Yes", "No"]
              }
            ],
            "Yes, multiple dependents": [
              {
                "id": "follow-up-deps-1",
                "text": "How many dependents do you have?",
                "categoryId": "family",
                "options": ["2", "3", "4", "5 or more"]
              },
              {
                "id": "follow-up-deps-2",
                "text": "Were any of your dependents full-time students for at least 5 months of the year?",
                "categoryId": "family",
                "options": ["Yes, all of them", "Yes, some of them", "No"]
              }
            ]
          }
        }
      ];
    }
    
    return new Response(
      JSON.stringify({ questions: extractedQuestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
