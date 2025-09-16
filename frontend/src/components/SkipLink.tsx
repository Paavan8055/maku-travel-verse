import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSkipLinks } from '@/hooks/useAccessibility';

export const SkipLink: React.FC = () => {
  const { t } = useTranslation();
  const { skipToContent } = useSkipLinks();

  return (
    <button
      className="fixed top-0 left-0 z-50 bg-primary text-primary-foreground px-4 py-2 transform -translate-y-full focus:translate-y-0 transition-transform duration-200 text-sm font-medium rounded-b-md"
      onClick={skipToContent}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skipToContent();
        }
      }}
    >
      {t('accessibility.skipToContent')}
    </button>
  );
};