import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface UserFeedbackProps {
  context?: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
  className?: string;
}

interface FeedbackData {
  rating: 'positive' | 'negative' | null;
  message: string;
  context: string;
  timestamp: Date;
}

export const UserFeedback: React.FC<UserFeedbackProps> = ({
  context = 'general',
  onFeedbackSubmit,
  className
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating && !message.trim()) {
      toast.error(t('feedback.pleaseProvideRatingOrMessage'));
      return;
    }

    setIsSubmitting(true);
    
    const feedbackData: FeedbackData = {
      rating,
      message: message.trim(),
      context,
      timestamp: new Date()
    };

    try {
      // Store feedback locally (could be enhanced to send to backend)
      const existingFeedback = JSON.parse(localStorage.getItem('maku-feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('maku-feedback', JSON.stringify(existingFeedback));

      onFeedbackSubmit?.(feedbackData);
      
      toast.success(t('feedback.thankYou'));
      setIsOpen(false);
      setRating(null);
      setMessage('');
    } catch (error) {
      toast.error(t('feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
        aria-label={t('feedback.provideFeedback')}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('feedback.feedback')}
      </Button>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {t('feedback.title')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('feedback.howWasExperience')}
          </p>
          <div className="flex gap-2">
            <Button
              variant={rating === 'positive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRating('positive')}
              aria-label={t('feedback.positive')}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              {t('feedback.good')}
            </Button>
            <Button
              variant={rating === 'negative' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setRating('negative')}
              aria-label={t('feedback.negative')}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              {t('feedback.needsWork')}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="feedback-message" className="text-sm font-medium">
            {t('feedback.additionalComments')} 
            <span className="text-muted-foreground ml-1">({t('common.optional')})</span>
          </label>
          <Textarea
            id="feedback-message"
            placeholder={t('feedback.tellUsMore')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            aria-describedby="feedback-char-count"
          />
          <div id="feedback-char-count" className="text-xs text-muted-foreground text-right">
            {message.length}/500
          </div>
        </div>

        {context !== 'general' && (
          <Badge variant="secondary" className="text-xs">
            {t('feedback.context')}: {context}
          </Badge>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!rating && !message.trim())}
            size="sm"
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? t('common.sending') : t('feedback.submit')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            size="sm"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Floating feedback button for global use
export const FloatingFeedback: React.FC<{ position?: 'bottom-right' | 'bottom-left' }> = ({
  position = 'bottom-right'
}) => {
  const positionClasses = position === 'bottom-left' 
    ? 'bottom-4 left-4' 
    : 'bottom-4 right-4';

  return (
    <div className={`fixed ${positionClasses} z-40`}>
      <UserFeedback context="page" />
    </div>
  );
};