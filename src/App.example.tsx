import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { EnhancedPageWrapper } from "@/components/accessibility/EnhancedPageWrapper";
import Index from "./pages/Index";
import HotelSearchPage from "./pages/search/hotels";
import AdminPage from "./pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if ((error as any)?.status >= 400 && (error as any)?.status < 500) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route 
                path="/" 
                element={
                  <EnhancedPageWrapper pageName="Home">
                    <Index />
                  </EnhancedPageWrapper>
                } 
              />
              <Route 
                path="/search/hotels" 
                element={
                  <EnhancedPageWrapper pageName="Hotel Search">
                    <HotelSearchPage />
                  </EnhancedPageWrapper>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <EnhancedPageWrapper pageName="Admin Dashboard">
                    <AdminPage />
                  </EnhancedPageWrapper>
                } 
              />
              <Route path="*" element={<div>Page not found</div>} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
