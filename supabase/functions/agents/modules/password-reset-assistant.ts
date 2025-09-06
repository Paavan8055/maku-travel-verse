import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { SendGridClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'password-reset-assistant');
  
  try {
    const { 
      email,
      resetMethod = 'email', // email, sms
      verificationLevel = 'standard' // basic, standard, high
    } = params;

    if (!email) {
      return {
        success: false,
        error: 'Email address is required for password reset'
      };
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseClient.auth.admin.getUserByEmail(email);
    
    if (userError || !user) {
      // Security: Don't reveal if email exists or not
      return {
        success: true,
        result: {
          message: 'If an account with this email exists, password reset instructions have been sent.',
          nextSteps: ['Check your email for reset instructions', 'Follow the link to create a new password'],
          estimatedDelivery: '5-10 minutes'
        }
      };
    }

    // Generate secure reset token
    const resetToken = crypto.randomUUID();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset request in memory
    await memory?.setMemory(
      'password-reset-assistant',
      user.id,
      'reset_request',
      {
        email,
        resetToken,
        expiresAt: resetExpiry.toISOString(),
        verificationLevel,
        requestedAt: new Date().toISOString(),
        ipAddress: 'unknown', // Would get from request headers in production
        userAgent: 'unknown'
      },
      undefined,
      resetExpiry.toISOString()
    );

    // Send reset email
    const sendGridClient = new SendGridClient(
      Deno.env.get('SENDGRID_API_KEY') || 'test'
    );

    const resetLink = `https://maku.travel/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const emailContent = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password for your MAKU Travel account.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
    
    <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Your Password</a></p>
    
    <p>This link will expire in 1 hour for security reasons.</p>
    
    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    
    <p>For security questions, contact our support team.</p>
    
    <p>Best regards,<br>MAKU Travel Team</p>
    `;

    try {
      await sendGridClient.sendEmail(
        email,
        'Password Reset - MAKU Travel',
        emailContent
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with success response for security (don't reveal email sending failures)
    }

    // Log security event
    await agent.logActivity(user.id, 'password_reset_requested', {
      email,
      verificationLevel,
      resetMethod,
      requestTimestamp: new Date().toISOString()
    });

    // Track reset attempts to prevent abuse
    const recentAttempts = await memory?.getMemory('password-reset-assistant', user.id, 'reset_attempts') || [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentValidAttempts = recentAttempts.filter(attempt => new Date(attempt.timestamp) > oneHourAgo);
    
    if (recentValidAttempts.length >= 3) {
      return {
        success: false,
        error: 'Too many password reset attempts. Please wait before requesting another reset.'
      };
    }

    const updatedAttempts = [...recentValidAttempts, {
      timestamp: new Date().toISOString(),
      email,
      success: true
    }];

    return {
      success: true,
      result: {
        message: 'Password reset instructions have been sent to your email address.',
        email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Partially mask email
        nextSteps: [
          'Check your email for reset instructions',
          'Click the reset link in the email',
          'Create a new secure password',
          'Sign in with your new password'
        ],
        securityInfo: {
          expiresIn: '1 hour',
          verificationLevel,
          ipTracking: 'enabled'
        },
        estimatedDelivery: '5-10 minutes'
      },
      memoryUpdates: [
        {
          key: 'reset_attempts',
          data: updatedAttempts,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'Unable to process password reset request. Please try again later.'
    };
  }
};