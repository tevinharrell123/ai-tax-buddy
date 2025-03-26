
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaxOrganizerProvider } from "./context/TaxOrganizerContext";
import Welcome from "./pages/Welcome";
import AIReview from "./pages/AIReview";
import DocumentHighlight from "./pages/DocumentHighlight";
import Categories from "./pages/Categories";
import Questions from "./pages/Questions";
import Summary from "./pages/Summary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TaxOrganizerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/review" element={<AIReview />} />
            <Route path="/highlight" element={<DocumentHighlight />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TaxOrganizerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
