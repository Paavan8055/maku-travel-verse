import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export class DataIngestorAgent extends BaseAgent {
  constructor(supabaseClient: any) {
    super('data-ingestor', supabaseClient);
  }

  async importFromAPI(userId: string, source: string, apiConfig: any): Promise<any> {
    try {
      StructuredLogger.info('Starting API data import', { userId, source });

      // Log import start
      const { data: importLog } = await this.supabaseClient
        .from('data_import_logs')
        .insert({
          import_source: source,
          import_type: 'api',
          status: 'in_progress',
          processed_by: userId,
          metadata: { api_config: apiConfig }
        })
        .select()
        .single();

      let processedRecords = 0;
      let failedRecords = 0;
      const errors = [];

      try {
        // Fetch data from external API
        const response = await fetch(apiConfig.url, {
          method: apiConfig.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...apiConfig.headers
          },
          body: apiConfig.body ? JSON.stringify(apiConfig.body) : undefined
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const records = Array.isArray(data) ? data : data.data || [data];

        // Process each record
        for (const record of records) {
          try {
            await this.processRecord(record, apiConfig.table_name);
            processedRecords++;
          } catch (error) {
            failedRecords++;
            errors.push({ record_id: record.id || 'unknown', error: error.message });
          }
        }

        // Update import log
        await this.supabaseClient
          .from('data_import_logs')
          .update({
            status: 'completed',
            total_records: records.length,
            processed_records: processedRecords,
            failed_records: failedRecords,
            completed_at: new Date().toISOString(),
            error_details: errors.length > 0 ? errors : null
          })
          .eq('id', importLog.id);

        const result = {
          import_id: importLog.id,
          total_records: records.length,
          processed_records: processedRecords,
          failed_records: failedRecords,
          errors: errors
        };

        await this.logActivity(userId, 'api_import_completed', result);
        return result;

      } catch (error) {
        // Update import log with failure
        await this.supabaseClient
          .from('data_import_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_details: [{ error: error.message }]
          })
          .eq('id', importLog.id);

        throw error;
      }

    } catch (error) {
      await this.createAlert(userId, 'api_import_failed', error.message, 'high');
      throw error;
    }
  }

  async importFromFile(userId: string, fileData: any, fileInfo: any): Promise<any> {
    try {
      StructuredLogger.info('Starting file data import', { userId, fileName: fileInfo.name });

      // Log import start
      const { data: importLog } = await this.supabaseClient
        .from('data_import_logs')
        .insert({
          import_source: 'file_upload',
          import_type: fileInfo.type,
          file_name: fileInfo.name,
          file_size: fileInfo.size,
          status: 'in_progress',
          processed_by: userId
        })
        .select()
        .single();

      let processedRecords = 0;
      let failedRecords = 0;
      const validationErrors = [];

      try {
        // Parse file based on type
        let records = [];
        
        if (fileInfo.type === 'application/json') {
          records = JSON.parse(fileData);
        } else if (fileInfo.type === 'text/csv') {
          records = this.parseCSV(fileData);
        } else {
          throw new Error(`Unsupported file type: ${fileInfo.type}`);
        }

        if (!Array.isArray(records)) {
          records = [records];
        }

        // Validate and process each record
        for (const record of records) {
          try {
            const validation = this.validateRecord(record);
            if (!validation.valid) {
              validationErrors.push({
                record_index: processedRecords + failedRecords,
                errors: validation.errors
              });
              failedRecords++;
              continue;
            }

            await this.processRecord(record, fileInfo.target_table);
            processedRecords++;
          } catch (error) {
            failedRecords++;
            validationErrors.push({
              record_index: processedRecords + failedRecords,
              error: error.message
            });
          }
        }

        // Update import log
        await this.supabaseClient
          .from('data_import_logs')
          .update({
            status: 'completed',
            total_records: records.length,
            processed_records: processedRecords,
            failed_records: failedRecords,
            completed_at: new Date().toISOString(),
            validation_errors: validationErrors.length > 0 ? validationErrors : null
          })
          .eq('id', importLog.id);

        const result = {
          import_id: importLog.id,
          total_records: records.length,
          processed_records: processedRecords,
          failed_records: failedRecords,
          validation_errors: validationErrors
        };

        await this.logActivity(userId, 'file_import_completed', result);
        return result;

      } catch (error) {
        // Update import log with failure
        await this.supabaseClient
          .from('data_import_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_details: [{ error: error.message }]
          })
          .eq('id', importLog.id);

        throw error;
      }

    } catch (error) {
      await this.createAlert(userId, 'file_import_failed', error.message, 'high');
      throw error;
    }
  }

  private async processRecord(record: any, tableName: string): Promise<void> {
    // Insert record into specified table
    const { error } = await this.supabaseClient
      .from(tableName)
      .insert(record);

    if (error) {
      throw new Error(`Failed to insert record: ${error.message}`);
    }
  }

  private validateRecord(record: any): { valid: boolean; errors: string[] } {
    const errors = [];

    // Basic validation
    if (!record || typeof record !== 'object') {
      errors.push('Record must be an object');
    }

    if (Object.keys(record).length === 0) {
      errors.push('Record cannot be empty');
    }

    // Check for required fields (customize based on your needs)
    const requiredFields = ['id'];
    for (const field of requiredFields) {
      if (!record[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private parseCSV(csvData: string): any[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const record = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || null;
      });
      
      records.push(record);
    }

    return records;
  }
}

export const dataIngestorHandler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: any,
  openaiClient: any,
  memory: any
) => {
  const agent = new DataIngestorAgent(supabaseClient);

  try {
    let result;

    switch (intent) {
      case 'import_from_api':
        result = await agent.importFromAPI(userId, params.source, params.api_config);
        break;

      case 'import_from_file':
        result = await agent.importFromFile(userId, params.file_data, params.file_info);
        break;

      case 'get_import_status':
        // Get import status
        const { data: imports } = await supabaseClient
          .from('data_import_logs')
          .select('*')
          .eq('processed_by', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        result = { recent_imports: imports };
        break;

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }

    return {
      success: true,
      result,
      memory_updates: {
        last_import: result,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    StructuredLogger.error('Data ingestor agent error', { error: error.message, userId, intent });
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