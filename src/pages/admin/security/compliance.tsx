
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AdminComplianceStatus() {
  const complianceChecks = [
    {
      standard: 'PCI DSS',
      status: 'compliant',
      score: 98,
      lastAudit: '2024-12-15',
      nextReview: '2025-06-15'
    },
    {
      standard: 'GDPR',
      status: 'compliant',
      score: 95,
      lastAudit: '2024-11-20',
      nextReview: '2025-05-20'
    },
    {
      standard: 'SOX',
      status: 'review_needed',
      score: 87,
      lastAudit: '2024-10-10',
      nextReview: '2025-04-10'
    },
    {
      standard: 'ISO 27001',
      status: 'non_compliant',
      score: 72,
      lastAudit: '2024-09-01',
      nextReview: '2025-03-01'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'review_needed':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'non_compliant':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="default" className="bg-green-500">Compliant</Badge>;
      case 'review_needed':
        return <Badge variant="secondary">Review Needed</Badge>;
      case 'non_compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Status</h1>
        <p className="text-muted-foreground">
          Monitor compliance with security standards and regulations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {complianceChecks.map((check) => (
          <Card key={check.standard}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  <CardTitle className="text-lg">{check.standard}</CardTitle>
                </div>
                {getStatusBadge(check.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Compliance Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(check.score)}`}>
                    {check.score}%
                  </span>
                </div>
                <Progress value={check.score} className="h-2" />
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Last audit: {check.lastAudit}</div>
                <div>Next review: {check.nextReview}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
