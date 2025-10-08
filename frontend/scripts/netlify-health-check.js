#!/usr/bin/env node

/**
 * Netlify deployment health check script
 * Validates deployment status and core functionality
 */

import https from 'https';
import { performance } from 'perf_hooks';

const TIMEOUT = 30000; // 30 seconds
const RETRIES = 3;
const DELAY_BETWEEN_RETRIES = 5000; // 5 seconds

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function httpGet(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const request = https.get(url, { timeout }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const endTime = performance.now();
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          data: data,
          responseTime: Math.round(endTime - startTime)
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });
  });
}

async function checkEndpoint(url, expectedStatus = 200, maxRetries = RETRIES) {
  console.log(`🔍 Checking: ${url}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await httpGet(url);
      
      if (result.statusCode === expectedStatus) {
        console.log(`✅ OK (${result.responseTime}ms) - Status: ${result.statusCode}`);
        return { success: true, ...result };
      } else {
        console.log(`❌ Unexpected status: ${result.statusCode} (expected ${expectedStatus})`);
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in ${DELAY_BETWEEN_RETRIES/1000}s... (attempt ${attempt}/${maxRetries})`);
          await sleep(DELAY_BETWEEN_RETRIES);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in ${DELAY_BETWEEN_RETRIES/1000}s... (attempt ${attempt}/${maxRetries})`);
        await sleep(DELAY_BETWEEN_RETRIES);
      }
    }
  }
  
  return { success: false };
}

async function validateSecurityHeaders(url) {
  console.log(`🔒 Checking security headers: ${url}`);
  
  try {
    const result = await httpGet(url);
    const headers = result.headers;
    
    const securityChecks = {
      'x-content-type-options': headers['x-content-type-options'] === 'nosniff',
      'x-frame-options': headers['x-frame-options'] === 'DENY',
      'referrer-policy': !!headers['referrer-policy'],
      'cache-control': !!headers['cache-control']
    };
    
    let passed = 0;
    let total = Object.keys(securityChecks).length;
    
    for (const [header, isValid] of Object.entries(securityChecks)) {
      if (isValid) {
        console.log(`  ✅ ${header}`);
        passed++;
      } else {
        console.log(`  ❌ ${header} (missing or invalid)`);
      }
    }
    
    console.log(`🛡️  Security headers: ${passed}/${total} passed`);
    return { passed, total, success: passed >= total * 0.75 }; // 75% threshold
  } catch (error) {
    console.log(`❌ Failed to check security headers: ${error.message}`);
    return { success: false };
  }
}

async function checkAssetCaching(baseUrl) {
  console.log(`📦 Checking asset caching...`);
  
  try {
    const indexResult = await httpGet(baseUrl);
    const assetMatch = indexResult.data.match(/\/assets\/[^"']+\.(css|js)/);
    
    if (assetMatch) {
      const assetUrl = baseUrl + assetMatch[0];
      const assetResult = await httpGet(assetUrl);
      
      const cacheControl = assetResult.headers['cache-control'];
      if (cacheControl && cacheControl.includes('max-age')) {
        console.log(`✅ Asset caching configured: ${cacheControl}`);
        return { success: true };
      } else {
        console.log(`❌ Asset caching not properly configured`);
        return { success: false };
      }
    } else {
      console.log(`⚠️  Could not find assets to test caching`);
      return { success: true }; // Don't fail if we can't find assets
    }
  } catch (error) {
    console.log(`❌ Failed to check asset caching: ${error.message}`);
    return { success: false };
  }
}

async function checkMakuFeatures(baseUrl) {
  console.log(`🎯 Checking Maku.Travel specific features...`);
  
  const featureChecks = [
    { name: 'Smart Dreams', path: '/smart-dreams' },
    { name: 'NFT Collection', path: '/nft' },
    { name: 'AI Intelligence', path: '/ai-intelligence' },
    { name: 'Admin Dashboard', path: '/admin' }
  ];
  
  let passed = 0;
  for (const feature of featureChecks) {
    try {
      const result = await httpGet(`${baseUrl}${feature.path}`);
      if (result.statusCode === 200) {
        console.log(`  ✅ ${feature.name}`);
        passed++;
      } else {
        console.log(`  ❌ ${feature.name} (status: ${result.statusCode})`);
      }
    } catch (error) {
      console.log(`  ❌ ${feature.name} (error: ${error.message})`);
    }
  }
  
  console.log(`🚀 Maku features: ${passed}/${featureChecks.length} accessible`);
  return { passed, total: featureChecks.length, success: passed >= 3 }; // At least 3 features should work
}

async function runHealthCheck(deploymentUrl) {
  console.log(`\n🚀 Running Netlify health check for: ${deploymentUrl}`);
  console.log(`⏱️  Started at: ${new Date().toISOString()}\n`);
  
  const checks = [];
  
  // Basic connectivity
  checks.push({
    name: 'Main page',
    check: () => checkEndpoint(deploymentUrl, 200)
  });
  
  // SPA routing
  checks.push({
    name: 'SPA routing',
    check: () => checkEndpoint(`${deploymentUrl}/hotels`, 200)
  });
  
  // Backend health (if available)
  checks.push({
    name: 'Backend health check',
    check: () => checkEndpoint(`${deploymentUrl}/api/health`, 200).catch(() => ({ success: true })) // Optional
  });
  
  // Security headers
  checks.push({
    name: 'Security headers',
    check: () => validateSecurityHeaders(deploymentUrl)
  });
  
  // Asset caching
  checks.push({
    name: 'Asset caching',
    check: () => checkAssetCaching(deploymentUrl)
  });
  
  // Maku-specific features
  checks.push({
    name: 'Maku.Travel features',
    check: () => checkMakuFeatures(deploymentUrl)
  });
  
  // Run all checks
  const results = [];
  for (const { name, check } of checks) {
    console.log(`\n--- ${name} ---`);
    try {
      const result = await check();
      results.push({ name, ...result });
    } catch (error) {
      console.log(`❌ ${name} failed: ${error.message}`);
      results.push({ name, success: false });
    }
  }
  
  // Summary
  console.log(`\n📊 NETLIFY DEPLOYMENT HEALTH CHECK SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  
  let passed = 0;
  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.success) passed++;
  }
  
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`\n🎯 Overall: ${passed}/${total} checks passed (${percentage}%)`);
  console.log(`⏱️  Completed at: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  const isHealthy = percentage >= 80; // 80% threshold
  if (isHealthy) {
    console.log(`\n🎉 Netlify deployment is healthy! ✨`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Netlify deployment health check failed. Please investigate.`);
    process.exit(1);
  }
}

// Main execution
const deploymentUrl = process.argv[2];

if (!deploymentUrl) {
  console.error('❌ Usage: node netlify-health-check.js <deployment-url>');
  console.error('   Example: node netlify-health-check.js https://maku.travel');
  process.exit(1);
}

// Ensure URL format
const url = deploymentUrl.startsWith('http') ? deploymentUrl : `https://${deploymentUrl}`;

runHealthCheck(url).catch((error) => {
  console.error(`❌ Health check failed: ${error.message}`);
  process.exit(1);
});

export { runHealthCheck, checkEndpoint, validateSecurityHeaders, checkMakuFeatures };