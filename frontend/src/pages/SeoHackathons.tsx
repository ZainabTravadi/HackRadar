import { useParams } from "react-router-dom";
import Hackathons from "./Hackathons";

type SeoPreset = {
  presetTheme?: string;
  presetTitle?: string;
  presetSubtitle?: string;
  presetMode?: string;
  presetCountry?: string;
  presetStatus?: string;
};

const presetMap: Record<string, SeoPreset> = {
  ai: { presetTheme: "AI", presetTitle: "AI Hackathons", presetSubtitle: "Every active AI hackathon, in one place." },
  web3: { presetTheme: "Web3", presetTitle: "Web3 Hackathons", presetSubtitle: "Crypto, Ethereum, and on-chain builds." },
  online: { presetMode: "Online", presetTitle: "Online Hackathons", presetSubtitle: "Build from anywhere — fully remote events." },
  india: { presetCountry: "India", presetTitle: "Hackathons in India", presetSubtitle: "Top hackathons across India." },
  "closing-soon": { presetStatus: "Closing Soon", presetTitle: "Closing Soon", presetSubtitle: "Hackathons with deadlines in the next 3 days." },
};

const SeoHackathons = () => {
  const { filter = "" } = useParams();
  const props = presetMap[filter] || { presetTitle: filter };
  return <Hackathons {...props} />;
};

export default SeoHackathons;
