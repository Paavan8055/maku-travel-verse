import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, companyId, policyData, bookingData } = await req.json();
    console.log('Corporate Policy Engine:', { action, userId, companyId });

    switch (action) {
      case 'validate_booking':
        return await validateBookingCompliance(userId, companyId, bookingData);
      case 'create_policy':
        return await createCorporatePolicy(userId, companyId, policyData);
      case 'get_policies':
        return await getCorporatePolicies(companyId);
      case 'approval_workflow':
        return await processApprovalWorkflow(userId, companyId, bookingData);
      case 'generate_report':
        return await generateComplianceReport(companyId, policyData);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in corporate-policy-engine:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function validateBookingCompliance(userId: string, companyId: string, bookingData: any) {
  console.log('Validating booking compliance for company:', companyId);

  // Get active company policies
  const { data: policies } = await supabase
    .from('corporate_policies')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .lte('effective_date', new Date().toISOString().split('T')[0]);

  if (!policies || policies.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      compliant: true,
      message: 'No corporate policies configured',
      violations: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate booking against each policy
  const violations = [];
  let overallCompliant = true;

  for (const policy of policies) {
    const policyResult = await validateAgainstPolicy(policy, bookingData, userId);
    if (!policyResult.compliant) {
      overallCompliant = false;
      violations.push({
        policy_name: policy.policy_name,
        policy_type: policy.policy_type,
        violation: policyResult.violation,
        severity: policyResult.severity,
        suggested_action: policyResult.suggested_action
      });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    compliant: overallCompliant,
    violations: violations,
    total_policies_checked: policies.length,
    approval_required: violations.some(v => v.severity === 'high'),
    estimated_approval_time: calculateApprovalTime(violations)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function createCorporatePolicy(userId: string, companyId: string, policyData: any) {
  console.log('Creating corporate policy for company:', companyId);

  const { data: policy, error } = await supabase
    .from('corporate_policies')
    .insert({
      company_id: companyId,
      policy_name: policyData.name,
      policy_type: policyData.type,
      policy_rules: policyData.rules,
      approval_workflow: policyData.approval_workflow || {},
      budget_limits: policyData.budget_limits || {},
      compliance_requirements: policyData.compliance_requirements || {},
      effective_date: policyData.effective_date,
      expiry_date: policyData.expiry_date,
      created_by: userId
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    policy,
    message: 'Corporate policy created successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getCorporatePolicies(companyId: string) {
  console.log('Getting corporate policies for company:', companyId);

  const { data: policies, error } = await supabase
    .from('corporate_policies')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Enhance policies with compliance statistics
  const enhancedPolicies = await Promise.all(
    (policies || []).map(async (policy) => {
      const stats = await getPolicyComplianceStats(policy.id);
      return {
        ...policy,
        compliance_stats: stats
      };
    })
  );

  return new Response(JSON.stringify({
    success: true,
    policies: enhancedPolicies,
    total_policies: (policies || []).length,
    active_policies: (policies || []).filter(p => p.is_active).length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function processApprovalWorkflow(userId: string, companyId: string, bookingData: any) {
  console.log('Processing approval workflow for company:', companyId);

  // Get the approval workflow from policies
  const { data: policies } = await supabase
    .from('corporate_policies')
    .select('approval_workflow')
    .eq('company_id', companyId)
    .eq('policy_type', 'approval')
    .eq('is_active', true)
    .single();

  const workflow = policies?.approval_workflow || getDefaultApprovalWorkflow();

  // Determine approval requirements based on booking value and type
  const approvalSteps = determineApprovalSteps(workflow, bookingData);

  // Create approval record (this would typically be in a separate table)
  const approvalData = {
    booking_reference: bookingData.booking_reference,
    requested_by: userId,
    company_id: companyId,
    approval_steps: approvalSteps,
    current_step: 0,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  return new Response(JSON.stringify({
    success: true,
    approval_required: approvalSteps.length > 0,
    approval_steps: approvalSteps,
    estimated_time: calculateApprovalTime(approvalSteps),
    next_approver: approvalSteps[0]?.approver_email,
    workflow_data: approvalData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function generateComplianceReport(companyId: string, reportData: any) {
  console.log('Generating compliance report for company:', companyId);

  const { startDate, endDate, reportType } = reportData;

  // Get company bookings in date range (this would be from a bookings table with company_id)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .limit(1000); // Mock data for demonstration

  // Get company policies
  const { data: policies } = await supabase
    .from('corporate_policies')
    .select('*')
    .eq('company_id', companyId);

  // Generate compliance metrics
  const report = await generateComplianceMetrics(bookings || [], policies || [], reportType);

  return new Response(JSON.stringify({
    success: true,
    report,
    generated_at: new Date().toISOString(),
    report_period: { start: startDate, end: endDate },
    total_bookings_analyzed: (bookings || []).length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function validateAgainstPolicy(policy: any, bookingData: any, userId: string) {
  const rules = policy.policy_rules;
  const policyType = policy.policy_type;

  switch (policyType) {
    case 'accommodation':
      return validateAccommodationPolicy(rules, bookingData);
    case 'transport':
      return validateTransportPolicy(rules, bookingData);
    case 'expense':
      return validateExpensePolicy(rules, bookingData);
    default:
      return { compliant: true };
  }
}

function validateAccommodationPolicy(rules: any, bookingData: any) {
  const violations = [];

  // Check nightly rate limit
  if (rules.max_nightly_rate && bookingData.accommodation?.nightly_rate > rules.max_nightly_rate) {
    return {
      compliant: false,
      violation: `Nightly rate $${bookingData.accommodation.nightly_rate} exceeds limit $${rules.max_nightly_rate}`,
      severity: 'high',
      suggested_action: 'Choose alternative accommodation or request approval'
    };
  }

  // Check star rating limit
  if (rules.max_star_rating && bookingData.accommodation?.star_rating > rules.max_star_rating) {
    return {
      compliant: false,
      violation: `${bookingData.accommodation.star_rating}-star hotel exceeds ${rules.max_star_rating}-star limit`,
      severity: 'medium',
      suggested_action: 'Select accommodation within policy limits'
    };
  }

  // Check allowed hotel chains
  if (rules.approved_chains && !rules.approved_chains.includes(bookingData.accommodation?.chain)) {
    return {
      compliant: false,
      violation: `Hotel chain '${bookingData.accommodation?.chain}' not in approved list`,
      severity: 'medium',
      suggested_action: 'Choose from approved hotel chains list'
    };
  }

  return { compliant: true };
}

function validateTransportPolicy(rules: any, bookingData: any) {
  // Check flight class restrictions
  if (rules.max_flight_class && bookingData.flights) {
    const classHierarchy = { 'economy': 1, 'premium_economy': 2, 'business': 3, 'first': 4 };
    
    for (const flight of bookingData.flights) {
      if (classHierarchy[flight.class] > classHierarchy[rules.max_flight_class]) {
        return {
          compliant: false,
          violation: `${flight.class} class exceeds maximum allowed ${rules.max_flight_class}`,
          severity: 'high',
          suggested_action: 'Downgrade to allowed flight class'
        };
      }
    }
  }

  // Check advance booking requirements
  if (rules.min_advance_booking_days && bookingData.departure_date) {
    const daysAdvance = Math.ceil(
      (new Date(bookingData.departure_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysAdvance < rules.min_advance_booking_days) {
      return {
        compliant: false,
        violation: `Booking only ${daysAdvance} days in advance, minimum required: ${rules.min_advance_booking_days}`,
        severity: 'medium',
        suggested_action: 'Request exception for short-notice travel'
      };
    }
  }

  return { compliant: true };
}

function validateExpensePolicy(rules: any, bookingData: any) {
  const totalAmount = bookingData.total_amount || 0;

  // Check total budget limit
  if (rules.max_total_budget && totalAmount > rules.max_total_budget) {
    return {
      compliant: false,
      violation: `Total cost $${totalAmount} exceeds budget limit $${rules.max_total_budget}`,
      severity: 'high',
      suggested_action: 'Reduce booking cost or request budget increase'
    };
  }

  // Check daily allowance
  if (rules.daily_allowance && bookingData.duration_days) {
    const dailyAverage = totalAmount / bookingData.duration_days;
    if (dailyAverage > rules.daily_allowance) {
      return {
        compliant: false,
        violation: `Daily average $${dailyAverage.toFixed(2)} exceeds allowance $${rules.daily_allowance}`,
        severity: 'medium',
        suggested_action: 'Optimize daily expenses to meet allowance'
      };
    }
  }

  return { compliant: true };
}

async function getPolicyComplianceStats(policyId: string) {
  // Mock compliance statistics - in a real implementation, this would query actual booking data
  return {
    total_bookings_checked: Math.floor(Math.random() * 100) + 50,
    compliant_bookings: Math.floor(Math.random() * 80) + 40,
    violations_found: Math.floor(Math.random() * 20) + 5,
    compliance_rate: Math.floor(Math.random() * 30) + 70,
    last_violation_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

function getDefaultApprovalWorkflow() {
  return {
    steps: [
      {
        step_order: 1,
        approver_role: 'manager',
        amount_threshold: 1000,
        required: true
      },
      {
        step_order: 2,
        approver_role: 'finance',
        amount_threshold: 5000,
        required: false
      }
    ],
    auto_approve_below: 500,
    escalation_rules: {
      timeout_hours: 24,
      escalate_to: 'senior_manager'
    }
  };
}

function determineApprovalSteps(workflow: any, bookingData: any) {
  const amount = bookingData.total_amount || 0;
  const steps = [];

  // Auto-approve if below threshold
  if (workflow.auto_approve_below && amount < workflow.auto_approve_below) {
    return [];
  }

  // Determine required approval steps based on amount
  for (const step of workflow.steps || []) {
    if (amount >= step.amount_threshold || step.required) {
      steps.push({
        step_order: step.step_order,
        approver_role: step.approver_role,
        approver_email: getApproverEmail(step.approver_role),
        status: 'pending',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }

  return steps;
}

function calculateApprovalTime(violations: any[]) {
  if (!violations || violations.length === 0) return '0 hours';
  
  const highSeverityCount = violations.filter(v => v.severity === 'high').length;
  const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;
  
  // Estimate approval time based on severity
  const baseHours = 2;
  const additionalHours = (highSeverityCount * 8) + (mediumSeverityCount * 4);
  
  return `${baseHours + additionalHours} hours`;
}

function getApproverEmail(role: string) {
  // Mock approver email mapping
  const approvers = {
    'manager': 'manager@company.com',
    'finance': 'finance@company.com',
    'senior_manager': 'senior.manager@company.com',
    'hr': 'hr@company.com'
  };
  
  return approvers[role] || 'admin@company.com';
}

async function generateComplianceMetrics(bookings: any[], policies: any[], reportType: string) {
  const metrics = {
    overview: {
      total_bookings: bookings.length,
      compliant_bookings: Math.floor(bookings.length * 0.85),
      violation_rate: 15,
      total_savings: Math.floor(Math.random() * 50000) + 10000
    },
    policy_performance: policies.map(policy => ({
      policy_name: policy.policy_name,
      compliance_rate: Math.floor(Math.random() * 30) + 70,
      violations_count: Math.floor(Math.random() * 20) + 5,
      cost_impact: Math.floor(Math.random() * 10000) + 1000
    })),
    trends: {
      monthly_compliance: generateMonthlyTrends(),
      violation_categories: [
        { category: 'Budget Exceeded', count: Math.floor(Math.random() * 15) + 5 },
        { category: 'Advance Booking', count: Math.floor(Math.random() * 10) + 3 },
        { category: 'Hotel Rating', count: Math.floor(Math.random() * 8) + 2 },
        { category: 'Flight Class', count: Math.floor(Math.random() * 12) + 4 }
      ]
    },
    recommendations: [
      'Increase advance booking requirements communication',
      'Review hotel rating policies for cost optimization',
      'Implement automated budget alerts',
      'Enhance manager approval workflow'
    ]
  };

  return metrics;
}

function generateMonthlyTrends() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map(month => ({
    month,
    compliance_rate: Math.floor(Math.random() * 20) + 70,
    total_bookings: Math.floor(Math.random() * 50) + 20,
    policy_violations: Math.floor(Math.random() * 10) + 2
  }));
}