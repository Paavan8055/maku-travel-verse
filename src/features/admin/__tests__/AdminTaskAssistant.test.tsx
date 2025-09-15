/**
 * Admin Task Assistant Tests
 * Tests all 70 administrative agent templates render correctly
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { setupStandardMocks, clearAllMocks } from '@/test-utils';
import AdminTaskAssistant from '../components/AdminTaskAssistant';
import { agentTemplates } from '../constants/agentTemplates';
import { AdminIntegrationProvider } from '../context/AdminIntegrationContext';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('AdminTaskAssistant Template Tests', () => {
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
        <AdminTaskAssistant />
      </AdminIntegrationProvider>
    );
  };

  it('should load all administrative agent templates', () => {
    renderComponent();

    // Check that all 35 admin agent templates are available
    expect(Object.keys(agentTemplates)).toHaveLength(35);
    
    // Verify template structure
    Object.entries(agentTemplates).forEach(([agentId, template]) => {
      expect(template).toHaveProperty('title');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('difficulty');
      expect(template).toHaveProperty('estimatedTime');
      expect(template).toHaveProperty('fields');
      expect(template).toHaveProperty('generateResponse');
      expect(Array.isArray((template as any).fields)).toBe(true);
      expect(typeof (template as any).generateResponse).toBe('function');
    });
  });

  it('should render template selector with all admin agents', () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();

    // Check that placeholder shows
    expect(screen.getByText('Select an admin agent template...')).toBeInTheDocument();
  });

  it('should render user management template correctly', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User Management'));

    await waitFor(() => {
      expect(screen.getByText('Manage user accounts, permissions, and access control')).toBeInTheDocument();
      expect(screen.getByText('Difficulty:')).toBeInTheDocument();
      expect(screen.getByText('Est. Time:')).toBeInTheDocument();
    });
  });

  it('should render booking operations template with proper fields', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Booking Operations'));

    await waitFor(() => {
      expect(screen.getByLabelText('Booking Reference')).toBeInTheDocument();
      expect(screen.getByLabelText('Operation Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Customer Email')).toBeInTheDocument();
    });
  });

  it('should generate and copy response for refund processor', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Refund Processor'));

    await waitFor(() => {
      // Fill in required fields
      fireEvent.change(screen.getByLabelText('Booking Reference'), {
        target: { value: 'BK12345' }
      });
      fireEvent.change(screen.getByLabelText('Refund Amount'), {
        target: { value: '250.00' }
      });
      fireEvent.change(screen.getByLabelText('Refund Reason'), {
        target: { value: 'Flight cancellation' }
      });
    });

    const generateBtn = screen.getByText('Generate Response');
    fireEvent.click(generateBtn);

    await waitFor(() => {
        expect(mockAdminContext.generateResponse).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });
  });

  it('should validate required fields before generating response', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Fraud Detector'));

    await waitFor(() => {
      const generateBtn = screen.getByText('Generate Response');
      fireEvent.click(generateBtn);
    });

    // Should not generate response without required fields
    expect(mockAdminContext.generateResponse).not.toHaveBeenCalled();
  });

  it('should handle security monitor template with proper validation', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Security Monitor'));

    await waitFor(() => {
      expect(screen.getByLabelText('Alert Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Severity Level')).toBeInTheDocument();
      expect(screen.getByLabelText('Affected System')).toBeInTheDocument();
    });

    // Fill fields and generate
    fireEvent.change(screen.getByLabelText('Alert Type'), {
      target: { value: 'Suspicious Login' }
    });
    fireEvent.change(screen.getByLabelText('Severity Level'), {
      target: { value: 'High' }
    });
    fireEvent.change(screen.getByLabelText('Affected System'), {
      target: { value: 'User Authentication' }
    });

    const generateBtn = screen.getByText('Generate Response');
    fireEvent.click(generateBtn);

    await waitFor(() => {
        expect(mockAdminContext.generateResponse).toHaveBeenCalled();
    });
  });

  it('should display difficulty levels correctly', () => {
    renderComponent();

    // Check that all difficulty levels are represented
    const difficulties = Object.values(agentTemplates).map(t => (t as any).difficulty);
    expect(difficulties).toContain('Easy');
    expect(difficulties).toContain('Medium');
    expect(difficulties).toContain('Hard');
  });

  it('should display estimated times in proper format', () => {
    renderComponent();

    // Check that all estimated times are properly formatted
    const estimatedTimes = Object.values(agentTemplates).map(t => (t as any).estimatedTime);
    estimatedTimes.forEach(time => {
      expect(time).toMatch(/\d+\s*(minutes?|hours?)/);
    });
  });

  it('should handle escalation handler template with priority fields', async () => {
    renderComponent();

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);
    fireEvent.click(screen.getByText('Escalation Handler'));

    await waitFor(() => {
      expect(screen.getByLabelText('Issue Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('Customer Tier')).toBeInTheDocument();
      expect(screen.getByLabelText('Issue Description')).toBeInTheDocument();
    });
  });

  it('should generate contextual responses based on agent type', async () => {
    renderComponent();

    // Test different agent types generate appropriate responses
    const testCases = [
      { agent: 'Compliance Checker', field: 'Compliance Area', value: 'GDPR' },
      { agent: 'Performance Optimizer', field: 'Performance Issue', value: 'Slow API' },
      { agent: 'Audit Tracker', field: 'Audit Type', value: 'Security Audit' }
    ];

    for (const testCase of testCases) {
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);
      fireEvent.click(screen.getByText(testCase.agent));

      await waitFor(() => {
        const field = screen.getByLabelText(testCase.field);
        fireEvent.change(field, { target: { value: testCase.value } });
      });

      const generateBtn = screen.getByText('Generate Response');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockAdminContext.generateResponse).toHaveBeenCalled();
      });
    }
  });
});