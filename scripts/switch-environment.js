#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to read JSON file
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Helper function to update .env file
function updateEnvFile(filePath, key, value) {
  try {
    let envContent = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(filePath, envContent, 'utf8');
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Main function
function switchEnvironment() {
  const args = process.argv.slice(2);
  const targetEnv = args[0];

  if (!targetEnv) {
    console.log('Usage: node switch-environment.js <lovable|emergent>');
    console.log('Available environments: lovable, emergent');
    process.exit(1);
  }

  // Read preview config
  const configPath = path.join(__dirname, '../preview-config.json');
  const config = readJsonFile(configPath);

  if (!config.environments[targetEnv]) {
    console.error(`Environment '${targetEnv}' not found.`);
    console.log('Available environments:', Object.keys(config.environments).join(', '));
    process.exit(1);
  }

  // Update current environment
  config.current_environment = targetEnv;
  config.last_updated = new Date().toISOString();

  // Update environment states
  Object.keys(config.environments).forEach(env => {
    config.environments[env].active = (env === targetEnv);
  });

  // Write updated config
  writeJsonFile(configPath, config);

  // Update .emergent/emergent.yml
  const emergentYmlPath = path.join(__dirname, '../.emergent/emergent.yml');
  const emergentConfig = readJsonFile(emergentYmlPath);
  emergentConfig.source = targetEnv;
  writeJsonFile(emergentYmlPath, emergentConfig);

  // Update frontend .env
  const frontendEnvPath = path.join(__dirname, '../frontend/.env');
  const backendUrl = config.environments[targetEnv].backend_url;
  updateEnvFile(frontendEnvPath, 'REACT_APP_BACKEND_URL', backendUrl);

  console.log(`✅ Successfully switched to ${targetEnv} environment`);
  console.log(`📍 Backend URL: ${backendUrl}`);
  console.log(`🔧 Source: ${targetEnv}`);
  console.log('\n💡 Remember to restart services if needed:');
  console.log('   sudo supervisorctl restart all');
}

// Show current status if no arguments
if (process.argv.length === 2) {
  const configPath = path.join(__dirname, '../preview-config.json');
  const config = readJsonFile(configPath);
  
  console.log('🏗️  Preview Environment Status');
  console.log('================================');
  console.log(`Current Environment: ${config.current_environment}`);
  console.log(`Last Updated: ${config.last_updated}`);
  console.log('\nAvailable Environments:');
  
  Object.entries(config.environments).forEach(([env, details]) => {
    const status = details.active ? '🟢 ACTIVE' : '⚪ Inactive';
    console.log(`  ${env}: ${status}`);
    console.log(`    - ${details.description}`);
    console.log(`    - URL: ${details.backend_url}`);
  });
  
  console.log('\nUsage: node switch-environment.js <lovable|emergent>');
} else {
  switchEnvironment();
}