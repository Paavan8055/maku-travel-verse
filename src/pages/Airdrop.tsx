import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FooterCtas from "@/components/FooterCtas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Share2, Calendar } from "lucide-react";

const quests = [
  { title: "Connect Wallet & Profile", points: 25, note: "Verify ownership and prevent abuse." },
  { title: "Plan or Save a Trip", points: 20, note: "Show intent; simple on-site action." },
  { title: "Referral (Verified)", points: 120, note: "Capped per epoch; single-use links." },
  { title: "Farcaster Frame Interaction", points: 15, note: "Cast/recast; future on-chain proof." },
  { title: "7-Day Streak", points: "×1.2", note: "Weekly streak multiplier." },
];

export default function Airdrop() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold">Maku Airdrop (Scheduled)</h1>
          <p className="mt-3 max-w-2xl">
            The airdrop will launch on our official roadmap timeline. Until then, climb the priority list
            with quests—earn WL priority, credits, and early-access perks (no token allocations now).
          </p>

          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <Calendar className="h-6 w-6" />
                <h3 className="font-semibold mt-3">Roadmap-Locked</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  No changes to the date. We build responsibly; hype without false promises.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Users className="h-6 w-6" />
                <h3 className="font-semibold mt-3">Priority Tiers</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Top contributors get WL priority and fee-credit perks, not token guarantees.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Trophy className="h-6 w-6" />
                <h3 className="font-semibold mt-3">Leaderboards</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Weekly top wallets (anonymized) showcased. Fair caps prevent farming.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quests */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">Quests (Hype Mode)</h2>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Earn points for WL priority and credits. Airdrop allocations remain locked until the roadmap date.
        </p>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {quests.map((q) => (
            <Card key={q.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{q.title}</h3>
                  <span className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1">
                    {q.points} pts
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{q.note}</p>
                <div className="mt-4">
                  <Button size="sm" variant="outline" disabled>
                    Start (soon)
                  </Button>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">// TODO: wire Zealy/Galxe or custom quests</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Leaderboard placeholder */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Leaderboard</h2>
            <Button size="sm" variant="outline" disabled title="Coming soon">
              Refresh
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Coming soon — shows top wallets weekly (anonymized). Points = WL priority & credits, not token amounts.
          </p>
          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>// TODO: integrate points ledger + pagination</p>
            <p>// TODO: add anti-sybil caps and invite code consumption</p>
          </div>
        </div>
      </section>

      <FooterCtas />
      <Footer />
    </div>
  );
}