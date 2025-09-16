// Mock Supabase client for edge function tests
export function createClient() {
  return {
    functions: {
      invoke: () => Promise.resolve({ data: null, error: null })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null })
    })
  };
}
