// Helper functions for the enhanced Master AI Bot system

export const fetchSystemData = async (supabase: any) => {
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    const [bookings, tasks, botResults] = await Promise.all([
      supabase.from('bookings').select('*').gte('created_at', startDate).limit(100),
      supabase.from('agentic_tasks').select('*').gte('created_at', startDate).limit(50),
      supabase.from('bot_result_aggregation').select('*').gte('created_at', startDate).limit(50)
    ]);

    return {
      bookings: bookings.data || [],
      tasks: tasks.data || [],
      bot_results: botResults.data || [],
      metrics: {
        total_bookings: bookings.data?.length || 0,
        task_success_rate: tasks.data ? 
          Math.round((tasks.data.filter((t: any) => t.status === 'completed').length / tasks.data.length) * 100) : 0,
        avg_booking_value: bookings.data ? 
          bookings.data.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) / bookings.data.length : 0
      }
    };
  } catch (error) {
    console.error('Error fetching system data:', error);
    return { error: 'Data fetch failed' };
  }
};

export const extractRecommendations = (content: string): string[] => {
  const recommendationsMatch = content.match(/(?:recommendations?|suggestions?):\s*\n?((?:[-•*]\s*.+\n?)+)/i);
  
  if (recommendationsMatch) {
    return recommendationsMatch[1]
      .split(/[-•*]\s*/)
      .filter(rec => rec.trim())
      .map(rec => rec.trim().replace(/\n/g, ' '))
      .slice(0, 5);
  }

  return [
    'Continue monitoring system performance',
    'Review and optimize key metrics',
    'Implement suggested improvements'
  ];
};