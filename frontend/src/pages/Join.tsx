import { useMemo, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { ArrowRight, BadgeCheck, BrainCircuit, CheckCircle2, Code2, MessageSquareMore, Rocket, Sparkles, Users2, Wrench } from "lucide-react";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetchJson } from "@/lib/api";
import ProgressStepper from "@/components/ui/ProgressStepper";
import ContributionCard from "@/components/ui/ContributionCard";
import SectionHeader from "@/components/ui/SectionHeader";
import FeatureCard from "@/components/ui/FeatureCard";

const CONTRIBUTION_AREAS = [
  "engineering",
  "frontend",
  "backend",
  "crawler",
  "data",
  "design",
  "documentation",
  "testing",
  "accessibility",
  "community",
  "outreach",
  "translation",
  "partnerships",
  "other",
];
const EXPERIENCE = ["Beginner", "Intermediate", "Advanced", "Professional"];
const AVAILABILITY = ["1-3 hours/week", "3-5 hours/week", "5-10 hours/week", "10+ hours/week", "Flexible / varies"];

const STEPS = [
  { title: "Who are you?", desc: "Tell us how to reach you and what name to use.", icon: Users2 },
  { title: "What do you want to build?", desc: "Pick the areas where you want to contribute.", icon: Wrench },
  { title: "How do you want to contribute?", desc: "Share your experience and availability.", icon: BrainCircuit },
  { title: "Let's build together.", desc: "Tell us what you'd like to work on.", icon: Rocket },
];

const CONTRIBUTION_AREAS_FEATURES = [
  {
    icon: Code2,
    title: "Crawler and data",
    desc: "Help improve source coverage, normalization, deduplication, and data quality across the discovery pipeline.",
  },
  {
    icon: Sparkles,
    title: "Frontend and UX",
    desc: "Shape the discovery experience, motion system, accessibility, and the visual language of the product.",
  },
  {
    icon: MessageSquareMore,
    title: "Documentation and community",
    desc: "Make the project easier to understand, easier to join, and easier to contribute to over time.",
  },
  {
    icon: BadgeCheck,
    title: "Testing and reliability",
    desc: "Strengthen confidence in the crawler, API contracts, and user-facing flows with practical checks.",
  },
];

const CONTRIBUTION_STEPS = [
  {
    title: "Tell us who you are",
    desc: "Share the basics so we can keep the process personal and follow up when needed.",
  },
  {
    title: "Choose your contribution lane",
    desc: "Pick the areas that match your interests, strengths, and available time.",
  },
  {
    title: "Start building with HackRadar",
    desc: "Submit the form and we’ll route you toward the most relevant next step.",
  },
];

