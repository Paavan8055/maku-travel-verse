import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, documentData, searchQuery } = await req.json();
    console.log('Document Intelligence:', { action, userId });

    switch (action) {
      case 'analyze_document':
        return await analyzeDocument(userId, documentData);
      case 'categorize_document':
        return await categorizeDocument(userId, documentData);
      case 'extract_data':
        return await extractDocumentData(userId, documentData);
      case 'search_documents':
        return await searchDocuments(userId, searchQuery);
      case 'check_expiry':
        return await checkExpiryDates(userId);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in document-intelligence:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeDocument(userId: string, documentData: any) {
  console.log('Analyzing document for user:', userId);

  const { fileName, fileContent, fileType } = documentData;

  // AI-powered document analysis
  const analysis = await performDocumentAnalysis(fileName, fileContent, fileType);
  
  // Automatically categorize document
  const category = categorizeByContent(analysis.extractedText);
  
  // Insert document into database
  const { data: document, error } = await supabase
    .from('document_intelligence')
    .insert({
      user_id: userId,
      document_name: fileName,
      document_type: category.type,
      file_path: documentData.filePath,
      ai_analysis: {
        extracted_text: analysis.extractedText,
        key_information: analysis.keyInfo,
        confidence_scores: analysis.confidence,
        language: analysis.language,
        document_structure: analysis.structure
      },
      classification_confidence: category.confidence,
      expiry_date: analysis.expiryDate,
      tags: analysis.tags,
      security_level: determineSecurityLevel(category.type),
      auto_categorized: true
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    document,
    analysis: {
      type: category.type,
      confidence: category.confidence,
      key_information: analysis.keyInfo,
      expiry_date: analysis.expiryDate,
      security_level: determineSecurityLevel(category.type)
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function categorizeDocument(userId: string, documentData: any) {
  console.log('Categorizing document for user:', userId);

  const { documentId, suggestedCategory } = documentData;

  const { data: document, error } = await supabase
    .from('document_intelligence')
    .update({
      document_type: suggestedCategory,
      classification_confidence: 1.0, // User confirmation = 100% confidence
      auto_categorized: false
    })
    .eq('id', documentId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    document,
    message: 'Document categorized successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function extractDocumentData(userId: string, documentData: any) {
  console.log('Extracting data from document for user:', userId);

  const { documentId } = documentData;

  const { data: document } = await supabase
    .from('document_intelligence')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (!document) {
    throw new Error('Document not found');
  }

  // Enhanced data extraction based on document type
  const extractedData = await enhancedDataExtraction(document);

  // Update document with enhanced extraction
  const { data: updatedDocument, error } = await supabase
    .from('document_intelligence')
    .update({
      ai_analysis: {
        ...document.ai_analysis,
        enhanced_extraction: extractedData,
        extraction_timestamp: new Date().toISOString()
      }
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    document: updatedDocument,
    extracted_data: extractedData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function searchDocuments(userId: string, searchQuery: any) {
  console.log('Searching documents for user:', userId, 'Query:', searchQuery);

  const { query, filters } = searchQuery;

  let queryBuilder = supabase
    .from('document_intelligence')
    .select('*')
    .eq('user_id', userId);

  // Full-text search using the search vector
  if (query) {
    queryBuilder = queryBuilder.textSearch('search_vector', query);
  }

  // Apply filters
  if (filters?.document_type) {
    queryBuilder = queryBuilder.eq('document_type', filters.document_type);
  }

  if (filters?.security_level) {
    queryBuilder = queryBuilder.eq('security_level', filters.security_level);
  }

  if (filters?.date_range) {
    queryBuilder = queryBuilder
      .gte('created_at', filters.date_range.start)
      .lte('created_at', filters.date_range.end);
  }

  const { data: documents, error } = await queryBuilder
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  // Enhance search results with relevance scoring
  const enhancedResults = documents.map(doc => ({
    ...doc,
    relevance_score: calculateRelevanceScore(doc, query),
    highlights: extractHighlights(doc, query)
  }));

  return new Response(JSON.stringify({
    success: true,
    results: enhancedResults,
    total_found: documents.length,
    query_processed: query,
    filters_applied: filters
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function checkExpiryDates(userId: string) {
  console.log('Checking expiry dates for user:', userId);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: expiringDocuments } = await supabase
    .from('document_intelligence')
    .select('*')
    .eq('user_id', userId)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
    .order('expiry_date');

  const alerts = (expiringDocuments || []).map(doc => {
    const daysUntilExpiry = Math.ceil(
      (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      document_id: doc.id,
      document_name: doc.document_name,
      document_type: doc.document_type,
      expiry_date: doc.expiry_date,
      days_until_expiry: daysUntilExpiry,
      urgency: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 30 ? 'warning' : 'info',
      action_required: getExpiryAction(doc.document_type, daysUntilExpiry)
    };
  });

  return new Response(JSON.stringify({
    success: true,
    expiring_documents: alerts,
    total_expiring: alerts.length,
    critical_alerts: alerts.filter(a => a.urgency === 'critical').length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function performDocumentAnalysis(fileName: string, fileContent: string, fileType: string) {
  // Simulate AI-powered document analysis
  const extractedText = simulateTextExtraction(fileName, fileType);
  
  return {
    extractedText: extractedText,
    keyInfo: extractKeyInformation(extractedText, fileName),
    confidence: {
      text_extraction: 0.95,
      classification: 0.87,
      data_extraction: 0.92
    },
    language: 'en',
    structure: analyzeDocumentStructure(extractedText),
    expiryDate: extractExpiryDate(extractedText),
    tags: generateTags(extractedText, fileName)
  };
}

function categorizeByContent(extractedText: string) {
  const text = extractedText.toLowerCase();
  
  // AI-powered categorization logic
  if (text.includes('passport') || text.includes('travel document')) {
    return { type: 'passport', confidence: 0.95 };
  } else if (text.includes('visa') || text.includes('entry permit')) {
    return { type: 'visa', confidence: 0.90 };
  } else if (text.includes('insurance') || text.includes('coverage')) {
    return { type: 'insurance', confidence: 0.85 };
  } else if (text.includes('ticket') || text.includes('boarding pass')) {
    return { type: 'ticket', confidence: 0.88 };
  } else if (text.includes('hotel') || text.includes('reservation')) {
    return { type: 'accommodation', confidence: 0.82 };
  } else if (text.includes('vaccination') || text.includes('immunization')) {
    return { type: 'health_certificate', confidence: 0.90 };
  } else {
    return { type: 'other', confidence: 0.60 };
  }
}

function determineSecurityLevel(documentType: string) {
  const highSecurityTypes = ['passport', 'visa', 'health_certificate'];
  const mediumSecurityTypes = ['insurance', 'ticket'];
  
  if (highSecurityTypes.includes(documentType)) {
    return 'confidential';
  } else if (mediumSecurityTypes.includes(documentType)) {
    return 'sensitive';
  } else {
    return 'standard';
  }
}

async function enhancedDataExtraction(document: any) {
  const documentType = document.document_type;
  const extractedText = document.ai_analysis?.extracted_text || '';
  
  const extractionMap = {
    passport: extractPassportData,
    visa: extractVisaData,
    insurance: extractInsuranceData,
    ticket: extractTicketData,
    accommodation: extractAccommodationData
  };

  const extractor = extractionMap[documentType] || extractGenericData;
  return extractor(extractedText);
}

function extractPassportData(text: string) {
  return {
    passport_number: extractPattern(text, /[A-Z]{1,2}\d{6,9}/),
    nationality: extractPattern(text, /nationality[:\s]+([A-Z]{2,})/i),
    issue_date: extractPattern(text, /issued[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    expiry_date: extractPattern(text, /expires?[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    place_of_birth: extractPattern(text, /place of birth[:\s]+([A-Z\s,]+)/i)
  };
}

function extractVisaData(text: string) {
  return {
    visa_type: extractPattern(text, /visa type[:\s]+([A-Z0-9\s]+)/i),
    entry_type: extractPattern(text, /(single|multiple)[:\s]+entry/i),
    valid_from: extractPattern(text, /valid from[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    valid_until: extractPattern(text, /valid until[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    country: extractPattern(text, /country[:\s]+([A-Z\s]+)/i)
  };
}

function extractInsuranceData(text: string) {
  return {
    policy_number: extractPattern(text, /policy[:\s]+([A-Z0-9\-]+)/i),
    coverage_amount: extractPattern(text, /coverage[:\s]+\$?([\d,]+)/i),
    effective_date: extractPattern(text, /effective[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    expiration_date: extractPattern(text, /expir[a-z]*[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    provider: extractPattern(text, /provider[:\s]+([A-Z\s&]+)/i)
  };
}

function extractTicketData(text: string) {
  return {
    confirmation_code: extractPattern(text, /confirmation[:\s]+([A-Z0-9]{6,})/i),
    flight_number: extractPattern(text, /flight[:\s]+([A-Z]{2}\d{3,4})/i),
    departure_date: extractPattern(text, /departure[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    departure_time: extractPattern(text, /(\d{1,2}:\d{2}\s?[AP]M)/i),
    destination: extractPattern(text, /to[:\s]+([A-Z]{3})/i),
    origin: extractPattern(text, /from[:\s]+([A-Z]{3})/i)
  };
}

function extractAccommodationData(text: string) {
  return {
    reservation_number: extractPattern(text, /reservation[:\s]+([A-Z0-9\-]+)/i),
    hotel_name: extractPattern(text, /hotel[:\s]+([A-Z\s&]+)/i),
    check_in: extractPattern(text, /check.?in[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    check_out: extractPattern(text, /check.?out[:\s]+(\d{2}\/\d{2}\/\d{4})/i),
    room_type: extractPattern(text, /room[:\s]+([A-Z\s]+)/i),
    guests: extractPattern(text, /guests?[:\s]+(\d+)/i)
  };
}

function extractGenericData(text: string) {
  return {
    dates_found: text.match(/\d{2}\/\d{2}\/\d{4}/g) || [],
    numbers_found: text.match(/[A-Z0-9]{6,}/g) || [],
    emails_found: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [],
    phones_found: text.match(/[\+]?[1-9]?[\d\s\-\(\)]{10,}/g) || []
  };
}

function simulateTextExtraction(fileName: string, fileType: string) {
  // Simulate OCR/text extraction based on document type
  const samples = {
    passport: "PASSPORT United States of America P USA SMITH/JOHN DOE Passport No. 123456789 Nationality: USA Date of Birth: 01/01/1980 Place of Birth: NEW YORK, NY Issue Date: 01/01/2020 Expiration Date: 01/01/2030",
    visa: "VISA Type: B-1/B-2 Entry: Multiple Valid From: 01/01/2023 Valid Until: 01/01/2033 Country: UNITED STATES",
    insurance: "Travel Insurance Policy No: TI123456789 Coverage: $100,000 Effective Date: 01/01/2023 Expiration Date: 12/31/2023 Provider: Global Insurance Co.",
    ticket: "Boarding Pass Flight: AA1234 From: JFK To: LAX Departure: 01/15/2023 10:30 AM Confirmation: ABC123",
    default: "Document content extracted successfully. Various data fields identified for processing."
  };

  const type = Object.keys(samples).find(key => fileName.toLowerCase().includes(key)) || 'default';
  return samples[type];
}

function extractKeyInformation(text: string, fileName: string) {
  return {
    document_subject: fileName.split('.')[0],
    key_dates: text.match(/\d{2}\/\d{2}\/\d{4}/g) || [],
    important_numbers: text.match(/[A-Z0-9]{6,}/g) || [],
    locations: text.match(/[A-Z]{2,3}(?:\s[A-Z]{2,3})?/g) || []
  };
}

function analyzeDocumentStructure(text: string) {
  return {
    has_header: text.includes('PASSPORT') || text.includes('VISA') || text.includes('INSURANCE'),
    has_dates: /\d{2}\/\d{2}\/\d{4}/.test(text),
    has_numbers: /[A-Z0-9]{6,}/.test(text),
    estimated_fields: text.split(/[:\n]/).length,
    confidence_score: 0.85
  };
}

function extractExpiryDate(text: string) {
  const expiryPatterns = [
    /expir[a-z]*[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /valid until[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /expires?[:\s]+(\d{2}\/\d{2}\/\d{4})/i
  ];

  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function generateTags(text: string, fileName: string) {
  const tags = [];
  
  if (text.toLowerCase().includes('passport')) tags.push('passport');
  if (text.toLowerCase().includes('visa')) tags.push('visa');
  if (text.toLowerCase().includes('insurance')) tags.push('insurance');
  if (text.toLowerCase().includes('travel')) tags.push('travel');
  if (text.toLowerCase().includes('international')) tags.push('international');
  
  // Add tags based on file name
  if (fileName.toLowerCase().includes('urgent')) tags.push('urgent');
  if (fileName.toLowerCase().includes('copy')) tags.push('copy');
  
  return tags;
}

function extractPattern(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match ? match[1] : null;
}

function calculateRelevanceScore(document: any, query: string) {
  if (!query) return 1;
  
  const searchableText = `${document.document_name} ${document.ai_analysis?.extracted_text || ''}`.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Simple relevance scoring
  let score = 0;
  const words = queryLower.split(' ');
  
  for (const word of words) {
    if (searchableText.includes(word)) {
      score += 1;
    }
  }
  
  return score / words.length;
}

function extractHighlights(document: any, query: string) {
  if (!query) return [];
  
  const text = document.ai_analysis?.extracted_text || '';
  const words = query.toLowerCase().split(' ');
  const highlights = [];
  
  for (const word of words) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      highlights.push(...matches);
    }
  }
  
  return highlights.slice(0, 5); // Return top 5 highlights
}

function getExpiryAction(documentType: string, daysUntilExpiry: number) {
  const actions = {
    passport: daysUntilExpiry <= 90 ? 'Renew passport immediately' : 'Monitor expiry date',
    visa: daysUntilExpiry <= 30 ? 'Apply for visa renewal' : 'Plan renewal process',
    insurance: daysUntilExpiry <= 14 ? 'Purchase new travel insurance' : 'Review coverage options',
    health_certificate: daysUntilExpiry <= 30 ? 'Schedule vaccination update' : 'Monitor validity'
  };
  
  return actions[documentType] || 'Review document renewal requirements';
}