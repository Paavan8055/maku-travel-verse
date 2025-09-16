import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportJob {
  id: string;
  name: string;
  type: 'csv' | 'xlsx' | 'pdf' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  recordCount?: number;
  parameters: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, template, format, fields, dateRange, filters, scheduleConfig, integrationConfig } = await req.json();

    switch (action) {
      case 'start_export':
        return await startExport(supabaseClient, template, format, fields, dateRange, filters);

      case 'get_export_jobs':
        return await getExportJobs(supabaseClient);

      case 'schedule_report':
        return await scheduleReport(supabaseClient, scheduleConfig);

      case 'setup_integration':
        return await setupPartnerIntegration(supabaseClient, integrationConfig);

      case 'generate_executive_report':
        return await generateExecutiveReport(supabaseClient, template, dateRange);

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Data export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function startExport(
  supabaseClient: any,
  template: string,
  format: string,
  fields: string[],
  dateRange: any,
  filters: any
): Promise<Response> {
  try {
    const jobId = crypto.randomUUID();
    
    // Create export job record
    const exportJob: ExportJob = {
      id: jobId,
      name: `${template}_${new Date().toISOString().split('T')[0]}`,
      type: format as any,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      parameters: {
        template,
        fields,
        dateRange,
        filters
      }
    };

    // Start async export processing
    processExportJob(supabaseClient, exportJob);

    // Log export initiation
    await supabaseClient.functions.invoke('enhanced-logging', {
      body: {
        level: 'info',
        message: 'Data export initiated',
        metadata: {
          jobId,
          template,
          format,
          fieldsCount: fields.length
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status: 'initiated',
        estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error starting export:', error);
    throw error;
  }
}

async function processExportJob(supabaseClient: any, job: ExportJob) {
  try {
    // Simulate export processing stages
    const stages = [
      { name: 'Validating parameters', duration: 1000, progress: 10 },
      { name: 'Querying database', duration: 3000, progress: 30 },
      { name: 'Processing data', duration: 5000, progress: 60 },
      { name: 'Formatting output', duration: 2000, progress: 80 },
      { name: 'Generating file', duration: 2000, progress: 95 },
      { name: 'Finalizing', duration: 1000, progress: 100 }
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      
      // Update job progress (in real implementation, this would update database)
      console.log(`Export ${job.id}: ${stage.name} (${stage.progress}%)`);
      
      if (stage.progress === 100) {
        // Generate mock download URL and file info
        const mockFileSize = Math.random() * 5 + 0.5; // 0.5-5.5 MB
        const mockRecordCount = Math.floor(Math.random() * 10000) + 500;
        
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date().toISOString();
        job.downloadUrl = `https://exports.maku.travel/${job.id}.${job.type}`;
        job.fileSize = mockFileSize;
        job.recordCount = mockRecordCount;

        // Log completion
        await supabaseClient.functions.invoke('enhanced-logging', {
          body: {
            level: 'info',
            message: 'Data export completed',
            metadata: {
              jobId: job.id,
              fileSize: mockFileSize,
              recordCount: mockRecordCount,
              duration: Date.now() - new Date(job.createdAt).getTime()
            }
          }
        });
      }
    }

  } catch (error) {
    console.error('Error processing export job:', error);
    job.status = 'failed';
    
    await supabaseClient.functions.invoke('enhanced-logging', {
      body: {
        level: 'error',
        message: 'Data export failed',
        metadata: {
          jobId: job.id,
          error: error.message
        }
      }
    });
  }
}

async function getExportJobs(supabaseClient: any): Promise<Response> {
  try {
    // In real implementation, fetch from database
    // For now, return mock data
    const mockJobs: ExportJob[] = [
      {
        id: '1',
        name: 'Monthly Booking Report',
        type: 'xlsx',
        status: 'completed',
        progress: 100,
        createdAt: '2024-01-15T10:30:00Z',
        completedAt: '2024-01-15T10:35:00Z',
        downloadUrl: '#',
        fileSize: 2.5,
        recordCount: 1250,
        parameters: { dateRange: '2024-01-01 to 2024-01-31' }
      },
      {
        id: '2',
        name: 'Provider Performance Analysis',
        type: 'csv',
        status: 'processing',
        progress: 65,
        createdAt: '2024-01-15T14:20:00Z',
        recordCount: 850,
        parameters: { providers: ['amadeus', 'sabre', 'hotelbeds'] }
      }
    ];

    return new Response(
      JSON.stringify({
        success: true,
        jobs: mockJobs,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting export jobs:', error);
    throw error;
  }
}

async function scheduleReport(supabaseClient: any, config: any): Promise<Response> {
  try {
    const scheduleId = crypto.randomUUID();
    
    // Create scheduled report configuration
    const scheduledReport = {
      id: scheduleId,
      name: config.name,
      frequency: config.frequency,
      reportType: config.reportType,
      recipients: config.recipients,
      parameters: config.parameters,
      isActive: true,
      createdAt: new Date().toISOString(),
      nextRun: calculateNextRun(config.frequency)
    };

    // In real implementation, save to database and set up cron job
    console.log('Scheduled report created:', scheduledReport);

    await supabaseClient.functions.invoke('enhanced-logging', {
      body: {
        level: 'info',
        message: 'Report scheduled',
        metadata: {
          scheduleId,
          frequency: config.frequency,
          reportType: config.reportType
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        scheduleId,
        nextRun: scheduledReport.nextRun,
        message: 'Report scheduled successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error scheduling report:', error);
    throw error;
  }
}

async function setupPartnerIntegration(supabaseClient: any, config: any): Promise<Response> {
  try {
    const integrationId = crypto.randomUUID();
    
    // Validate integration configuration
    if (!config.partnerName || !config.endpoint || !config.authType) {
      throw new Error('Missing required integration parameters');
    }

    // Create integration configuration
    const integration = {
      id: integrationId,
      partnerName: config.partnerName,
      endpoint: config.endpoint,
      authType: config.authType,
      dataTypes: config.dataTypes || [],
      isActive: false, // Start inactive until tested
      createdAt: new Date().toISOString()
    };

    // Test integration connectivity
    const testResult = await testIntegrationConnection(config);
    
    if (testResult.success) {
      integration.isActive = true;
    }

    await supabaseClient.functions.invoke('enhanced-logging', {
      body: {
        level: 'info',
        message: 'Partner integration configured',
        metadata: {
          integrationId,
          partnerName: config.partnerName,
          testSuccess: testResult.success
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        integrationId,
        testResult,
        message: 'Integration configured successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up integration:', error);
    throw error;
  }
}

async function generateExecutiveReport(
  supabaseClient: any,
  template: string,
  dateRange: any
): Promise<Response> {
  try {
    // Generate comprehensive executive report data
    const reportData = {
      executiveSummary: {
        totalRevenue: '$2.4M',
        growthRate: '18.5%',
        customerSatisfaction: '94.2%',
        marketShare: '12.8%'
      },
      keyMetrics: [
        { metric: 'Booking Volume', value: '1,250', change: '+15.2%' },
        { metric: 'Average Order Value', value: '$485', change: '+8.7%' },
        { metric: 'Provider Success Rate', value: '96.8%', change: '+2.1%' },
        { metric: 'Customer Retention', value: '87.3%', change: '+5.4%' }
      ],
      strategicInsights: [
        'Mobile bookings now represent 68% of total volume',
        'Corporate travel segment shows 300% growth potential',
        'Provider diversification reducing operational risk'
      ],
      recommendations: [
        'Accelerate mobile-first development initiatives',
        'Launch dedicated enterprise sales program',
        'Expand provider network for better resilience'
      ]
    };

    // Generate PDF report (in real implementation)
    const reportUrl = `https://reports.maku.travel/executive-${Date.now()}.pdf`;

    await supabaseClient.functions.invoke('enhanced-logging', {
      body: {
        level: 'info',
        message: 'Executive report generated',
        metadata: {
          template,
          dateRange,
          reportUrl
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        reportData,
        reportUrl,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating executive report:', error);
    throw error;
  }
}

function calculateNextRun(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  
  return now.toISOString();
}

async function testIntegrationConnection(config: any): Promise<{ success: boolean; message: string }> {
  try {
    // Mock integration test - in real implementation, test actual endpoint
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    return {
      success,
      message: success ? 'Connection successful' : 'Connection failed - check credentials'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}