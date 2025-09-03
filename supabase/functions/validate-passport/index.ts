import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import logger from "../_shared/logger.ts";

interface PassportData {
  country: string;
  passportNumber: string;
  expiryDate: string;
  isValid: boolean;
  confidence: number;
}

async function extractPassportData(imageUrl: string): Promise<PassportData> {
  try {
    logger.info('Starting AWS Textract OCR for passport:', imageUrl);
    
    // Real AWS Textract integration
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';
    const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    
    if (!awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('AWS credentials not configured');
    }
    
    // Download image for Textract processing
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch passport image');
    }
    
    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
    
    // AWS Textract API call
    const textractEndpoint = `https://textract.${awsRegion}.amazonaws.com/`;
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const date = timestamp.substr(0, 8);
    
    // Create AWS Signature V4
    const payload = JSON.stringify({
      Document: {
        Bytes: Array.from(imageBytes)
      },
      FeatureTypes: ['FORMS', 'TABLES']
    });
    
    const payloadHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    const payloadHashHex = Array.from(new Uint8Array(payloadHash))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const headers = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'Textract.AnalyzeDocument',
      'Authorization': await createAWSSignature(awsAccessKeyId, awsSecretAccessKey, awsRegion, timestamp, payloadHashHex)
    };
    
    const textractResponse = await fetch(textractEndpoint, {
      method: 'POST',
      headers,
      body: payload
    });
    
    if (!textractResponse.ok) {
      logger.error('Textract API error:', await textractResponse.text());
      throw new Error('AWS Textract processing failed');
    }
    
    const textractResult = await textractResponse.json();
    
    // Extract passport data from Textract response
    const extractedData = parseTextractPassportData(textractResult);
    
    logger.info('Textract OCR completed', { 
      confidence: extractedData.confidence, 
      country: extractedData.country 
    });
    
    return extractedData;
    
  } catch (error) {
    logger.error('OCR extraction failed:', error);
    return {
      country: '',
      passportNumber: '',
      expiryDate: '',
      isValid: false,
      confidence: 0
    };
  }
}

async function createAWSSignature(accessKey: string, secretKey: string, region: string, timestamp: string, payloadHash: string): Promise<string> {
  const date = timestamp.substr(0, 8);
  const service = 'textract';
  
  // Create canonical request
  const canonicalRequest = [
    'POST',
    '/',
    '',
    'content-type:application/x-amz-json-1.1',
    'host:textract.' + region + '.amazonaws.com',
    'x-amz-date:' + timestamp,
    'x-amz-target:Textract.AnalyzeDocument',
    '',
    'content-type;host;x-amz-date;x-amz-target',
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    date + '/' + region + '/' + service + '/aws4_request',
    await sha256Hash(canonicalRequest)
  ].join('\n');
  
  // Create signing key
  const signingKey = await getSigningKey(secretKey, date, region, service);
  
  // Create signature
  const signature = await hmacSha256(signingKey, stringToSign);
  
  // Return authorization header
  return `AWS4-HMAC-SHA256 Credential=${accessKey}/${date}/${region}/${service}/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-target, Signature=${signature}`;
}

async function sha256Hash(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: CryptoKey, message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign('HMAC', key, msgUint8);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSigningKey(secretKey: string, date: string, region: string, service: string): Promise<CryptoKey> {
  const kDate = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('AWS4' + secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const kRegion = await crypto.subtle.sign('HMAC', kDate, new TextEncoder().encode(region));
  const kService = await crypto.subtle.sign('HMAC', 
    await crypto.subtle.importKey('raw', kRegion, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    new TextEncoder().encode(service)
  );
  
  const kSigning = await crypto.subtle.sign('HMAC',
    await crypto.subtle.importKey('raw', kService, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    new TextEncoder().encode('aws4_request')
  );
  
  return await crypto.subtle.importKey('raw', kSigning, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

function parseTextractPassportData(textractResult: any): PassportData {
  const blocks = textractResult.Blocks || [];
  const textBlocks = blocks.filter((block: any) => block.BlockType === 'LINE');
  
  let country = '';
  let passportNumber = '';
  let expiryDate = '';
  let confidence = 0;
  
  // Extract text and look for passport patterns
  for (const block of textBlocks) {
    const text = block.Text || '';
    const blockConfidence = block.Confidence || 0;
    confidence = Math.max(confidence, blockConfidence / 100);
    
    // Look for country code (3 letters at start)
    if (!country && /^[A-Z]{3}/.test(text)) {
      country = text.substring(0, 3);
    }
    
    // Look for passport number (starts with P followed by numbers)
    if (!passportNumber && /P\d{7,9}/.test(text)) {
      const match = text.match(/P\d{7,9}/);
      if (match) passportNumber = match[0];
    }
    
    // Look for expiry date (DDMMMYY or similar format)
    if (!expiryDate && /\d{2}[A-Z]{3}\d{2}/.test(text)) {
      const match = text.match(/\d{2}[A-Z]{3}\d{2}/);
      if (match) {
        // Convert to ISO date format
        const day = match[0].substring(0, 2);
        const month = match[0].substring(2, 5);
        const year = '20' + match[0].substring(5, 7);
        
        const monthMap: {[key: string]: string} = {
          'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
          'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
          'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };
        
        if (monthMap[month]) {
          expiryDate = `${year}-${monthMap[month]}-${day}`;
        }
      }
    }
  }
  
  const isValid = country && passportNumber && expiryDate && 
                  new Date(expiryDate) > new Date() && confidence > 0.8;
  
  return {
    country,
    passportNumber,
    expiryDate,
    isValid,
    confidence
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { passportImageUrl, userId } = await req.json()

    logger.info(`Validating passport for user ${userId} with image: ${passportImageUrl}`)

    // Real AWS Textract integration
    const ocrResult = await extractPassportData(passportImageUrl);
    
    logger.info('OCR extraction completed', { confidence: ocrResult.confidence, country: ocrResult.country })

    // Update passport_info table with validation result
    const { data, error } = await supabase
      .from('passport_info')
      .update({
        verified: ocrResult.isValid && ocrResult.confidence > 0.9,
        country: ocrResult.country,
        passport_number: ocrResult.passportNumber,
        expiry_date: ocrResult.expiryDate,
        confidence_score: ocrResult.confidence,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update passport info' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: ocrResult.isValid && ocrResult.confidence > 0.9,
        extractedData: ocrResult,
        data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    logger.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})