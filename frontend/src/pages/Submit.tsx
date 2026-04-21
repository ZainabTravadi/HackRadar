import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const Submit = () => {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast({ title: "Submission received", description: "We'll review your hackathon within 24h." });
  };

  return (
    <Layout>
      <section className="bg-hero-gradient py-16">
        <div className="container max-w-2xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Submit a <span className="font-serif-display italic text-primary">hackathon</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Hosting one we missed? Submit it and we'll get it on the radar.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-2xl">
          {submitted ? (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h2 className="mt-4 text-xl font-semibold">Thanks for the submission</h2>
              <p className="mt-2 text-sm text-muted-foreground">We'll review and publish within 24 hours.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Submit another</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-card">
              <Field label="Title">
                <Input required placeholder="e.g. Global AI Summit Hack" />
              </Field>
              <Field label="Link">
                <Input required type="url" placeholder="https://..." />
              </Field>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Platform">
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Devpost">Devpost</SelectItem>
                      <SelectItem value="MLH">MLH</SelectItem>
                      <SelectItem value="Unstop">Unstop</SelectItem>
                      <SelectItem value="Devfolio">Devfolio</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Mode">
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="In-person">In-person</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Registration Deadline">
                <Input required type="date" />
              </Field>
              <Field label="Description">
                <Textarea required rows={4} placeholder="What's the hackathon about?" />
              </Field>
              <Button type="submit" size="lg" className="w-full bg-primary-gradient shadow-glow">
                Submit Hackathon
              </Button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

export default Submit;
