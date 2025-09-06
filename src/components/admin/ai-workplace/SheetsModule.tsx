import React, { useState, useEffect } from 'react';
import { Table, Plus, Download, Upload, Play, Pause, BarChart3, TrendingUp, Calculator, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataSheet {
  id: string;
  name: string;
  description?: string;
  sheet_type: string;
  data_source: string;
  configuration: any;
  columns_config: any[];
  data_rows: any[];
  calculations: any;
  charts_config: any[];
  processing_status: string;
  last_processed_at?: string;
  created_at: string;
  updated_at: string;
}

interface ProcessingJob {
  id: string;
  job_name: string;
  job_type: string;
  sheet_id?: string;
  status: string;
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

export function SheetsModule() {
  const [sheets, setSheets] = useState<DataSheet[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<DataSheet | null>(null);
  const { toast } = useToast();

  const [newSheet, setNewSheet] = useState({
    name: '',
    description: '',
    sheet_type: 'analysis',
    data_source: 'manual',
    columns_config: [] as any[],
    configuration: {}
  });

  const [newJob, setNewJob] = useState({
    job_name: '',
    job_type: 'data_import',
    sheet_id: '',
    source_config: {},
    processing_config: {},
    scheduled_for: ''
  });

  useEffect(() => {
    loadSheets();
    loadJobs();
  }, []);

  const loadSheets = async () => {
    try {
      const { data, error } = await supabase
        .from('data_sheets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSheets(data || []);
    } catch (error) {
      console.error('Error loading data sheets:', error);
      toast({
        title: "Error",
        description: "Failed to load data sheets",
        variant: "destructive"
      });
    }
  };

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('data_processing_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading processing jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSheet = async () => {
    try {
      const sheetData = {
        ...newSheet,
        columns_config: JSON.stringify(newSheet.columns_config),
        configuration: JSON.stringify(newSheet.configuration)
      };

      const { error } = await supabase
        .from('data_sheets')
        .insert([sheetData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Data sheet created successfully"
      });

      setShowSheetDialog(false);
      setNewSheet({
        name: '',
        description: '',
        sheet_type: 'analysis',
        data_source: 'manual',
        columns_config: [],
        configuration: {}
      });
      loadSheets();
    } catch (error) {
      console.error('Error creating data sheet:', error);
      toast({
        title: "Error",
        description: "Failed to create data sheet",
        variant: "destructive"
      });
    }
  };

  const handleCreateJob = async () => {
    try {
      const jobData = {
        ...newJob,
        source_config: JSON.stringify(newJob.source_config),
        processing_config: JSON.stringify(newJob.processing_config),
        scheduled_for: newJob.scheduled_for ? new Date(newJob.scheduled_for).toISOString() : null
      };

      const { error } = await supabase
        .from('data_processing_jobs')
        .insert([jobData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Processing job created successfully"
      });

      setShowJobDialog(false);
      setNewJob({
        job_name: '',
        job_type: 'data_import',
        sheet_id: '',
        source_config: {},
        processing_config: {},
        scheduled_for: ''
      });
      loadJobs();
    } catch (error) {
      console.error('Error creating processing job:', error);
      toast({
        title: "Error",
        description: "Failed to create processing job",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSheetTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'metrics': return <TrendingUp className="w-4 h-4" />;
      case 'report': return <Table className="w-4 h-4" />;
      case 'calculation': return <Calculator className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const runningJobs = jobs.filter(job => job.status === 'running' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');

  const analyticSheets = sheets.filter(sheet => sheet.sheet_type === 'analysis');
  const metricSheets = sheets.filter(sheet => sheet.sheet_type === 'metrics');
  const reportSheets = sheets.filter(sheet => sheet.sheet_type === 'report');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Sheets & Data Processing</h2>
          <p className="text-muted-foreground">
            Automated data analysis, reporting, and business intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Play className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Processing Job</DialogTitle>
                <DialogDescription>
                  Schedule a data processing or analysis job.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="job-name">Job Name</Label>
                  <Input
                    id="job-name"
                    value={newJob.job_name}
                    onChange={(e) => setNewJob({...newJob, job_name: e.target.value})}
                    placeholder="Data processing job name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job-type">Job Type</Label>
                    <Select 
                      value={newJob.job_type} 
                      onValueChange={(value) => setNewJob({...newJob, job_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data_import">Data Import</SelectItem>
                        <SelectItem value="data_export">Data Export</SelectItem>
                        <SelectItem value="data_analysis">Data Analysis</SelectItem>
                        <SelectItem value="report_generation">Report Generation</SelectItem>
                        <SelectItem value="data_cleanup">Data Cleanup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target-sheet">Target Sheet</Label>
                    <Select 
                      value={newJob.sheet_id} 
                      onValueChange={(value) => setNewJob({...newJob, sheet_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sheet" />
                      </SelectTrigger>
                      <SelectContent>
                        {sheets.map(sheet => (
                          <SelectItem key={sheet.id} value={sheet.id}>
                            {sheet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduled-for">Schedule For (Optional)</Label>
                  <Input
                    id="scheduled-for"
                    type="datetime-local"
                    value={newJob.scheduled_for}
                    onChange={(e) => setNewJob({...newJob, scheduled_for: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateJob}>
                  Create Job
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showSheetDialog} onOpenChange={setShowSheetDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Sheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Data Sheet</DialogTitle>
                <DialogDescription>
                  Create a new data sheet for analysis or reporting.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sheet-name">Sheet Name</Label>
                  <Input
                    id="sheet-name"
                    value={newSheet.name}
                    onChange={(e) => setNewSheet({...newSheet, name: e.target.value})}
                    placeholder="Data sheet name"
                  />
                </div>

                <div>
                  <Label htmlFor="sheet-description">Description</Label>
                  <Textarea
                    id="sheet-description"
                    value={newSheet.description}
                    onChange={(e) => setNewSheet({...newSheet, description: e.target.value})}
                    placeholder="What this sheet is for"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sheet-type">Sheet Type</Label>
                    <Select 
                      value={newSheet.sheet_type} 
                      onValueChange={(value) => setNewSheet({...newSheet, sheet_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="metrics">Metrics</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="calculation">Calculation</SelectItem>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data-source">Data Source</Label>
                    <Select 
                      value={newSheet.data_source} 
                      onValueChange={(value) => setNewSheet({...newSheet, data_source: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="csv">CSV Upload</SelectItem>
                        <SelectItem value="agents">Agent Data</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSheet}>
                  Create Sheet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sheets">Data Sheets</TabsTrigger>
          <TabsTrigger value="jobs">Processing Jobs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sheets</CardTitle>
                <Table className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sheets.length}</div>
                <p className="text-xs text-muted-foreground">
                  {sheets.filter(s => s.processing_status === 'ready').length} ready
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runningJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {jobs.filter(j => j.status === 'pending').length} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedJobs.length}</div>
                <p className="text-xs text-muted-foreground">
                  {failedJobs.length} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(sheets.map(s => s.data_source)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Connected sources
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sheets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sheets.slice(0, 5).map((sheet) => (
                    <div key={sheet.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSheetTypeIcon(sheet.sheet_type)}
                        <div>
                          <p className="font-medium">{sheet.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sheet.sheet_type} • {sheet.data_source}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(sheet.processing_status)}>
                        {sheet.processing_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{job.job_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.job_type} • {job.progress_percentage}%
                        </p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No processing jobs
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sheets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analysis Sheets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticSheets.map((sheet) => (
                    <div key={sheet.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{sheet.name}</h4>
                      <p className="text-sm text-muted-foreground">{sheet.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getStatusColor(sheet.processing_status)}>
                          {sheet.processing_status}
                        </Badge>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  ))}
                  {analyticSheets.length === 0 && (
                    <p className="text-sm text-muted-foreground">No analysis sheets</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Metric Sheets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricSheets.map((sheet) => (
                    <div key={sheet.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{sheet.name}</h4>
                      <p className="text-sm text-muted-foreground">{sheet.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getStatusColor(sheet.processing_status)}>
                          {sheet.processing_status}
                        </Badge>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  ))}
                  {metricSheets.length === 0 && (
                    <p className="text-sm text-muted-foreground">No metric sheets</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Report Sheets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportSheets.map((sheet) => (
                    <div key={sheet.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{sheet.name}</h4>
                      <p className="text-sm text-muted-foreground">{sheet.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getStatusColor(sheet.processing_status)}>
                          {sheet.processing_status}
                        </Badge>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                  ))}
                  {reportSheets.length === 0 && (
                    <p className="text-sm text-muted-foreground">No report sheets</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Jobs</CardTitle>
              <CardDescription>
                Manage data processing and automation jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{job.job_name}</h3>
                        <Badge variant="outline">{job.job_type}</Badge>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="mt-1">
                        {job.status === 'running' && (
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${job.progress_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {job.progress_percentage}%
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Created: {new Date(job.created_at).toLocaleString()}
                          {job.started_at && (
                            <span> • Started: {new Date(job.started_at).toLocaleString()}</span>
                          )}
                          {job.completed_at && (
                            <span> • Completed: {new Date(job.completed_at).toLocaleString()}</span>
                          )}
                        </p>
                        {job.error_message && (
                          <p className="text-sm text-red-600 mt-1">{job.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'running' && (
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status === 'pending' && (
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No processing jobs yet. Create a new job to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for data operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Processing Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Jobs Completed</span>
                      <span className="text-sm font-medium">{completedJobs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium">
                        {jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Failed Jobs</span>
                      <span className="text-sm font-medium text-red-600">{failedJobs.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Data Sources</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Manual Entry</span>
                      <span className="text-sm font-medium">
                        {sheets.filter(s => s.data_source === 'manual').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">API Sources</span>
                      <span className="text-sm font-medium">
                        {sheets.filter(s => s.data_source === 'api').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Database</span>
                      <span className="text-sm font-medium">
                        {sheets.filter(s => s.data_source === 'database').length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Sheet Types</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Analysis Sheets</span>
                      <span className="text-sm font-medium">{analyticSheets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Metric Sheets</span>
                      <span className="text-sm font-medium">{metricSheets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Report Sheets</span>
                      <span className="text-sm font-medium">{reportSheets.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Sheets Created Today</span>
                      <span className="text-sm font-medium">
                        {sheets.filter(s => 
                          new Date(s.created_at).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Jobs Run Today</span>
                      <span className="text-sm font-medium">
                        {jobs.filter(j => 
                          new Date(j.created_at).toDateString() === new Date().toDateString()
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Processing Time</span>
                      <span className="text-sm font-medium">~2.3 min avg</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}