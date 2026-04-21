export type Platform = "Devpost" | "MLH" | "Unstop" | "Devfolio";
export type Mode = "Online" | "In-person" | "Hybrid";
export type Status = "Open" | "Closing Soon" | "Ended";

export interface Hackathon {
  slug: string;
  title: string;
  platform: Platform;
  description: string;
  registrationDeadline: string; // ISO
  submissionDeadline: string;
  mode: Mode;
  country?: string;
  prize?: string;
  tags: string[];
  organizer: string;
  url: string;
  updatedHoursAgo: number;
}

const daysFromNow = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString();
};

export const hackathons: Hackathon[] = [
  {
    slug: "global-ai-summit-2026",
    title: "Global AI Summit Hack",
    platform: "Devpost",
    description: "Build the next generation of AI-native products. Open to teams of 1–4. $250k in total prizes across 8 tracks including LLM agents, multimodal, and AI for science.",
    registrationDeadline: daysFromNow(3),
    submissionDeadline: daysFromNow(10),
    mode: "Online",
    country: "Global",
    prize: "$250,000",
    tags: ["AI", "LLM", "Open"],
    organizer: "Devpost × OpenAI",
    url: "https://devpost.com",
    updatedHoursAgo: 2,
  },
  {
    slug: "mlh-spring-kickoff",
    title: "MLH Spring Kickoff",
    platform: "MLH",
    description: "MLH's seasonal flagship hack. Beginner-friendly, mentors on-call, and shipped projects get featured.",
    registrationDeadline: daysFromNow(1),
    submissionDeadline: daysFromNow(4),
    mode: "Hybrid",
    country: "USA",
    prize: "$40,000",
    tags: ["Open", "Beginner"],
    organizer: "Major League Hacking",
    url: "https://mlh.io",
    updatedHoursAgo: 5,
  },
  {
    slug: "ethindia-2026",
    title: "ETHIndia 2026",
    platform: "Devfolio",
    description: "Asia's largest Ethereum hackathon. 1,500+ builders, 30+ sponsors, and the deepest Web3 mentor network in the region.",
    registrationDeadline: daysFromNow(14),
    submissionDeadline: daysFromNow(21),
    mode: "In-person",
    country: "India",
    prize: "$400,000",
    tags: ["Web3", "Ethereum", "Crypto"],
    organizer: "Devfolio × Ethereum Foundation",
    url: "https://devfolio.co",
    updatedHoursAgo: 1,
  },
  {
    slug: "unstop-fintech-cup",
    title: "Unstop Fintech Cup",
    platform: "Unstop",
    description: "Build for the next billion banking users. Backed by HDFC, Razorpay, and Visa.",
    registrationDeadline: daysFromNow(7),
    submissionDeadline: daysFromNow(18),
    mode: "Online",
    country: "India",
    prize: "₹15,00,000",
    tags: ["Fintech", "Open"],
    organizer: "Unstop",
    url: "https://unstop.com",
    updatedHoursAgo: 6,
  },
  {
    slug: "devpost-climate-hack",
    title: "Climate Action Hack",
    platform: "Devpost",
    description: "Use software to fight climate change. Tracks for energy, agriculture, carbon, and consumer behavior.",
    registrationDeadline: daysFromNow(20),
    submissionDeadline: daysFromNow(35),
    mode: "Online",
    country: "Global",
    prize: "$120,000",
    tags: ["Climate", "Open"],
    organizer: "Devpost",
    url: "https://devpost.com",
    updatedHoursAgo: 3,
  },
  {
    slug: "mlh-hackcon-eu",
    title: "HackCon EU",
    platform: "MLH",
    description: "Europe's largest student hackathon community gathering. Build, learn, and ship in 36 hours.",
    registrationDeadline: daysFromNow(2),
    submissionDeadline: daysFromNow(5),
    mode: "In-person",
    country: "Germany",
    prize: "€25,000",
    tags: ["Open", "Student"],
    organizer: "MLH",
    url: "https://mlh.io",
    updatedHoursAgo: 4,
  },
  {
    slug: "devfolio-ai-agents",
    title: "AI Agents Worldwide",
    platform: "Devfolio",
    description: "Ship autonomous agents that do real work. Tooling sponsored by LangChain, CrewAI, and Modal.",
    registrationDeadline: daysFromNow(9),
    submissionDeadline: daysFromNow(16),
    mode: "Online",
    country: "Global",
    prize: "$80,000",
    tags: ["AI", "Agents"],
    organizer: "Devfolio",
    url: "https://devfolio.co",
    updatedHoursAgo: 8,
  },
  {
    slug: "unstop-hardware-jam",
    title: "Hardware Jam",
    platform: "Unstop",
    description: "Embedded, robotics, and IoT projects welcomed. Hardware kits shipped to finalists.",
    registrationDeadline: daysFromNow(25),
    submissionDeadline: daysFromNow(45),
    mode: "Hybrid",
    country: "India",
    prize: "₹8,00,000",
    tags: ["Hardware", "IoT"],
    organizer: "Unstop",
    url: "https://unstop.com",
    updatedHoursAgo: 12,
  },
  {
    slug: "devpost-game-off",
    title: "Game Off 2026",
    platform: "Devpost",
    description: "Annual month-long game jam. Open theme reveal in 12 days.",
    registrationDeadline: daysFromNow(12),
    submissionDeadline: daysFromNow(42),
    mode: "Online",
    country: "Global",
    prize: "$30,000",
    tags: ["Gaming", "Open"],
    organizer: "GitHub × Devpost",
    url: "https://devpost.com",
    updatedHoursAgo: 7,
  },
];

export const getDaysUntil = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export const getStatus = (h: Hackathon): Status => {
  const days = getDaysUntil(h.registrationDeadline);
  if (days <= 0) return "Ended";
  if (days <= 3) return "Closing Soon";
  return "Open";
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
