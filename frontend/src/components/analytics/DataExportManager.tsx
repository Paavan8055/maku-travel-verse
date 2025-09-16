import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Calendar, 
  FileText, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  Settings
} from 'lucide-react';

interface ExportJob {
  id: string;
  name: string;
  type: 'analytics' | 'bookings' | 'financial' | 'custom';
  format: 'csv' | 'pdf' | 'excel' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  size?: string;
  downloadUrl?: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  schedule: string;
  recipients: string[];
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
}

export const DataExportManager: React.FC = () => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Revenue Analytics Q1',
      type: 'analytics',
      format: 'pdf',
      status: 'completed',
      progress: 100,
      createdAt: '2024-01-15 10:30',
      size: '2.3 MB',
      downloadUrl: '#'
    },
    {
      id: '2',
      name: 'Booking Data Export',
      type: 'bookings',
      format: 'csv',
      status: 'processing',
      progress: 65,
      createdAt: '2024-01-15 11:15'
    }
  ]);

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Daily Revenue Summary',
      type: 'financial',
      schedule: 'Daily at 9:00 AM',
      recipients: ['admin@maku.travel', 'finance@maku.travel'],
      lastRun: '2024-01-15 09:00',
      nextRun: '2024-01-16 09:00',
      status: 'active'
    },
    {
      id: '2',
      name: 'Weekly Provider Performance',
      type: 'analytics',
      schedule: 'Weekly on Monday',
      recipients: ['operations@maku.travel'],
      lastRun: '2024-01-14 09:00',
      nextRun: '2024-01-21 09:00',
      status: 'active'
    }
  ]);

  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['bookings']);
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [reportName, setReportName] = useState<string>('');

  const dataTypes = [
    { id: 'bookings', label: 'Bookings Data', description: 'All booking records and details' },
    { id: 'analytics', label: 'Analytics Data', description: 'Performance metrics and insights' },
    { id: 'financial', label: 'Financial Data', description: 'Revenue, costs, and financial metrics' },
    { id: 'users', label: 'User Data', description: 'Customer information and behavior' },
    { id: 'providers', label: 'Provider Data', description: 'Provider performance and costs' }
  ];

  const handleExport = () => {
    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: reportName || `Export ${new Date().toLocaleString()}`,
      type: selectedDataTypes[0] as any,
      format: selectedFormat as any,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toLocaleString()
    };

    setExportJobs(prev => [newJob, ...prev]);

    // Simulate export progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id 
            ? { ...job, status: 'completed', progress: 100, size: '1.2 MB', downloadUrl: '#' }
            : job
        ));
      } else {
        setExportJobs(prev => prev.map(job => 
          job.id === newJob.id ? { ...job, progress } : job
        ));
      }
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'processing': return 'text-warning';
      case 'failed': return 'text-destructive';
      case 'active': return 'text-success';
      case 'paused': return 'text-muted-foreground';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'json': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center">
          <Download className="h-6 w-6 mr-2 text-primary" />
          Data Export & Reporting
        </h2>
        <p className="text-muted-foreground">Generate and schedule automated reports</p>
      </div>

      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export">Quick Export</TabsTrigger>
          <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Data Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Name</Label>
                  <Input 
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Data Types</Label>
                {dataTypes.map((type) => (
                  <div key={type.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={type.id}
                      checked={selectedDataTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDataTypes(prev => [...prev, type.id]);
                        } else {
                          setSelectedDataTypes(prev => prev.filter(t => t !== type.id));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={type.id} className="text-sm font-medium">
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV - Comma Separated Values</SelectItem>
                    <SelectItem value="excel">Excel - Spreadsheet</SelectItem>
                    <SelectItem value="pdf">PDF - Document</SelectItem>
                    <SelectItem value="json">JSON - Data Format</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={selectedDataTypes.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Export
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="space-y-4">
            {exportJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getFormatIcon(job.format)}
                        <span className="font-medium">{job.name}</span>
                        <Badge variant={getStatusBadge(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {job.type} • {job.format.toUpperCase()} • Created {job.createdAt}
                        {job.size && ` • ${job.size}`}
                      </div>

                      {job.status === 'processing' && (
                        <div className="space-y-1">
                          <Progress value={job.progress} className="w-full" />
                          <p className="text-xs text-muted-foreground">
                            {job.progress.toFixed(0)}% complete
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      
                      {job.status === 'processing' && (
                        <div className="animate-spin">
                          <Clock className="h-4 w-4 text-warning" />
                        </div>
                      )}
                      
                      {job.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                      
                      {job.status === 'failed' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Scheduled Reports</h3>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>

          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{report.name}</span>
                        <Badge variant={getStatusBadge(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>{report.schedule}</p>
                        <p>Recipients: {report.recipients.join(', ')}</p>
                        <p>Last run: {report.lastRun} • Next run: {report.nextRun}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Advanced report builder coming soon. Create custom reports with drag-and-drop interface,
              advanced filtering, and custom visualizations.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Report Builder (Beta)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Build custom reports with our visual drag-and-drop interface
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};