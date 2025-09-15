/**
 * AgentMetrics Integration Tests
 * Ensures that agent performance metrics are correctly displayed and updated
 * Relevant Files:
 * - src/pages/admin/AgentMetrics.tsx
 * - src/test-utils/mocks/supabase.ts
 * - src/test-utils/setup.ts
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AgentMetrics from '@/pages/admin/AgentMetrics';
import { supabase } from '@/integrations/supabase/client';
import { clearAllMocks, setupStandardMocks, createConsoleMock } from '@/test-utils';

describe('AgentMetrics Integration Tests', () => {
  let consoleMock: any;

  beforeEach(() => {
    clearAllMocks();
    setupStandardMocks();
    consoleMock = createConsoleMock();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  const mockTaskData = {
    data: [
      { id: 1, agent_id: 'agent1', status: 'success', duration: 120 },
      { id: 2, agent_id: 'agent1', status: 'failed', duration: 80 },
      { id: 3, agent_id: 'agent2', status: 'success', duration: 150 },
    ],
    error: null,
  };

  it('should load and display task metrics correctly', async () => {
    (supabase.from as vi.Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockTaskData),
    });

    render(<AgentMetrics />);

    await waitFor(() => {
      expect(screen.getByText('agent1')).toBeInTheDocument();
      expect(screen.getByText('agent2')).toBeInTheDocument();
    });
  });

  it('should calculate success rate correctly', async () => {
    (supabase.from as vi.Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockTaskData),
    });

    render(<AgentMetrics />);

    await waitFor(() => {
      // Success rate for agent1: 1 success / 2 total = 50%
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      // Success rate for agent2: 1 success / 1 total = 100%
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });

  it('should display agent breakdown correctly', async () => {
    (supabase.from as vi.Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockTaskData),
    });

    render(<AgentMetrics />);

    await waitFor(() => {
      const agent1Tasks = screen.getAllByText(/agent1/);
      expect(agent1Tasks.length).toBeGreaterThan(0);
    });
  });

  it('should show recent tasks with proper status icons', async () => {
    (supabase.from as vi.Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockTaskData),
    });

    render(<AgentMetrics />);

    await waitFor(() => {
      const successIcons = screen.getAllByTestId('success-icon');
      const failedIcons = screen.getAllByTestId('failed-icon');
      expect(successIcons.length).toBe(2);
      expect(failedIcons.length).toBe(1);
    });
  });

  it('should establish real-time subscription', () => {
    const onMock = vi.fn().mockReturnThis();
    const subscribeMock = vi.fn();
    (supabase.from as vi.Mock).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      on: onMock,
      subscribe: subscribeMock,
    });

    render(<AgentMetrics />);

    expect(supabase.from).toHaveBeenCalledWith('agent_tasks');
  });

  it('should handle loading and error states', async () => {
    (supabase.from as vi.Mock).mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
    });

    render(<AgentMetrics />);

    await waitFor(() => {
        expect(screen.getByText(/error fetching metrics/i)).toBeInTheDocument();
    });
  });

  it('should calculate average completion time correctly', async () => {
    (supabase.from as vi.Mock).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockTaskData),
    });

    render(<AgentMetrics />);

    await waitFor(() => {
        // agent1 avg: (120 + 80) / 2 = 100
        // agent2 avg: 150 / 1 = 150
        expect(screen.getByText('100.0 ms')).toBeInTheDocument();
        expect(screen.getByText('150.0 ms')).toBeInTheDocument();
    });
  });
});