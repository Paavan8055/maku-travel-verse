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

interface Spreadsheet {
  id: string;
  name: string;
  description?: string;
  sheet_data: {
    headers: string[];
    rows: string[][];
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProcessingJob {
  id: string;
  name: string;
  type: string;
  status: string;
  progress: number;
  created_at: string;
}

export function SheetsModule() {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSheetDialog, setShowSheetDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const { toast } = useToast();

  const [newSheet, setNewSheet] = useState({
    name: '',
    description: '',
  });

  const [newJob, setNewJob] = useState({
    name: '',
    type: 'analysis',
  });

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    try {
      setIsLoading(true);

      // Mock spreadsheets
      const mockSheets: Spreadsheet[] = [
        {
          id: '1',
          name: 'Travel Bookings',
          description: 'Customer booking analytics',
          sheet_data: {
            headers: ['Date', 'Customer', 'Destination', 'Revenue'],
            rows: [
              ['2024-01-01', 'John Doe', 'Paris', '$1,200'],
              ['2024-01-02', 'Jane Smith', 'Tokyo', '$2,400'],
            ]
          },
          created_by: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Performance Metrics',
          description: 'Monthly performance dashboard',
          sheet_data: {
            headers: ['Month', 'Revenue', 'Bookings', 'Conversion'],
            rows: [
              ['January', '$45,000', '120', '3.2%'],
              ['February', '$52,000', '140', '3.8%'],
            ]
          },
          created_by: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock processing jobs
      const mockJobs: ProcessingJob[] = [
        {
          id: '1',
          name: 'Monthly Report Generation',
          type: 'report',
          status: 'completed',
          progress: 100,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Data Import - Booking Records',
          type: 'import',
          status: 'running',
          progress: 75,
          created_at: new Date().toISOString(),
        },
      ];

      setSpreadsheets(mockSheets);
      setJobs(mockJobs);

    } catch (error) {
      console.error('Error loading spreadsheets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load spreadsheets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpreadsheet = async () => {
    try {
      // Mock creating spreadsheet
      const mockSheet: Spreadsheet = {
        id: Date.now().toString(),
        ...newSheet,
        created_by: 'user1',
        sheet_data: { headers: [], rows: [] },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSpreadsheets(prev => [mockSheet, ...prev]);

      toast({
        title: 'Success',
        description: 'Spreadsheet created successfully',
      });

      setShowSheetDialog(false);
      setNewSheet({
        name: '',
        description: '',
      });

    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      toast({
        title: 'Error',
        description: 'Failed to create spreadsheet',
        variant: 'destructive',
      });
    }
  };

  const handleCreateJob = async () => {
    try {
      // Mock creating job
      const mockJob: ProcessingJob = {
        id: Date.now().toString(),
        name: newJob.name,
        type: newJob.type,
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString(),
      };

      setJobs(prev => [mockJob, ...prev]);

      toast({
        title: 'Success',
        description: 'Processing job created successfully',
      });

      setShowJobDialog(false);
      setNewJob({
        name: '',
        type: 'analysis',
      });

    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create processing job',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'report': return <TrendingUp className="w-4 h-4" />;
      case 'import': return <Upload className="w-4 h-4" />;
      case 'export': return <Download className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const runningJobs = jobs.filter(job => job.status === 'running' || job.status === 'pending');
  const completedJobs = jobs.filter(job => job.status === 'completed');

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
                    value={newJob.name}
                    onChange={(e) => setNewJob({...newJob, name: e.target.value})}
                    placeholder="Data processing job name"
                  />
                </div>

                <div>
                  <Label htmlFor="job-type">Job Type</Label>
                  <Select 
                    value={newJob.type} 
                    onValueChange={(value) => setNewJob({...newJob, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis">Data Analysis</SelectItem>
                      <SelectItem value="report">Report Generation</SelectItem>
                      <SelectItem value="import">Data Import</SelectItem>
                      <SelectItem value="export">Data Export</SelectItem>
                      <SelectItem value="cleanup">Data Cleanup</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSpreadsheet}>
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
                <div className="text-2xl font-bold">{spreadsheets.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active spreadsheets
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
                  Currently processing
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
                  Successfully completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Rows</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {spreadsheets.reduce((sum, sheet) => sum + sheet.sheet_data.rows.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total data rows
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
                  {spreadsheets.slice(0, 5).map((sheet) => (
                    <div key={sheet.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Table className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{sheet.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sheet.sheet_data.rows.length} rows
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </div>
                  ))}
                  {spreadsheets.length === 0 && (
                    <p className="text-sm text-muted-foreground">No sheets yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Processing Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(job.type)}
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.type} • {job.progress}%
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(job.status)} variant="secondary">
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <p className="text-sm text-muted-foreground">No jobs yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Data Sheets</CardTitle>
              <CardDescription>
                Manage all data sheets and spreadsheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spreadsheets.map((sheet) => (
                  <div key={sheet.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{sheet.name}</h3>
                        <Badge variant="outline">
                          {sheet.sheet_data.rows.length} rows
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {sheet.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(sheet.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
                {spreadsheets.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No data sheets found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Jobs</CardTitle>
              <CardDescription>
                Monitor data processing and analysis jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(job.type)}
                      <div className="flex-1">
                        <h3 className="font-medium">{job.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.type} job • Created {new Date(job.created_at).toLocaleDateString()}
                        </p>
                        {job.status === 'running' && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)} variant="secondary">
                        {job.status}
                      </Badge>
                      {job.status === 'running' && (
                        <Button variant="ghost" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No processing jobs found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Processing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analysis jobs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-4/5 h-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">80%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Report generation</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-3/5 h-2 bg-green-500 rounded"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data import</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-2/3 h-2 bg-orange-500 rounded"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">67%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Travel Bookings</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Revenue up 15% this month compared to last month.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Performance Metrics</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Conversion rate improved by 0.6% in February.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}