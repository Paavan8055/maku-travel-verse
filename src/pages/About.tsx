
import { Plane, Shield, Workflow, Wallet, Network, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const bullets = [
  {
    icon: Sparkles,
    title: "Agentic AI Assistant",
    body: "A conversational assistant that plans, reflects, and recovers gracefully—grounded by guardrails and real system data.",
  },
  {
    icon: Workflow,
    title: "Provider Rotation Engine",
    body: "Automatically selects the best available option across Sabre, HotelBeds and Amadeus with consistent output formats.",
  },
  {
    icon: Shield,
    title: "Booking Integrity + Stripe",
    body: "Atomic booking and payment flows with idempotency, status transitions, and auditability end-to-end.",
  },
  {
    icon: Wallet,
    title: "Travel Fund Manager",
    body: "Built-in collaborative savings for trips, wired to secure tables and RLS policies on Supabase.",
  },
  {
    icon: Network,
    title: "Four-Way Marketplace",
    body: "Designed for families/friends, solo travellers, and pet-friendly stays—one platform, different needs.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            This isn't just where you book a trip —
            <br className="hidden md:block" /> it's where you build your life's travel story.
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Personalised planning, trustworthy payments, and an AI concierge that adapts to you.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Plane className="h-5 w-5" />
            <span className="text-sm opacity-90">
              Based in Sydney • Launching 23 Oct 2025 (Diwali)
            </span>
          </div>
        </div>
      </section>

      {/* Timeline (facts only) */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">Our Journey</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Q4 2024</p>
              <h3 className="font-semibold text-xl mt-2">Concept & Research</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We kicked off in Sydney with a clear aim: trusted, personalised travel for every type of journey.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">June 2025</p>
              <h3 className="font-semibold text-xl mt-2">MVP Delivered</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Hotels, flights and Travel Fund Manager integrated with our AI assistant and secure payment pipeline.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">23 Oct 2025</p>
              <h3 className="font-semibold text-xl mt-2">Public Launch (Diwali)</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Four-way marketplace—families/friends, solo and pet-friendly—powered by provider rotation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-4xl px-6 pb-4">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">Our Mission</h2>
            <p className="mt-3 text-muted-foreground">
              To empower every traveller with fair, personalised booking tools built on trust, transparency, and innovation.
            </p>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">Our Vision</h2>
            <p className="mt-3 text-muted-foreground">
              A global travel ecosystem where journeys are managed seamlessly through AI-driven assistance,
              transparent pricing, and inclusive experiences for families, friends, solo travellers, and pets.
            </p>
          </div>
        </div>
      </section>

      {/* Innovation Grid (shipped features only) */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">What Makes Maku Different</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bullets.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="h-full">
              <CardContent className="p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="font-semibold text-lg mt-3">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Values (evidence-based) */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">How We Operate</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">Trust & Security</h3>
              <p className="text-sm text-muted-foreground mt-2">
                PCI-compliant payments, role-based access, and Row Level Security for sensitive data.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">Transparency</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Clear booking states, error surfacing, and consistent provider outputs so you always know what's happening.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">Accessibility</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Mobile-first, semantic UI and inclusive journeys for families, friends, solo and pet-friendly travel.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center mt-10">
          <Button asChild size="lg">
            <a href="/hotels">Start Your Journey</a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
