import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';

export interface Document {
  id: string;
  document_type: 'boarding_pass' | 'hotel_confirmation' | 'passport' | 'visa' | 'insurance' | 'receipt' | 'vaccination';
  title: string;
  description?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  status: 'active' | 'expired' | 'revoked';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringCount, setExpiringCount] = useState(0);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    if (!user) {
      setDocuments([]);
      setExpiringCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('document-service', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      if (data.success) {
        setDocuments(data.documents);
        setExpiringCount(data.expiringCount);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (documentData: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('document-service', {
        method: 'POST',
        body: documentData
      });

      if (error) {
        console.error('Error adding document:', error);
        return null;
      }

      if (data.success) {
        await fetchDocuments(); // Refresh the list
        return data.document;
      }
    } catch (error) {
      console.error('Error adding document:', error);
    }

    return null;
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      const { error } = await supabase
        .from('user_documents')
        .update(updates)
        .eq('id', id);

      if (!error) {
        await fetchDocuments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', id);

      if (!error) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchDocuments();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('documents_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_documents',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDocuments(); // Refetch when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    documents,
    loading,
    expiringCount,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchDocuments
  };
};