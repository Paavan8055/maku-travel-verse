export interface TimelineMilestone {
  id: string;
  title: string;
  description: string;
  date: Date;
  status?: 'completed' | 'current' | 'upcoming';
}

export interface TimelineConfig {
  milestones: TimelineMilestone[];
  launchDate: Date;
}

// Centralized timeline configuration
export const timelineConfig: TimelineConfig = {
  launchDate: new Date('2025-10-23'), // Diwali launch date
  milestones: [
    {
      id: 'concept',
      title: 'Concept & Research',
      description: 'We kicked off in Sydney with a clear aim: trusted, personalised travel for every type of journey.',
      date: new Date('2024-10-01'), // Q4 2024
    },
    {
      id: 'mvp',
      title: 'MVP Delivered',
      description: 'Hotels, flights and Travel Fund Manager integrated with our AI assistant and secure payment pipeline.',
      date: new Date('2025-06-01'), // June 2025
    },
    {
      id: 'launch',
      title: 'Public Launch (Diwali)',
      description: 'Four-way marketplace—families/friends, solo and pet-friendly—powered by provider rotation.',
      date: new Date('2025-10-23'), // 23 Oct 2025
    },
  ],
};

// Helper function to determine milestone status
export function getMilestoneStatus(date: Date, launchDate: Date): 'completed' | 'current' | 'upcoming' {
  const now = new Date();
  const milestoneTime = date.getTime();
  const nowTime = now.getTime();
  const launchTime = launchDate.getTime();

  if (milestoneTime < nowTime) {
    return 'completed';
  } else if (milestoneTime <= launchTime && nowTime >= (milestoneTime - 30 * 24 * 60 * 60 * 1000)) {
    // Current if within 30 days of milestone
    return 'current';
  } else {
    return 'upcoming';
  }
}

// Helper function to format dates for display
export function formatTimelineDate(date: Date): string {
  const now = new Date();
  const year = date.getFullYear();
  const month = date.toLocaleString('default', { month: 'long' });
  
  if (year === now.getFullYear()) {
    return month;
  } else if (date < now) {
    return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${year}`;
  } else {
    return `${date.getDate()} ${month} ${year}`;
  }
}