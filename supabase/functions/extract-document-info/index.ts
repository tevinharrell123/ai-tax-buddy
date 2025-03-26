
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.20.1";

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
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const { documents } = await req.json();

    // Prepare extracted fields array
    const extractedFields = [];

    // Process each document
    for (const doc of documents) {
      // In a real scenario, you'd read the file content here
      // For this example, we'll simulate extraction
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful tax document analysis assistant. Extract key financial information from the document."
          },
          {
            role: "user",
            content: `Analyze the following document and extract key tax-related fields: ${doc.name}`
          }
        ],
        max_tokens: 300
      });

      const extractedText = response.choices[0].message.content;

      // Parse the extracted text into structured fields
      const fields = [
        {
          id: `${doc.id}_income`,
          name: "Estimated Income",
          value: extractedText.includes("income") 
            ? extractedText.match(/income.*?(\$?\d+(?:,\d{3})*(?:\.\d{2})?)/i)?.[1] || "Not specified"
            : "Not specified",
          isCorrect: null,
          originalValue: extractedText
        },
        {
          id: `${doc.id}_tax_year`,
          name: "Tax Year",
          value: extractedText.match(/\b(20\d{2})\b/)?.[1] || "Not specified",
          isCorrect: null,
          originalValue: extractedText
        }
      ];

      extractedFields.push(...fields);
    }

    return new Response(JSON.stringify({ extractedFields }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });

  } catch (error) {
    console.error('Error in document extraction:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
