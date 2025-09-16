import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'data-validation');
  
  try {
    const { dataType, dataToValidate, validationRules, strictMode } = params;
    
    const validationHistory = await memory.getMemory('data-validation', userId, 'validation_history') || [];
    
    const systemPrompt = `You are a data validation specialist for MAKU.Travel.
    
TASK: Perform comprehensive data validation and integrity checks.

VALIDATION REQUEST:
- Data Type: ${dataType}
- Data to Validate: ${JSON.stringify(dataToValidate)}
- Validation Rules: ${JSON.stringify(validationRules)}
- Strict Mode: ${strictMode ? 'Enabled' : 'Disabled'}

VALIDATION HISTORY: ${JSON.stringify(validationHistory.slice(-3))}

Validate data for:
1. Format compliance (email, phone, dates, etc.)
2. Business logic validation
3. Cross-field consistency
4. Range and boundary checks
5. Required field validation
6. Data type validation
7. Pattern matching
8. Referential integrity

Provide:
- Validation status (VALID/INVALID/WARNING)
- Specific errors found
- Field-level validation results
- Data quality score (0-100)
- Recommended corrections
- Clean data suggestions

Be thorough and precise in validation assessment.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiClient}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [{ role: 'system', content: systemPrompt }],
        max_completion_tokens: 1200
      }),
    });

    const aiResponse = await response.json();
    const validationReport = aiResponse.choices[0]?.message?.content || 'Data validation completed';

    // Perform actual data validation
    const validationResults = performDataValidation(dataToValidate, validationRules, strictMode);
    
    const dataQualityScore = calculateDataQualityScore(validationResults);
    const validationStatus = validationResults.errors.length === 0 ? 'VALID' :
                           validationResults.warnings.length > 0 ? 'WARNING' : 'INVALID';

    await agent.logActivity(userId, 'data_validation_performed', { 
      dataType, 
      status: validationStatus,
      qualityScore: dataQualityScore 
    });
    
    // Update validation history
    const updatedValidationHistory = [
      ...validationHistory.slice(-4),
      {
        dataType,
        status: validationStatus,
        qualityScore: dataQualityScore,
        errorsCount: validationResults.errors.length,
        warningsCount: validationResults.warnings.length,
        timestamp: new Date().toISOString()
      }
    ];
    
    await memory.setMemory('data-validation', userId, 'validation_history', updatedValidationHistory);

    return {
      success: true,
      result: {
        validationStatus,
        dataQualityScore,
        validationReport,
        validationResults,
        errorsFound: validationResults.errors,
        warningsFound: validationResults.warnings,
        recommendedActions: validationStatus === 'INVALID' ? ['Fix errors before proceeding'] :
                          validationStatus === 'WARNING' ? ['Review warnings'] : ['Data is valid']
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

function performDataValidation(data: any, rules: any, strictMode: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validFields: string[] = [];

  // Email validation
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    } else {
      validFields.push('email');
    }
  }

  // Phone validation
  if (data.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format');
    } else {
      validFields.push('phone');
    }
  }

  // Date validation
  if (data.date) {
    const dateObj = new Date(data.date);
    if (isNaN(dateObj.getTime())) {
      errors.push('Invalid date format');
    } else {
      validFields.push('date');
    }
  }

  // Required fields validation
  if (rules.requiredFields) {
    for (const field of rules.requiredFields) {
      if (!data[field] || data[field] === '') {
        errors.push(`Required field missing: ${field}`);
      }
    }
  }

  // Strict mode additional checks
  if (strictMode) {
    if (data.name && data.name.length < 2) {
      warnings.push('Name appears too short');
    }
    if (data.amount && data.amount < 0) {
      errors.push('Amount cannot be negative');
    }
  }

  return { errors, warnings, validFields };
}

function calculateDataQualityScore(validationResults: any): number {
  const totalChecks = validationResults.errors.length + validationResults.warnings.length + validationResults.validFields.length;
  if (totalChecks === 0) return 100;
  
  const validCount = validationResults.validFields.length;
  const warningCount = validationResults.warnings.length;
  
  // Valid fields = 100%, warnings = 70%, errors = 0%
  const score = ((validCount * 100) + (warningCount * 70)) / totalChecks;
  return Math.round(score);
}