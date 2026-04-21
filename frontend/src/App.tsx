import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Hackathons from "./pages/Hackathons.tsx";
import HackathonDetail from "./pages/HackathonDetail.tsx";
import SeoHackathons from "./pages/SeoHackathons.tsx";
import Submit from "./pages/Submit.tsx";
import Api from "./pages/Api.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/hackathons/:filter" element={<SeoHackathons />} />
          <Route path="/h/:slug" element={<HackathonDetail />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/api" element={<Api />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
