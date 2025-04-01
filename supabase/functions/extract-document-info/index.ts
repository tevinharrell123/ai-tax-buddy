import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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
      throw new Error('CLAUDE_API_KEY is not set in environment variables');
    }

    const { documents } = await req.json();
    console.log(`Processing ${documents.length} documents`);
    
    // Prepare extractedFields array
    const extractedFields = [];
    
    // Process each document
    for (const doc of documents) {
      console.log(`Processing document: ${doc.name}, type: ${doc.type}`);
      
      // Create more specific, detailed prompts based on document name and type
      const documentPrompt = createDetailedPrompt(doc);
      
      // Call Claude to analyze the document
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: documentPrompt
                }
              ]
            }
          ],
          system: "You are a specialized tax document analyzer that extracts specific information from tax documents. Extract all requested information in a detailed, structured JSON format. If you cannot find a value, respond with \"null\" rather than \"Not found\". Focus on finding precise values for each requested field.",
          response_format: { type: "json_object" }
        })
      });

      console.log("Claude API response received");
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error from Claude API: ${response.status} - ${errorBody}`);
        throw new Error(`Claude API error: ${response.status}`);
      }
      
      const claudeResponse = await response.json();
      const extractedText = claudeResponse.content[0].text;
      console.log(`Extracted text sample: ${extractedText.substring(0, 100)}...`);
      
      // Parse the extracted fields - enhanced parsing logic
      try {
        // Attempt to parse JSON response
        const extracted = JSON.parse(extractedText);
        const parsedFields = parseExtractedData(doc, extracted);
        extractedFields.push(...parsedFields);
      } catch (error) {
        console.error("JSON parsing error:", error);
        // Fallback to text-based extraction if JSON parsing fails
        const parsedFields = parseDocumentFields(doc, extractedText);
        extractedFields.push(...parsedFields);
      }
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

// Create more detailed prompts based on document type - keeping the same logic
function createDetailedPrompt(doc) {
  const fileName = doc.name.toLowerCase();
  
  if (fileName.includes('w-2') || fileName.includes('w2')) {
    return `Extract the following from this W-2 document in JSON format:
    {
      "employer_name": "Full employer name",
      "employer_address": "Complete employer address",
      "employee_name": "Full employee name",
      "employee_address": "Complete employee address",
      "employee_ssn": "Last 4 digits only",
      "wages": "Box 1 wages amount",
      "federal_tax_withheld": "Box 2 amount",
      "social_security_wages": "Box 3 amount",
      "medicare_wages": "Box 5 amount",
      "year": "Tax year",
      "ein": "Employer Identification Number"
    }
    
    Look carefully at all sections of the W-2. If any field is not visible or cannot be determined, use null.`;
  } 
  else if (fileName.includes('1098') || fileName.includes('mortgage')) {
    return `Extract the following from this mortgage document in JSON format:
    {
      "lender_name": "Full lender/recipient name",
      "lender_address": "Complete lender address",
      "borrower_name": "Full payer/borrower name",
      "borrower_address": "Complete borrower address",
      "account_number": "Account number (last 4 digits only)",
      "mortgage_interest_paid": "Box 1 amount - mortgage interest paid",
      "points_paid": "Box 6 amount - points paid on purchase",
      "property_tax": "Box 10 amount - property taxes paid if available",
      "mortgage_insurance_premiums": "Box 5 amount if available",
      "year": "Tax year"
    }
    
    Look carefully at all sections of the 1098. If any field is not visible or cannot be determined, use null.`;
  }
  else if (fileName.includes('1099')) {
    return `Extract the following from this 1099 document in JSON format:
    {
      "payer_name": "Full payer name",
      "payer_address": "Complete payer address",
      "payer_tin": "Payer's TIN (masked or last 4 digits)",
      "recipient_name": "Full recipient name",
      "recipient_address": "Complete recipient address",
      "recipient_tin": "Recipient's TIN (masked or last 4 digits)",
      "type": "Type of 1099 (MISC, NEC, DIV, INT, etc.)",
      "amounts": {
        "nonemployee_compensation": "Amount in Box 1 for 1099-NEC",
        "dividends": "Amount for dividends if 1099-DIV",
        "interest": "Amount for interest if 1099-INT",
        "rents": "Amount for rents if applicable",
        "royalties": "Amount for royalties if applicable",
        "other_income": "Other income amount if applicable"
      },
      "federal_tax_withheld": "Federal income tax withheld amount",
      "state_tax_withheld": "State tax withheld if available",
      "year": "Tax year"
    }
    
    Look carefully at all sections of the 1099. If any field is not visible or cannot be determined, use null.`;
  }
  else if (fileName.includes('1095') || fileName.includes('health')) {
    return `Extract the following health insurance information in JSON format:
    {
      "insurance_provider": "Full name of insurance provider",
      "policy_holder": "Full name of policy holder",
      "covered_individuals": ["List of covered individuals' names"],
      "policy_number": "Policy or certificate number (masked)",
      "coverage_months": ["List of months covered"],
      "marketplace_identifier": "Marketplace identifier if applicable",
      "premium_amount": "Monthly premium amount if available",
      "slcsp_amount": "Second lowest cost silver plan amount if available",
      "advance_premium_tax_credit": "Advance premium tax credit amount if available",
      "coverage_type": "Type of coverage"
    }
    
    Look carefully at all sections of the health insurance document. If any field is not visible or cannot be determined, use null.`;
  }
  else if (fileName.includes('license') || fileName.includes('id') || fileName.includes('passport')) {
    return `Extract the following personal identification information in JSON format:
    {
      "full_name": "Complete name as shown on ID",
      "address": "Complete residential address",
      "city": "City of residence",
      "state": "State of residence",
      "zip": "ZIP/Postal code",
      "date_of_birth": "Date of birth (formatted as MM/DD/YYYY)",
      "id_number": "ID number (show only last 4 digits)",
      "issuing_authority": "Authority that issued the ID",
      "issue_date": "Date the ID was issued",
      "expiration_date": "Date the ID expires",
      "id_type": "Type of ID (driver's license, passport, state ID, etc.)"
    }
    
    Look carefully at all sections of the identification document. If any field is not visible or cannot be determined, use null.`;
  }
  else if (fileName.includes('student') || fileName.includes('1098-t') || fileName.includes('education')) {
    return `Extract the following education information in JSON format:
    {
      "institution_name": "Full name of the educational institution",
      "institution_address": "Complete address of institution",
      "institution_tin": "Institution's TIN (masked)",
      "student_name": "Full name of student",
      "student_address": "Complete student address",
      "student_id": "Student ID number (masked)",
      "student_ssn": "Student SSN (show only last 4 digits)",
      "tuition_paid": "Amount of qualified tuition and related expenses paid",
      "scholarships": "Amount of scholarships or grants",
      "adjustments": "Adjustments to prior year",
      "academic_period": "Academic period",
      "half_time_student": "Was student at least half-time? (Yes/No)",
      "graduate_student": "Was student a graduate student? (Yes/No)",
      "year": "Tax year"
    }
    
    Look carefully at all sections of the education document. If any field is not visible or cannot be determined, use null.`;
  }
  else {
    return `Analyze this tax document and extract all possible information in JSON format:
    {
      "document_type": "Type of document if identifiable",
      "persons": [{
        "name": "Full name of individual",
        "address": "Complete address if available",
        "identification": "Any ID numbers (masked, last 4 digits only)"
      }],
      "financial_amounts": [{
        "description": "Description or purpose of amount",
        "amount": "Monetary value",
        "tax_year": "Tax year if available"
      }],
      "dates": [{
        "description": "Purpose or type of date",
        "date": "Actual date"
      }],
      "institutions": [{
        "name": "Name of institution/company",
        "address": "Address of institution",
        "identification": "Any identification numbers (masked)"
      }],
      "other_information": "Any other relevant tax information"
    }
    
    Look carefully at all sections of the document. If any field is not visible or cannot be determined, use null.`;
  }
}

// Parse extracted JSON data into structured fields - keeping the same logic
function parseExtractedData(doc, extractedData) {
  const fields = [];
  const fileName = doc.name.toLowerCase();
  
  // Handle W-2 documents
  if (fileName.includes('w-2') || fileName.includes('w2')) {
    // Personal information
    if (extractedData.employee_name) {
      fields.push({
        id: `${doc.id}_employee_name`,
        name: "Employee Name",
        value: extractedData.employee_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Information"
      });
    }
    
    if (extractedData.employee_address) {
      fields.push({
        id: `${doc.id}_employee_address`,
        name: "Address",
        value: extractedData.employee_address || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Identification Information"
      });
    }
    
    // Income information
    if (extractedData.employer_name) {
      fields.push({
        id: `${doc.id}_employer_name`,
        name: "Employer Name",
        value: extractedData.employer_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Income Information"
      });
    }
    
    if (extractedData.wages) {
      fields.push({
        id: `${doc.id}_wages`,
        name: "Wages/Tips",
        value: extractedData.wages || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Income Information"
      });
    }
    
    if (extractedData.federal_tax_withheld) {
      fields.push({
        id: `${doc.id}_federal_tax`,
        name: "Federal Tax Withheld",
        value: extractedData.federal_tax_withheld || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Income Information"
      });
    }
    
    // Employment summary
    fields.push({
      id: `${doc.id}_employment_summary`,
      name: "Employment Summary",
      value: "Had 1 job", // Default to 1 job per W-2
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Income Information"
    });
  } 
  
  // Handle identification documents
  else if (fileName.includes('license') || fileName.includes('id') || fileName.includes('passport')) {
    if (extractedData.full_name) {
      fields.push({
        id: `${doc.id}_full_name`,
        name: "Full Name",
        value: extractedData.full_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Identification Information"
      });
    }
    
    // Combine address components if available
    let address = "Not found";
    if (extractedData.address) {
      address = extractedData.address;
      if (extractedData.city) address += extractedData.city ? `, ${extractedData.city}` : "";
      if (extractedData.state) address += extractedData.state ? `, ${extractedData.state}` : "";
      if (extractedData.zip) address += extractedData.zip ? ` ${extractedData.zip}` : "";
    }
    
    fields.push({
      id: `${doc.id}_address`,
      name: "Address",
      value: address,
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Personal Identification Information"
    });
    
    if (extractedData.date_of_birth) {
      fields.push({
        id: `${doc.id}_dob`,
        name: "Date of Birth",
        value: extractedData.date_of_birth || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Identification Information"
      });
    }
    
    // Mask ID numbers
    let idNumber = extractedData.id_number || "Not found";
    if (idNumber && idNumber !== "Not found" && !idNumber.includes("xxx-xx-")) {
      if (idNumber.length > 4) {
        const lastFour = idNumber.slice(-4);
        idNumber = `xxx-xx-${lastFour}`;
      }
    }
    
    fields.push({
      id: `${doc.id}_id_number`,
      name: "ID Number",
      value: idNumber,
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Personal Identification Information"
    });
    
    if (extractedData.issuing_authority) {
      fields.push({
        id: `${doc.id}_issuing_authority`,
        name: "Issuing Authority",
        value: extractedData.issuing_authority || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Identification Information"
      });
    }
    
    if (extractedData.expiration_date) {
      fields.push({
        id: `${doc.id}_expiration_date`,
        name: "Expiration Date",
        value: extractedData.expiration_date || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Identification Information"
      });
    }
  }
  
  // Handle 1098 mortgage documents
  else if (fileName.includes('1098') || fileName.includes('mortgage')) {
    if (extractedData.lender_name) {
      fields.push({
        id: `${doc.id}_lender_name`,
        name: "Mortgage Lender",
        value: extractedData.lender_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Expense and Deduction Information"
      });
    }
    
    if (extractedData.borrower_name) {
      fields.push({
        id: `${doc.id}_borrower_name`,
        name: "Borrower Name",
        value: extractedData.borrower_name || "Not found", 
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Information"
      });
    }
    
    if (extractedData.mortgage_interest_paid) {
      fields.push({
        id: `${doc.id}_mortgage_interest`,
        name: "Mortgage Interest Paid",
        value: extractedData.mortgage_interest_paid || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Expense and Deduction Information"
      });
    }
    
    if (extractedData.property_tax) {
      fields.push({
        id: `${doc.id}_property_tax`,
        name: "Property Taxes Paid",
        value: extractedData.property_tax || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Expense and Deduction Information"
      });
    }
    
    fields.push({
      id: `${doc.id}_home_ownership`,
      name: "Home Ownership",
      value: "Yes", // If they have a 1098, they own a home
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Expense and Deduction Information"
    });
  }
  
  // Handle 1099 documents
  else if (fileName.includes('1099')) {
    if (extractedData.type) {
      fields.push({
        id: `${doc.id}_1099_type`,
        name: "1099 Type",
        value: extractedData.type || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Income Information"
      });
    }
    
    if (extractedData.payer_name) {
      fields.push({
        id: `${doc.id}_payer_name`,
        name: "Payer Name",
        value: extractedData.payer_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Income Information"
      });
    }
    
    if (extractedData.recipient_name) {
      fields.push({
        id: `${doc.id}_recipient_name`,
        name: "Recipient Name",
        value: extractedData.recipient_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Information"
      });
    }
    
    // Extract amount based on 1099 type
    let amountValue = "Not found";
    if (extractedData.amounts) {
      if (extractedData.type && extractedData.type.toLowerCase().includes('nec')) {
        amountValue = extractedData.amounts.nonemployee_compensation || "Not found";
      } else if (extractedData.type && extractedData.type.toLowerCase().includes('div')) {
        amountValue = extractedData.amounts.dividends || "Not found";
      } else if (extractedData.type && extractedData.type.toLowerCase().includes('int')) {
        amountValue = extractedData.amounts.interest || "Not found";
      } else {
        // Try to find any amount value
        for (const [key, value] of Object.entries(extractedData.amounts)) {
          if (value && value !== "Not found" && value !== "null") {
            amountValue = `${key.replace(/_/g, ' ')}: ${value}`;
            break;
          }
        }
      }
    }
    
    fields.push({
      id: `${doc.id}_1099_amount`,
      name: "Amount Received",
      value: amountValue,
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Income Information"
    });
    
    if (extractedData.federal_tax_withheld) {
      fields.push({
        id: `${doc.id}_1099_tax_withheld`,
        name: "Federal Tax Withheld",
        value: extractedData.federal_tax_withheld || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Income Information"
      });
    }
  }
  
  // Handle education documents
  else if (fileName.includes('student') || fileName.includes('1098-t') || fileName.includes('education')) {
    if (extractedData.institution_name) {
      fields.push({
        id: `${doc.id}_school_name`,
        name: "Educational Institution",
        value: extractedData.institution_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Education Information"
      });
    }
    
    if (extractedData.student_name) {
      fields.push({
        id: `${doc.id}_student_name`,
        name: "Student Name",
        value: extractedData.student_name || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Information"
      });
    }
    
    if (extractedData.tuition_paid) {
      fields.push({
        id: `${doc.id}_tuition_paid`,
        name: "Tuition Paid",
        value: extractedData.tuition_paid || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Education Information"
      });
    }
    
    fields.push({
      id: `${doc.id}_education_summary`,
      name: "Education Status",
      value: "Attended 1 college",
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Education Information"
    });
  }
  
  // Handle health insurance documents
  else if (fileName.includes('1095') || fileName.includes('health')) {
    if (extractedData.insurance_provider) {
      fields.push({
        id: `${doc.id}_insurance_provider`,
        name: "Insurance Provider",
        value: extractedData.insurance_provider || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Health and Benefits Information"
      });
    }
    
    if (extractedData.policy_holder) {
      fields.push({
        id: `${doc.id}_policy_holder`,
        name: "Policy Holder",
        value: extractedData.policy_holder || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Personal Information"
      });
    }
    
    // Coverage months
    let coverageValue = "Not found";
    if (extractedData.coverage_months && Array.isArray(extractedData.coverage_months)) {
      coverageValue = extractedData.coverage_months.join(", ");
    }
    
    fields.push({
      id: `${doc.id}_coverage_months`,
      name: "Months Covered",
      value: coverageValue,
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Health and Benefits Information"
    });
    
    if (extractedData.premium_amount) {
      fields.push({
        id: `${doc.id}_premium_amount`,
        name: "Premium Amount",
        value: extractedData.premium_amount || "Not found",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Health and Benefits Information"
      });
    }
  }
  
  // Generic document handling if nothing else matched
  else {
    // Try to extract basic information from generic parsing
    if (extractedData.document_type) {
      fields.push({
        id: `${doc.id}_document_type`,
        name: "Document Type",
        value: extractedData.document_type || "Unknown Document",
        isCorrect: null,
        originalValue: JSON.stringify(extractedData),
        category: "Other Information"
      });
    }
    
    // Extract persons information
    if (extractedData.persons && extractedData.persons.length > 0) {
      const person = extractedData.persons[0];
      
      if (person.name) {
        fields.push({
          id: `${doc.id}_person_name`,
          name: "Full Name",
          value: person.name,
          isCorrect: null,
          originalValue: JSON.stringify(extractedData),
          category: "Personal Identification Information"
        });
      }
      
      if (person.address) {
        fields.push({
          id: `${doc.id}_person_address`,
          name: "Address",
          value: person.address,
          isCorrect: null,
          originalValue: JSON.stringify(extractedData),
          category: "Personal Identification Information"
        });
      }
    }
    
    // Extract financial information
    if (extractedData.financial_amounts && extractedData.financial_amounts.length > 0) {
      extractedData.financial_amounts.slice(0, 2).forEach((item, index) => {
        if (item.description && item.amount) {
          fields.push({
            id: `${doc.id}_financial_${index}`,
            name: item.description,
            value: item.amount,
            isCorrect: null,
            originalValue: JSON.stringify(extractedData),
            category: "Other Information"
          });
        }
      });
    }
    
    // Add a summary
    fields.push({
      id: `${doc.id}_summary`,
      name: "Document Summary",
      value: summarizeDocument(extractedData),
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Other Information"
    });
  }
  
  // If no fields were extracted, add a default field
  if (fields.length === 0) {
    fields.push({
      id: `${doc.id}_fallback`,
      name: "Document Information",
      value: "Document processed but content could not be extracted",
      isCorrect: null,
      originalValue: JSON.stringify(extractedData),
      category: "Other Information"
    });
  }
  
  return fields;
}

// Legacy parsing function for backward compatibility - keeping the same logic
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
          // If we successfully parsed JSON, use the enhanced parser
          return parseExtractedData(doc, extractedData);
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

// Helper to extract values from potential JSON or text - keeping the same logic
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

// Create a summary from extracted text - keeping the same logic
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
