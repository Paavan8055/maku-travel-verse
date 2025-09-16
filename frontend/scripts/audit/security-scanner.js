#!/usr/bin/env node

/**
 * Maku.Travel Security Scanner
 * Automated security auditing for Supabase database and application
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityScanner {
  constructor() {
    this.findings = [];
    this.criticalCount = 0;
    this.highCount = 0;
    this.mediumCount = 0;
    this.lowCount = 0;
  }

  async scanSupabaseRLS() {
    console.log('🔒 Scanning Supabase RLS policies...');
    
    try {
      // This would integrate with Supabase linter API
      // For now, we'll check known issues from the project
      const knownIssues = [
        {
          severity: 'CRITICAL',
          type: 'RLS_MISSING',
          table: 'bookings',
          description: 'Table may be missing Row Level Security policies',
          fix: 'Enable RLS and create appropriate policies for user access control'
        },
        {
          severity: 'HIGH',
          type: 'POLICY_OVERPERMISSIVE',
          table: 'users',
          description: 'RLS policy may be too permissive',
          fix: 'Review and tighten access control policies'
        }
      ];

      knownIssues.forEach(issue => {
        this.addFinding(issue);
      });

    } catch (error) {
      console.error('Error scanning Supabase RLS:', error);
      this.addFinding({
        severity: 'HIGH',
        type: 'SCAN_ERROR',
        description: `Failed to scan Supabase RLS: ${error.message}`,
        fix: 'Check Supabase connection and permissions'
      });
    }
  }

  async scanCodeVulnerabilities() {
    console.log('🔍 Scanning code vulnerabilities...');
    
    try {
      // Check for hardcoded secrets
      await this.scanForHardcodedSecrets();
      
      // Check for insecure patterns
      await this.scanForInsecurePatterns();
      
    } catch (error) {
      console.error('Error scanning code vulnerabilities:', error);
    }
  }

  async scanForHardcodedSecrets() {
    const srcPath = path.join(process.cwd(), 'src');
    const secretPatterns = [
      /api_key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][^'"]+['"]/gi
    ];

    try {
      const files = await this.getAllTsxFiles(srcPath);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        secretPatterns.forEach((pattern, index) => {
          const matches = content.match(pattern);
          if (matches) {
            this.addFinding({
              severity: 'HIGH',
              type: 'HARDCODED_SECRET',
              file: file.replace(process.cwd(), ''),
              description: `Potential hardcoded secret detected: ${matches[0]}`,
              fix: 'Move secrets to environment variables or Supabase secrets'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error scanning for hardcoded secrets:', error);
    }
  }

  async scanForInsecurePatterns() {
    const srcPath = path.join(process.cwd(), 'src');
    const insecurePatterns = [
      {
        pattern: /innerHTML\s*=\s*[^;]+/gi,
        type: 'XSS_RISK',
        severity: 'MEDIUM',
        description: 'Direct innerHTML usage detected - XSS risk'
      },
      {
        pattern: /eval\s*\(/gi,
        type: 'CODE_INJECTION',
        severity: 'CRITICAL',
        description: 'eval() usage detected - code injection risk'
      },
      {
        pattern: /window\.location\s*=\s*[^;]+/gi,
        type: 'OPEN_REDIRECT',
        severity: 'MEDIUM',
        description: 'Direct window.location assignment - open redirect risk'
      }
    ];

    try {
      const files = await this.getAllTsxFiles(srcPath);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        insecurePatterns.forEach(({ pattern, type, severity, description }) => {
          const matches = content.match(pattern);
          if (matches) {
            this.addFinding({
              severity,
              type,
              file: file.replace(process.cwd(), ''),
              description: `${description}: ${matches[0]}`,
              fix: 'Use secure alternatives or proper sanitization'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error scanning for insecure patterns:', error);
    }
  }

  async getAllTsxFiles(dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          files.push(...(await this.getAllTsxFiles(fullPath)));
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }
    
    return files;
  }

  addFinding(finding) {
    this.findings.push({
      ...finding,
      timestamp: new Date().toISOString(),
      id: `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    });

    switch (finding.severity) {
      case 'CRITICAL':
        this.criticalCount++;
        break;
      case 'HIGH':
        this.highCount++;
        break;
      case 'MEDIUM':
        this.mediumCount++;
        break;
      case 'LOW':
        this.lowCount++;
        break;
    }
  }

  async generateReport() {
    const reportDir = path.join(process.cwd(), 'reports', 'security');
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      scan_date: new Date().toISOString(),
      summary: {
        total_findings: this.findings.length,
        critical: this.criticalCount,
        high: this.highCount,
        medium: this.mediumCount,
        low: this.lowCount
      },
      findings: this.findings,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(reportDir, `security-report-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 Security Report Generated:`);
    console.log(`   Critical: ${this.criticalCount}`);
    console.log(`   High: ${this.highCount}`);
    console.log(`   Medium: ${this.mediumCount}`);
    console.log(`   Low: ${this.lowCount}`);
    console.log(`   Report saved: ${reportPath}`);

    // Exit with error code if critical or high severity issues found
    if (this.criticalCount > 0 || this.highCount > 0) {
      console.log('\n❌ Critical or high severity security issues found!');
      process.exit(1);
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.criticalCount > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: 'Address all critical security vulnerabilities immediately',
        impact: 'Prevents potential security breaches and data exposure'
      });
    }

    if (this.highCount > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Review and fix high severity security issues within 24 hours',
        impact: 'Reduces attack surface and improves overall security posture'
      });
    }

    recommendations.push({
      priority: 'ONGOING',
      action: 'Implement regular security scanning in CI/CD pipeline',
      impact: 'Prevents security regressions and maintains security standards'
    });

    return recommendations;
  }

  async run() {
    console.log('🚀 Starting Maku.Travel Security Scan...');
    
    await this.scanSupabaseRLS();
    await this.scanCodeVulnerabilities();
    
    return await this.generateReport();
  }
}

// Run if called directly
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.run().catch(error => {
    console.error('Security scan failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityScanner;