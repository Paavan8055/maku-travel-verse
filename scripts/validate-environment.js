#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables and connections
 * for production deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const REQUIRED_ENV_VARS = {
  backend: [
    { name: 'MONGO_URL', description: 'MongoDB connection string', validate: 'mongodb' },
    { name: 'BLOCKCHAIN_MODE', description: 'Blockchain mode (mock/live)', validate: 'enum', values: ['mock', 'live'] },
    { name: 'POLYGON_RPC_URL', description: 'Polygon RPC endpoint', validate: 'url' },
  ],
  frontend: [
    { name: 'VITE_BACKEND_URL', description: 'Backend API URL', validate: 'url' },
    { name: 'VITE_SUPABASE_URL', description: 'Supabase project URL', validate: 'url' },
    { name: 'VITE_SUPABASE_ANON_KEY', description: 'Supabase anonymous key', validate: 'string' },
  ]
};

const OPTIONAL_ENV_VARS = {
  backend: [
    { name: 'MAKU_TOKEN_ADDRESS', description: 'Deployed MAKU token address', validate: 'ethereum' },
    { name: 'MAKU_NFT_ADDRESS', description: 'Deployed NFT contract address', validate: 'ethereum' },
    { name: 'BLOCKCHAIN_PRIVATE_KEY', description: 'Deployer private key', validate: 'ethereum_key' },
  ]
};

function loadEnv(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

function validateValue(value, validationType, expectedValues = []) {
  if (!value) return { valid: false, error: 'Missing value' };
  
  switch (validationType) {
    case 'url':
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }
    
    case 'mongodb':
      if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
        return { valid: false, error: 'Must start with mongodb:// or mongodb+srv://' };
      }
      return { valid: true };
    
    case 'ethereum':
      if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        return { valid: false, error: 'Invalid Ethereum address format' };
      }
      return { valid: true };
    
    case 'ethereum_key':
      if (value === 'mock_key_for_testing_only') {
        return { valid: false, error: 'Using mock key (set real key for production)' };
      }
      if (!/^(0x)?[a-fA-F0-9]{64}$/.test(value)) {
        return { valid: false, error: 'Invalid private key format' };
      }
      return { valid: true };
    
    case 'enum':
      if (!expectedValues.includes(value)) {
        return { valid: false, error: `Must be one of: ${expectedValues.join(', ')}` };
      }
      return { valid: true };
    
    case 'string':
      if (value.length < 10) {
        return { valid: false, error: 'Value too short (minimum 10 characters)' };
      }
      return { valid: true };
    
    default:
      return { valid: true };
  }
}

