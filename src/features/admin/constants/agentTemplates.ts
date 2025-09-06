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

  
  // Operational Templates
  {
    id: 'escalation-manager',
    title: 'Escalation Management',
    description: 'Escalate issues to higher-level support',
    category: 'operational',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    template: 'ESCALATION REQUIRED\n\nIssue: {issueType}\nCustomer: {customerName}\nOriginal ticket: {ticketId}\n\nEscalation reason:\n{escalationReason}\n\nAttempted resolution:\n{attemptedResolution}\n\nRecommended action:\n{recommendedAction}\n\nEscalated by: {adminName}\nEscalation level: {escalationLevel}',
    fields: [
      { name: 'issueType', label: 'Issue Type', type: 'select', required: true, options: ['Technical', 'Billing', 'Service', 'Complaint', 'Emergency'] },
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'ticketId', label: 'Original Ticket ID', type: 'text', required: true },
      { name: 'escalationReason', label: 'Escalation Reason', type: 'textarea', required: true },
      { name: 'attemptedResolution', label: 'Attempted Resolution', type: 'textarea', required: true },
      { name: 'recommendedAction', label: 'Recommended Action', type: 'textarea', required: true },
      { name: 'escalationLevel', label: 'Escalation Level', type: 'select', required: true, options: ['Level 2', 'Level 3', 'Management', 'Executive'] },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'vip-concierge',
    title: 'VIP Customer Service',
    description: 'Handle VIP customer requests',
    category: 'operational',
    estimatedTime: '20 minutes',
    difficulty: 'medium',
    template: 'Dear {customerName},\n\nAs your dedicated VIP concierge, I\'m personally handling your request for {serviceType}.\n\nRequest details:\n{requestDetails}\n\nI\'ve arranged the following:\n{arrangements}\n\nYour dedicated contact information:\n{contactDetails}\n\nPlease don\'t hesitate to contact me directly for any additional needs.\n\nYour VIP Concierge,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'VIP Customer Name', type: 'text', required: true },
      { name: 'serviceType', label: 'Service Type', type: 'select', required: true, options: ['Travel Arrangements', 'Special Requests', 'Emergency Assistance', 'Event Planning', 'Custom Services'] },
      { name: 'requestDetails', label: 'Request Details', type: 'textarea', required: true },
      { name: 'arrangements', label: 'Arrangements Made', type: 'textarea', required: true },
      { name: 'contactDetails', label: 'Contact Details', type: 'textarea', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'compliance-check',
    title: 'Compliance Verification',
    description: 'Verify regulatory compliance',
    category: 'security',
    estimatedTime: '30 minutes',
    difficulty: 'hard',
    template: 'COMPLIANCE VERIFICATION REPORT\n\nCompliance Type: {complianceType}\nVerification Date: {verificationDate}\nCompliance Officer: {adminName}\n\nVerification Results:\n{verificationResults}\n\nCompliance Status: {complianceStatus}\n\nRequired Actions:\n{requiredActions}\n\nNext Review Date: {nextReviewDate}\n\nDocumentation: {documentationLinks}',
    fields: [
      { name: 'complianceType', label: 'Compliance Type', type: 'select', required: true, options: ['GDPR', 'PCI DSS', 'SOX', 'IATA', 'Local Regulations'] },
      { name: 'verificationDate', label: 'Verification Date', type: 'date', required: true },
      { name: 'verificationResults', label: 'Verification Results', type: 'textarea', required: true },
      { name: 'complianceStatus', label: 'Compliance Status', type: 'select', required: true, options: ['Compliant', 'Non-Compliant', 'Partially Compliant', 'Under Review'] },
      { name: 'requiredActions', label: 'Required Actions', type: 'textarea', required: true },
      { name: 'nextReviewDate', label: 'Next Review Date', type: 'date', required: true },
      { name: 'documentationLinks', label: 'Documentation Links', type: 'textarea', required: false },
      { name: 'adminName', label: 'Compliance Officer', type: 'text', required: true }
    ]
  },
  {
    id: 'data-validation',
    title: 'Data Quality Validation',
    description: 'Validate data integrity and quality',
    category: 'operational',
    estimatedTime: '25 minutes',
    difficulty: 'hard',
    template: 'DATA VALIDATION REPORT\n\nDataset: {datasetName}\nValidation Type: {validationType}\nValidated by: {adminName}\nValidation Date: {validationDate}\n\nValidation Results:\n{validationResults}\n\nData Quality Score: {qualityScore}/100\n\nIssues Found:\n{issuesFound}\n\nRecommendations:\n{recommendations}\n\nNext Validation: {nextValidation}',
    fields: [
      { name: 'datasetName', label: 'Dataset Name', type: 'text', required: true },
      { name: 'validationType', label: 'Validation Type', type: 'select', required: true, options: ['Integrity Check', 'Completeness', 'Accuracy', 'Consistency', 'Full Audit'] },
      { name: 'validationDate', label: 'Validation Date', type: 'date', required: true },
      { name: 'validationResults', label: 'Validation Results', type: 'textarea', required: true },
      { name: 'qualityScore', label: 'Quality Score (0-100)', type: 'number', required: true },
      { name: 'issuesFound', label: 'Issues Found', type: 'textarea', required: true },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { name: 'nextValidation', label: 'Next Validation Date', type: 'date', required: true },
      { name: 'adminName', label: 'Validator Name', type: 'text', required: true }
    ]
  },
  {
    id: 'dispute-resolution',
    title: 'Customer Dispute Resolution',
    description: 'Resolve customer disputes and complaints',
    category: 'operational',
    estimatedTime: '45 minutes',
    difficulty: 'hard',
    template: 'DISPUTE RESOLUTION CASE\n\nCustomer: {customerName}\nDispute ID: {disputeId}\nDispute Type: {disputeType}\nFiled Date: {filedDate}\n\nDispute Details:\n{disputeDetails}\n\nInvestigation Summary:\n{investigationSummary}\n\nResolution:\n{resolution}\n\nCompensation: {compensation}\n\nCustomer Satisfaction: {satisfaction}\n\nResolved by: {adminName}\nResolution Date: {resolutionDate}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'disputeId', label: 'Dispute ID', type: 'text', required: true },
      { name: 'disputeType', label: 'Dispute Type', type: 'select', required: true, options: ['Service Quality', 'Billing Issue', 'Cancellation', 'Refund', 'Booking Error', 'Other'] },
      { name: 'filedDate', label: 'Filed Date', type: 'date', required: true },
      { name: 'disputeDetails', label: 'Dispute Details', type: 'textarea', required: true },
      { name: 'investigationSummary', label: 'Investigation Summary', type: 'textarea', required: true },
      { name: 'resolution', label: 'Resolution', type: 'textarea', required: true },
      { name: 'compensation', label: 'Compensation Offered', type: 'text', required: false },
      { name: 'satisfaction', label: 'Customer Satisfaction', type: 'select', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
      { name: 'resolutionDate', label: 'Resolution Date', type: 'date', required: true },
      { name: 'adminName', label: 'Resolver Name', type: 'text', required: true }
    ]
  },
  {
    id: 'loyalty-adjuster',
    title: 'Loyalty Points Adjustment',
    description: 'Adjust customer loyalty points and status',
    category: 'financial',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    template: 'LOYALTY ADJUSTMENT NOTIFICATION\n\nCustomer: {customerName}\nMembership ID: {membershipId}\nAdjustment Type: {adjustmentType}\nPoints Adjusted: {pointsAdjusted}\nReason: {adjustmentReason}\n\nPrevious Balance: {previousBalance}\nNew Balance: {newBalance}\nMembership Tier: {membershipTier}\n\nAdjustment Notes:\n{adjustmentNotes}\n\nProcessed by: {adminName}\nDate: {adjustmentDate}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'membershipId', label: 'Membership ID', type: 'text', required: true },
      { name: 'adjustmentType', label: 'Adjustment Type', type: 'select', required: true, options: ['Points Added', 'Points Deducted', 'Tier Upgrade', 'Tier Downgrade', 'Bonus Points'] },
      { name: 'pointsAdjusted', label: 'Points Adjusted', type: 'number', required: true },
      { name: 'adjustmentReason', label: 'Adjustment Reason', type: 'textarea', required: true },
      { name: 'previousBalance', label: 'Previous Balance', type: 'number', required: true },
      { name: 'newBalance', label: 'New Balance', type: 'number', required: true },
      { name: 'membershipTier', label: 'Membership Tier', type: 'select', required: true, options: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] },
      { name: 'adjustmentNotes', label: 'Adjustment Notes', type: 'textarea', required: false },
      { name: 'adjustmentDate', label: 'Adjustment Date', type: 'date', required: true },
      { name: 'adminName', label: 'Admin Name', type: 'text', required: true }
    ]
  },
  {
    id: 'credit-manager',
    title: 'Credit Management',
    description: 'Manage customer credits and vouchers',
    category: 'financial',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    template: 'CREDIT MANAGEMENT ACTION\n\nCustomer: {customerName}\nAccount ID: {accountId}\nCredit Type: {creditType}\nAction: {creditAction}\nAmount: {creditAmount}\n\nReason: {creditReason}\nExpiry Date: {expiryDate}\nRestrictions: {restrictions}\n\nPrevious Credit Balance: {previousBalance}\nNew Credit Balance: {newBalance}\n\nProcessed by: {adminName}\nDate: {processDate}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'accountId', label: 'Account ID', type: 'text', required: true },
      { name: 'creditType', label: 'Credit Type', type: 'select', required: true, options: ['Travel Credit', 'Refund Credit', 'Compensation Credit', 'Promotional Credit', 'Goodwill Credit'] },
      { name: 'creditAction', label: 'Credit Action', type: 'select', required: true, options: ['Issue Credit', 'Redeem Credit', 'Extend Expiry', 'Cancel Credit', 'Transfer Credit'] },
      { name: 'creditAmount', label: 'Credit Amount', type: 'number', required: true },
      { name: 'creditReason', label: 'Reason for Credit Action', type: 'textarea', required: true },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
      { name: 'restrictions', label: 'Usage Restrictions', type: 'textarea', required: false },
      { name: 'previousBalance', label: 'Previous Balance', type: 'number', required: true },
      { name: 'newBalance', label: 'New Balance', type: 'number', required: true },
      { name: 'processDate', label: 'Process Date', type: 'date', required: true },
      { name: 'adminName', label: 'Admin Name', type: 'text', required: true }
    ]
  },
  {
    id: 'insurance-processor',
    title: 'Travel Insurance Processing',
    description: 'Process travel insurance claims and policies',
    category: 'financial',
    estimatedTime: '35 minutes',
    difficulty: 'hard',
    template: 'TRAVEL INSURANCE PROCESSING\n\nPolicyholder: {policyholderName}\nPolicy Number: {policyNumber}\nClaim Type: {claimType}\nIncident Date: {incidentDate}\n\nClaim Details:\n{claimDetails}\n\nDocuments Received:\n{documentsReceived}\n\nAssessment:\n{claimAssessment}\n\nDecision: {claimDecision}\nPayout Amount: {payoutAmount}\nProcessing Time: {processingTime}\n\nProcessed by: {adminName}\nDate: {processDate}',
    fields: [
      { name: 'policyholderName', label: 'Policyholder Name', type: 'text', required: true },
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true },
      { name: 'claimType', label: 'Claim Type', type: 'select', required: true, options: ['Trip Cancellation', 'Medical Emergency', 'Lost Luggage', 'Flight Delay', 'Travel Disruption', 'Other'] },
      { name: 'incidentDate', label: 'Incident Date', type: 'date', required: true },
      { name: 'claimDetails', label: 'Claim Details', type: 'textarea', required: true },
      { name: 'documentsReceived', label: 'Documents Received', type: 'textarea', required: true },
      { name: 'claimAssessment', label: 'Claim Assessment', type: 'textarea', required: true },
      { name: 'claimDecision', label: 'Claim Decision', type: 'select', required: true, options: ['Approved', 'Partially Approved', 'Denied', 'Under Review', 'Requires More Info'] },
      { name: 'payoutAmount', label: 'Payout Amount', type: 'number', required: false },
      { name: 'processingTime', label: 'Processing Time', type: 'text', required: true },
      { name: 'processDate', label: 'Process Date', type: 'date', required: true },
      { name: 'adminName', label: 'Processor Name', type: 'text', required: true }
    ]
  },
  {
    id: 'documentation-handler',
    title: 'Documentation Management',
    description: 'Handle document verification and processing',
    category: 'operational',
    estimatedTime: '20 minutes',
    difficulty: 'medium',
    template: 'DOCUMENT PROCESSING REPORT\n\nCustomer: {customerName}\nDocument Type: {documentType}\nDocument ID: {documentId}\nSubmission Date: {submissionDate}\n\nVerification Status: {verificationStatus}\nVerification Notes:\n{verificationNotes}\n\nRequired Actions:\n{requiredActions}\n\nExpiry Date: {expiryDate}\nNext Review: {nextReview}\n\nProcessed by: {adminName}\nDate: {processDate}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'documentType', label: 'Document Type', type: 'select', required: true, options: ['Passport', 'Visa', 'ID Card', 'Driver License', 'Travel Insurance', 'Health Certificate', 'Other'] },
      { name: 'documentId', label: 'Document ID/Number', type: 'text', required: true },
      { name: 'submissionDate', label: 'Submission Date', type: 'date', required: true },
      { name: 'verificationStatus', label: 'Verification Status', type: 'select', required: true, options: ['Verified', 'Rejected', 'Pending', 'Requires Clarification', 'Expired'] },
      { name: 'verificationNotes', label: 'Verification Notes', type: 'textarea', required: true },
      { name: 'requiredActions', label: 'Required Actions', type: 'textarea', required: false },
      { name: 'expiryDate', label: 'Document Expiry Date', type: 'date', required: false },
      { name: 'nextReview', label: 'Next Review Date', type: 'date', required: false },
      { name: 'processDate', label: 'Process Date', type: 'date', required: true },
      { name: 'adminName', label: 'Processor Name', type: 'text', required: true }
    ]
  },
  {
    id: 'policy-enforcer',
    title: 'Policy Enforcement',
    description: 'Enforce company policies and guidelines',
    category: 'operational',
    estimatedTime: '30 minutes',
    difficulty: 'hard',
    template: 'POLICY ENFORCEMENT ACTION\n\nPolicy: {policyName}\nViolation Type: {violationType}\nAccount: {accountDetails}\nViolation Date: {violationDate}\n\nViolation Details:\n{violationDetails}\n\nPolicy Reference:\n{policyReference}\n\nEnforcement Action:\n{enforcementAction}\n\nPenalties Applied:\n{penaltiesApplied}\n\nAppeal Process:\n{appealProcess}\n\nEnforced by: {adminName}\nDate: {enforcementDate}',
    fields: [
      { name: 'policyName', label: 'Policy Name', type: 'text', required: true },
      { name: 'violationType', label: 'Violation Type', type: 'select', required: true, options: ['Terms of Service', 'Privacy Policy', 'Booking Policy', 'Cancellation Policy', 'Code of Conduct', 'Other'] },
      { name: 'accountDetails', label: 'Account Details', type: 'text', required: true },
      { name: 'violationDate', label: 'Violation Date', type: 'date', required: true },
      { name: 'violationDetails', label: 'Violation Details', type: 'textarea', required: true },
      { name: 'policyReference', label: 'Policy Reference', type: 'textarea', required: true },
      { name: 'enforcementAction', label: 'Enforcement Action', type: 'select', required: true, options: ['Warning', 'Temporary Suspension', 'Account Restriction', 'Account Termination', 'Financial Penalty'] },
      { name: 'penaltiesApplied', label: 'Penalties Applied', type: 'textarea', required: false },
      { name: 'appealProcess', label: 'Appeal Process', type: 'textarea', required: true },
      { name: 'enforcementDate', label: 'Enforcement Date', type: 'date', required: true },
      { name: 'adminName', label: 'Enforcer Name', type: 'text', required: true }
    ]
  },
  {
    id: 'review-moderator',
    title: 'Review Moderation',
    description: 'Moderate customer reviews and ratings',
    category: 'operational',
    estimatedTime: '15 minutes',
    difficulty: 'medium',
    template: 'REVIEW MODERATION DECISION\n\nReview ID: {reviewId}\nReviewer: {reviewerName}\nService/Product: {serviceProduct}\nRating: {rating}/5\nSubmission Date: {submissionDate}\n\nReview Content:\n{reviewContent}\n\nModeration Decision: {moderationDecision}\nReason: {moderationReason}\n\nAction Taken:\n{actionTaken}\n\nModerated by: {adminName}\nDate: {moderationDate}',
    fields: [
      { name: 'reviewId', label: 'Review ID', type: 'text', required: true },
      { name: 'reviewerName', label: 'Reviewer Name', type: 'text', required: true },
      { name: 'serviceProduct', label: 'Service/Product', type: 'text', required: true },
      { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
      { name: 'submissionDate', label: 'Submission Date', type: 'date', required: true },
      { name: 'reviewContent', label: 'Review Content', type: 'textarea', required: true },
      { name: 'moderationDecision', label: 'Moderation Decision', type: 'select', required: true, options: ['Approved', 'Rejected', 'Requires Editing', 'Flagged for Review', 'Pending'] },
      { name: 'moderationReason', label: 'Moderation Reason', type: 'textarea', required: true },
      { name: 'actionTaken', label: 'Action Taken', type: 'textarea', required: true },
      { name: 'moderationDate', label: 'Moderation Date', type: 'date', required: true },
      { name: 'adminName', label: 'Moderator Name', type: 'text', required: true }
    ]
  },
  {
    id: 'content-manager',
    title: 'Content Management',
    description: 'Manage website and marketing content',
    category: 'operational',
    estimatedTime: '25 minutes',
    difficulty: 'medium',
    template: 'CONTENT MANAGEMENT UPDATE\n\nContent Type: {contentType}\nContent ID: {contentId}\nTitle: {contentTitle}\nUpdate Type: {updateType}\n\nContent Changes:\n{contentChanges}\n\nPublish Date: {publishDate}\nExpiry Date: {expiryDate}\nTarget Audience: {targetAudience}\n\nSEO Keywords: {seoKeywords}\nApproval Status: {approvalStatus}\n\nUpdated by: {adminName}\nDate: {updateDate}',
    fields: [
      { name: 'contentType', label: 'Content Type', type: 'select', required: true, options: ['Blog Post', 'Destination Guide', 'Product Description', 'Marketing Material', 'Help Article', 'Policy Document'] },
      { name: 'contentId', label: 'Content ID', type: 'text', required: true },
      { name: 'contentTitle', label: 'Content Title', type: 'text', required: true },
      { name: 'updateType', label: 'Update Type', type: 'select', required: true, options: ['New Content', 'Content Update', 'Content Revision', 'Content Removal', 'SEO Update'] },
      { name: 'contentChanges', label: 'Content Changes', type: 'textarea', required: true },
      { name: 'publishDate', label: 'Publish Date', type: 'date', required: true },
      { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: false },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
      { name: 'seoKeywords', label: 'SEO Keywords', type: 'text', required: false },
      { name: 'approvalStatus', label: 'Approval Status', type: 'select', required: true, options: ['Draft', 'Pending Approval', 'Approved', 'Published', 'Archived'] },
      { name: 'updateDate', label: 'Update Date', type: 'date', required: true },
      { name: 'adminName', label: 'Content Manager', type: 'text', required: true }
    ]
  },
  {
    id: 'supplier-liaison',
    title: 'Supplier Relationship Management',
    description: 'Manage supplier relationships and communications',
    category: 'operational',
    estimatedTime: '40 minutes',
    difficulty: 'hard',
    template: 'SUPPLIER INTERACTION REPORT\n\nSupplier: {supplierName}\nSupplier ID: {supplierId}\nContact Person: {contactPerson}\nInteraction Type: {interactionType}\nDate: {interactionDate}\n\nInteraction Summary:\n{interactionSummary}\n\nDiscussed Items:\n{discussedItems}\n\nAgreements Reached:\n{agreementsReached}\n\nAction Items:\n{actionItems}\n\nNext Follow-up: {nextFollowup}\n\nManaged by: {adminName}',
    fields: [
      { name: 'supplierName', label: 'Supplier Name', type: 'text', required: true },
      { name: 'supplierId', label: 'Supplier ID', type: 'text', required: true },
      { name: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
      { name: 'interactionType', label: 'Interaction Type', type: 'select', required: true, options: ['Contract Negotiation', 'Performance Review', 'Issue Resolution', 'New Partnership', 'Regular Check-in', 'Emergency Contact'] },
      { name: 'interactionDate', label: 'Interaction Date', type: 'date', required: true },
      { name: 'interactionSummary', label: 'Interaction Summary', type: 'textarea', required: true },
      { name: 'discussedItems', label: 'Discussed Items', type: 'textarea', required: true },
      { name: 'agreementsReached', label: 'Agreements Reached', type: 'textarea', required: false },
      { name: 'actionItems', label: 'Action Items', type: 'textarea', required: true },
      { name: 'nextFollowup', label: 'Next Follow-up Date', type: 'date', required: true },
      { name: 'adminName', label: 'Liaison Manager', type: 'text', required: true }
    ]
  },
  {
    id: 'quality-auditor',
    title: 'Quality Assurance Audit',
    description: 'Conduct quality assurance audits and assessments',
    category: 'operational',
    estimatedTime: '60 minutes',
    difficulty: 'hard',
    template: 'QUALITY ASSURANCE AUDIT REPORT\n\nAudit Type: {auditType}\nAudit Scope: {auditScope}\nAudit Date: {auditDate}\nAuditor: {adminName}\n\nAreas Audited:\n{areasAudited}\n\nFindings:\n{auditFindings}\n\nCompliance Score: {complianceScore}/100\n\nRecommendations:\n{recommendations}\n\nCorrective Actions Required:\n{correctiveActions}\n\nNext Audit Date: {nextAuditDate}\n\nAudit Status: {auditStatus}',
    fields: [
      { name: 'auditType', label: 'Audit Type', type: 'select', required: true, options: ['Service Quality', 'Process Compliance', 'System Security', 'Customer Experience', 'Supplier Performance', 'Financial Controls'] },
      { name: 'auditScope', label: 'Audit Scope', type: 'textarea', required: true },
      { name: 'auditDate', label: 'Audit Date', type: 'date', required: true },
      { name: 'areasAudited', label: 'Areas Audited', type: 'textarea', required: true },
      { name: 'auditFindings', label: 'Audit Findings', type: 'textarea', required: true },
      { name: 'complianceScore', label: 'Compliance Score (0-100)', type: 'number', required: true },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { name: 'correctiveActions', label: 'Corrective Actions Required', type: 'textarea', required: true },
      { name: 'nextAuditDate', label: 'Next Audit Date', type: 'date', required: true },
      { name: 'auditStatus', label: 'Audit Status', type: 'select', required: true, options: ['Completed', 'In Progress', 'Pending Review', 'Corrective Actions Required'] },
      { name: 'adminName', label: 'Auditor Name', type: 'text', required: true }
    ]
  },
  {
    id: 'training-coordinator',
    title: 'Training Coordination',
    description: 'Coordinate staff training and development',
    category: 'operational',
    estimatedTime: '35 minutes',
    difficulty: 'medium',
    template: 'TRAINING COORDINATION PLAN\n\nTraining Program: {trainingProgram}\nTraining Type: {trainingType}\nTarget Audience: {targetAudience}\nScheduled Date: {scheduledDate}\n\nTraining Objectives:\n{trainingObjectives}\n\nTraining Content:\n{trainingContent}\n\nTrainer: {trainerName}\nDuration: {trainingDuration}\nLocation: {trainingLocation}\n\nRequired Materials:\n{requiredMaterials}\n\nAttendees: {attendeesCount}\n\nCoordinated by: {adminName}',
    fields: [
      { name: 'trainingProgram', label: 'Training Program', type: 'text', required: true },
      { name: 'trainingType', label: 'Training Type', type: 'select', required: true, options: ['Onboarding', 'Skill Development', 'Compliance Training', 'Product Training', 'Customer Service', 'Emergency Procedures'] },
      { name: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true },
      { name: 'trainingObjectives', label: 'Training Objectives', type: 'textarea', required: true },
      { name: 'trainingContent', label: 'Training Content', type: 'textarea', required: true },
      { name: 'trainerName', label: 'Trainer Name', type: 'text', required: true },
      { name: 'trainingDuration', label: 'Training Duration', type: 'text', required: true },
      { name: 'trainingLocation', label: 'Training Location', type: 'text', required: true },
      { name: 'requiredMaterials', label: 'Required Materials', type: 'textarea', required: false },
      { name: 'attendeesCount', label: 'Number of Attendees', type: 'number', required: true },
      { name: 'adminName', label: 'Training Coordinator', type: 'text', required: true }
    ]
  },
  {
    id: 'schedule-manager',
    title: 'Schedule Management',
    description: 'Manage staff schedules and resource allocation',
    category: 'operational',
    estimatedTime: '30 minutes',
    difficulty: 'medium',
    template: 'SCHEDULE MANAGEMENT UPDATE\n\nSchedule Period: {schedulePeriod}\nDepartment: {department}\nSchedule Type: {scheduleType}\nEffective Date: {effectiveDate}\n\nSchedule Changes:\n{scheduleChanges}\n\nStaff Affected: {staffAffected}\nResource Requirements: {resourceRequirements}\n\nShift Coverage: {shiftCoverage}\nOvertime Requirements: {overtimeRequirements}\n\nApproval Status: {approvalStatus}\n\nScheduled by: {adminName}\nDate: {scheduleDate}',
    fields: [
      { name: 'schedulePeriod', label: 'Schedule Period', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'select', required: true, options: ['Customer Service', 'Operations', 'Finance', 'IT', 'Marketing', 'Management'] },
      { name: 'scheduleType', label: 'Schedule Type', type: 'select', required: true, options: ['Regular Schedule', 'Holiday Schedule', 'Emergency Coverage', 'Project Schedule', 'Training Schedule'] },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { name: 'scheduleChanges', label: 'Schedule Changes', type: 'textarea', required: true },
      { name: 'staffAffected', label: 'Staff Affected', type: 'textarea', required: true },
      { name: 'resourceRequirements', label: 'Resource Requirements', type: 'textarea', required: true },
      { name: 'shiftCoverage', label: 'Shift Coverage', type: 'textarea', required: true },
      { name: 'overtimeRequirements', label: 'Overtime Requirements', type: 'text', required: false },
      { name: 'approvalStatus', label: 'Approval Status', type: 'select', required: true, options: ['Draft', 'Pending Approval', 'Approved', 'Active', 'Archived'] },
      { name: 'scheduleDate', label: 'Schedule Date', type: 'date', required: true },
      { name: 'adminName', label: 'Schedule Manager', type: 'text', required: true }
    ]
  },
  {
    id: 'inventory-controller',
    title: 'Inventory Control Management',
    description: 'Control and manage inventory levels',
    category: 'operational',
    estimatedTime: '25 minutes',
    difficulty: 'medium',
    template: 'INVENTORY CONTROL REPORT\n\nInventory Type: {inventoryType}\nLocation: {inventoryLocation}\nControl Date: {controlDate}\nController: {adminName}\n\nCurrent Stock Levels:\n{currentStock}\n\nStock Movements:\n{stockMovements}\n\nReorder Points: {reorderPoints}\nStock Alerts: {stockAlerts}\n\nRecommended Actions:\n{recommendedActions}\n\nNext Review Date: {nextReviewDate}\nInventory Value: {inventoryValue}',
    fields: [
      { name: 'inventoryType', label: 'Inventory Type', type: 'select', required: true, options: ['Office Supplies', 'Marketing Materials', 'Equipment', 'Software Licenses', 'Gift Cards', 'Promotional Items'] },
      { name: 'inventoryLocation', label: 'Inventory Location', type: 'text', required: true },
      { name: 'controlDate', label: 'Control Date', type: 'date', required: true },
      { name: 'currentStock', label: 'Current Stock Levels', type: 'textarea', required: true },
      { name: 'stockMovements', label: 'Stock Movements', type: 'textarea', required: true },
      { name: 'reorderPoints', label: 'Reorder Points', type: 'textarea', required: true },
      { name: 'stockAlerts', label: 'Stock Alerts', type: 'textarea', required: false },
      { name: 'recommendedActions', label: 'Recommended Actions', type: 'textarea', required: true },
      { name: 'nextReviewDate', label: 'Next Review Date', type: 'date', required: true },
      { name: 'inventoryValue', label: 'Total Inventory Value', type: 'number', required: true },
      { name: 'adminName', label: 'Inventory Controller', type: 'text', required: true }
    ]
  },
  {
    id: 'pricing-analyst',
    title: 'Pricing Analysis',
    description: 'Analyze pricing strategies and market trends',
    category: 'financial',
    estimatedTime: '45 minutes',
    difficulty: 'hard',
    template: 'PRICING ANALYSIS REPORT\n\nAnalysis Period: {analysisPeriod}\nProduct/Service: {productService}\nMarket Segment: {marketSegment}\nAnalyst: {adminName}\n\nMarket Analysis:\n{marketAnalysis}\n\nCompetitor Pricing:\n{competitorPricing}\n\nDemand Trends:\n{demandTrends}\n\nRevenue Impact:\n{revenueImpact}\n\nPricing Recommendations:\n{pricingRecommendations}\n\nImplementation Timeline: {implementationTimeline}\nExpected ROI: {expectedROI}',
    fields: [
      { name: 'analysisPeriod', label: 'Analysis Period', type: 'text', required: true },
      { name: 'productService', label: 'Product/Service', type: 'text', required: true },
      { name: 'marketSegment', label: 'Market Segment', type: 'select', required: true, options: ['Budget', 'Mid-range', 'Premium', 'Luxury', 'Family', 'Business', 'Solo Travelers'] },
      { name: 'marketAnalysis', label: 'Market Analysis', type: 'textarea', required: true },
      { name: 'competitorPricing', label: 'Competitor Pricing', type: 'textarea', required: true },
      { name: 'demandTrends', label: 'Demand Trends', type: 'textarea', required: true },
      { name: 'revenueImpact', label: 'Revenue Impact', type: 'textarea', required: true },
      { name: 'pricingRecommendations', label: 'Pricing Recommendations', type: 'textarea', required: true },
      { name: 'implementationTimeline', label: 'Implementation Timeline', type: 'text', required: true },
      { name: 'expectedROI', label: 'Expected ROI (%)', type: 'number', required: true },
      { name: 'adminName', label: 'Pricing Analyst', type: 'text', required: true }
    ]
  },
  {
    id: 'commission-calculator',
    title: 'Commission Calculation',
    description: 'Calculate and manage commission payments',
    category: 'financial',
    estimatedTime: '20 minutes',
    difficulty: 'medium',
    template: 'COMMISSION CALCULATION REPORT\n\nPeriod: {commissionPeriod}\nAgent/Partner: {agentPartner}\nCommission Type: {commissionType}\nCalculation Date: {calculationDate}\n\nSales Summary:\n{salesSummary}\n\nCommission Rate: {commissionRate}%\nGross Commission: {grossCommission}\nDeductions: {deductions}\nNet Commission: {netCommission}\n\nPayment Method: {paymentMethod}\nPayment Date: {paymentDate}\n\nCalculated by: {adminName}',
    fields: [
      { name: 'commissionPeriod', label: 'Commission Period', type: 'text', required: true },
      { name: 'agentPartner', label: 'Agent/Partner Name', type: 'text', required: true },
      { name: 'commissionType', label: 'Commission Type', type: 'select', required: true, options: ['Sales Commission', 'Referral Commission', 'Override Commission', 'Bonus Commission', 'Performance Commission'] },
      { name: 'calculationDate', label: 'Calculation Date', type: 'date', required: true },
      { name: 'salesSummary', label: 'Sales Summary', type: 'textarea', required: true },
      { name: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true },
      { name: 'grossCommission', label: 'Gross Commission', type: 'number', required: true },
      { name: 'deductions', label: 'Deductions', type: 'number', required: false },
      { name: 'netCommission', label: 'Net Commission', type: 'number', required: true },
      { name: 'paymentMethod', label: 'Payment Method', type: 'select', required: true, options: ['Bank Transfer', 'Check', 'PayPal', 'Direct Deposit', 'Cash'] },
      { name: 'paymentDate', label: 'Payment Date', type: 'date', required: true },
      { name: 'adminName', label: 'Calculator Name', type: 'text', required: true }
    ]
  },
  {
    id: 'tax-processor',
    title: 'Tax Processing',
    description: 'Process tax calculations and compliance',
    category: 'financial',
    estimatedTime: '40 minutes',
    difficulty: 'hard',
    template: 'TAX PROCESSING REPORT\n\nTax Period: {taxPeriod}\nTax Type: {taxType}\nJurisdiction: {jurisdiction}\nProcessing Date: {processingDate}\n\nTaxable Amount: {taxableAmount}\nTax Rate: {taxRate}%\nTax Due: {taxDue}\n\nTax Calculations:\n{taxCalculations}\n\nCompliance Status: {complianceStatus}\nFiling Requirements:\n{filingRequirements}\n\nPayment Status: {paymentStatus}\nDue Date: {dueDate}\n\nProcessed by: {adminName}',
    fields: [
      { name: 'taxPeriod', label: 'Tax Period', type: 'text', required: true },
      { name: 'taxType', label: 'Tax Type', type: 'select', required: true, options: ['Sales Tax', 'Service Tax', 'VAT', 'Income Tax', 'Property Tax', 'Other'] },
      { name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true },
      { name: 'processingDate', label: 'Processing Date', type: 'date', required: true },
      { name: 'taxableAmount', label: 'Taxable Amount', type: 'number', required: true },
      { name: 'taxRate', label: 'Tax Rate (%)', type: 'number', required: true },
      { name: 'taxDue', label: 'Tax Due', type: 'number', required: true },
      { name: 'taxCalculations', label: 'Tax Calculations', type: 'textarea', required: true },
      { name: 'complianceStatus', label: 'Compliance Status', type: 'select', required: true, options: ['Compliant', 'Non-Compliant', 'Under Review', 'Exempted'] },
      { name: 'filingRequirements', label: 'Filing Requirements', type: 'textarea', required: true },
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', required: true, options: ['Paid', 'Pending', 'Overdue', 'Partially Paid'] },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { name: 'adminName', label: 'Tax Processor', type: 'text', required: true }
    ]
  },
  {
    id: 'report-generator',
    title: 'Report Generation',
    description: 'Generate business reports and analytics',
    category: 'operational',
    estimatedTime: '35 minutes',
    difficulty: 'medium',
    template: 'REPORT GENERATION SUMMARY\n\nReport Type: {reportType}\nReport Period: {reportPeriod}\nGenerated Date: {generatedDate}\nGenerated by: {adminName}\n\nReport Parameters:\n{reportParameters}\n\nKey Metrics:\n{keyMetrics}\n\nData Sources: {dataSources}\nReport Recipients: {reportRecipients}\n\nDelivery Method: {deliveryMethod}\nNext Generation: {nextGeneration}\n\nReport Status: {reportStatus}',
    fields: [
      { name: 'reportType', label: 'Report Type', type: 'select', required: true, options: ['Financial Report', 'Sales Report', 'Customer Analytics', 'Operational Report', 'Performance Report', 'Compliance Report'] },
      { name: 'reportPeriod', label: 'Report Period', type: 'text', required: true },
      { name: 'generatedDate', label: 'Generated Date', type: 'date', required: true },
      { name: 'reportParameters', label: 'Report Parameters', type: 'textarea', required: true },
      { name: 'keyMetrics', label: 'Key Metrics', type: 'textarea', required: true },
      { name: 'dataSources', label: 'Data Sources', type: 'textarea', required: true },
      { name: 'reportRecipients', label: 'Report Recipients', type: 'textarea', required: true },
      { name: 'deliveryMethod', label: 'Delivery Method', type: 'select', required: true, options: ['Email', 'Dashboard', 'File Download', 'Printed Copy', 'API Endpoint'] },
      { name: 'nextGeneration', label: 'Next Generation Date', type: 'date', required: false },
      { name: 'reportStatus', label: 'Report Status', type: 'select', required: true, options: ['Generated', 'Delivered', 'Pending', 'Failed', 'Scheduled'] },
      { name: 'adminName', label: 'Report Generator', type: 'text', required: true }
    ]
  },
  {
    id: 'backup-coordinator',
    title: 'Backup Coordination',
    description: 'Coordinate system backups and recovery',
    category: 'operational',
    estimatedTime: '30 minutes',
    difficulty: 'medium',
    template: 'BACKUP COORDINATION REPORT\n\nBackup Type: {backupType}\nBackup Date: {backupDate}\nSystem/Database: {systemDatabase}\nCoordinator: {adminName}\n\nBackup Status: {backupStatus}\nBackup Size: {backupSize}\nBackup Location: {backupLocation}\n\nVerification Status: {verificationStatus}\nRecovery Test: {recoveryTest}\n\nRetention Period: {retentionPeriod}\nNext Backup: {nextBackup}\n\nIssues Encountered:\n{issuesEncountered}',
    fields: [
      { name: 'backupType', label: 'Backup Type', type: 'select', required: true, options: ['Full Backup', 'Incremental Backup', 'Differential Backup', 'Transaction Log Backup', 'System Backup'] },
      { name: 'backupDate', label: 'Backup Date', type: 'date', required: true },
      { name: 'systemDatabase', label: 'System/Database', type: 'text', required: true },
      { name: 'backupStatus', label: 'Backup Status', type: 'select', required: true, options: ['Successful', 'Failed', 'Partial', 'In Progress', 'Scheduled'] },
      { name: 'backupSize', label: 'Backup Size', type: 'text', required: true },
      { name: 'backupLocation', label: 'Backup Location', type: 'text', required: true },
      { name: 'verificationStatus', label: 'Verification Status', type: 'select', required: true, options: ['Verified', 'Failed Verification', 'Pending', 'Not Required'] },
      { name: 'recoveryTest', label: 'Recovery Test', type: 'select', required: true, options: ['Passed', 'Failed', 'Pending', 'Not Performed'] },
      { name: 'retentionPeriod', label: 'Retention Period', type: 'text', required: true },
      { name: 'nextBackup', label: 'Next Backup Date', type: 'date', required: true },
      { name: 'issuesEncountered', label: 'Issues Encountered', type: 'textarea', required: false },
      { name: 'adminName', label: 'Backup Coordinator', type: 'text', required: true }
    ]
  },
  {
    id: 'integration-manager',
    title: 'Integration Management',
    description: 'Manage system integrations and APIs',
    category: 'operational',
    estimatedTime: '50 minutes',
    difficulty: 'hard',
    template: 'INTEGRATION MANAGEMENT REPORT\n\nIntegration: {integrationName}\nIntegration Type: {integrationType}\nStatus: {integrationStatus}\nManagement Date: {managementDate}\n\nIntegration Details:\n{integrationDetails}\n\nPerformance Metrics:\n{performanceMetrics}\n\nIssues Identified:\n{issuesIdentified}\n\nResolution Actions:\n{resolutionActions}\n\nUptime: {uptime}%\nNext Review: {nextReview}\n\nManaged by: {adminName}',
    fields: [
      { name: 'integrationName', label: 'Integration Name', type: 'text', required: true },
      { name: 'integrationType', label: 'Integration Type', type: 'select', required: true, options: ['API Integration', 'Database Integration', 'Payment Gateway', 'Third-party Service', 'Booking System', 'CRM Integration'] },
      { name: 'integrationStatus', label: 'Integration Status', type: 'select', required: true, options: ['Active', 'Inactive', 'Maintenance', 'Error', 'Testing', 'Deprecated'] },
      { name: 'managementDate', label: 'Management Date', type: 'date', required: true },
      { name: 'integrationDetails', label: 'Integration Details', type: 'textarea', required: true },
      { name: 'performanceMetrics', label: 'Performance Metrics', type: 'textarea', required: true },
      { name: 'issuesIdentified', label: 'Issues Identified', type: 'textarea', required: false },
      { name: 'resolutionActions', label: 'Resolution Actions', type: 'textarea', required: false },
      { name: 'uptime', label: 'Uptime (%)', type: 'number', required: true },
      { name: 'nextReview', label: 'Next Review Date', type: 'date', required: true },
      { name: 'adminName', label: 'Integration Manager', type: 'text', required: true }
    ]
  },
  {
    id: 'api-monitor',
    title: 'API Monitoring',
    description: 'Monitor API performance and health',
    category: 'operational',
    estimatedTime: '20 minutes',
    difficulty: 'medium',
    template: 'API MONITORING REPORT\n\nAPI Name: {apiName}\nAPI Version: {apiVersion}\nMonitoring Period: {monitoringPeriod}\nMonitor: {adminName}\n\nHealth Status: {healthStatus}\nResponse Time: {responseTime}ms\nUptime: {uptime}%\nError Rate: {errorRate}%\n\nRequests Processed: {requestsProcessed}\nFailed Requests: {failedRequests}\n\nPerformance Issues:\n{performanceIssues}\n\nRecommendations:\n{recommendations}\n\nNext Check: {nextCheck}',
    fields: [
      { name: 'apiName', label: 'API Name', type: 'text', required: true },
      { name: 'apiVersion', label: 'API Version', type: 'text', required: true },
      { name: 'monitoringPeriod', label: 'Monitoring Period', type: 'text', required: true },
      { name: 'healthStatus', label: 'Health Status', type: 'select', required: true, options: ['Healthy', 'Warning', 'Critical', 'Down', 'Maintenance'] },
      { name: 'responseTime', label: 'Average Response Time (ms)', type: 'number', required: true },
      { name: 'uptime', label: 'Uptime (%)', type: 'number', required: true },
      { name: 'errorRate', label: 'Error Rate (%)', type: 'number', required: true },
      { name: 'requestsProcessed', label: 'Total Requests Processed', type: 'number', required: true },
      { name: 'failedRequests', label: 'Failed Requests', type: 'number', required: true },
      { name: 'performanceIssues', label: 'Performance Issues', type: 'textarea', required: false },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { name: 'nextCheck', label: 'Next Check Date', type: 'date', required: true },
      { name: 'adminName', label: 'API Monitor', type: 'text', required: true }
    ]
  }
];