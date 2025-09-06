import { BaseAgent, AgentHandler, StructuredLogger } from '../_shared/memory-utils.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

export class APIKeyManagerAgent extends BaseAgent {
  constructor(supabaseClient: any) {
    super('api-key-manager', supabaseClient);
  }

  async rotateAPIKey(userId: string, provider: string, keyName: string, reason: string): Promise<any> {
    try {
      StructuredLogger.info('Starting API key rotation', { userId, provider, keyName });

      // Get current key (if exists)
      const { data: currentRotation } = await this.supabaseClient
        .from('api_key_rotations')
        .select('*')
        .eq('provider', provider)
        .eq('key_name', keyName)
        .eq('status', 'active')
        .single();

      // Generate new key hash (in production, this would generate a real API key)
      const newKeyHash = this.generateKeyHash();
      const oldKeyHash = currentRotation?.new_key_hash || null;

      // Calculate next rotation date (30 days from now)
      const nextRotationDate = new Date();
      nextRotationDate.setDate(nextRotationDate.getDate() + 30);

      // Deactivate old rotation record
      if (currentRotation) {
        await this.supabaseClient
          .from('api_key_rotations')
          .update({ status: 'rotated' })
          .eq('id', currentRotation.id);
      }

      // Create new rotation record
      const { data: newRotation, error } = await this.supabaseClient
        .from('api_key_rotations')
        .insert({
          provider,
          key_name: keyName,
          old_key_hash: oldKeyHash,
          new_key_hash: newKeyHash,
          rotation_reason: reason,
          rotated_by: userId,
          next_rotation_date: nextRotationDate.toISOString(),
          status: 'active',
          metadata: {
            rotation_method: 'automated',
            previous_rotation_id: currentRotation?.id
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Create alert for manual key update
      await this.createAlert(
        userId,
        'api_key_rotation_required',
        `API key for ${provider}:${keyName} has been rotated. Please update your configuration.`,
        'high',
        {
          provider,
          key_name: keyName,
          rotation_id: newRotation.id,
          new_key_hash: newKeyHash
        }
      );

      const result = {
        rotation_id: newRotation.id,
        provider,
        key_name: keyName,
        new_key_hash: newKeyHash,
        next_rotation_date: nextRotationDate.toISOString(),
        requires_manual_update: true
      };

      await this.logActivity(userId, 'api_key_rotated', result);
      return result;

    } catch (error) {
      await this.createAlert(userId, 'api_key_rotation_failed', error.message, 'high');
      throw error;
    }
  }

  async checkExpiringKeys(userId: string): Promise<any> {
    try {
      StructuredLogger.info('Checking for expiring API keys', { userId });

      // Get keys expiring in the next 7 days
      const expirationThreshold = new Date();
      expirationThreshold.setDate(expirationThreshold.getDate() + 7);

      const { data: expiringKeys, error } = await this.supabaseClient
        .from('api_key_rotations')
        .select('*')
        .eq('status', 'active')
        .lte('next_rotation_date', expirationThreshold.toISOString())
        .order('next_rotation_date', { ascending: true });

      if (error) throw error;

      // Create alerts for expiring keys
      for (const key of expiringKeys || []) {
        const daysUntilExpiry = Math.ceil(
          (new Date(key.next_rotation_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.createAlert(
          userId,
          'api_key_expiring',
          `API key for ${key.provider}:${key.key_name} expires in ${daysUntilExpiry} days`,
          daysUntilExpiry <= 3 ? 'high' : 'medium',
          {
            provider: key.provider,
            key_name: key.key_name,
            rotation_id: key.id,
            days_until_expiry: daysUntilExpiry
          }
        );
      }

      const result = {
        expiring_keys: expiringKeys || [],
        total_expiring: expiringKeys?.length || 0,
        alerts_created: expiringKeys?.length || 0
      };

      await this.logActivity(userId, 'expiring_keys_checked', result);
      return result;

    } catch (error) {
      await this.createAlert(userId, 'expiring_keys_check_failed', error.message, 'medium');
      throw error;
    }
  }

  async validateAPIKeys(userId: string, keysToValidate: any[]): Promise<any> {
    try {
      StructuredLogger.info('Validating API keys', { userId, keyCount: keysToValidate.length });

      const validationResults = [];

      for (const keyConfig of keysToValidate) {
        try {
          const isValid = await this.testAPIKey(keyConfig);
          
          validationResults.push({
            provider: keyConfig.provider,
            key_name: keyConfig.key_name,
            valid: isValid,
            last_tested: new Date().toISOString()
          });

          // Update rotation record with validation result
          await this.supabaseClient
            .from('api_key_rotations')
            .update({
              metadata: {
                last_validation: new Date().toISOString(),
                validation_result: isValid
              }
            })
            .eq('provider', keyConfig.provider)
            .eq('key_name', keyConfig.key_name)
            .eq('status', 'active');

          if (!isValid) {
            await this.createAlert(
              userId,
              'api_key_invalid',
              `API key for ${keyConfig.provider}:${keyConfig.key_name} failed validation`,
              'high',
              keyConfig
            );
          }

        } catch (error) {
          validationResults.push({
            provider: keyConfig.provider,
            key_name: keyConfig.key_name,
            valid: false,
            error: error.message,
            last_tested: new Date().toISOString()
          });
        }
      }

      const result = {
        total_tested: validationResults.length,
        valid_keys: validationResults.filter(r => r.valid).length,
        invalid_keys: validationResults.filter(r => !r.valid).length,
        results: validationResults
      };

      await this.logActivity(userId, 'api_keys_validated', result);
      return result;

    } catch (error) {
      await this.createAlert(userId, 'api_key_validation_failed', error.message, 'medium');
      throw error;
    }
  }

  async getKeyRotationHistory(userId: string, provider?: string): Promise<any> {
    try {
      let query = this.supabaseClient
        .from('api_key_rotations')
        .select('*')
        .order('rotation_date', { ascending: false });

      if (provider) {
        query = query.eq('provider', provider);
      }

      const { data: rotations, error } = await query.limit(50);

      if (error) throw error;

      const result = {
        rotations: rotations || [],
        total_rotations: rotations?.length || 0,
        providers: [...new Set(rotations?.map(r => r.provider) || [])]
      };

      return result;

    } catch (error) {
      throw error;
    }
  }

  private generateKeyHash(): string {
    // Generate a cryptographically secure hash for the API key
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async testAPIKey(keyConfig: any): Promise<boolean> {
    try {
      // This would test the actual API key against the provider's endpoint
      // For demo purposes, we'll simulate the test
      
      if (!keyConfig.test_endpoint) {
        return true; // Assume valid if no test endpoint
      }

      const response = await fetch(keyConfig.test_endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keyConfig.api_key}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;

    } catch (error) {
      return false;
    }
  }
}

export const apiKeyManagerHandler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: any,
  openaiClient: any,
  memory: any
) => {
  const agent = new APIKeyManagerAgent(supabaseClient);

  try {
    let result;

    switch (intent) {
      case 'rotate_key':
        result = await agent.rotateAPIKey(userId, params.provider, params.key_name, params.reason);
        break;

      case 'check_expiring':
        result = await agent.checkExpiringKeys(userId);
        break;

      case 'validate_keys':
        result = await agent.validateAPIKeys(userId, params.keys);
        break;

      case 'get_rotation_history':
        result = await agent.getKeyRotationHistory(userId, params.provider);
        break;

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }

    return {
      success: true,
      result,
      memory_updates: {
        last_key_operation: result,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    StructuredLogger.error('API key manager agent error', { error: error.message, userId, intent });
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