
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
    
    // Prepare extractedFields array with categories
    const extractedFields = [];
    
    // Process each document
    for (const doc of documents) {
      console.log(`Processing document: ${doc.name}`);
      
      // Create prompt based on document name and type
      const documentPrompt = createDocumentPrompt(doc);
      
      // Call OpenAI to analyze the document
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a tax document analyzer that extracts specific information from tax documents. Extract key information in JSON format."
          },
          {
            role: "user",
            content: documentPrompt
          }
        ],
        max_tokens: 500
      });

      console.log("OpenAI response received");
      const extractedText = response.choices[0].message.content;
      console.log(`Extracted text: ${extractedText}`);
      
      // Parse the extracted fields based on document type
      const parsedFields = parseDocumentFields(doc, extractedText);
      extractedFields.push(...parsedFields);
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

// Create appropriate prompt based on document type
function createDocumentPrompt(doc) {
  const fileName = doc.name.toLowerCase();
  
  if (fileName.includes('w-2') || fileName.includes('w2')) {
    return `Extract the following from this W-2 document: 
    - Employer name and address
    - Employee name and address
    - Employee SSN (last 4 digits only)
    - Wages/Tips amount
    - Federal tax withheld
    - Number of jobs represented (usually 1 per W-2)`;
  } 
  else if (fileName.includes('1098') || fileName.includes('mortgage')) {
    return `Extract the following from this mortgage document:
    - Mortgage interest paid
    - Property taxes paid if available
    - Homeowner status (yes/no)`;
  }
  else if (fileName.includes('1099')) {
    return `Extract the following from this 1099 document:
    - Type of 1099 (MISC, NEC, DIV, INT, etc.)
    - Payer name
    - Recipient name
    - Amount paid
    - Tax withheld if any`;
  }
  else if (fileName.includes('1095') || fileName.includes('health')) {
    return `Extract health insurance information:
    - Coverage type
    - Months covered
    - Premium amount if available`;
  }
  else if (fileName.includes('license') || fileName.includes('id') || fileName.includes('passport')) {
    return `Extract the following personal information:
    - Full name
    - Address
    - Date of birth
    - ID number (show last 4 digits only)
    - Expiration date`;
  }
  else if (fileName.includes('student') || fileName.includes('1098-t') || fileName.includes('education')) {
    return `Extract education information:
    - Institution name
    - Student name
    - Tuition paid
    - Education credits if available`;
  }
  else {
    return `Analyze this tax document and extract key information including:
    - Document type
    - Names of individuals
    - Any monetary amounts and their purpose
    - Dates
    - Any identification numbers (show last 4 digits only)
    - Contact information`;
  }
}

