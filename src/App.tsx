
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaxOrganizerProvider } from "./context/TaxOrganizerContext";
import Welcome from "./pages/Welcome";
import ImportOptions from "./pages/ImportOptions";
import AIReview from "./pages/AIReview";
import DocumentHighlight from "./pages/DocumentHighlight";
import Categories from "./pages/Categories";
import Questions from "./pages/Questions";
import Summary from "./pages/Summary";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TaxOrganizerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Welcome />
              </ProtectedRoute>
            } />
            <Route path="/import-options" element={
              <ProtectedRoute>
                <ImportOptions />
              </ProtectedRoute>
            } />
            <Route path="/review" element={
              <ProtectedRoute>
                <AIReview />
              </ProtectedRoute>
            } />
            <Route path="/highlight" element={
              <ProtectedRoute>
                <DocumentHighlight />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            } />
            <Route path="/questions" element={
              <ProtectedRoute>
                <Questions />
              </ProtectedRoute>
            } />
            <Route path="/summary" element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TaxOrganizerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
