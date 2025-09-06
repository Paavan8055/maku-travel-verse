import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export class SupabaseSchemaManagerAgent extends BaseAgent {
  constructor(supabaseClient: any) {
    super('supabase-schema-migrator', supabaseClient);
  }

  async analyzeDatabaseSchema(userId: string): Promise<any> {
    try {
      StructuredLogger.info('Analyzing database schema', { userId });

      // Get all table schemas
      const { data: tables, error } = await this.supabaseClient
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');

      if (error) throw error;

      // Get column information for each table
      const schemaAnalysis = {
        total_tables: tables?.length || 0,
        tables: [],
        recommendations: []
      };

      for (const table of tables || []) {
        const { data: columns } = await this.supabaseClient
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', table.table_name)
          .eq('table_schema', 'public');

        schemaAnalysis.tables.push({
          name: table.table_name,
          columns: columns || []
        });
      }

      await this.logActivity(userId, 'schema_analysis', { analysis: schemaAnalysis });
      return schemaAnalysis;

    } catch (error) {
      await this.createAlert(userId, 'schema_analysis_failed', error.message, 'medium');
      throw error;
    }
  }

  async planMigration(userId: string, changes: any): Promise<any> {
    try {
      StructuredLogger.info('Planning database migration', { userId, changes });

      const migrationPlan = {
        migration_id: crypto.randomUUID(),
        planned_changes: changes,
        estimated_duration: this.estimateMigrationTime(changes),
        rollback_plan: this.generateRollbackPlan(changes),
        risks: this.assessMigrationRisks(changes)
      };

      // Log migration plan
      await this.supabaseClient
        .from('migration_logs')
        .insert({
          migration_name: `User-${userId}-${Date.now()}`,
          migration_version: '1.0.0',
          status: 'planned',
          applied_by: userId,
          metadata: migrationPlan
        });

      await this.logActivity(userId, 'migration_planned', migrationPlan);
      return migrationPlan;

    } catch (error) {
      await this.createAlert(userId, 'migration_planning_failed', error.message, 'high');
      throw error;
    }
  }

  private estimateMigrationTime(changes: any): number {
    // Simple estimation based on change types
    let timeMinutes = 0;
    
    if (changes.add_tables) timeMinutes += changes.add_tables.length * 2;
    if (changes.add_columns) timeMinutes += changes.add_columns.length * 1;
    if (changes.add_indexes) timeMinutes += changes.add_indexes.length * 3;
    if (changes.modify_columns) timeMinutes += changes.modify_columns.length * 5;

    return Math.max(timeMinutes, 1);
  }

  private generateRollbackPlan(changes: any): any {
    // Generate reverse operations for rollback
    const rollback = {
      drop_tables: changes.add_tables || [],
      drop_columns: changes.add_columns || [],
      drop_indexes: changes.add_indexes || [],
      revert_modifications: changes.modify_columns || []
    };

    return rollback;
  }

  private assessMigrationRisks(changes: any): string[] {
    const risks = [];
    
    if (changes.modify_columns?.length > 0) {
      risks.push('Column modifications may cause data loss');
    }
    if (changes.drop_tables?.length > 0) {
      risks.push('Table drops will permanently delete data');
    }
    if (changes.add_indexes?.length > 5) {
      risks.push('Multiple index creation may impact performance');
    }

    return risks;
  }
}

export const supabaseSchemaManagerHandler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: any,
  openaiClient: any,
  memory: any
) => {
  const agent = new SupabaseSchemaManagerAgent(supabaseClient);

  try {
    let result;

    switch (intent) {
      case 'analyze_schema':
        result = await agent.analyzeDatabaseSchema(userId);
        break;

      case 'plan_migration':
        result = await agent.planMigration(userId, params.changes);
        break;

      case 'validate_schema':
        // Validate schema integrity
        result = await agent.analyzeDatabaseSchema(userId);
        break;

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }

    return {
      success: true,
      result,
      memory_updates: {
        last_schema_analysis: result,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    StructuredLogger.error('Schema migrator agent error', { error: error.message, userId, intent });
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