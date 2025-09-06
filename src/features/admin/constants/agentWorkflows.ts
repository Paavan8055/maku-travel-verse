// 70-Agent System Workflow Definitions
// This file contains workflow definitions for all administrative agents

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component?: React.ComponentType<any>;
  action?: () => Promise<void>;
  validation?: () => boolean;
  isOptional?: boolean;
  estimatedTime?: string;
  dependencies?: string[];
}

export interface AgentWorkflow {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'user' | 'booking' | 'security' | 'financial' | 'operational';
  steps: WorkflowStep[];
  requiredPermissions?: string[];
  automationLevel?: 'manual' | 'semi-automated' | 'fully-automated';
}

export const agentWorkflows: Record<string, AgentWorkflow> = {
  // User Management Workflows
  'reset-password': {
    id: 'reset-password',
    title: 'Reset User Password',
    description: 'Help a user reset their password safely',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    category: 'user',
    automationLevel: 'semi-automated',
    steps: [
      {
        id: 'identify-user',
        title: 'Find the User',
        description: 'Search for the user account that needs a password reset',
        estimatedTime: '1 minute'
      },
      {
        id: 'verify-identity',
        title: 'Verify User Identity',
        description: 'Confirm the user identity through email or support ticket',
        estimatedTime: '2 minutes'
      },
      {
        id: 'send-reset-link',
        title: 'Send Reset Link',
        description: 'Generate and send a secure password reset link',
        estimatedTime: '1 minute'
      },
      {
        id: 'confirm-reset',
        title: 'Confirm Reset',
        description: 'Verify the password has been successfully reset',
        estimatedTime: '1 minute'
      }
    ]
  },

  'account-verification': {
    id: 'account-verification',
    title: 'Account Verification Process',
    description: 'Verify customer account with required documentation',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    category: 'user',
    automationLevel: 'manual',
    requiredPermissions: ['user.verify'],
    steps: [
      {
        id: 'collect-documents',
        title: 'Collect Documents',
        description: 'Gather required identity and verification documents',
        estimatedTime: '3 minutes'
      },
      {
        id: 'validate-documents',
        title: 'Validate Documents',
        description: 'Check document authenticity and completeness',
        estimatedTime: '5 minutes'
      },
      {
        id: 'background-check',
        title: 'Background Check',
        description: 'Perform security and compliance checks',
        estimatedTime: '5 minutes',
        isOptional: true
      },
      {
        id: 'approve-account',
        title: 'Approve Account',
        description: 'Update account status and notify customer',
        estimatedTime: '2 minutes'
      }
    ]
  },

  // Booking Management Workflows
  'process-refund': {
    id: 'process-refund',
    title: 'Process Booking Refund',
    description: 'Issue a refund for a booking following proper procedures',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    category: 'financial',
    automationLevel: 'semi-automated',
    requiredPermissions: ['booking.refund'],
    steps: [
      {
        id: 'find-booking',
        title: 'Locate Booking',
        description: 'Find the booking using reference number or customer details',
        estimatedTime: '2 minutes'
      },
      {
        id: 'check-policy',
        title: 'Check Refund Policy',
        description: 'Verify the booking is eligible for refund according to policy',
        estimatedTime: '3 minutes'
      },
      {
        id: 'calculate-amount',
        title: 'Calculate Refund Amount',
        description: 'Determine the correct refund amount including any fees',
        estimatedTime: '2 minutes'
      },
      {
        id: 'process-payment',
        title: 'Process Refund',
        description: 'Execute the refund through the payment system',
        estimatedTime: '2 minutes'
      },
      {
        id: 'notify-customer',
        title: 'Notify Customer',
        description: 'Send confirmation email to the customer',
        estimatedTime: '1 minute'
      }
    ]
  },

  'booking-modification': {
    id: 'booking-modification',
    title: 'Modify Existing Booking',
    description: 'Change booking details and process any additional charges',
    estimatedTime: '12 minutes',
    difficulty: 'medium',
    category: 'booking',
    automationLevel: 'manual',
    requiredPermissions: ['booking.modify'],
    steps: [
      {
        id: 'locate-booking',
        title: 'Locate Booking',
        description: 'Find the booking in the system',
        estimatedTime: '2 minutes'
      },
      {
        id: 'check-modification-rules',
        title: 'Check Modification Rules',
        description: 'Verify what changes are allowed for this booking type',
        estimatedTime: '2 minutes'
      },
      {
        id: 'calculate-changes',
        title: 'Calculate Cost Changes',
        description: 'Determine any additional charges or refunds',
        estimatedTime: '3 minutes'
      },
      {
        id: 'process-modification',
        title: 'Process Modification',
        description: 'Update booking details in the system',
        estimatedTime: '3 minutes'
      },
      {
        id: 'send-confirmation',
        title: 'Send Confirmation',
        description: 'Email updated booking confirmation to customer',
        estimatedTime: '2 minutes'
      }
    ]
  },

  // Security Workflows
  'fraud-detection': {
    id: 'fraud-detection',
    title: 'Investigate Fraud Alert',
    description: 'Investigate and respond to potential fraudulent activity',
    estimatedTime: '30 minutes',
    difficulty: 'hard',
    category: 'security',
    automationLevel: 'manual',
    requiredPermissions: ['security.investigate', 'account.suspend'],
    steps: [
      {
        id: 'review-alert',
        title: 'Review Alert Details',
        description: 'Examine the fraud detection alert and supporting data',
        estimatedTime: '5 minutes'
      },
      {
        id: 'gather-evidence',
        title: 'Gather Evidence',
        description: 'Collect transaction history, user behavior patterns',
        estimatedTime: '10 minutes'
      },
      {
        id: 'analyze-patterns',
        title: 'Analyze Patterns',
        description: 'Look for suspicious patterns and correlations',
        estimatedTime: '8 minutes'
      },
      {
        id: 'determine-action',
        title: 'Determine Action',
        description: 'Decide on appropriate response (warn, suspend, block)',
        estimatedTime: '5 minutes'
      },
      {
        id: 'execute-action',
        title: 'Execute Security Action',
        description: 'Implement the determined security response',
        estimatedTime: '2 minutes'
      }
    ]
  },

  // Administrative Workflows
  'create-admin': {
    id: 'create-admin',
    title: 'Create Administrator Account',
    description: 'Add a new administrator with proper permissions',
    estimatedTime: '8 minutes',
    difficulty: 'medium',
    category: 'operational',
    automationLevel: 'manual',
    requiredPermissions: ['admin.create', 'permissions.assign'],
    steps: [
      {
        id: 'gather-info',
        title: 'Gather Information',
        description: 'Collect new admin email, name, and required permissions',
        estimatedTime: '2 minutes'
      },
      {
        id: 'create-account',
        title: 'Create Account',
        description: 'Create the user account in the system',
        estimatedTime: '2 minutes'
      },
      {
        id: 'assign-roles',
        title: 'Assign Admin Roles',
        description: 'Grant appropriate administrative permissions',
        estimatedTime: '2 minutes'
      },
      {
        id: 'send-invitation',
        title: 'Send Invitation',
        description: 'Send setup instructions to the new administrator',
        estimatedTime: '1 minute'
      },
      {
        id: 'verify-access',
        title: 'Verify Access',
        description: 'Confirm the new admin can log in and access required features',
        estimatedTime: '1 minute'
      }
    ]
  },

  'upgrade-processor': {
    id: 'upgrade-processor',
    title: 'Process Booking Upgrade',
    description: 'Handle customer upgrade requests with proper pricing',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    category: 'booking',
    automationLevel: 'semi-automated',
    requiredPermissions: ['booking.upgrade'],
    steps: [
      {
        id: 'check-availability',
        title: 'Check Upgrade Availability',
        description: 'Verify upgrade options are available for the booking',
        estimatedTime: '3 minutes'
      },
      {
        id: 'calculate-upgrade-cost',
        title: 'Calculate Upgrade Cost',
        description: 'Determine the additional cost for the upgrade',
        estimatedTime: '4 minutes'
      },
      {
        id: 'process-payment',
        title: 'Process Additional Payment',
        description: 'Charge the customer for the upgrade difference',
        estimatedTime: '3 minutes'
      },
      {
        id: 'update-booking',
        title: 'Update Booking',
        description: 'Apply the upgrade to the booking',
        estimatedTime: '3 minutes'
      },
      {
        id: 'confirm-upgrade',
        title: 'Confirm Upgrade',
        description: 'Send upgrade confirmation to customer',
        estimatedTime: '2 minutes'
      }
    ]
  },

  'dispute-resolution': {
    id: 'dispute-resolution',
    title: 'Resolve Customer Dispute',
    description: 'Handle customer complaints and find appropriate resolution',
    estimatedTime: '25 minutes',
    difficulty: 'hard',
    category: 'operational',
    automationLevel: 'manual',
    requiredPermissions: ['dispute.resolve', 'compensation.approve'],
    steps: [
      {
        id: 'understand-dispute',
        title: 'Understand the Dispute',
        description: 'Gather details about the customer complaint',
        estimatedTime: '5 minutes'
      },
      {
        id: 'investigate-facts',
        title: 'Investigate Facts',
        description: 'Research the booking history and relevant policies',
        estimatedTime: '8 minutes'
      },
      {
        id: 'determine-resolution',
        title: 'Determine Resolution',
        description: 'Decide on appropriate compensation or action',
        estimatedTime: '7 minutes'
      },
      {
        id: 'implement-resolution',
        title: 'Implement Resolution',
        description: 'Execute the agreed-upon resolution',
        estimatedTime: '3 minutes'
      },
      {
        id: 'follow-up',
        title: 'Follow Up',
        description: 'Ensure customer satisfaction with the resolution',
        estimatedTime: '2 minutes'
      }
    ]
  },

  'vip-concierge': {
    id: 'vip-concierge',
    title: 'VIP Concierge Service',
    description: 'Provide premium concierge services for VIP customers',
    estimatedTime: '20 minutes',
    difficulty: 'medium',
    category: 'operational',
    automationLevel: 'manual',
    requiredPermissions: ['vip.access'],
    steps: [
      {
        id: 'identify-vip-needs',
        title: 'Identify VIP Needs',
        description: 'Understand the specific requirements of the VIP customer',
        estimatedTime: '4 minutes'
      },
      {
        id: 'coordinate-services',
        title: 'Coordinate Services',
        description: 'Arrange special services and accommodations',
        estimatedTime: '10 minutes'
      },
      {
        id: 'confirm-arrangements',
        title: 'Confirm Arrangements',
        description: 'Verify all VIP services are properly booked',
        estimatedTime: '3 minutes'
      },
      {
        id: 'provide-concierge-details',
        title: 'Provide Concierge Details',
        description: 'Send detailed itinerary and contact information',
        estimatedTime: '3 minutes'
      }
    ]
  }

  // Additional workflows would be defined here for all 70 agents
  // This is a representative sample showing the pattern
};