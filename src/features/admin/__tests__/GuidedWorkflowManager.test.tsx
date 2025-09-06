/**
 * Guided Workflow Manager Tests  
 * Tests workflow step progression and validation for admin agents
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { setupStandardMocks, clearAllMocks } from '@/test-utils';
import GuidedWorkflowManager from '../components/GuidedWorkflowManager';
import { agentWorkflows } from '../constants/agentWorkflows';

describe('GuidedWorkflowManager Tests', () => {
  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
  });

  const renderComponent = () => {
    return render(<GuidedWorkflowManager />);
  };

  it('should load all administrative agent workflows', () => {
    renderComponent();

    // Check that all 35 admin agent workflows are available
    expect(Object.keys(agentWorkflows)).toHaveLength(35);
    
    // Verify workflow structure
    Object.entries(agentWorkflows).forEach(([workflowId, workflow]) => {
      expect(workflow).toHaveProperty('title');
      expect(workflow).toHaveProperty('description');
      expect(workflow).toHaveProperty('steps');
      expect(workflow).toHaveProperty('estimatedDuration');
      expect(Array.isArray((workflow as any).steps)).toBe(true);
      expect((workflow as any).steps.length).toBeGreaterThan(0);
      
      // Check step structure
      (workflow as any).steps.forEach((step: any) => {
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('type');
        expect(step).toHaveProperty('validation');
      });
    });
  });

  it('should render workflow selector with all admin workflows', () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
    expect(screen.getByText('Select a workflow to begin...')).toBeInTheDocument();
  });

  it('should start user management workflow correctly', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('User Management Workflow')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User Management Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
      expect(screen.getByText('User Identification')).toBeInTheDocument();
    });
  });

  it('should progress through booking operations workflow steps', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Booking Operations Workflow'));

    // Step 1: Booking Validation
    await waitFor(() => {
      expect(screen.getByText('Booking Validation')).toBeInTheDocument();
      expect(screen.getByLabelText('Booking Reference')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Booking Reference'), {
      target: { value: 'BK12345' }
    });

    const nextBtn = screen.getByText('Next Step');
    fireEvent.click(nextBtn);

    // Step 2: Operation Selection
    await waitFor(() => {
      expect(screen.getByText('Operation Selection')).toBeInTheDocument();
    });
  });

  it('should validate required fields before proceeding', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Refund Processing Workflow'));

    await waitFor(() => {
      const nextBtn = screen.getByText('Next Step');
      fireEvent.click(nextBtn);
    });

    // Should not proceed without required fields
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
  });

  it('should handle fraud detection workflow with security steps', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Fraud Detection Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Transaction Analysis')).toBeInTheDocument();
      expect(screen.getByLabelText('Transaction ID')).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByLabelText('Transaction ID'), {
      target: { value: 'TXN789' }
    });

    const nextBtn = screen.getByText('Next Step');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    });
  });

  it('should show progress indicator correctly', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('System Monitoring Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
      
      // Check progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '20'); // 1/5 = 20%
    });
  });

  it('should handle workflow completion', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Performance Optimization Workflow'));

    // Navigate through all steps
    for (let step = 1; step <= 4; step++) {
      await waitFor(() => {
        expect(screen.getByText(`Step ${step} of 4`)).toBeInTheDocument();
      });

      // Fill any required fields for this step
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        if (input.hasAttribute('required')) {
          fireEvent.change(input, { target: { value: 'test value' } });
        }
      });

      const nextBtn = screen.getByText(step === 4 ? 'Complete Workflow' : 'Next Step');
      fireEvent.click(nextBtn);
    }

    await waitFor(() => {
      expect(screen.getByText('Workflow Completed!')).toBeInTheDocument();
    });
  });

  it('should allow going back to previous steps', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Data Analysis Workflow'));

    // Go to step 2
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Analysis Type'), {
        target: { value: 'Revenue Analysis' }
      });
    });

    fireEvent.click(screen.getByText('Next Step'));

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    });

    // Go back to step 1
    fireEvent.click(screen.getByText('Previous Step'));

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });
  });

  it('should handle different step types correctly', () => {
    renderComponent();

    // Check that workflows contain different step types
    const stepTypes = new Set();
    Object.values(agentWorkflows).forEach(workflow => {
      (workflow as any).steps.forEach((step: any) => {
        stepTypes.add(step.type);
      });
    });

    expect(stepTypes.has('input')).toBe(true);
    expect(stepTypes.has('selection')).toBe(true);
    expect(stepTypes.has('confirmation')).toBe(true);
    expect(stepTypes.has('action')).toBe(true);
  });

  it('should display estimated duration for workflows', () => {
    renderComponent();

    // Check that all workflows have proper duration estimates
    Object.values(agentWorkflows).forEach(workflow => {
      expect((workflow as any).estimatedDuration).toMatch(/\d+\s*(minutes?|hours?)/);
    });
  });

  it('should reset workflow when selecting a new one', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    
    // Start first workflow
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Audit Tracking Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    });

    // Switch to different workflow
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Backup Management Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });
  });
});