async function testConnection(url, name) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };
    
    const req = (urlObj.protocol === 'https:' ? https : require('http')).request(options, (res) => {
      resolve({ success: true, statusCode: res.statusCode });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });
    
    req.end();
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 MAKU.Travel Environment Validation');
  console.log('='.repeat(80));
  
  const results = {
    backend: { required: [], optional: [] },
    frontend: { required: [], optional: [] },
    connections: []
  };
  
  // Validate Backend Environment
  console.log('\n📦 Backend Environment (.env)');
  console.log('-'.repeat(80));
  
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  const backendEnv = loadEnv(backendEnvPath);
  
  if (!backendEnv) {
    console.log('❌ Backend .env file not found');
    results.backend.error = 'File not found';
  } else {
    console.log(`✅ Found: ${backendEnvPath}`);
    
    // Check required variables
    for (const envVar of REQUIRED_ENV_VARS.backend) {
      const value = backendEnv[envVar.name];
      const validation = validateValue(value, envVar.validate, envVar.values);
      
      if (!value) {
        console.log(`❌ ${envVar.name}: Missing`);
        console.log(`   Description: ${envVar.description}`);
        results.backend.required.push({ ...envVar, status: 'missing' });
      } else if (!validation.valid) {
        console.log(`⚠️  ${envVar.name}: ${validation.error}`);
        console.log(`   Value: ${value.substring(0, 50)}...`);
        results.backend.required.push({ ...envVar, status: 'invalid', error: validation.error });
      } else {
        console.log(`✅ ${envVar.name}: Valid`);
        results.backend.required.push({ ...envVar, status: 'valid' });
      }
    }
    
    // Check optional variables
    console.log('\nOptional Variables:');
    for (const envVar of OPTIONAL_ENV_VARS.backend) {
      const value = backendEnv[envVar.name];
      const validation = validateValue(value, envVar.validate);
      
      if (!value) {
        console.log(`ℹ️  ${envVar.name}: Not set (optional)`);
        results.backend.optional.push({ ...envVar, status: 'missing' });
      } else if (!validation.valid) {
        console.log(`⚠️  ${envVar.name}: ${validation.error}`);
        results.backend.optional.push({ ...envVar, status: 'invalid', error: validation.error });
      } else {
        console.log(`✅ ${envVar.name}: Valid`);
        results.backend.optional.push({ ...envVar, status: 'valid' });
      }
    }
  }
  
  // Validate Frontend Environment
  console.log('\n🎨 Frontend Environment (.env)');
  console.log('-'.repeat(80));
  
  const frontendEnvPath = path.join(__dirname, '../frontend/.env');
  const frontendEnv = loadEnv(frontendEnvPath);
  
  if (!frontendEnv) {
    console.log('❌ Frontend .env file not found');
    results.frontend.error = 'File not found';
  } else {
    console.log(`✅ Found: ${frontendEnvPath}`);
    
    for (const envVar of REQUIRED_ENV_VARS.frontend) {
      const value = frontendEnv[envVar.name];
      const validation = validateValue(value, envVar.validate);
      
      if (!value) {
        console.log(`❌ ${envVar.name}: Missing`);
        console.log(`   Description: ${envVar.description}`);
        results.frontend.required.push({ ...envVar, status: 'missing' });
      } else if (!validation.valid) {
        console.log(`⚠️  ${envVar.name}: ${validation.error}`);
        results.frontend.required.push({ ...envVar, status: 'invalid', error: validation.error });
      } else {
        console.log(`✅ ${envVar.name}: Valid`);
        results.frontend.required.push({ ...envVar, status: 'valid' });
      }
    }
  }
  
  // Test Connections
  console.log('\n🌐 Connection Tests');
  console.log('-'.repeat(80));
  
  if (backendEnv && backendEnv.POLYGON_RPC_URL) {
    console.log('Testing Polygon RPC...');
    const result = await testConnection(backendEnv.POLYGON_RPC_URL, 'Polygon RPC');
    if (result.success) {
      console.log(`✅ Polygon RPC: Connected (Status: ${result.statusCode})`);
      results.connections.push({ name: 'Polygon RPC', status: 'connected' });
    } else {
      console.log(`❌ Polygon RPC: Failed - ${result.error}`);
      results.connections.push({ name: 'Polygon RPC', status: 'failed', error: result.error });
    }
  }
  
  if (frontendEnv && frontendEnv.VITE_SUPABASE_URL) {
    console.log('Testing Supabase...');
    const result = await testConnection(frontendEnv.VITE_SUPABASE_URL + '/rest/v1/', 'Supabase');
    if (result.success) {
      console.log(`✅ Supabase: Connected (Status: ${result.statusCode})`);
      results.connections.push({ name: 'Supabase', status: 'connected' });
    } else {
      console.log(`❌ Supabase: Failed - ${result.error}`);
      results.connections.push({ name: 'Supabase', status: 'failed', error: result.error });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Validation Summary');
  console.log('='.repeat(80));
  
  const backendRequiredValid = results.backend.required.filter(v => v.status === 'valid').length;
  const backendRequiredTotal = results.backend.required.length;
  const frontendRequiredValid = results.frontend.required.filter(v => v.status === 'valid').length;
  const frontendRequiredTotal = results.frontend.required.length;
  const connectionsValid = results.connections.filter(c => c.status === 'connected').length;
  const connectionsTotal = results.connections.length;
  
  console.log(`\nBackend Required Variables: ${backendRequiredValid}/${backendRequiredTotal} valid`);
  console.log(`Frontend Required Variables: ${frontendRequiredValid}/${frontendRequiredTotal} valid`);
  console.log(`Connection Tests: ${connectionsValid}/${connectionsTotal} passed`);
  
  const allValid = backendRequiredValid === backendRequiredTotal &&
                   frontendRequiredValid === frontendRequiredTotal &&
                   connectionsValid === connectionsTotal;
  
  if (allValid) {
    console.log('\n🎉 All validations passed! Environment is production-ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some validations failed. Review issues above before deployment.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Validation error:', error);
  process.exit(1);
});
