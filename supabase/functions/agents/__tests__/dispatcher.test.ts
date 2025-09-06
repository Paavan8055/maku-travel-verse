/**
 * Dynamic Agent Dispatcher Tests
 * Tests all 70 agent modules return expected placeholder responses
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { agentConfigs, executeAgent } from '../index.ts';

Deno.test('Agent Configs - All 70 agents are defined', () => {
  assertEquals(Object.keys(agentConfigs).length, 70, 'Should have exactly 70 agents configured');
});

Deno.test('Agent Configs - Categories are properly distributed', () => {
  const customerAgents = Object.values(agentConfigs).filter(agent => agent.category === 'customer');
  const adminAgents = Object.values(agentConfigs).filter(agent => agent.category === 'admin');
  const monitoringAgents = Object.values(agentConfigs).filter(agent => agent.category === 'monitoring');

  assertEquals(customerAgents.length, 20, 'Should have 20 customer agents');
  assertEquals(adminAgents.length, 35, 'Should have 35 admin agents');
  assertEquals(monitoringAgents.length, 15, 'Should have 15 monitoring agents');
});

Deno.test('Agent Configs - All agents have required properties', () => {
  Object.entries(agentConfigs).forEach(([agentId, config]) => {
    assertExists(config.name, `Agent ${agentId} should have a name`);
    assertExists(config.category, `Agent ${agentId} should have a category`);
    assertExists(config.description, `Agent ${agentId} should have a description`);
    assertExists(config.capabilities, `Agent ${agentId} should have capabilities array`);
    
    // Check category is valid
    const validCategories = ['customer', 'admin', 'monitoring'];
    assertEquals(
      validCategories.includes(config.category),
      true,
      `Agent ${agentId} should have valid category`
    );
  });
});

// Test all customer agents (1-20)
const customerAgentTests = [
  'booking-assistant', 'travel-advisor', 'payment-processor', 'itinerary-manager',
  'loyalty-manager', 'document-verifier', 'weather-advisor', 'local-guide',
  'emergency-assistant', 'accessibility-helper', 'family-planner', 'business-travel',
  'budget-optimizer', 'group-coordinator', 'visa-assistant', 'insurance-advisor',
  'meal-preference', 'cultural-guide', 'language-helper', 'senior-travel'
];

customerAgentTests.forEach(agentId => {
  Deno.test(`Customer Agent: ${agentId} - Returns valid placeholder response`, async () => {
    const result = await executeAgent(agentId, { testParam: 'test' });
    
    assertExists(result, `Agent ${agentId} should return a result`);
    assertEquals(result.success, true, `Agent ${agentId} should return success: true`);
    assertExists(result.message, `Agent ${agentId} should return a message`);
    assertEquals(typeof result.message, 'string', `Agent ${agentId} message should be a string`);
  });
});

// Test all admin agents (21-55)
const adminAgentTests = [
  'user-management', 'booking-operations', 'refund-processor', 'fraud-detector',
  'system-monitor', 'provider-manager', 'pricing-analyst', 'inventory-manager',
  'customer-support', 'escalation-handler', 'data-analyst', 'report-generator',
  'compliance-checker', 'audit-tracker', 'security-monitor', 'backup-manager',
  'deployment-coordinator', 'feature-flag-manager', 'ab-test-coordinator', 'performance-optimizer',
  'error-tracker', 'log-analyzer', 'capacity-planner', 'cost-optimizer',
  'vendor-coordinator', 'contract-manager', 'sla-monitor', 'uptime-tracker',
  'alert-coordinator', 'incident-responder', 'change-manager', 'config-manager',
  'access-controller', 'permission-manager', 'onboarding-coordinator'
];

adminAgentTests.forEach(agentId => {
  Deno.test(`Admin Agent: ${agentId} - Returns valid placeholder response`, async () => {
    const result = await executeAgent(agentId, { testParam: 'test' });
    
    assertExists(result, `Agent ${agentId} should return a result`);
    assertEquals(result.success, true, `Agent ${agentId} should return success: true`);
    assertExists(result.message, `Agent ${agentId} should return a message`);
    assertEquals(typeof result.message, 'string', `Agent ${agentId} message should be a string`);
  });
});

// Test all monitoring agents (56-70)
const monitoringAgentTests = [
  'health-checker', 'performance-monitor', 'availability-tracker', 'latency-monitor',
  'error-rate-tracker', 'throughput-analyzer', 'resource-monitor', 'api-monitor',
  'database-monitor', 'cache-monitor', 'queue-monitor', 'network-monitor',
  'security-scanner', 'vulnerability-checker', 'compliance-monitor'
];

monitoringAgentTests.forEach(agentId => {
  Deno.test(`Monitoring Agent: ${agentId} - Returns valid placeholder response`, async () => {
    const result = await executeAgent(agentId, { testParam: 'test' });
    
    assertExists(result, `Agent ${agentId} should return a result`);
    assertEquals(result.success, true, `Agent ${agentId} should return success: true`);
    assertExists(result.message, `Agent ${agentId} should return a message`);
    assertEquals(typeof result.message, 'string', `Agent ${agentId} message should be a string`);
  });
});

Deno.test('executeAgent - Handles invalid agent ID', async () => {
  const result = await executeAgent('invalid-agent', { testParam: 'test' });
  
  assertEquals(result.success, false, 'Should return success: false for invalid agent');
  assertExists(result.error, 'Should return an error message');
  assertEquals(result.error, 'Unknown agent: invalid-agent');
});

Deno.test('executeAgent - Handles empty parameters', async () => {
  const result = await executeAgent('booking-assistant', {});
  
  assertEquals(result.success, true, 'Should handle empty parameters gracefully');
  assertExists(result.message, 'Should still return a message');
});

Deno.test('executeAgent - Handles null parameters', async () => {
  const result = await executeAgent('booking-assistant', null as any);
  
  assertEquals(result.success, true, 'Should handle null parameters gracefully');
  assertExists(result.message, 'Should still return a message');
});

// Test agent response structure consistency
Deno.test('All agents return consistent response structure', async () => {
  const testAgents = ['booking-assistant', 'user-management', 'health-checker'];
  
  for (const agentId of testAgents) {
    const result = await executeAgent(agentId, { test: true });
    
    // Check required fields
    assertExists(result.success, `Agent ${agentId} should have success field`);
    assertEquals(typeof result.success, 'boolean', `Agent ${agentId} success should be boolean`);
    
    if (result.success) {
      assertExists(result.message, `Agent ${agentId} should have message on success`);
      assertEquals(typeof result.message, 'string', `Agent ${agentId} message should be string`);
    } else {
      assertExists(result.error, `Agent ${agentId} should have error on failure`);
      assertEquals(typeof result.error, 'string', `Agent ${agentId} error should be string`);
    }
  }
});