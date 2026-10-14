"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, History, Plus } from "lucide-react";
import { BrandInput, type InputState } from "@/components/strategy/BrandInput";
import { Progress, type StepState } from "@/components/strategy/Progress";
import { StrategyResults } from "@/components/strategy/StrategyResults";
import type { Generation, SourceReport, Strategy } from "@/lib/strategyTypes";

export type HistoryItem = { id: string; brand_name: string | null; website_url: string | null; social_url: string | null; version: number; status: string; created_at: string };

// Orchestrates the real workflow. Each progress step is one server request:
//   analyze  → "Understanding your brand" + "Analyzing products & positioning"
//   audience → "Identifying your target audience"
//   concepts → "Developing advertising concepts"
// A step is shown as active only while its request is running.

type Phase = "input" | "working" | "results";

export function StrategyClient(props: {
  initialStrategy: Strategy | null;
  initialGenerations: Generation[];
  history: HistoryItem[];
  isPaying: boolean;
  aiReady: boolean;
  imagesReady: boolean;
  setupMissing: boolean;
  creditCost: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [strategy, setStrategy] = useState<Strategy | null>(props.initialStrategy);
  const [generations, setGenerations] = useState<Generation[]>(props.initialGenerations);
  const [phase, setPhase] = useState<Phase>(props.initialStrategy ? (props.initialStrategy.status === "ready" ? "results" : "working") : "input");
  const [steps, setSteps] = useState<StepState[]>(["pending", "pending", "pending"]);
  const [error, setError] = useState<{ message: string; retry: (() => void) | null } | null>(null);
  const [sourceProblem, setSourceProblem] = useState<{ sources: SourceReport[]; fallback: string } | null>(null);
  const [input, setInput] = useState<InputState>({
    websiteUrl: props.initialStrategy?.website_url ?? "",
    socialUrl: props.initialStrategy?.social_url ?? "",
    context: props.initialStrategy?.user_context ?? {},
    notes: "",
    files: [],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rerunOf, setRerunOf] = useState<string | null>(null); // re-analysis saves a new version of this strategy
  const busy = useRef(false);

  const setUrl = useCallback(
    (id: string | null) => {
      const qs = id ? `?s=${id}` : "";
      window.history.replaceState(null, "", `${pathname}${qs}`);
    },
    [pathname]
  );

  const call = async (url: string, init: RequestInit) => {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch {
      return { ok: false as const, status: 0, data: { error: "Connection problem — check your internet and try again." } as Record<string, unknown> };
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  };

  /** Runs the audience and concepts steps for a profiled strategy (skips steps already done). */
  const continueSteps = useCallback(
    async (s: Strategy) => {
      setPhase("working");
      setError(null);
      let cur = s;
      setSteps(["done", cur.audience?.length ? "done" : "pending", "pending"]);
      if (!cur.audience?.length) {
        setSteps(["done", "active", "pending"]);
        const r = await call(`/api/strategy/${cur.id}/audience`, { method: "POST" });
        if (!r.ok) {
          setSteps(["done", "failed", "pending"]);
          setError({ message: String(r.data.error ?? "The audience step failed."), retry: () => continueSteps(cur) });
          return;
        }
        cur = r.data.strategy as Strategy;
        setStrategy(cur);
      }
      setSteps(["done", "done", "active"]);
      const r2 = await call(`/api/strategy/${cur.id}/concepts`, { method: "POST" });
      if (!r2.ok) {
        setSteps(["done", "done", "failed"]);
        setError({ message: String(r2.data.error ?? "The concepts step failed."), retry: () => continueSteps(cur) });
        return;
      }
      cur = r2.data.strategy as Strategy;
      setStrategy(cur);
      setSteps(["done", "done", "done"]);
      setPhase("results");
      router.refresh(); // refresh the saved-strategies list
    },
    [router]
  );

  // Reopening a strategy that stopped half-way continues where it left off.
  useEffect(() => {
    if (props.initialStrategy && props.initialStrategy.status !== "ready") continueSteps(props.initialStrategy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyze = async (parentId?: string) => {
    if (busy.current) return;
    busy.current = true;
    setFieldErrors({});
    setSourceProblem(null);
    setError(null);
    setPhase("working");
    setSteps(["active", "pending", "pending"]);
    const form = new FormData();
    form.append("websiteUrl", input.websiteUrl);
    form.append("socialUrl", input.socialUrl);
    for (const [k, v] of Object.entries(input.context)) if (v) form.append(`ctx_${k}`, v);
    if (input.notes) form.append("socialNotes", input.notes);
    for (const f of input.files) form.append("screenshots", f);
    if (parentId) form.append("parentId", parentId);
    const r = await call("/api/strategy/analyze", { method: "POST", body: form });
    busy.current = false;
    if (!r.ok) {
      if (r.data.fieldErrors) setFieldErrors(r.data.fieldErrors as Record<string, string>);
      if (r.status === 422 && r.data.sources) {
        setSourceProblem({ sources: r.data.sources as SourceReport[], fallback: String(r.data.fallback ?? "") });
        setPhase("input");
        return;
      }
      if (r.status === 400) {
        setPhase("input");
        setError({ message: String(r.data.error ?? "Please check the links."), retry: null });
        return;
      }
      setSteps(["failed", "pending", "pending"]);
      setError({ message: String(r.data.error ?? "The analysis failed."), retry: () => analyze(parentId) });
      return;
    }
    const s = r.data.strategy as Strategy;
    setRerunOf(null);
    setStrategy(s);
    setGenerations([]);
    setUrl(s.id);
    await continueSteps(s);
  };

  const openHistory = (id: string) => {
    window.location.href = `${pathname}?s=${id}`;
  };

  const startNew = () => {
    setStrategy(null);
    setGenerations([]);
    setPhase("input");
    setError(null);
    setSourceProblem(null);
    setInput({ websiteUrl: "", socialUrl: "", context: {}, notes: "", files: [] });
    setRerunOf(null);
    setUrl(null);
  };

  if (props.setupMissing) {
    return (
      <Notice title="Creative Strategy isn't set up yet">
        The database tables for this feature don&apos;t exist yet. Run <code className="text-brand-light">supabase/migration-015-creative-strategy.sql</code> in Supabase, then reload.
      </Notice>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {phase === "input" && (
        <div className="cs-stage">
          <BrandInput
            value={input}
            onChange={setInput}
            onSubmit={() => analyze(rerunOf ?? undefined)}
            rerun={!!rerunOf}
            fieldErrors={fieldErrors}
            error={error?.message ?? null}
            sourceProblem={sourceProblem}
            disabled={!props.isPaying || !props.aiReady}
            disabledReason={!props.isPaying ? "plan" : !props.aiReady ? "ai" : null}
          />
          {props.history.length > 0 && (
            <section className="mx-auto mt-10 max-w-2xl">
              <h2 className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
                <History size={14} /> Your saved strategies
              </h2>
              <ul className="mt-3 divide-y divide-base-border overflow-hidden rounded-2xl border border-base-border bg-base-card">
                {props.history.map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => openHistory(h.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-base-surface">
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink-primary">{h.brand_name ?? h.website_url ?? h.social_url}</span>
                        <span className="block truncate text-xs text-ink-muted">
                          v{h.version} · {new Date(h.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {h.website_url ?? h.social_url}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-brand-light">{h.status === "ready" ? "Open" : "Continue"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {phase === "working" && (
        <div className="cs-stage mx-auto max-w-xl pt-6">
          <Progress steps={steps} brand={strategy?.brand_name ?? input.websiteUrl ?? input.socialUrl} />
          {error && (
            <div role="alert" className="mt-6 rounded-2xl border border-accent-red/30 bg-accent-red/5 p-4 text-sm text-ink-primary">
              <p className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent-red" /> {error.message}
              </p>
              <div className="mt-3 flex gap-2">
                {error.retry && (
                  <button type="button" onClick={error.retry} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white">
                    Try again
                  </button>
                )}
                <button type="button" onClick={startNew} className="rounded-lg border border-base-border px-3 py-1.5 text-xs text-ink-secondary">
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "results" && strategy && (
        <div className="cs-stage">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {props.history.length > 1 && (
              <select
                aria-label="Open a saved strategy"
                value={strategy.id}
                onChange={(e) => openHistory(e.target.value)}
                className="h-9 max-w-full rounded-xl border border-base-border bg-base-card px-3 text-sm text-ink-secondary"
              >
                {props.history.map((h) => (
                  <option key={h.id} value={h.id}>
                    {(h.brand_name ?? h.website_url ?? h.social_url ?? "").slice(0, 40)} · v{h.version} · {new Date(h.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={startNew} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-base-border px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary">
              <Plus size={14} /> New analysis
            </button>
          </div>
          <StrategyResults
            strategy={strategy}
            generations={generations}
            setGenerations={setGenerations}
            imagesReady={props.imagesReady}
            creditCost={props.creditCost}
            onStrategy={(s) => setStrategy(s)}
            onRevised={async (s) => {
              setStrategy(s);
              setGenerations([]);
              setUrl(s.id);
              await continueSteps(s);
            }}
            onReanalyze={() => {
              setInput((i) => ({ ...i, websiteUrl: strategy.website_url ?? "", socialUrl: strategy.social_url ?? "", context: strategy.user_context ?? {} }));
              setRerunOf(strategy.id);
              setPhase("input");
            }}
          />
        </div>
      )}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-base-border bg-base-card p-6 text-sm text-ink-secondary">
      <h2 className="font-medium text-ink-primary">{title}</h2>
      <p className="mt-2 leading-relaxed">{children}</p>
    </div>
  );
}
