import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterCtas from "@/components/FooterCtas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Wallet, Star } from "lucide-react";

const utilities = [
  { icon: Sparkles, title: "Priority Access", desc: "Early access to new features, pilots and limited drops." },
  { icon: Wallet, title: "Platform Credits", desc: "Fee-credit vouchers for bookings (values set conservatively)." },
  { icon: Shield, title: "Transparent Provenance", desc: "IPFS metadata with reveal window and provenance hash." },
  { icon: Star, title: "Community Multipliers", desc: "Leaderboard/WL priority multipliers during hype seasons." },
];

export default function NFT() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold">Maku — Phase-1 NFT</h1>
          <p className="mt-3 max-w-2xl">
            Phase-1 supply: <b>3,333</b>. Total collection capped at <b>9,999</b> across 3 phases.
            One <b>Universal</b> 1/1 will be invitation-only for a lucky Maku traveller.
          </p>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {/* Mint panel (disabled until contract wired) */}
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold">Mint Panel</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Connect wallet and mint when the contract is wired. WL window opens before public sale.
                </p>

                <div className="mt-4 grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Phase-1 Status</p>
                    <p className="font-semibold mt-1">Live (contract pending)</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Supply</p>
                    <p className="font-semibold mt-1">3,333</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">Chain</p>
                    <p className="font-semibold mt-1">Base (recommended)</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3">
                  <Button size="lg" disabled title="Contract not yet connected">
                    Connect & Mint (soon)
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/airdrop">Get WL Priority</a>
                  </Button>
                </div>

                {/* Technical placeholders for later */}
                <div className="mt-6 text-xs text-muted-foreground space-y-1">
                  <p>// TODO: inject wagmi + RainbowKit</p>
                  <p>// TODO: set contract address (ERC-721A), Merkle WL root, and network = base</p>
                </div>
              </CardContent>
            </Card>

            {/* Snapshot / Provenance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">Provenance & Reveal</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Metadata pinned to IPFS (or Arweave)</li>
                  <li>Reveal window: T + 48h after sellout / close</li>
                  <li>Provenance hash snapshot published at reveal</li>
                </ul>
                <div className="mt-4 text-xs text-muted-foreground">
                  // Optional: add "View on Explorer / OpenSea" once deployed
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Utilities */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">Holder Utilities</h2>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Practical, platform-native benefits. No financial promises.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {utilities.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="h-full">
              <CardContent className="p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="font-semibold mt-3">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap beats */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">Phases & Caps</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { phase: "Phase-1", cap: "3,333", status: "On sale" },
            { phase: "Phase-2", cap: "3,333", status: "Scheduled (per roadmap)" },
            { phase: "Phase-3", cap: "3,333", status: "Scheduled (per roadmap)" },
          ].map((p) => (
            <Card key={p.phase}>
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.phase}</p>
                <h3 className="font-semibold text-xl mt-2">{p.cap} supply</h3>
                <p className="text-sm text-muted-foreground mt-2">{p.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Universal 1/1</p>
              <h3 className="font-semibold text-xl mt-2">Invitation-only "Universal" Maku NFT</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Awarded to one lucky Maku traveller by transparent raffle (snapshot & proof published).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ & Legal */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">FAQ</h2>
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="font-semibold">What chain will you use?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We recommend Base L2 for low fees and smooth UX. Final network will be announced before mint.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Is there an allowlist?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Yes. WL gets a short early window. Public mint follows with per-wallet limits.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Any financial promises?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No. NFTs provide access-based utilities only (priority, credits, early features).
            </p>
          </div>
        </div>
      </section>

      <FooterCtas />
      <Footer />
    </div>
  );
}