export default function Join() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [contributionTypes] = useState<string[]>([]);
  const [motivation, setMotivation] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedAreaCount = areas.length;
  const filledBasics = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  function toggleArea(area: string) {
    setAreas((previous) => (previous.includes(area) ? previous.filter((value) => value !== area) : [...previous, area]));
  }

  const progressMeta = useMemo(
    () => [
      { label: "Basics", done: filledBasics },
      { label: "Focus", done: selectedAreaCount > 0 },
      { label: "Context", done: Boolean(experience || availability) },
      { label: "Proposal", done: Boolean(motivation.trim()) },
    ],
    [availability, experience, filledBasics, motivation, selectedAreaCount],
  );

  function focusForm() {
    setStep(1);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 250);
  }

  async function submit() {
    setError(null);

    if (!name.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setStatus("error");
      setError("Provide a name and a valid email.");
      setStep(1);
      return;
    }

    if (areas.length === 0) {
      setStatus("error");
      setError("Select at least one contribution area.");
      setStep(2);
      return;
    }

    setStatus("submitting");

    try {
      await apiFetchJson<{ success: boolean; applicationId: string }>("/api/initiative/applications", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          githubUsername: github,
          linkedinUrl: linkedin,
          websiteUrl: website,
          contributionAreas: areas,
          experienceLevel: experience,
          availability,
          contributionTypes,
          motivation,
        }),
      });

      setStatus("success");
      setStep(4);
    } catch (err: unknown) {
      setStatus("error");
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Submission failed");
    }
  }

  if (status === "success") {
    return (
      <Layout>
        <section className="section-surface relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
          <div className="absolute inset-0 radar-grid opacity-[0.2]" aria-hidden />
          <div className="container relative">
            <div className="mx-auto max-w-4xl">
              <div className="glass-surface-strong rounded-[2rem] p-8 text-center md:p-12">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary-gradient text-primary-foreground shadow-glow">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">You are on the radar.</h1>
                <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
                  Thanks for your interest. We'll review submissions and may follow up if we need more details. Start contributing now on GitHub.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href="https://github.com/ZainabTravadi/List-Of-Hackathons"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-primary-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
                  >
                    View on GitHub
                  </a>
                  <a
                    href="/about"
                    className="inline-flex items-center justify-center rounded-full border border-border/70 bg-card/90 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    Read Contribution Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-surface relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 bg-hero-gradient" aria-hidden />
        <div className="absolute inset-0 radar-grid opacity-[0.18]" aria-hidden />
        <div className="container relative">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Contribute to HackRadar"
              title="A contribution path for builders, designers, and community helpers."
              subtitle="HackRadar is an open-source discovery platform. If you want to improve the crawler, refine the interface, write docs, or help the community grow, there is a clear place for you here."
              center={false}
            />

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="glass-surface-strong rounded-[2rem] p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-success">
                      <span className="h-2 w-2 rounded-full bg-success motion-safe:animate-pulse-soft" />
                      Open contributor path
                    </div>
                    <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">Want to build with us?</h2>
                    <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
                      HackRadar needs people who care about reliable data, clear interfaces, and a welcoming open-source workflow. Pick a lane, tell us a bit about yourself, and we’ll help you get started.
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded-full border border-border/70 bg-card/85 px-3 py-2 text-sm text-muted-foreground">Crawler</span>
                    <span className="rounded-full border border-border/70 bg-card/85 px-3 py-2 text-sm text-muted-foreground">Frontend</span>
                    <span className="rounded-full border border-border/70 bg-card/85 px-3 py-2 text-sm text-muted-foreground">Docs</span>
                    <span className="rounded-full border border-border/70 bg-card/85 px-3 py-2 text-sm text-muted-foreground">Community</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-[1.6rem] border border-border/70 bg-background/65 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Ready to contribute?</div>
                    <div className="mt-1 text-sm text-muted-foreground">Jump straight into the application form below. We keep the backend flow exactly the same.</div>
                  </div>
                  <Button className="rounded-full bg-primary-gradient px-6" onClick={focusForm}>
                    Start my application <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </section>

              <section className="glass-surface-strong rounded-[2rem] p-6 md:p-8">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">How you can help</div>
                <div className="mt-4 grid gap-4">
                  {CONTRIBUTION_STEPS.map((item, index) => (
                    <div key={item.title} className="rounded-3xl border border-border/70 bg-card/80 p-4">
                      <div className="flex items-start gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-semibold tracking-tight text-foreground">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-8">
              <SectionHeader
                eyebrow="Contribution areas"
                title="Choose the lane that feels most useful to you."
                subtitle="These are the kinds of contributions that move HackRadar forward without forcing you into a single role."
              />
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {CONTRIBUTION_AREAS_FEATURES.map((feature, index) => (
                  <div key={feature.title} className={`animate-fade-in-up ${index === 1 ? "animate-delay-150" : index === 2 ? "animate-delay-300" : index === 3 ? "animate-delay-450" : ""}`}>
                    <FeatureCard icon={feature.icon} title={feature.title} desc={feature.desc} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-border/70 bg-card/70 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Three-step flow</div>
                  <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">From first hello to first contribution.</div>
                </div>
                <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Keep going when you’re ready
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {CONTRIBUTION_STEPS.map((item, index) => (
                  <div key={item.title} className="rounded-3xl border border-border/70 bg-background/80 p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">0{index + 1}</div>
                    <div className="mt-2 font-semibold tracking-tight text-foreground">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div ref={formRef} className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="glass-surface-strong rounded-[2rem] p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Application progress</div>
                    <div className="mt-1 text-sm text-muted-foreground">Work through the four steps and keep your details honest and useful.</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {STEPS.map((item, index) => (
                    <StepCard key={item.title} index={index + 1} active={step === index + 1} done={step > index + 1} title={item.title} desc={item.desc} icon={item.icon} />
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-border/70 bg-background/70 p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Progress</div>
                  <ProgressStepper step={step} steps={4} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {progressMeta.map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-2xl border px-3 py-2 text-sm ${
                          item.done ? "border-success/20 bg-success/10 text-success" : "border-border/70 bg-card/70 text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <section className="glass-surface-strong rounded-[2rem] p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step {step} of 4</div>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{STEPS[step - 1].title}</h2>
                  </div>
                  <div className="rounded-full border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Open source onboarding
                  </div>
                </div>

                {error ? (
                  <div role="alert" className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Name *" htmlFor="join-name">
                      <Input
                        id="join-name"
                        ref={nameInputRef}
                        aria-label="Name *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 rounded-2xl border-border/70 bg-background/80"
                      />
                    </Field>
                    <Field label="Email *" htmlFor="join-email">
                      <Input id="join-email" aria-label="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl border-border/70 bg-background/80" />
                    </Field>
                  </div>

                  {step === 1 && (
                    <div key="step-1" className="animate-fade-in-up space-y-4 motion-reduce:animate-none">
                      <p className="text-sm leading-7 text-muted-foreground">Step 1 sets the basics so we can contact you and keep the rest of the journey personal.</p>
                      <div className="flex justify-end">
                        <Button className="rounded-full bg-primary-gradient px-6" onClick={() => setStep(2)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div key="step-2" className="animate-fade-in-up space-y-4 motion-reduce:animate-none">
                      <p className="text-sm leading-7 text-muted-foreground">Pick the areas you want to contribute to. Multiple selections are encouraged, and you can always start small.</p>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                        {CONTRIBUTION_AREAS.map((area) => (
                          <ContributionCard key={area} label={area} selected={areas.includes(area)} onClick={() => toggleArea(area)} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" className="rounded-full" onClick={() => setStep(1)}>
                          Back
                        </Button>
                        <Button className="rounded-full bg-primary-gradient px-6" onClick={() => setStep(3)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div key="step-3" className="animate-fade-in-up space-y-4 motion-reduce:animate-none">
                      <p className="text-sm leading-7 text-muted-foreground">Let us know your experience level and how much time you can give each week.</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Experience level" htmlFor="join-experience">
                          <select
                            id="join-experience"
                            className="h-12 w-full rounded-2xl border border-border/70 bg-background/80 px-3 text-sm"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                          >
                            <option value="">Choose...</option>
                            {EXPERIENCE.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Availability" htmlFor="join-availability">
                          <select
                            id="join-availability"
                            className="h-12 w-full rounded-2xl border border-border/70 bg-background/80 px-3 text-sm"
                            value={availability}
                            onChange={(e) => setAvailability(e.target.value)}
                          >
                            <option value="">Choose...</option>
                            {AVAILABILITY.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button variant="outline" className="rounded-full" onClick={() => setStep(2)}>
                          Back
                        </Button>
                        <Button className="rounded-full bg-primary-gradient px-6" onClick={() => setStep(4)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div key="step-4" className="animate-fade-in-up space-y-4 motion-reduce:animate-none">
                      <p className="text-sm leading-7 text-muted-foreground">Tell us what you want to build and where to reach you if the team needs follow-up.</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="GitHub" htmlFor="join-github">
                          <Input id="join-github" value={github} onChange={(e) => setGithub(e.target.value)} className="h-12 rounded-2xl border-border/70 bg-background/80" />
                        </Field>

                        <Field label="LinkedIn" htmlFor="join-linkedin">
                          <Input id="join-linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="h-12 rounded-2xl border-border/70 bg-background/80" />
                        </Field>
                      </div>

                      <Field label="Website" htmlFor="join-website">
                        <Input id="join-website" value={website} onChange={(e) => setWebsite(e.target.value)} className="h-12 rounded-2xl border-border/70 bg-background/80" />
                      </Field>

                      <Field label="What would you like to build or help improve?" htmlFor="join-motivation">
                        <Textarea
                          id="join-motivation"
                          value={motivation}
                          onChange={(e) => setMotivation(e.target.value)}
                          placeholder="E.g. improve crawler coverage, add tests, refine the UI, or help with docs..."
                          className="min-h-36 rounded-2xl border-border/70 bg-background/80"
                        />
                      </Field>

                      <div className="flex items-center justify-between">
                        <Button variant="outline" className="rounded-full" onClick={() => setStep(3)}>
                          Back
                        </Button>
                        <Button className="rounded-full bg-primary-gradient px-6" onClick={() => void submit()} disabled={status === "submitting"}>
                          {status === "submitting" ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end border-t border-border/70 pt-5">
                    <Button onClick={() => void submit()} disabled={status === "submitting"} className="rounded-full bg-primary-gradient px-6">
                      {status === "submitting" ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

const Field = ({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) => (
  <label htmlFor={htmlFor} className="block">
    <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
    {children}
  </label>
);

const StepCard = ({
  index,
  active,
  done,
  title,
  desc,
  icon: Icon,
}: {
  index: number;
  active: boolean;
  done: boolean;
  title: string;
  desc: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) => (
  <div
    className={`rounded-3xl border p-4 transition-all ${
      active ? "border-primary/30 bg-primary/10 shadow-glow" : done ? "border-success/20 bg-success/10" : "border-border/70 bg-card/70"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-primary-gradient text-primary-foreground" : done ? "bg-success text-success-foreground" : "bg-secondary text-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Step {index}</div>
        <div className="mt-1 font-semibold tracking-tight text-foreground">{title}</div>
        <div className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</div>
      </div>
    </div>
  </div>
);
