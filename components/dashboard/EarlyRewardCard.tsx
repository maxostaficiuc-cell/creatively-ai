import Link from "next/link";
import { Check, Clock, Gift } from "lucide-react";
import type { RewardState } from "@/lib/rewards";

// Early Customer Rewards card. The headline, copy, badge and supporting line
// are fixed marketing copy; the "your status" row reflects the user's real
// reward_grants row and never says credits were added unless they were.

export function EarlyRewardCard({ reward, isPaying, balance }: { reward: RewardState; isPaying: boolean; balance: number }) {
  const amount = reward.setup ? reward.amount : 10000;
  const grant = reward.setup ? reward.grant : null;
  const launched = reward.setup && !!reward.launchedAt;

  return (
    <section aria-labelledby="reward-title" className="ov-reveal reward-card relative overflow-hidden rounded-2xl border border-brand/35 p-6 sm:p-8" style={{ animationDelay: "60ms" }}>
      <span aria-hidden className="reward-glow" />
      <span aria-hidden className="reward-sheen" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-brand-light">
            <Gift size={14} /> Early Customer Rewards
          </p>
          <h2 id="reward-title" className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-tight text-ink-primary sm:text-[1.7rem]">
            Be among the first to connect your ad accounts.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
            Creatively.ai is preparing advertising account integrations. As an early customer, you&apos;ll receive 10,000 bonus credits when
            account connections become available.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="reward-badge inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-[0.08em] text-white">
            {amount.toLocaleString()} BONUS CREDITS
          </span>
          <p className="text-xs text-ink-muted">Reserved for eligible early customers when integrations launch.</p>
        </div>
      </div>

      {/* this user's real status */}
      <div className="relative mt-6 border-t border-white/[0.07] pt-4 text-sm">
        {grant?.status === "granted" ? (
          <p className="flex flex-wrap items-center gap-2 text-ink-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-green/15 text-accent-green">
              <Check size={12} />
            </span>
            {grant.amount.toLocaleString()} bonus credits were added to your account
            {grant.grantedAt ? ` on ${new Date(grant.grantedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}.
            <span className="text-ink-muted">Current balance: {balance.toLocaleString()} credits.</span>
          </p>
        ) : grant?.status === "reserved" ? (
          <p className="flex flex-wrap items-center gap-2 text-ink-secondary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/15 text-brand-light">
              <Clock size={12} />
            </span>
            <span className="text-ink-primary">Your reward is reserved.</span>
            {launched && !isPaying
              ? "It will be added once your subscription is active."
              : "It will be added to your balance when account integrations launch — nothing has been credited yet."}
          </p>
        ) : launched ? (
          <p className="text-ink-muted">This early-customer offer closed when account integrations launched.</p>
        ) : !reward.setup ? (
          <p className="text-ink-muted">Eligibility is confirmed automatically for paying customers before launch.</p>
        ) : isPaying ? (
          <p className="text-ink-muted">Your eligibility is being confirmed. Refresh in a moment.</p>
        ) : (
          <p className="text-ink-secondary">
            Early customers are accounts with an active paid plan before integrations launch.{" "}
            <Link href="/pricing" className="text-brand-light hover:underline">
              See plans
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
