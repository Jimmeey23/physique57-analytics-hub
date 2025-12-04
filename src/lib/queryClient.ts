import { QueryClient } from '@tanstack/react-query';

// Create query client with optimized defaults (no persistence)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale-while-revalidate strategy with longer cache for Sheets data
      staleTime: 10 * 60 * 1000, // 10 minutes - data is fresh (increased from 5)
      gcTime: 60 * 60 * 1000, // 60 minutes - keep in cache (increased from 30)
      
      // Performance optimizations
      refetchOnWindowFocus: false, // Don't refetch on tab focus to save API calls
      refetchOnReconnect: false, // Don't auto-refetch on reconnect to save quota
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      retry: 2, // Reduced from 3 to save quota
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30000), // Longer delays
      
      // Network optimizations
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1, // Reduced from 2
      retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Note: Persistence removed for production app that runs across multiple devices
// In-memory cache with optimized stale-time provides excellent performance
// For server-side persistence, consider implementing with your backend API
