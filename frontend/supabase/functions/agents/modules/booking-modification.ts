import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'booking-modification');
  
  try {
    const { bookingId, modificationType, newDetails } = params;
    
    if (!bookingId || !modificationType) {
      return { success: false, error: 'Missing booking ID or modification type' };
    }

    // Get booking
    const { data: booking } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (!booking) {
      return { success: false, error: 'Booking not found or unauthorized' };
    }

    // Process modification (placeholder implementation)
    const modificationFee = 50; // USD
    const updatedBooking = {
      ...booking.booking_data,
      ...newDetails,
      lastModified: new Date().toISOString()
    };

    await supabaseClient
      .from('bookings')
      .update({ booking_data: updatedBooking })
      .eq('id', bookingId);

    await agent.logActivity(userId, 'booking_modified', { bookingId, modificationType });

    return {
      success: true,
      result: {
        bookingId,
        modificationType,
        modificationFee,
        status: 'completed',
        newDetails: updatedBooking
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};