// Parse extracted text into structured fields
function parseDocumentFields(doc, extractedText) {
  const fields = [];
  const fileName = doc.name.toLowerCase();
  
  try {
    // Try to parse JSON if AI returned it in that format
    let extractedData = extractedText;
    try {
      if (extractedText.includes('{') && extractedText.includes('}')) {
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.log("Could not parse as JSON, using text extraction fallbacks");
      extractedData = extractedText;
    }
    
    // Document category detection
    let documentCategory = "Other";
    
    if (fileName.includes('w-2') || fileName.includes('w2')) {
      documentCategory = "Income - Employment";
      
      // Basic W-2 fields
      fields.push({
        id: `${doc.id}_employer_name`,
        name: "Employer Name",
        value: extractValue(extractedData, ["employer name", "employer", "company name"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Income Information"
      });
      
      fields.push({
        id: `${doc.id}_employee_name`,
        name: "Employee Name",
        value: extractValue(extractedData, ["employee name", "employee", "name"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Personal Information"
      });
      
      fields.push({
        id: `${doc.id}_wages`,
        name: "Wages/Tips",
        value: extractValue(extractedData, ["wages", "tips", "compensation", "box 1"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Income Information"
      });
      
      fields.push({
        id: `${doc.id}_employment_summary`,
        name: "Employment Summary",
        value: "Had 1 job", // Default to 1 job per W-2
        isCorrect: null,
        originalValue: extractedText,
        category: "Income Information"
      });
    } 
    else if (fileName.includes('1098') || fileName.includes('mortgage')) {
      documentCategory = "Deductions - Mortgage";
      
      fields.push({
        id: `${doc.id}_mortgage_interest`,
        name: "Mortgage Interest Paid",
        value: extractValue(extractedData, ["mortgage interest", "interest paid", "interest"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Expense and Deduction Information"
      });
      
      fields.push({
        id: `${doc.id}_home_ownership`,
        name: "Home Ownership",
        value: "Yes", // If they have a 1098, they own a home
        isCorrect: null,
        originalValue: extractedText,
        category: "Expense and Deduction Information"
      });
    }
    else if (fileName.includes('1099')) {
      documentCategory = "Income - Other";
      
      fields.push({
        id: `${doc.id}_1099_type`,
        name: "1099 Type",
        value: extractValue(extractedData, ["type", "form type", "1099 type"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Income Information"
      });
      
      fields.push({
        id: `${doc.id}_1099_amount`,
        name: "Amount Received",
        value: extractValue(extractedData, ["amount", "payment", "income", "paid"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Income Information"
      });
    }
    else if (fileName.includes('license') || fileName.includes('id') || fileName.includes('passport')) {
      documentCategory = "Personal Identification";
      
      fields.push({
        id: `${doc.id}_full_name`,
        name: "Full Name",
        value: extractValue(extractedData, ["full name", "name"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Personal Identification Information"
      });
      
      fields.push({
        id: `${doc.id}_address`,
        name: "Address",
        value: extractValue(extractedData, ["address", "residential address", "home address"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Personal Identification Information"
      });
      
      fields.push({
        id: `${doc.id}_dob`,
        name: "Date of Birth",
        value: extractValue(extractedData, ["date of birth", "dob", "birth date"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Personal Identification Information"
      });
      
      const idNumber = extractValue(extractedData, ["id number", "identification number", "license number", "passport number"]);
      
      // Mask the ID number if it's longer than 4 digits
      let maskedId = idNumber;
      if (idNumber && idNumber.length > 4) {
        const lastFour = idNumber.slice(-4);
        maskedId = `xxx-xx-${lastFour}`;
      }
      
      fields.push({
        id: `${doc.id}_id_number`,
        name: "ID Number",
        value: maskedId,
        isCorrect: null,
        originalValue: extractedText,
        category: "Personal Identification Information"
      });
    }
    else if (fileName.includes('student') || fileName.includes('1098-t') || fileName.includes('education')) {
      documentCategory = "Education";
      
      fields.push({
        id: `${doc.id}_school_name`,
        name: "Educational Institution",
        value: extractValue(extractedData, ["school", "university", "college", "institution"]),
        isCorrect: null,
        originalValue: extractedText,
        category: "Education Information"
      });
      
      fields.push({
        id: `${doc.id}_education_summary`,
        name: "Education Status",
        value: "Attended 1 college",
        isCorrect: null,
        originalValue: extractedText,
        category: "Education Information"
      });
    }
    else {
      // Generic document handling
      fields.push({
        id: `${doc.id}_document_type`,
        name: "Document Type",
        value: extractValue(extractedData, ["document type", "form", "type"]) || "Unknown Document",
        isCorrect: null,
        originalValue: extractedText,
        category: "Other Information"
      });
      
      fields.push({
        id: `${doc.id}_summary`,
        name: "Document Summary",
        value: summarizeDocument(extractedData),
        isCorrect: null,
        originalValue: extractedText,
        category: "Other Information"
      });
    }
  } catch (error) {
    console.error("Error parsing document fields:", error);
    
    // Fallback field if parsing fails
    fields.push({
      id: `${doc.id}_fallback`,
      name: "Document Information",
      value: "Document processed but content could not be fully extracted",
      isCorrect: null,
      originalValue: extractedText,
      category: "Other Information"
    });
  }
  
  return fields;
}

// Helper to extract values from potential JSON or text
function extractValue(data, possibleKeys) {
  // If data is an object, try to find matching keys
  if (typeof data === 'object' && data !== null) {
    for (const key of possibleKeys) {
      for (const dataKey in data) {
        if (dataKey.toLowerCase().includes(key.toLowerCase()) && data[dataKey]) {
          return data[dataKey];
        }
      }
    }
    return "Not found";
  }
  
  // If it's a string, try simple pattern matching
  if (typeof data === 'string') {
    for (const key of possibleKeys) {
      const regex = new RegExp(`${key}[:\\s]+(.*?)(?:\\n|$)`, 'i');
      const match = data.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Very simple fallback
    for (const key of possibleKeys) {
      if (data.toLowerCase().includes(key.toLowerCase())) {
        const startIndex = data.toLowerCase().indexOf(key.toLowerCase()) + key.length;
        const endIndex = data.indexOf('\n', startIndex);
        if (endIndex > startIndex) {
          return data.substring(startIndex, endIndex).replace(/[:\s]+/, '').trim();
        }
      }
    }
  }
  
  return "Not found";
}

// Create a summary from extracted text
function summarizeDocument(data) {
  if (typeof data === 'object' && data !== null) {
    // Try to create a summary from available keys/values
    const keyValues = Object.entries(data)
      .filter(([k, v]) => v && typeof v === 'string' && v.length < 100)
      .slice(0, 3);
      
    if (keyValues.length > 0) {
      return keyValues.map(([k, v]) => `${k}: ${v}`).join(', ');
    }
  }
  
  if (typeof data === 'string') {
    // Return first 100 chars as summary
    return data.substring(0, 100).trim() + (data.length > 100 ? '...' : '');
  }
  
  return "Document processed successfully";
}
