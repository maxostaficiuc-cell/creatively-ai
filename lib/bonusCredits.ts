// Bonus credits (e.g. the early-customer reward) sit ON TOP of the weekly
// plan allowance and are never wiped by a weekly reset.
//
// profiles.bonus_credits holds the unspent bonus as of the last reset. The
// weekly allowance is always spent first, so whatever is left of the balance
// up to bonus_credits is still bonus. Accounts without the column (migration
// 013 not run yet) or without a bonus behave exactly as before.

/** Weekly plan allowance plus any unspent bonus — the denominator for credit displays. */
export function creditCapFor(allowance: number, profile: object | null | undefined): number {
  return allowance + bonusOf(profile);
}

export function bonusOf(profile: object | null | undefined): number {
  const v = (profile as { bonus_credits?: unknown } | null | undefined)?.bonus_credits;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export function hasBonusColumn(profile: object | null | undefined): boolean {
  return !!profile && "bonus_credits" in profile;
}

/** Unspent bonus, given the current balance (allowance is spent before bonus). */
export function remainingBonus(bonus: number, balance: number): number {
  return Math.max(0, Math.min(bonus, Math.floor(balance)));
}
