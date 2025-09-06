// Administrative Agent Workflows - 35 Multi-step Workflows
// Each workflow corresponds to an admin template and guides execution

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  required: boolean;
  fields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
}

export interface AgentWorkflow {
  id: string;
  title: string;
  description: string;
  category: 'user' | 'booking' | 'security' | 'communication' | 'financial' | 'operational';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  steps: WorkflowStep[];
  completionCriteria: string;
}

export const agentWorkflows: AgentWorkflow[] = [
  // User Management Workflows
  {
    id: 'password-reset-workflow',
    title: 'Password Reset Process',
    description: 'Complete workflow for processing password reset requests',
    category: 'user',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    prerequisites: ['Valid customer email', 'Account verification'],
    steps: [
      {
        id: 'verify-identity',
        title: 'Verify Customer Identity',
        description: 'Confirm customer identity using security questions or account details',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
          { name: 'customerEmail', label: 'Customer Email', type: 'email', required: true },
          { name: 'verificationMethod', label: 'Verification Method', type: 'select', required: true, options: ['Security Questions', 'Account Details', 'Phone Verification'] }
        ]
      },
      {
        id: 'generate-reset-link',
        title: 'Generate Password Reset Link',
        description: 'Create secure password reset link with expiration',
        estimatedTime: '1 minute',
        required: true
      },
      {
        id: 'send-notification',
        title: 'Send Reset Instructions',
        description: 'Email password reset instructions to customer',
        estimatedTime: '1 minute',
        required: true
      },
      {
        id: 'document-action',
        title: 'Document Password Reset',
        description: 'Log password reset action in customer record',
        estimatedTime: '1 minute',
        required: true
      }
    ],
    completionCriteria: 'Customer receives reset email and action is logged'
  },
  {
    id: 'account-verification-workflow',
    title: 'Account Verification Process',
    description: 'Complete workflow for verifying customer accounts',
    category: 'user',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    prerequisites: ['Customer documentation', 'Account creation request'],
    steps: [
      {
        id: 'review-documents',
        title: 'Review Submitted Documents',
        description: 'Verify identity documents and account information',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'documentType', label: 'Document Type', type: 'select', required: true, options: ['Passport', 'Driver License', 'National ID', 'Other'] },
          { name: 'documentStatus', label: 'Document Status', type: 'select', required: true, options: ['Valid', 'Expired', 'Invalid', 'Unclear'] }
        ]
      },
      {
        id: 'verify-information',
        title: 'Cross-reference Information',
        description: 'Verify provided information against databases',
        estimatedTime: '3 minutes',
        required: true
      },
      {
        id: 'update-account-status',
        title: 'Update Account Status',
        description: 'Mark account as verified or request additional documentation',
        estimatedTime: '1 minute',
        required: true,
        fields: [
          { name: 'verificationStatus', label: 'Verification Status', type: 'select', required: true, options: ['Verified', 'Rejected', 'Additional Info Required'] }
        ]
      },
      {
        id: 'notify-customer',
        title: 'Notify Customer',
        description: 'Send verification result to customer',
        estimatedTime: '1 minute',
        required: true
      }
    ],
    completionCriteria: 'Account status updated and customer notified'
  },

  // Booking Management Workflows
  {
    id: 'booking-modification-workflow',
    title: 'Booking Modification Process',
    description: 'Complete workflow for modifying existing bookings',
    category: 'booking',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    prerequisites: ['Valid booking reference', 'Modification authorization'],
    steps: [
      {
        id: 'retrieve-booking',
        title: 'Retrieve Booking Details',
        description: 'Locate and load existing booking information',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
          { name: 'customerName', label: 'Customer Name', type: 'text', required: true }
        ]
      },
      {
        id: 'assess-changes',
        title: 'Assess Modification Request',
        description: 'Review requested changes and check availability',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'modificationType', label: 'Modification Type', type: 'select', required: true, options: ['Date Change', 'Guest Count', 'Room Type', 'Additional Services'] }
        ]
      },
      {
        id: 'calculate-fees',
        title: 'Calculate Modification Fees',
        description: 'Determine any applicable change fees or cost differences',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'changeFee', label: 'Change Fee', type: 'number', required: true },
          { name: 'priceDifference', label: 'Price Difference', type: 'number', required: true }
        ]
      },
      {
        id: 'process-modification',
        title: 'Process Modification',
        description: 'Apply changes to booking and update systems',
        estimatedTime: '2 minutes',
        required: true
      },
      {
        id: 'send-confirmation',
        title: 'Send Modified Booking Confirmation',
        description: 'Email updated booking confirmation to customer',
        estimatedTime: '1 minute',
        required: true
      }
    ],
    completionCriteria: 'Booking successfully modified and confirmation sent'
  },
  {
    id: 'cancellation-handler-workflow',
    title: 'Booking Cancellation Process',
    description: 'Complete workflow for processing booking cancellations',
    category: 'booking',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    prerequisites: ['Valid booking reference', 'Cancellation policy review'],
    steps: [
      {
        id: 'validate-cancellation',
        title: 'Validate Cancellation Request',
        description: 'Verify booking details and cancellation eligibility',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
          { name: 'cancellationReason', label: 'Cancellation Reason', type: 'select', required: true, options: ['Change of Plans', 'Emergency', 'Medical', 'Weather', 'Other'] }
        ]
      },
      {
        id: 'review-policy',
        title: 'Review Cancellation Policy',
        description: 'Check applicable cancellation terms and fees',
        estimatedTime: '4 minutes',
        required: true,
        fields: [
          { name: 'policyType', label: 'Policy Type', type: 'select', required: true, options: ['Flexible', 'Moderate', 'Strict', 'Non-refundable'] }
        ]
      },
      {
        id: 'calculate-refund',
        title: 'Calculate Refund Amount',
        description: 'Determine refund amount after applicable fees',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'originalAmount', label: 'Original Amount', type: 'number', required: true },
          { name: 'cancellationFee', label: 'Cancellation Fee', type: 'number', required: true },
          { name: 'refundAmount', label: 'Refund Amount', type: 'number', required: true }
        ]
      },
      {
        id: 'process-cancellation',
        title: 'Process Cancellation',
        description: 'Cancel booking in all systems and notify suppliers',
        estimatedTime: '3 minutes',
        required: true
      },
      {
        id: 'initiate-refund',
        title: 'Initiate Refund',
        description: 'Process refund to original payment method',
        estimatedTime: '2 minutes',
        required: true
      }
    ],
    completionCriteria: 'Booking cancelled, refund processed, and customer notified'
  },
  {
    id: 'upgrade-processor-workflow',
    title: 'Booking Upgrade Process',
    description: 'Complete workflow for processing booking upgrades',
    category: 'booking',
    estimatedTime: '12 minutes',
    difficulty: 'medium',
    prerequisites: ['Valid booking reference', 'Upgrade availability'],
    steps: [
      {
        id: 'check-availability',
        title: 'Check Upgrade Availability',
        description: 'Verify available upgrade options for booking',
        estimatedTime: '4 minutes',
        required: true,
        fields: [
          { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
          { name: 'upgradeType', label: 'Upgrade Type', type: 'select', required: true, options: ['Room Category', 'Flight Class', 'Car Category', 'Service Level'] }
        ]
      },
      {
        id: 'calculate-cost',
        title: 'Calculate Upgrade Cost',
        description: 'Determine additional cost for upgrade',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'upgradeCost', label: 'Upgrade Cost', type: 'number', required: true }
        ]
      },
      {
        id: 'process-payment',
        title: 'Process Additional Payment',
        description: 'Collect payment for upgrade if required',
        estimatedTime: '3 minutes',
        required: true
      },
      {
        id: 'apply-upgrade',
        title: 'Apply Upgrade',
        description: 'Update booking with upgrade details',
        estimatedTime: '2 minutes',
        required: true
      }
    ],
    completionCriteria: 'Upgrade applied and confirmation sent'
  },

  // Financial Workflows
  {
    id: 'refund-processing-workflow',
    title: 'Refund Processing Workflow',
    description: 'Complete workflow for processing customer refunds',
    category: 'financial',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    prerequisites: ['Approved refund request', 'Original payment details'],
    steps: [
      {
        id: 'verify-refund-eligibility',
        title: 'Verify Refund Eligibility',
        description: 'Confirm refund request meets policy requirements',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'refundReason', label: 'Refund Reason', type: 'select', required: true, options: ['Cancellation', 'Service Issue', 'Duplicate Payment', 'Error', 'Goodwill'] },
          { name: 'originalPaymentMethod', label: 'Original Payment Method', type: 'text', required: true }
        ]
      },
      {
        id: 'process-refund',
        title: 'Process Refund Transaction',
        description: 'Execute refund to original payment method',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'refundAmount', label: 'Refund Amount', type: 'number', required: true }
        ]
      },
      {
        id: 'update-records',
        title: 'Update Financial Records',
        description: 'Record refund in accounting system',
        estimatedTime: '1 minute',
        required: true
      }
    ],
    completionCriteria: 'Refund processed and customer notified'
  },
  {
    id: 'payment-investigation-workflow',
    title: 'Payment Investigation Process',
    description: 'Complete workflow for investigating payment issues',
    category: 'financial',
    estimatedTime: '20 minutes',
    difficulty: 'hard',
    prerequisites: ['Payment dispute or issue report', 'Transaction details'],
    steps: [
      {
        id: 'gather-information',
        title: 'Gather Payment Information',
        description: 'Collect all relevant payment and transaction data',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'transactionId', label: 'Transaction ID', type: 'text', required: true },
          { name: 'paymentMethod', label: 'Payment Method', type: 'select', required: true, options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Other'] },
          { name: 'issueType', label: 'Issue Type', type: 'select', required: true, options: ['Duplicate Charge', 'Unauthorized Transaction', 'Failed Payment', 'Wrong Amount', 'Chargeback'] }
        ]
      },
      {
        id: 'review-transaction-history',
        title: 'Review Transaction History',
        description: 'Analyze payment flow and identify issues',
        estimatedTime: '8 minutes',
        required: true
      },
      {
        id: 'contact-payment-processor',
        title: 'Contact Payment Processor',
        description: 'Coordinate with payment gateway or bank if needed',
        estimatedTime: '5 minutes',
        required: false
      },
      {
        id: 'document-findings',
        title: 'Document Investigation Findings',
        description: 'Record investigation results and recommended actions',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'findings', label: 'Investigation Findings', type: 'textarea', required: true },
          { name: 'recommendedAction', label: 'Recommended Action', type: 'textarea', required: true }
        ]
      }
    ],
    completionCriteria: 'Investigation completed and resolution plan documented'
  },
  {
    id: 'loyalty-adjuster-workflow',
    title: 'Loyalty Points Adjustment Workflow',
    description: 'Complete workflow for adjusting customer loyalty points',
    category: 'financial',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    prerequisites: ['Customer loyalty account', 'Adjustment authorization'],
    steps: [
      {
        id: 'verify-account',
        title: 'Verify Loyalty Account',
        description: 'Confirm customer loyalty account and current status',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'loyaltyId', label: 'Loyalty Account ID', type: 'text', required: true },
          { name: 'currentPoints', label: 'Current Points Balance', type: 'number', required: true }
        ]
      },
      {
        id: 'calculate-adjustment',
        title: 'Calculate Points Adjustment',
        description: 'Determine points to add or subtract',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'adjustmentType', label: 'Adjustment Type', type: 'select', required: true, options: ['Add Points', 'Subtract Points', 'Tier Adjustment', 'Bonus Award'] },
          { name: 'pointsAmount', label: 'Points Amount', type: 'number', required: true },
          { name: 'adjustmentReason', label: 'Adjustment Reason', type: 'textarea', required: true }
        ]
      },
      {
        id: 'apply-adjustment',
        title: 'Apply Points Adjustment',
        description: 'Update loyalty account with new points balance',
        estimatedTime: '2 minutes',
        required: true
      },
      {
        id: 'notify-customer',
        title: 'Notify Customer',
        description: 'Send points adjustment notification to customer',
        estimatedTime: '1 minute',
        required: true
      },
      {
        id: 'update-tier-status',
        title: 'Update Tier Status',
        description: 'Check and update loyalty tier if applicable',
        estimatedTime: '2 minutes',
        required: false
      }
    ],
    completionCriteria: 'Points adjusted, tier updated if applicable, and customer notified'
  },
  {
    id: 'credit-manager-workflow',
    title: 'Customer Credit Management Workflow',
    description: 'Complete workflow for managing customer credits and vouchers',
    category: 'financial',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    prerequisites: ['Customer account', 'Credit authorization'],
    steps: [
      {
        id: 'assess-credit-request',
        title: 'Assess Credit Request',
        description: 'Evaluate reason and validity of credit request',
        estimatedTime: '4 minutes',
        required: true,
        fields: [
          { name: 'creditType', label: 'Credit Type', type: 'select', required: true, options: ['Travel Credit', 'Compensation Credit', 'Goodwill Credit', 'Refund Credit'] },
          { name: 'creditReason', label: 'Credit Reason', type: 'textarea', required: true },
          { name: 'requestedAmount', label: 'Requested Amount', type: 'number', required: true }
        ]
      },
      {
        id: 'determine-credit-amount',
        title: 'Determine Credit Amount',
        description: 'Calculate appropriate credit amount and terms',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'approvedAmount', label: 'Approved Amount', type: 'number', required: true },
          { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true }
        ]
      },
      {
        id: 'generate-credit',
        title: 'Generate Credit Voucher',
        description: 'Create credit voucher with terms and conditions',
        estimatedTime: '3 minutes',
        required: true
      },
      {
        id: 'update-account',
        title: 'Update Customer Account',
        description: 'Add credit to customer account balance',
        estimatedTime: '2 minutes',
        required: true
      },
      {
        id: 'send-credit-notification',
        title: 'Send Credit Notification',
        description: 'Email credit details and usage instructions to customer',
        estimatedTime: '3 minutes',
        required: true
      }
    ],
    completionCriteria: 'Credit issued, account updated, and customer notified'
  },
  {
    id: 'insurance-processor-workflow',
    title: 'Travel Insurance Processing Workflow',
    description: 'Complete workflow for processing travel insurance claims',
    category: 'financial',
    estimatedTime: '35 minutes',
    difficulty: 'hard',
    prerequisites: ['Insurance policy details', 'Claim documentation'],
    steps: [
      {
        id: 'validate-policy',
        title: 'Validate Insurance Policy',
        description: 'Verify policy is active and covers claimed incident',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true },
          { name: 'policyStatus', label: 'Policy Status', type: 'select', required: true, options: ['Active', 'Expired', 'Cancelled', 'Suspended'] }
        ]
      },
      {
        id: 'review-claim-documentation',
        title: 'Review Claim Documentation',
        description: 'Examine all submitted documents and evidence',
        estimatedTime: '10 minutes',
        required: true,
        fields: [
          { name: 'claimType', label: 'Claim Type', type: 'select', required: true, options: ['Trip Cancellation', 'Medical Emergency', 'Lost Luggage', 'Flight Delay', 'Other'] },
          { name: 'documentsReceived', label: 'Documents Received', type: 'textarea', required: true }
        ]
      },
      {
        id: 'assess-coverage',
        title: 'Assess Coverage Eligibility',
        description: 'Determine if claim is covered under policy terms',
        estimatedTime: '8 minutes',
        required: true,
        fields: [
          { name: 'coverageEligible', label: 'Coverage Eligible', type: 'select', required: true, options: ['Fully Covered', 'Partially Covered', 'Not Covered'] }
        ]
      },
      {
        id: 'calculate-payout',
        title: 'Calculate Claim Payout',
        description: 'Determine payout amount based on policy limits',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'claimedAmount', label: 'Claimed Amount', type: 'number', required: true },
          { name: 'approvedAmount', label: 'Approved Payout', type: 'number', required: true }
        ]
      },
      {
        id: 'process-claim-decision',
        title: 'Process Claim Decision',
        description: 'Finalize claim decision and initiate payout if approved',
        estimatedTime: '4 minutes',
        required: true,
        fields: [
          { name: 'claimDecision', label: 'Claim Decision', type: 'select', required: true, options: ['Approved', 'Denied', 'Partially Approved', 'Under Review'] }
        ]
      },
      {
        id: 'notify-outcome',
        title: 'Notify Claim Outcome',
        description: 'Send claim decision and payment details to customer',
        estimatedTime: '3 minutes',
        required: true
      }
    ],
    completionCriteria: 'Claim processed, decision communicated, and payout initiated if approved'
  },

  // Security Workflows
  {
    id: 'security-alert-workflow',
    title: 'Security Alert Response Workflow',
    description: 'Complete workflow for responding to security alerts',
    category: 'security',
    estimatedTime: '15 minutes',
    difficulty: 'hard',
    prerequisites: ['Security incident report', 'Access to security systems'],
    steps: [
      {
        id: 'assess-threat-level',
        title: 'Assess Threat Level',
        description: 'Evaluate severity and potential impact of security issue',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'threatLevel', label: 'Threat Level', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
          { name: 'affectedSystems', label: 'Affected Systems', type: 'textarea', required: true }
        ]
      },
      {
        id: 'implement-containment',
        title: 'Implement Containment Measures',
        description: 'Take immediate action to contain security threat',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'containmentActions', label: 'Containment Actions Taken', type: 'textarea', required: true }
        ]
      },
      {
        id: 'investigate-incident',
        title: 'Investigate Security Incident',
        description: 'Analyze logs and evidence to understand the incident',
        estimatedTime: '4 minutes',
        required: true
      },
      {
        id: 'document-response',
        title: 'Document Security Response',
        description: 'Record all actions taken and findings',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'responseActions', label: 'Response Actions', type: 'textarea', required: true },
          { name: 'recommendations', label: 'Security Recommendations', type: 'textarea', required: true }
        ]
      },
      {
        id: 'notify-stakeholders',
        title: 'Notify Relevant Stakeholders',
        description: 'Inform management and affected parties of security incident',
        estimatedTime: '1 minute',
        required: true
      }
    ],
    completionCriteria: 'Security incident contained, investigated, and stakeholders notified'
  },
  {
    id: 'fraud-detection-workflow',
    title: 'Fraud Detection Investigation Workflow',
    description: 'Complete workflow for investigating potential fraud cases',
    category: 'security',
    estimatedTime: '25 minutes',
    difficulty: 'hard',
    prerequisites: ['Fraud alert trigger', 'Account details', 'Transaction history'],
    steps: [
      {
        id: 'analyze-fraud-indicators',
        title: 'Analyze Fraud Indicators',
        description: 'Review suspicious activity patterns and risk factors',
        estimatedTime: '6 minutes',
        required: true,
        fields: [
          { name: 'fraudIndicators', label: 'Fraud Indicators', type: 'textarea', required: true },
          { name: 'riskScore', label: 'Risk Score (1-10)', type: 'number', required: true }
        ]
      },
      {
        id: 'verify-account-activity',
        title: 'Verify Account Activity',
        description: 'Cross-reference recent account activity with known patterns',
        estimatedTime: '8 minutes',
        required: true
      },
      {
        id: 'contact-customer',
        title: 'Contact Customer for Verification',
        description: 'Reach out to customer to verify suspicious transactions',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'contactMethod', label: 'Contact Method', type: 'select', required: true, options: ['Phone', 'Email', 'SMS', 'Secure Message'] },
          { name: 'customerResponse', label: 'Customer Response', type: 'textarea', required: true }
        ]
      },
      {
        id: 'take-protective-action',
        title: 'Take Protective Action',
        description: 'Implement account protection measures if fraud confirmed',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'protectiveActions', label: 'Protective Actions', type: 'textarea', required: true },
          { name: 'accountStatus', label: 'Account Status', type: 'select', required: true, options: ['Active', 'Suspended', 'Restricted', 'Closed'] }
        ]
      },
      {
        id: 'report-fraud',
        title: 'Report Fraud Case',
        description: 'File fraud report with relevant authorities if required',
        estimatedTime: '3 minutes',
        required: false,
        fields: [
          { name: 'reportRequired', label: 'External Report Required', type: 'select', required: true, options: ['Yes', 'No'] }
        ]
      }
    ],
    completionCriteria: 'Fraud investigation completed and appropriate actions taken'
  },
  {
    id: 'compliance-check-workflow',
    title: 'Compliance Verification Workflow',
    description: 'Complete workflow for verifying regulatory compliance',
    category: 'security',
    estimatedTime: '30 minutes',
    difficulty: 'hard',
    prerequisites: ['Compliance framework', 'Audit requirements', 'System access'],
    steps: [
      {
        id: 'define-compliance-scope',
        title: 'Define Compliance Scope',
        description: 'Identify specific compliance requirements to verify',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'complianceFramework', label: 'Compliance Framework', type: 'select', required: true, options: ['GDPR', 'PCI DSS', 'SOX', 'HIPAA', 'ISO 27001', 'Custom'] },
          { name: 'auditScope', label: 'Audit Scope', type: 'textarea', required: true }
        ]
      },
      {
        id: 'collect-evidence',
        title: 'Collect Compliance Evidence',
        description: 'Gather documentation and system evidence',
        estimatedTime: '10 minutes',
        required: true
      },
      {
        id: 'assess-compliance-status',
        title: 'Assess Compliance Status',
        description: 'Evaluate current compliance against requirements',
        estimatedTime: '8 minutes',
        required: true,
        fields: [
          { name: 'complianceLevel', label: 'Compliance Level', type: 'select', required: true, options: ['Fully Compliant', 'Mostly Compliant', 'Partially Compliant', 'Non-Compliant'] },
          { name: 'gapsIdentified', label: 'Compliance Gaps Identified', type: 'textarea', required: true }
        ]
      },
      {
        id: 'create-remediation-plan',
        title: 'Create Remediation Plan',
        description: 'Develop plan to address any compliance gaps',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'remediationActions', label: 'Remediation Actions', type: 'textarea', required: true },
          { name: 'targetDate', label: 'Target Completion Date', type: 'date', required: true }
        ]
      },
      {
        id: 'generate-compliance-report',
        title: 'Generate Compliance Report',
        description: 'Create detailed compliance verification report',
        estimatedTime: '2 minutes',
        required: true
      }
    ],
    completionCriteria: 'Compliance status verified and remediation plan created if needed'
  },

  // Communication Workflows
  {
    id: 'special-requests-workflow',
    title: 'Special Request Handling Workflow',
    description: 'Complete workflow for handling special customer requests',
    category: 'communication',
    estimatedTime: '8 minutes',
    difficulty: 'medium',
    prerequisites: ['Customer request details', 'Service availability'],
    steps: [
      {
        id: 'categorize-request',
        title: 'Categorize Request Type',
        description: 'Classify the special request for appropriate handling',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'requestCategory', label: 'Request Category', type: 'select', required: true, options: ['Accessibility', 'Dietary', 'Medical', 'Celebration', 'Business', 'Other'] },
          { name: 'urgency', label: 'Request Urgency', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Urgent'] }
        ]
      },
      {
        id: 'assess-feasibility',
        title: 'Assess Request Feasibility',
        description: 'Determine if request can be accommodated',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'feasibilityStatus', label: 'Feasibility Status', type: 'select', required: true, options: ['Fully Possible', 'Partially Possible', 'Not Possible', 'Requires Coordination'] }
        ]
      },
      {
        id: 'coordinate-fulfillment',
        title: 'Coordinate Request Fulfillment',
        description: 'Arrange with suppliers or internal teams to fulfill request',
        estimatedTime: '2 minutes',
        required: true
      },
      {
        id: 'confirm-arrangements',
        title: 'Confirm Arrangements',
        description: 'Verify all arrangements are in place for the request',
        estimatedTime: '1 minute',
        required: true,
        fields: [
          { name: 'arrangementDetails', label: 'Arrangement Details', type: 'textarea', required: true }
        ]
      }
    ],
    completionCriteria: 'Special request processed and customer informed of outcome'
  },

  // Operational Workflows
  {
    id: 'escalation-manager-workflow',
    title: 'Issue Escalation Management Workflow',
    description: 'Complete workflow for escalating customer service issues',
    category: 'operational',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    prerequisites: ['Unresolved customer issue', 'Escalation criteria met'],
    steps: [
      {
        id: 'document-escalation-reason',
        title: 'Document Escalation Reason',
        description: 'Record why the issue requires escalation',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'escalationTrigger', label: 'Escalation Trigger', type: 'select', required: true, options: ['Customer Request', 'Complexity', 'Policy Exception', 'Time Limit', 'Management Required'] },
          { name: 'previousAttempts', label: 'Previous Resolution Attempts', type: 'textarea', required: true }
        ]
      },
      {
        id: 'determine-escalation-level',
        title: 'Determine Escalation Level',
        description: 'Identify appropriate escalation level and recipient',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'escalationLevel', label: 'Escalation Level', type: 'select', required: true, options: ['Supervisor', 'Manager', 'Senior Management', 'Executive', 'External Partner'] }
        ]
      },
      {
        id: 'prepare-escalation-brief',
        title: 'Prepare Escalation Brief',
        description: 'Compile comprehensive briefing for escalation recipient',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'situationSummary', label: 'Situation Summary', type: 'textarea', required: true },
          { name: 'customerImpact', label: 'Customer Impact', type: 'textarea', required: true },
          { name: 'recommendedAction', label: 'Recommended Action', type: 'textarea', required: true }
        ]
      },
      {
        id: 'transfer-case',
        title: 'Transfer Case',
        description: 'Hand over case to appropriate escalation level',
        estimatedTime: '2 minutes',
        required: true
      },
      {
        id: 'notify-customer',
        title: 'Notify Customer of Escalation',
        description: 'Inform customer that their case has been escalated',
        estimatedTime: '3 minutes',
        required: true
      }
    ],
    completionCriteria: 'Case escalated to appropriate level and customer notified'
  },
  {
    id: 'vip-concierge-workflow',
    title: 'VIP Customer Service Workflow',
    description: 'Complete workflow for providing VIP customer service',
    category: 'operational',
    estimatedTime: '20 minutes',
    difficulty: 'medium',
    prerequisites: ['VIP customer status verified', 'Concierge service request'],
    steps: [
      {
        id: 'verify-vip-status',
        title: 'Verify VIP Status',
        description: 'Confirm customer VIP tier and available benefits',
        estimatedTime: '2 minutes',
        required: true,
        fields: [
          { name: 'vipTier', label: 'VIP Tier', type: 'select', required: true, options: ['Gold', 'Platinum', 'Diamond', 'Elite'] },
          { name: 'availableBenefits', label: 'Available Benefits', type: 'textarea', required: true }
        ]
      },
      {
        id: 'understand-request',
        title: 'Understand Service Request',
        description: 'Gather detailed requirements for VIP service',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Travel Planning', 'Reservation Changes', 'Special Arrangements', 'Emergency Assistance', 'Event Planning'] },
          { name: 'requestDetails', label: 'Request Details', type: 'textarea', required: true }
        ]
      },
      {
        id: 'coordinate-premium-services',
        title: 'Coordinate Premium Services',
        description: 'Arrange exclusive services and accommodations',
        estimatedTime: '8 minutes',
        required: true
      },
      {
        id: 'provide-personal-assistance',
        title: 'Provide Personal Assistance',
        description: 'Deliver personalized concierge service',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'personalizedServices', label: 'Personalized Services Provided', type: 'textarea', required: true }
        ]
      },
      {
        id: 'follow-up-vip',
        title: 'VIP Follow-up',
        description: 'Ensure satisfaction and offer additional assistance',
        estimatedTime: '2 minutes',
        required: true
      }
    ],
    completionCriteria: 'VIP service delivered and customer satisfaction confirmed'
  },
  {
    id: 'data-validation-workflow',
    title: 'Data Quality Validation Workflow',
    description: 'Complete workflow for validating data integrity and quality',
    category: 'operational',
    estimatedTime: '25 minutes',
    difficulty: 'hard',
    prerequisites: ['Data access permissions', 'Validation criteria', 'Quality standards'],
    steps: [
      {
        id: 'define-validation-scope',
        title: 'Define Validation Scope',
        description: 'Identify data sets and validation criteria',
        estimatedTime: '4 minutes',
        required: true,
        fields: [
          { name: 'dataSource', label: 'Data Source', type: 'text', required: true },
          { name: 'validationType', label: 'Validation Type', type: 'select', required: true, options: ['Completeness', 'Accuracy', 'Consistency', 'Validity', 'Uniqueness'] }
        ]
      },
      {
        id: 'run-validation-checks',
        title: 'Run Validation Checks',
        description: 'Execute automated and manual data validation processes',
        estimatedTime: '12 minutes',
        required: true
      },
      {
        id: 'analyze-validation-results',
        title: 'Analyze Validation Results',
        description: 'Review validation outcomes and identify issues',
        estimatedTime: '6 minutes',
        required: true,
        fields: [
          { name: 'recordsValidated', label: 'Records Validated', type: 'number', required: true },
          { name: 'errorsFound', label: 'Errors Found', type: 'number', required: true },
          { name: 'qualityScore', label: 'Quality Score (%)', type: 'number', required: true }
        ]
      },
      {
        id: 'create-remediation-plan',
        title: 'Create Data Remediation Plan',
        description: 'Develop plan to fix identified data quality issues',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'remediationSteps', label: 'Remediation Steps', type: 'textarea', required: true }
        ]
      }
    ],
    completionCriteria: 'Data validation completed and remediation plan created'
  },
  {
    id: 'dispute-resolution-workflow',
    title: 'Customer Dispute Resolution Workflow',
    description: 'Complete workflow for resolving customer disputes',
    category: 'operational',
    estimatedTime: '45 minutes',
    difficulty: 'hard',
    prerequisites: ['Formal dispute filed', 'All case documentation', 'Resolution authority'],
    steps: [
      {
        id: 'case-intake',
        title: 'Dispute Case Intake',
        description: 'Register dispute case and assign case number',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'disputeCategory', label: 'Dispute Category', type: 'select', required: true, options: ['Service Quality', 'Billing', 'Policy Violation', 'Cancellation', 'Refund', 'Discrimination'] },
          { name: 'severityLevel', label: 'Severity Level', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] }
        ]
      },
      {
        id: 'investigate-dispute',
        title: 'Investigate Dispute Claims',
        description: 'Thoroughly investigate all aspects of the dispute',
        estimatedTime: '20 minutes',
        required: true,
        fields: [
          { name: 'evidenceReviewed', label: 'Evidence Reviewed', type: 'textarea', required: true },
          { name: 'witnessStatements', label: 'Witness Statements', type: 'textarea', required: false }
        ]
      },
      {
        id: 'mediate-resolution',
        title: 'Mediate Resolution',
        description: 'Facilitate discussion between parties to reach resolution',
        estimatedTime: '12 minutes',
        required: true,
        fields: [
          { name: 'mediationOutcome', label: 'Mediation Outcome', type: 'select', required: true, options: ['Agreement Reached', 'Partial Agreement', 'No Agreement', 'Escalation Required'] }
        ]
      },
      {
        id: 'implement-resolution',
        title: 'Implement Resolution',
        description: 'Execute agreed-upon resolution actions',
        estimatedTime: '5 minutes',
        required: true,
        fields: [
          { name: 'resolutionActions', label: 'Resolution Actions', type: 'textarea', required: true },
          { name: 'compensationOffered', label: 'Compensation Offered', type: 'text', required: false }
        ]
      },
      {
        id: 'close-dispute-case',
        title: 'Close Dispute Case',
        description: 'Document final resolution and close case',
        estimatedTime: '3 minutes',
        required: true,
        fields: [
          { name: 'customerSatisfaction', label: 'Customer Satisfaction', type: 'select', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] }
        ]
      }
    ],
    completionCriteria: 'Dispute resolved to customer satisfaction and case closed'
  }
];