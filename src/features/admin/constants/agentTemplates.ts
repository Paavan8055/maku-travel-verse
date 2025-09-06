// 70 Administrative Agent Templates
// This file contains template definitions for all administrative agents

export interface AgentTemplate {
  id: string;
  title: string;
  description: string;
  category: 'user' | 'booking' | 'security' | 'communication' | 'financial' | 'operational';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  template: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
}

export const agentTemplates: AgentTemplate[] = [
  // User Management Templates
  {
    id: 'password-reset',
    title: 'Password Reset Request',
    description: 'Help a customer reset their password',
    category: 'user',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    template: 'Hi {customerName},\n\nI understand you need help resetting your password. I\'ve sent a secure reset link to {email}.\n\nPlease check your email and follow the instructions. The link will expire in 24 hours.\n\nIf you don\'t see the email, please check your spam folder.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true, placeholder: 'John Doe' },
      { name: 'email', label: 'Customer Email', type: 'email', required: true, placeholder: 'customer@example.com' },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true, placeholder: 'Admin Name' }
    ]
  },
  {
    id: 'account-verification',
    title: 'Account Verification',
    description: 'Verify customer account identity',
    category: 'user',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    template: 'Hi {customerName},\n\nTo complete your account verification, please provide the following:\n\n{requiredDocuments}\n\nOnce we receive these documents, verification typically takes 1-2 business days.\n\nUpload documents securely at: {verificationLink}\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'requiredDocuments', label: 'Required Documents', type: 'textarea', required: true },
      { name: 'verificationLink', label: 'Verification Link', type: 'text', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },

  // Booking Management Templates
  {
    id: 'booking-modification',
    title: 'Booking Modification',
    description: 'Help modify an existing booking',
    category: 'booking',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    template: 'Hi {customerName},\n\nI\'ve successfully modified your booking {bookingReference}.\n\nChanges made:\n{changes}\n\nNew total: {newTotal}\n\nYou\'ll receive an updated confirmation email shortly.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'changes', label: 'Changes Made', type: 'textarea', required: true },
      { name: 'newTotal', label: 'New Total Amount', type: 'text', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'cancellation-handler',
    title: 'Booking Cancellation',
    description: 'Process booking cancellation requests',
    category: 'booking',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    template: 'Hi {customerName},\n\nYour cancellation request for booking {bookingReference} has been processed.\n\nCancellation fees: {cancellationFees}\nRefund amount: {refundAmount}\nProcessing time: {processingTime}\n\n{additionalNotes}\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'cancellationFees', label: 'Cancellation Fees', type: 'text', required: true },
      { name: 'refundAmount', label: 'Refund Amount', type: 'text', required: true },
      { name: 'processingTime', label: 'Processing Time', type: 'text', required: true },
      { name: 'additionalNotes', label: 'Additional Notes', type: 'textarea', required: false },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'upgrade-processor',
    title: 'Booking Upgrade',
    description: 'Process booking upgrade requests',
    category: 'booking',
    estimatedTime: '12 minutes',
    difficulty: 'medium',
    template: 'Hi {customerName},\n\nGreat news! Your upgrade request for booking {bookingReference} has been approved.\n\nUpgrade details:\n{upgradeDetails}\n\nAdditional cost: {upgradeCost}\nNew total: {newTotal}\n\nYour upgraded booking is confirmed!\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'upgradeDetails', label: 'Upgrade Details', type: 'textarea', required: true },
      { name: 'upgradeCost', label: 'Upgrade Cost', type: 'text', required: true },
      { name: 'newTotal', label: 'New Total', type: 'text', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },

  // Financial Templates
  {
    id: 'refund-processing',
    title: 'Refund Confirmation',
    description: 'Confirm a refund has been processed',
    category: 'financial',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    template: 'Hi {customerName},\n\nYour refund for booking {bookingReference} has been processed.\n\nRefund amount: {refundAmount}\nProcessing time: 3-5 business days\nRefund method: Original payment method\n\nYou\'ll see the refund in your account within the specified timeframe.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'refundAmount', label: 'Refund Amount', type: 'text', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'payment-investigation',
    title: 'Payment Investigation',
    description: 'Investigate payment-related issues',
    category: 'financial',
    estimatedTime: '20 minutes',
    difficulty: 'hard',
    template: 'Hi {customerName},\n\nI\'ve investigated the payment issue for booking {bookingReference}.\n\nInvestigation findings:\n{findings}\n\nRecommended action:\n{recommendedAction}\n\nNext steps:\n{nextSteps}\n\nI\'ll keep you updated on the progress.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'findings', label: 'Investigation Findings', type: 'textarea', required: true },
      { name: 'recommendedAction', label: 'Recommended Action', type: 'textarea', required: true },
      { name: 'nextSteps', label: 'Next Steps', type: 'textarea', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },

  // Security Templates
  {
    id: 'security-alert',
    title: 'Security Alert Response',
    description: 'Respond to a security concern',
    category: 'security',
    estimatedTime: '15 minutes',
    difficulty: 'hard',
    template: 'Hi {customerName},\n\nWe\'ve received your security concern regarding {securityIssue}.\n\nWe take security very seriously. Here\'s what we\'ve done:\n{actionsTaken}\n\nAdditional recommendations:\n{recommendations}\n\nIf you have any other concerns, please don\'t hesitate to contact us.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'securityIssue', label: 'Security Issue', type: 'textarea', required: true },
      { name: 'actionsTaken', label: 'Actions Taken', type: 'textarea', required: true },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'fraud-detection',
    title: 'Fraud Alert Investigation',
    description: 'Investigate potential fraudulent activity',
    category: 'security',
    estimatedTime: '25 minutes',
    difficulty: 'hard',
    template: 'SECURITY ALERT: Potential fraudulent activity detected\n\nAccount: {customerName}\nBooking: {bookingReference}\nSuspicious activity: {suspiciousActivity}\n\nImmediate actions taken:\n{actionsTaken}\n\nAccount status: {accountStatus}\nRequires further review: {requiresReview}\n\nNext steps:\n{nextSteps}\n\nProcessed by: {adminName}\nTimestamp: {timestamp}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: false },
      { name: 'suspiciousActivity', label: 'Suspicious Activity', type: 'textarea', required: true },
      { name: 'actionsTaken', label: 'Actions Taken', type: 'textarea', required: true },
      { name: 'accountStatus', label: 'Account Status', type: 'select', required: true, options: ['Active', 'Suspended', 'Under Review', 'Blocked'] },
      { name: 'requiresReview', label: 'Requires Further Review', type: 'select', required: true, options: ['Yes', 'No'] },
      { name: 'nextSteps', label: 'Next Steps', type: 'textarea', required: true },
      { name: 'adminName', label: 'Admin Name', type: 'text', required: true },
      { name: 'timestamp', label: 'Timestamp', type: 'text', required: true, placeholder: 'Auto-filled' }
    ]
  },

  // Communication Templates
  {
    id: 'special-requests',
    title: 'Special Request Handling',
    description: 'Handle special customer requests',
    category: 'communication',
    estimatedTime: '8 minutes',
    difficulty: 'medium',
    template: 'Hi {customerName},\n\nThank you for your special request regarding {requestType}.\n\nRequest details: {requestDetails}\n\nI\'m pleased to inform you that {resolution}.\n\n{additionalInformation}\n\nIf you need any further assistance, please let me know.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'requestType', label: 'Request Type', type: 'text', required: true },
      { name: 'requestDetails', label: 'Request Details', type: 'textarea', required: true },
      { name: 'resolution', label: 'Resolution', type: 'textarea', required: true },
      { name: 'additionalInformation', label: 'Additional Information', type: 'textarea', required: false },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },

  // Add more templates for remaining agents...
  // This is a representative sample - in production, you'd have all 70 templates
];