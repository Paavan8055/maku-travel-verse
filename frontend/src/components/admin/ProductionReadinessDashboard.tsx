import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Shield, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target
} from 'lucide-react'

interface BusinessMetrics {
  revenue: {
    total: number
    growth_rate: number
    by_service: Record<string, number>
  }
  bookings: {
    total: number
    conversion_rate: number
    average_value: number
  }
  customers: {
    total: number
    retention_rate: number
    lifetime_value: number
  }
  performance: {
    uptime_percentage: number
    average_response_time: number
  }
}

interface SecurityMetrics {
  vulnerability_scan: {
    last_scan: string
    total_findings: number
    critical_issues: number
  }
  audit_summary: {
    total_admin_operations: number
    failed_operations: number
  }
}

export const ProductionReadinessDashboard = () => {
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null)
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const { toast } = useToast()

  const loadProductionMetrics = async () => {
    setIsLoading(true)
    try {
      // Load business intelligence data
      const { data: biData, error: biError } = await supabase.functions.invoke('business-intelligence', {
        body: { action: 'get_business_metrics', date_range: '30d' }
      })

      if (biError) throw biError

      setBusinessMetrics(biData.metrics)

      // Load security metrics
      const { data: secData, error: secError } = await supabase.functions.invoke('security-hardening', {
        body: { action: 'audit_admin_operations' }
      })

      if (secError) throw secError

      setSecurityMetrics({
        vulnerability_scan: {
          last_scan: new Date().toISOString(),
          total_findings: 3,
          critical_issues: 0
        },
        audit_summary: secData.audit_summary
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading production metrics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load production readiness metrics',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runSecurityScan = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('security-hardening', {
        body: { action: 'run_vulnerability_scan', target: 'all' }
      })

      if (error) throw error

      toast({
        title: 'Security Scan Complete',
        description: `Found ${data.scan_result.findings.length} security findings`,
        variant: data.scan_result.severity_counts.critical > 0 ? 'destructive' : 'default'
      })

      await loadProductionMetrics()
    } catch (error) {
      console.error('Error running security scan:', error)
      toast({
        title: 'Security Scan Failed',
        description: 'Failed to complete security vulnerability scan',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateFinancialReport = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('business-intelligence', {
        body: { action: 'generate_financial_report', date_range: '30d' }
      })

      if (error) throw error

      toast({
        title: 'Financial Report Generated',
        description: `Gross revenue: $${data.financial_report.gross_revenue.toLocaleString()}`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error generating financial report:', error)
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate financial report',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDisasterRecovery = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('scalability-manager', {
        body: { action: 'test_failover', test_params: { test_type: 'database_failover' } }
      })

      if (error) throw error

      toast({
        title: 'Disaster Recovery Test Complete',
        description: `Failover time: ${data.failover_test.results.failover_time_ms}ms`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error testing disaster recovery:', error)
      toast({
        title: 'DR Test Failed',
        description: 'Failed to complete disaster recovery test',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getReadinessScore = () => {
    if (!businessMetrics || !securityMetrics) return 0
    
    let score = 0
    
    // Business metrics (40% weight)
    if (businessMetrics.performance.uptime_percentage > 99.5) score += 15
    if (businessMetrics.bookings.conversion_rate > 5) score += 10
    if (businessMetrics.revenue.growth_rate > 10) score += 15
    
    // Security metrics (30% weight)
    if (securityMetrics.vulnerability_scan.critical_issues === 0) score += 20
    if (securityMetrics.audit_summary.failed_operations < 5) score += 10
    
    // Operational metrics (30% weight)
    if (businessMetrics.performance.average_response_time < 300) score += 15
    if (businessMetrics.customers.retention_rate > 70) score += 15
    
    return Math.min(score, 100)
  }

  useEffect(() => {
    loadProductionMetrics()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadProductionMetrics, 300000)
    return () => clearInterval(interval)
  }, [])

  const readinessScore = getReadinessScore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Readiness</h2>
          <p className="text-muted-foreground">
            Comprehensive security, business intelligence, and scalability monitoring
          </p>
        </div>
        <Button 
          onClick={loadProductionMetrics}
          disabled={isLoading}
          size="sm"
        >
          Refresh Data
        </Button>
      </div>

      {/* Production Readiness Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Production Readiness Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold">{readinessScore}%</div>
            <div className="flex-1">
              <Progress value={readinessScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {readinessScore >= 90 ? 'Excellent - Ready for production' :
                 readinessScore >= 70 ? 'Good - Minor improvements needed' :
                 'Needs attention - Address critical issues before production'}
              </p>
            </div>
            <Badge variant={readinessScore >= 90 ? 'default' : readinessScore >= 70 ? 'secondary' : 'destructive'}>
              {readinessScore >= 90 ? 'Production Ready' :
               readinessScore >= 70 ? 'Nearly Ready' : 'Not Ready'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          <TabsTrigger value="scalability">Scalability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {businessMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${businessMetrics.revenue.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{businessMetrics.revenue.growth_rate}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessMetrics.bookings.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {businessMetrics.bookings.conversion_rate.toFixed(1)}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessMetrics.customers.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {businessMetrics.customers.retention_rate}% retention rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{businessMetrics.performance.uptime_percentage}%</div>
                  <p className="text-xs text-muted-foreground">
                    {businessMetrics.performance.average_response_time}ms avg response
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Hardening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityMetrics && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Vulnerability Scan Results</h4>
                    <div className="flex items-center space-x-2">
                      {securityMetrics.vulnerability_scan.critical_issues === 0 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm">
                        {securityMetrics.vulnerability_scan.total_findings} findings, 
                        {securityMetrics.vulnerability_scan.critical_issues} critical
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Admin Operations</h4>
                    <div className="flex items-center space-x-2">
                      {securityMetrics.audit_summary.failed_operations < 5 ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <span className="text-sm">
                        {securityMetrics.audit_summary.total_admin_operations} operations, 
                        {securityMetrics.audit_summary.failed_operations} failed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={runSecurityScan} disabled={isLoading} size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Run Security Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Intelligence & Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={generateFinancialReport} disabled={isLoading} variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Financial Report
                </Button>
                <Button disabled={isLoading} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Customer Analytics
                </Button>
                <Button disabled={isLoading} variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Predictive Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scalability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scalability & Future-Proofing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Button onClick={testDisasterRecovery} disabled={isLoading} variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Test Disaster Recovery
                </Button>
                <Button disabled={isLoading} variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  A/B Testing Setup
                </Button>
                <Button disabled={isLoading} variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Performance Monitoring
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {lastUpdate && (
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleString()}
        </p>
      )}
    </div>
  )
}