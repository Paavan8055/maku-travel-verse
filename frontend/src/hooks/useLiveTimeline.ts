import { useMemo } from 'react';
import { timelineConfig, getMilestoneStatus, formatTimelineDate, type TimelineMilestone } from '@/lib/timeline-config';

export interface LiveTimelineMilestone extends TimelineMilestone {
  status: 'completed' | 'current' | 'upcoming';
  formattedDate: string;
}

export interface LiveTimelineData {
  milestones: LiveTimelineMilestone[];
  launchDate: Date;
  isPreLaunch: boolean;
  isPostLaunch: boolean;
  daysToLaunch: number;
}

export function useLiveTimeline(): LiveTimelineData {
  return useMemo(() => {
    const now = new Date();
    const launchTime = timelineConfig.launchDate.getTime();
    const nowTime = now.getTime();
    
    const daysToLaunch = Math.ceil((launchTime - nowTime) / (1000 * 60 * 60 * 24));
    
    const enrichedMilestones: LiveTimelineMilestone[] = timelineConfig.milestones.map(milestone => ({
      ...milestone,
      status: getMilestoneStatus(milestone.date, timelineConfig.launchDate),
      formattedDate: formatTimelineDate(milestone.date),
    }));

    return {
      milestones: enrichedMilestones,
      launchDate: timelineConfig.launchDate,
      isPreLaunch: nowTime < launchTime,
      isPostLaunch: nowTime >= launchTime,
      daysToLaunch,
    };
  }, []); // No dependencies needed since dates are relatively static
}