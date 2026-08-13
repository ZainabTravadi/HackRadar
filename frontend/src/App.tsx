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
import Transparency from "./pages/Transparency.tsx";
import Roadmap from "./pages/Roadmap.tsx";
import Docs from "./pages/Docs.tsx";
import Governance from "./pages/Governance.tsx";
import Impact from "./pages/Impact.tsx";
import NotFound from "./pages/NotFound.tsx";
import About from "./pages/About.tsx";
import Organizers from "./pages/Organizers.tsx";
import Join from "./pages/Join.tsx";
import Contributors from "./pages/Contributors.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";

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
          <Route path="/about" element={<About />} />
          <Route path="/transparency" element={<Transparency />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/join" element={<Join />} />
          <Route path="/contributors" element={<Contributors />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/organizers" element={<Organizers />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/api" element={<Api />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
