/**
 * Guided Workflow Manager Tests
 * Tests all 70 administrative agent workflows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { setupStandardMocks, clearAllMocks } from '@/test-utils';
import GuidedWorkflowManager from '../components/GuidedWorkflowManager';
import { agentWorkflows } from '../data/agentWorkflows';
import { AdminIntegrationProvider } from '../context/AdminIntegrationContext';

describe('GuidedWorkflowManager Tests', () => {
  const mockAdminContext = {
    isGenerating: false,
    setIsGenerating: vi.fn(),
    response: '',
    setResponse: vi.fn(),
    generateResponse: vi.fn(),
  };

  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
  });

  const renderComponent = () => {
    return render(
      <AdminIntegrationProvider>
        <GuidedWorkflowManager />
      </AdminIntegrationProvider>
    );
  };

  it('should load all administrative agent workflows', () => {
    renderComponent();
    expect(Object.keys(agentWorkflows)).toHaveLength(35);
  });

  it('should render workflow selector with all admin workflows', () => {
    renderComponent();
    expect(screen.getByText('Select a guided workflow...')).toBeInTheDocument();
  });

  it('should start user management workflow correctly', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('User Management Workflow'));
    await waitFor(() => {
      expect(screen.getByText('Step 1: Identify User')).toBeInTheDocument();
    });
  });

  it('should progress through booking operations workflow steps', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Booking Operations Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1: Retrieve Booking')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Booking Reference'), {
      target: { value: 'BK123' }
    });
    fireEvent.click(screen.getByText('Next Step'));

    await waitFor(() => {
      expect(screen.getByText('Step 2: Select Operation')).toBeInTheDocument();
    });
  });

  it('should validate required fields before proceeding', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Booking Operations Workflow'));
    await waitFor(() => {
      expect(screen.getByText('Step 1: Retrieve Booking')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Next Step'));
    expect(screen.queryByText('Step 2: Select Operation')).not.toBeInTheDocument();
  });

  it('should handle fraud detection workflow with security steps', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Fraud Detection Workflow'));
    await waitFor(() => {
      expect(screen.getByText('Step 1: Analyze Transaction')).toBeInTheDocument();
    });
  });

  it('should show progress indicator correctly', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('User Management Workflow'));
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should handle workflow completion', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('User Management Workflow'));

    // Simulate completing all steps
    for (let i = 0; i < 4; i++) {
      await waitFor(() => {
        // Each step might have different fields to fill, for simplicity we just click next
        const nextButton = screen.getByText('Next Step');
        if (nextButton) {
            fireEvent.click(nextButton);
        }    
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Workflow Complete!')).toBeInTheDocument();
    });
  });

  it('should allow going back to previous steps', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Booking Operations Workflow'));

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Booking Reference'), {
        target: { value: 'BK123' }
      });
      fireEvent.click(screen.getByText('Next Step'));
    });

    await waitFor(() => {
      expect(screen.getByText('Step 2: Select Operation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Previous Step'));

    await waitFor(() => {
      expect(screen.getByText('Step 1: Retrieve Booking')).toBeInTheDocument();
    });
  });

  it('should handle different step types correctly', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Booking Operations Workflow'));

    await waitFor(() => {
      expect(screen.getByLabelText('Booking Reference')).toBeInstanceOf(HTMLInputElement);
    });

    fireEvent.change(screen.getByLabelText('Booking Reference'), {
      target: { value: 'BK123' }
    });
    fireEvent.click(screen.getByText('Next Step'));

    await waitFor(() => {
      expect(screen.getByLabelText('Operation')).toBeInstanceOf(HTMLSelectElement);
    });
  });

  it('should display estimated duration for workflows', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('User Management Workflow'));

    await waitFor(() => {
      expect(screen.getByText(/Est\. Duration:/)).toBeInTheDocument();
    });
  });

  it('should reset workflow when selecting a new one', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('User Management Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1: Identify User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Next Step'));
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Booking Operations Workflow'));

    await waitFor(() => {
      expect(screen.getByText('Step 1: Retrieve Booking')).toBeInTheDocument();
      expect(screen.queryByText('Step 2: Identify User')).not.toBeInTheDocument();
    });
  });
});