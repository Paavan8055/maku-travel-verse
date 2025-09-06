import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export class DataCleanerAgent extends BaseAgent {
  constructor(supabaseClient: any) {
    super('data-cleaner', supabaseClient);
  }

  async cleanAndValidateData(userId: string, tableName: string, rules: any): Promise<any> {
    try {
      StructuredLogger.info('Starting data cleaning process', { userId, tableName });

      // Get all records from the table
      const { data: records, error } = await this.supabaseClient
        .from(tableName)
        .select('*');

      if (error) throw error;

      const cleaningResults = {
        total_records: records?.length || 0,
        cleaned_records: 0,
        invalid_records: 0,
        duplicates_removed: 0,
        validation_errors: [],
        cleaning_applied: []
      };

      if (!records || records.length === 0) {
        return cleaningResults;
      }

      const cleanedRecords = [];
      const seenRecords = new Set();

      for (const record of records) {
        try {
          // Check for duplicates
          const recordKey = this.generateRecordKey(record, rules.unique_fields || ['id']);
          if (seenRecords.has(recordKey)) {
            cleaningResults.duplicates_removed++;
            continue;
          }
          seenRecords.add(recordKey);

          // Clean the record
          const cleanedRecord = await this.cleanRecord(record, rules);
          
          // Validate the cleaned record
          const validation = this.validateRecord(cleanedRecord, rules.validation || {});
          
          if (validation.valid) {
            cleanedRecords.push(cleanedRecord);
            cleaningResults.cleaned_records++;
          } else {
            cleaningResults.invalid_records++;
            cleaningResults.validation_errors.push({
              record_id: record.id,
              errors: validation.errors
            });
          }

        } catch (error) {
          cleaningResults.invalid_records++;
          cleaningResults.validation_errors.push({
            record_id: record.id,
            error: error.message
          });
        }
      }

      // Update records in batches if cleaning was successful
      if (cleanedRecords.length > 0 && rules.apply_changes) {
        await this.updateCleanedRecords(tableName, cleanedRecords);
      }

      await this.logActivity(userId, 'data_cleaning_completed', cleaningResults);
      return cleaningResults;

    } catch (error) {
      await this.createAlert(userId, 'data_cleaning_failed', error.message, 'medium');
      throw error;
    }
  }

  async deduplicateRecords(userId: string, tableName: string, uniqueFields: string[]): Promise<any> {
    try {
      StructuredLogger.info('Starting deduplication process', { userId, tableName, uniqueFields });

      // Get all records
      const { data: records, error } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const seen = new Set();
      const duplicates = [];
      const unique = [];

      for (const record of records || []) {
        const key = this.generateRecordKey(record, uniqueFields);
        
        if (seen.has(key)) {
          duplicates.push(record);
        } else {
          seen.add(key);
          unique.push(record);
        }
      }

      // Remove duplicates
      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map(d => d.id);
        const { error: deleteError } = await this.supabaseClient
          .from(tableName)
          .delete()
          .in('id', duplicateIds);

        if (deleteError) throw deleteError;
      }

      const result = {
        total_records: records?.length || 0,
        unique_records: unique.length,
        duplicates_removed: duplicates.length,
        duplicate_records: duplicates
      };

      await this.logActivity(userId, 'deduplication_completed', result);
      return result;

    } catch (error) {
      await this.createAlert(userId, 'deduplication_failed', error.message, 'medium');
      throw error;
    }
  }

  async normalizeData(userId: string, tableName: string, normalizationRules: any): Promise<any> {
    try {
      StructuredLogger.info('Starting data normalization', { userId, tableName });

      const { data: records, error } = await this.supabaseClient
        .from(tableName)
        .select('*');

      if (error) throw error;

      const normalizedRecords = [];
      const normalizationResults = {
        total_records: records?.length || 0,
        normalized_records: 0,
        normalization_errors: []
      };

      for (const record of records || []) {
        try {
          const normalizedRecord = this.applyNormalizationRules(record, normalizationRules);
          normalizedRecords.push(normalizedRecord);
          normalizationResults.normalized_records++;
        } catch (error) {
          normalizationResults.normalization_errors.push({
            record_id: record.id,
            error: error.message
          });
        }
      }

      // Update normalized records
      if (normalizedRecords.length > 0) {
        await this.updateCleanedRecords(tableName, normalizedRecords);
      }

      await this.logActivity(userId, 'normalization_completed', normalizationResults);
      return normalizationResults;

    } catch (error) {
      await this.createAlert(userId, 'normalization_failed', error.message, 'medium');
      throw error;
    }
  }

  private async cleanRecord(record: any, rules: any): Promise<any> {
    const cleaned = { ...record };

    // Apply cleaning rules
    if (rules.trim_strings) {
      for (const field of rules.trim_strings) {
        if (cleaned[field] && typeof cleaned[field] === 'string') {
          cleaned[field] = cleaned[field].trim();
        }
      }
    }

    if (rules.lowercase_fields) {
      for (const field of rules.lowercase_fields) {
        if (cleaned[field] && typeof cleaned[field] === 'string') {
          cleaned[field] = cleaned[field].toLowerCase();
        }
      }
    }

    if (rules.remove_nulls) {
      for (const key in cleaned) {
        if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
          delete cleaned[key];
        }
      }
    }

    if (rules.format_dates) {
      for (const field of rules.format_dates) {
        if (cleaned[field]) {
          try {
            cleaned[field] = new Date(cleaned[field]).toISOString();
          } catch (error) {
            // Keep original value if date parsing fails
          }
        }
      }
    }

    return cleaned;
  }

  private validateRecord(record: any, validationRules: any): { valid: boolean; errors: string[] } {
    const errors = [];

    // Required fields validation
    if (validationRules.required_fields) {
      for (const field of validationRules.required_fields) {
        if (!record[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Type validation
    if (validationRules.field_types) {
      for (const [field, expectedType] of Object.entries(validationRules.field_types)) {
        if (record[field] && typeof record[field] !== expectedType) {
          errors.push(`Field ${field} should be of type ${expectedType}`);
        }
      }
    }

    // Pattern validation
    if (validationRules.patterns) {
      for (const [field, pattern] of Object.entries(validationRules.patterns)) {
        if (record[field] && !new RegExp(pattern as string).test(record[field])) {
          errors.push(`Field ${field} does not match required pattern`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private generateRecordKey(record: any, uniqueFields: string[]): string {
    return uniqueFields
      .map(field => record[field] || '')
      .join('|')
      .toLowerCase();
  }

  private applyNormalizationRules(record: any, rules: any): any {
    const normalized = { ...record };

    // Phone number normalization
    if (rules.normalize_phones) {
      for (const field of rules.normalize_phones) {
        if (normalized[field]) {
          normalized[field] = this.normalizePhoneNumber(normalized[field]);
        }
      }
    }

    // Email normalization
    if (rules.normalize_emails) {
      for (const field of rules.normalize_emails) {
        if (normalized[field]) {
          normalized[field] = normalized[field].toLowerCase().trim();
        }
      }
    }

    // Address normalization
    if (rules.normalize_addresses) {
      for (const field of rules.normalize_addresses) {
        if (normalized[field]) {
          normalized[field] = this.normalizeAddress(normalized[field]);
        }
      }
    }

    return normalized;
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters except +
    return phone.replace(/[^\\d+]/g, '');
  }

  private normalizeAddress(address: string): string {
    // Basic address normalization
    return address
      .toLowerCase()
      .replace(/\\bst\\b/g, 'street')
      .replace(/\\bave\\b/g, 'avenue')
      .replace(/\\brd\\b/g, 'road')
      .replace(/\\bblvd\\b/g, 'boulevard')
      .trim();
  }

  private async updateCleanedRecords(tableName: string, records: any[]): Promise<void> {
    // Update records in batches of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        const { error } = await this.supabaseClient
          .from(tableName)
          .update(record)
          .eq('id', record.id);

        if (error) {
          throw new Error(`Failed to update record ${record.id}: ${error.message}`);
        }
      }
    }
  }
}

export const dataCleanerHandler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: any,
  openaiClient: any,
  memory: any
) => {
  const agent = new DataCleanerAgent(supabaseClient);

  try {
    let result;

    switch (intent) {
      case 'clean_and_validate':
        result = await agent.cleanAndValidateData(userId, params.table_name, params.rules);
        break;

      case 'deduplicate':
        result = await agent.deduplicateRecords(userId, params.table_name, params.unique_fields);
        break;

      case 'normalize':
        result = await agent.normalizeData(userId, params.table_name, params.normalization_rules);
        break;

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }

    return {
      success: true,
      result,
      memory_updates: {
        last_cleaning: result,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    StructuredLogger.error('Data cleaner agent error', { error: error.message, userId, intent });
    return {
      success: false,
      error: error.message,
      memory_updates: {
        last_error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};
