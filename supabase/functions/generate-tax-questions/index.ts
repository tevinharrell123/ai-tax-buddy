
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

    const { selectedCategories, documents } = await req.json();
    
    console.log("Received request with:", { 
      categoriesCount: selectedCategories?.length || 0, 
      documentsCount: documents?.length || 0 
    });

    // Format the context for Claude
    let prompt = `You are a tax expert AI that generates relevant tax questions to help users maximize their tax returns.

Based on the following selected tax categories and uploaded documents, generate a set of 3-5 personalized tax questions that would help the user maximize their tax refund.

Selected Categories:
${JSON.stringify(selectedCategories, null, 2)}

Uploaded Documents:
${JSON.stringify(documents, null, 2)}

For each question:
1. Make it specific to the categories and documents
2. Include appropriate options for multiple choice answers
3. Identify if any required document is missing
4. For yes/no questions that can lead to potential deductions or credits, include follow-up questions
5. Provide a question ID, text, category ID reference, and multiple choice options

Output only valid JSON in this format:
[
  {
    "id": "question-uuid",
    "text": "Question text here",
    "categoryId": "related-category-id",
    "options": ["Option 1", "Option 2", "Option 3"],
    "missingDocument": null or { "name": "Document Name", "description": "Brief description of what this document is" },
    "followUpQuestions": {
      "Option 1": [
        {
          "id": "follow-up-question-uuid",
          "text": "Follow-up question text here",
          "categoryId": "related-category-id",
          "options": ["Option A", "Option B", "Option C"]
        }
      ]
    }
  },
  ...more questions
]

Important: Include detailed follow-up questions whenever a response to a main question could lead to additional tax deductions or credits. For example, if asking about dependents, include follow-ups about their ages, student status, etc. If asking about education expenses, include follow-ups about textbooks, equipment, etc. These follow-up questions are critical for maximizing the user's tax refund.`;

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
