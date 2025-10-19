/**
 * Lighthouse Performance Testing Script
 * Target: Score ≥ 90 for Production Readiness
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/blockchain', name: 'Blockchain' },
  { path: '/collaborative-planning', name: 'Collaborative Planning' },
  { path: '/travel-fund', name: 'Travel Fund' },
];

const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

async function runLighthouse(url, name) {
  console.log(`\n🔍 Testing: ${name} (${url})`);
  
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });

  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options, LIGHTHOUSE_CONFIG);

    await chrome.kill();

    const scores = {
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
      seo: runnerResult.lhr.categories.seo.score * 100,
    };

    console.log(`\n📊 Scores for ${name}:`);
    console.log(`   Performance: ${scores.performance.toFixed(1)}`);
    console.log(`   Accessibility: ${scores.accessibility.toFixed(1)}`);
    console.log(`   Best Practices: ${scores.bestPractices.toFixed(1)}`);
    console.log(`   SEO: ${scores.seo.toFixed(1)}`);

    // Check if meets target
    const meetsTarget = scores.performance >= 90 && 
                       scores.accessibility >= 90 && 
                       scores.bestPractices >= 90 && 
                       scores.seo >= 90;

    if (meetsTarget) {
      console.log(`   ✅ All scores meet ≥90 target!`);
    } else {
      console.log(`   ⚠️  Some scores below 90 target`);
    }

    // Save detailed report
    const reportDir = path.join(__dirname, '../../test-results/lighthouse');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `${name.replace(/\s+/g, '-').toLowerCase()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));
    console.log(`   📄 Detailed report saved: ${reportPath}`);

    return { name, scores, meetsTarget, report: runnerResult.lhr };

  } catch (error) {
    await chrome.kill();
    console.error(`   ❌ Error testing ${name}:`, error.message);
    return { name, error: error.message, meetsTarget: false };
  }
}

async function runAllTests() {
  console.log('='*80);
  console.log('🚀 MAKU.Travel Lighthouse Performance Testing');
  console.log('   Target: All scores ≥ 90');
  console.log('   Base URL:', BASE_URL);
  console.log('='*80);

  const results = [];

  for (const page of PAGES_TO_TEST) {
    const url = `${BASE_URL}${page.path}`;
    const result = await runLighthouse(url, page.name);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='*80);
  console.log('📊 SUMMARY');
  console.log('='*80);

  const passedPages = results.filter(r => r.meetsTarget).length;
  const totalPages = results.length;

  console.log(`\nPages Tested: ${totalPages}`);
  console.log(`Passed (≥90 all categories): ${passedPages}/${totalPages}`);

  results.forEach(result => {
    if (result.error) {
      console.log(`\n❌ ${result.name}: ERROR - ${result.error}`);
    } else {
      const status = result.meetsTarget ? '✅' : '⚠️ ';
      console.log(`\n${status} ${result.name}:`);
      console.log(`   Performance: ${result.scores.performance.toFixed(1)}`);
      console.log(`   Accessibility: ${result.scores.accessibility.toFixed(1)}`);
      console.log(`   Best Practices: ${result.scores.bestPractices.toFixed(1)}`);
      console.log(`   SEO: ${result.scores.seo.toFixed(1)}`);
    }
  });

  console.log('\n' + '='*80);

  if (passedPages === totalPages) {
    console.log('🎉 SUCCESS: All pages meet performance targets!');
    process.exit(0);
  } else {
    console.log('⚠️  WARNING: Some pages need performance optimization');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
