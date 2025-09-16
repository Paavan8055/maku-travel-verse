import { ArrowRight } from "lucide-react";

export default function FooterCtas() {
  return (
    <div className="w-full border-t bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="mx-auto max-w-6xl px-6 py-6 grid sm:grid-cols-2 gap-4">
        <a href="/airdrop" className="group rounded-2xl border p-5 hover:bg-primary/5 transition">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Airdrop</h3>
            <span className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1">
              Scheduled per roadmap
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Build hype with quests today. Airdrop goes live on the roadmap date.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-primary text-sm">
            Start quests <ArrowRight className="h-4 w-4" />
          </div>
        </a>

        <a href="/nft" className="group rounded-2xl border p-5 hover:bg-primary/5 transition">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">NFT</h3>
            <span className="text-xs rounded-full bg-emerald-600 text-white px-3 py-1">
              Phase-1 live
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Collect Maku • Base L2 (recommended) • Phase-1 supply 3,333
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-emerald-700 text-sm">
            Explore collection <ArrowRight className="h-4 w-4" />
          </div>
        </a>
      </div>
    </div>
  );
}