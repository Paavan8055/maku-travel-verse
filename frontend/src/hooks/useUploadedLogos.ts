import { useState, useEffect } from 'react';

export interface UploadedLogo {
  id: string;
  name: string;
  url: string;
  type: 'full-circular' | 'head-circular' | 'complete' | 'text-only';
}

export const useUploadedLogos = () => {
  const [logos, setLogos] = useState<UploadedLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This will be populated with actual uploaded logo URLs
    // once they are properly uploaded via attachment feature
    setLoading(false);
  }, []);

  const getLogoByType = (type: UploadedLogo['type']): string | null => {
    const logo = logos.find(l => l.type === type);
    return logo?.url || null;
  };

  const setUploadedLogos = (uploadedLogos: UploadedLogo[]) => {
    setLogos(uploadedLogos);
    console.log('✅ Uploaded logos set:', uploadedLogos);
  };

  return {
    logos,
    loading,
    error,
    getLogoByType,
    setUploadedLogos
  };
};

export default useUploadedLogos;