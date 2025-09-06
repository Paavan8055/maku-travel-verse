/**
 * Agent Metrics Page Integration Tests
 * Tests real-time data loading, task calculations, and subscription functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupStandardMocks, clearAllMocks } from '@/test-utils';
import AgentMetrics from '../AgentMetrics';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock data
const mockTasks = [
  {
    id: '1',
    agent_id: 'booking-assistant',
    intent: 'modify_booking',
    status: 'completed',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:05:00Z',
    progress: 100,
  },
  {
    id: '2',
    agent_id: 'customer-support',
    intent: 'refund_request',
    status: 'failed',
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:02:00Z',
    progress: 50,
    error_message: 'Payment provider error',
  },
  {
    id: '3',
    agent_id: 'booking-assistant',
    intent: 'create_booking',
    status: 'running',
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:01:00Z',
    progress: 75,
  },
];

describe('AgentMetrics Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock successful data fetch
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
      }),
    });

    // Mock channel subscription
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AgentMetrics />
      </QueryClientProvider>
    );
  };

  it('should load and display task metrics correctly', async () => {
    renderComponent();

    // Check that data is being fetched
    expect(mockSupabase.from).toHaveBeenCalledWith('agentic_tasks');

    // Wait for data to load and check overview cards
    await waitFor(() => {
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    });

    // Verify task counts are calculated correctly
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
    });
  });

  it('should calculate success rate correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // 1 completed out of 3 total = 33.3% success rate
      const successElements = screen.getAllByText(/33\.3%/);
      expect(successElements.length).toBeGreaterThan(0);
    });
  });

  it('should display agent breakdown correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('By Agent')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('booking-assistant')).toBeInTheDocument();
      expect(screen.getByText('customer-support')).toBeInTheDocument();
    });
  });

  it('should show recent tasks with proper status icons', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Recent Tasks')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('modify_booking')).toBeInTheDocument();
      expect(screen.getByText('refund_request')).toBeInTheDocument();
      expect(screen.getByText('create_booking')).toBeInTheDocument();
    });
  });

  it('should establish real-time subscription', async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('agentic_tasks_changes');
    });

    const channelMock = mockSupabase.channel.mock.results[0].value;
    expect(channelMock.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'agentic_tasks',
      }),
      expect.any(Function)
    );
  });

  it('should handle loading and error states', async () => {
    // Test loading state
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    });

    renderComponent();
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);

    // Test error state
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });

    queryClient.clear();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/error loading metrics/i)).toBeInTheDocument();
    });
  });

  it('should calculate average completion time correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Check that average completion time is displayed
      // Based on mock data: (5 + 2 + 1) / 3 = 2.67 minutes average
      const avgTimeElements = screen.getAllByText(/2\.7/);
      expect(avgTimeElements.length).toBeGreaterThan(0);
    });
  });
});