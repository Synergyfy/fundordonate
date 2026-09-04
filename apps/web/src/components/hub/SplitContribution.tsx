// =============================================================================
// UK Hub — Split Contribution Widget
// One amount, split across several destinations (city / borough / high
// street), each as Fund or Donate — or the full amount to a single cause.
// Demo planner: no payment is taken.
// =============================================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSplitDestinations } from "@/data/ukHubData";

type SplitLevel = "CITY" | "BOROUGH" | "HIGH_STREET";
type SplitMode = "FUND" | "DONATE";

interface SplitRow {
  key: number;
  level: SplitLevel;
  place: string;
  mode: SplitMode;
  pounds: string;
}

const LEVELS: { value: SplitLevel; label: string; icon: string; hint: string }[] = [
  { value: "CITY", label: "City", icon: "🏙️", hint: "A whole city hub" },
  { value: "BOROUGH", label: "Borough", icon: "🏘️", hint: "A borough within a city" },
  { value: "HIGH_STREET", label: "High street", icon: "🛒", hint: "A local high street" },
];

function toPence(pounds: string): number {
  const n = parseFloat(pounds);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

function gbp(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

let rowKey = 0;
const nextKey = () => ++rowKey;

interface SplitContributionProps {
  scopeCitySlug?: string | null;
  scopeCityName?: string | null;
}

export function SplitContribution({ scopeCitySlug, scopeCityName }: SplitContributionProps) {
  const dest = useMemo(() => getSplitDestinations(scopeCitySlug), [scopeCitySlug]);
  const defaultCity = scopeCitySlug ?? "";

  const [totalPounds, setTotalPounds] = useState("100");
  const [mode, setMode] = useState<"single" | "split">("split");
  const [singleLevel, setSingleLevel] = useState<SplitLevel>("CITY");
  const [singlePlace, setSinglePlace] = useState(defaultCity);
  const [singleMode, setSingleMode] = useState<SplitMode>("DONATE");
  const [rows, setRows] = useState<SplitRow[]>([
    { key: nextKey(), level: "CITY", place: defaultCity, mode: "DONATE", pounds: "50" },
    { key: nextKey(), level: "BOROUGH", place: "", mode: "DONATE", pounds: "50" },
  ]);
  const [done, setDone] = useState(false);

  const totalPence = toPence(totalPounds);

  const placesFor = (level: SplitLevel) =>
    level === "CITY" ? dest.cities : level === "BOROUGH" ? dest.boroughs : dest.highStreets;

  const placeName = (level: SplitLevel, slug: string) =>
    placesFor(level).find(p => p.slug === slug)?.name ?? "";

  const patchRow = (key: number, patch: Partial<SplitRow>) =>
    setRows(rs => rs.map(r => {
      if (r.key !== key) return r;
      const next = { ...r, ...patch };
      if (patch.level && patch.level !== r.level) next.place = "";
      return next;
    }));

  const addRow = () => {
    if (rows.length >= 4) return;
    setRows(rs => [...rs, { key: nextKey(), level: "CITY", place: defaultCity, mode: "DONATE", pounds: "" }]);
  };

  const removeRow = (key: number) => {
    if (rows.length <= 2) return;
    setRows(rs => rs.filter(r => r.key !== key));
  };

  const splitEvenly = () => {
    if (totalPence <= 0 || rows.length === 0) return;
    const base = Math.floor(totalPence / rows.length);
    const rem = totalPence - base * rows.length;
    setRows(rs => rs.map((r, i) => ({ ...r, pounds: String((base + (i < rem ? 1 : 0)) / 100) })));
  };

  const rowPence = (r: SplitRow) => toPence(r.pounds);
  const allocated = rows.reduce((s, r) => s + rowPence(r), 0);
  const remaining = totalPence - allocated;

  const singleValid = totalPence > 0 && singlePlace !== "" && placesFor(singleLevel).some(p => p.slug === singlePlace);
  const splitValid =
    totalPence > 0 &&
    rows.every(r => r.place !== "" && rowPence(r) > 0 && placesFor(r.level).some(p => p.slug === r.place)) &&
    remaining === 0;

  const summary = mode === "single"
    ? [{ level: singleLevel, place: singlePlace, mode: singleMode, pence: totalPence }]
    : rows.map(r => ({ level: r.level, place: r.place, mode: r.mode, pence: rowPence(r) }));

  const levelLabel = (l: SplitLevel) => LEVELS.find(x => x.value === l)?.label ?? l;
  const levelIcon = (l: SplitLevel) => LEVELS.find(x => x.value === l)?.icon ?? "📍";

  if (done) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h3 className="mt-3 text-xl font-bold text-gray-900">Your split plan is ready</h3>
        <p className="mt-1 text-sm text-gray-500">
          {gbp(totalPence)} across {summary.length} {summary.length === 1 ? "cause" : "causes"}
          {scopeCityName ? ` in ${scopeCityName}` : " across the UK Hub"}.
        </p>
        <ul className="mx-auto mt-5 max-w-md space-y-2 text-left">
          {summary.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <span>{levelIcon(s.level)}</span>
                <span className="font-medium">{placeName(s.level, s.place)}</span>
                <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${s.mode === "FUND" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {s.mode === "FUND" ? "FUND" : "DONATE"}
                </span>
              </span>
              <span className="font-bold text-gray-900">{gbp(s.pence)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-gray-400">Demo plan — no payment is taken here. Continue to campaigns to back each cause.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/campaigns" className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            Browse campaigns →
          </Link>
          <Link
            to={scopeCitySlug ? `/uk-hub-activation/${scopeCitySlug}` : "/uk-hub-activation"}
            className="inline-flex items-center rounded-lg border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {scopeCityName ? `Back to ${scopeCityName} hub` : "Back to UK hub"}
          </Link>
        </div>
        <button onClick={() => setDone(false)} className="mt-3 text-xs font-semibold text-gray-400 hover:text-gray-600">
          Adjust plan
        </button>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100";
  const selectCls = "w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 focus:border-primary-400 focus:outline-none";

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      {/* Step 1 — Amount */}
      <h3 className="font-bold text-gray-900">1 · How much do you want to contribute?</h3>
      <div className="mt-2 flex max-w-xs items-center gap-2">
        <span className="text-lg font-bold text-gray-400">£</span>
        <input
          type="number" min="1" step="0.01" value={totalPounds}
          onChange={e => setTotalPounds(e.target.value)}
          className={inputCls} placeholder="100"
        />
      </div>

      {/* Step 2 — One cause or split */}
      <h3 className="mt-6 font-bold text-gray-900">2 · One cause, or split it?</h3>
      <div className="mt-2 inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
        <button
          type="button" onClick={() => setMode("single")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${mode === "single" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          Full amount, one cause
        </button>
        <button
          type="button" onClick={() => setMode("split")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${mode === "split" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
        >
          Split up to 4 ways
        </button>
      </div>

      {/* Step 3 — Destinations */}
      <h3 className="mt-6 font-bold text-gray-900">
        3 · {mode === "single" ? "Where should it go?" : `Where should each part go? (${rows.length} of 4)`}
      </h3>

      {mode === "single" ? (
        <div className="mt-2 grid gap-2 rounded-xl border bg-gray-50/60 p-3 sm:grid-cols-4">
          <label className="text-xs font-semibold text-gray-500">Level
            <select value={singleLevel} onChange={e => { setSingleLevel(e.target.value as SplitLevel); setSinglePlace(""); }} className={`${selectCls} mt-1`}>
              {LEVELS.map(l => (
                <option key={l.value} value={l.value} disabled={placesFor(l.value).length === 0}>
                  {l.icon} {l.label}{placesFor(l.value).length === 0 ? " (none)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-gray-500 sm:col-span-2">Place
            <select value={singlePlace} onChange={e => setSinglePlace(e.target.value)} className={`${selectCls} mt-1`}>
              <option value="">Choose…</option>
              {placesFor(singleLevel).map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </label>
          <div className="text-xs font-semibold text-gray-500">Fund or Donate
            <div className="mt-1 flex overflow-hidden rounded-lg border border-gray-200">
              {(["FUND", "DONATE"] as SplitMode[]).map(m => (
                <button
                  key={m} type="button" onClick={() => setSingleMode(m)}
                  className={`flex-1 px-2 py-2 text-xs font-bold ${singleMode === m ? (m === "FUND" ? "bg-blue-600 text-white" : "bg-green-600 text-white") : "bg-white text-gray-400"}`}
                >
                  {m === "FUND" ? "Fund" : "Donate"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <div key={r.key} className="grid gap-2 rounded-xl border bg-gray-50/60 p-3 sm:grid-cols-12">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white sm:col-span-1">{i + 1}</span>
              <label className="text-xs font-semibold text-gray-500 sm:col-span-3">Level
                <select value={r.level} onChange={e => patchRow(r.key, { level: e.target.value as SplitLevel })} className={`${selectCls} mt-1`}>
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value} disabled={placesFor(l.value).length === 0}>
                      {l.icon} {l.label}{placesFor(l.value).length === 0 ? " (none)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500 sm:col-span-4">Place
                <select value={r.place} onChange={e => patchRow(r.key, { place: e.target.value })} className={`${selectCls} mt-1`}>
                  <option value="">Choose…</option>
                  {placesFor(r.level).map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
              </label>
              <div className="text-xs font-semibold text-gray-500 sm:col-span-2">Type
                <div className="mt-1 flex overflow-hidden rounded-lg border border-gray-200">
                  {(["FUND", "DONATE"] as SplitMode[]).map(m => (
                    <button
                      key={m} type="button" onClick={() => patchRow(r.key, { mode: m })}
                      className={`flex-1 px-1 py-2 text-[11px] font-bold ${r.mode === m ? (m === "FUND" ? "bg-blue-600 text-white" : "bg-green-600 text-white") : "bg-white text-gray-400"}`}
                    >
                      {m === "FUND" ? "Fund" : "Donate"}
                    </button>
                  ))}
                </div>
              </div>
              <label className="text-xs font-semibold text-gray-500 sm:col-span-1">£
                <input type="number" min="0" step="0.01" value={r.pounds} onChange={e => patchRow(r.key, { pounds: e.target.value })} className={`${inputCls} mt-1 px-2`} placeholder="0" />
              </label>
              <div className="flex items-end sm:col-span-1">
                <button type="button" onClick={() => removeRow(r.key)} disabled={rows.length <= 2} className="w-full rounded-lg border px-2 py-2 text-xs font-bold text-gray-400 hover:text-red-600 disabled:opacity-30" title="Remove">
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={addRow} disabled={rows.length >= 4} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              + Add destination ({rows.length}/4)
            </button>
            <button type="button" onClick={splitEvenly} disabled={totalPence <= 0} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              Split evenly
            </button>
            <span className={`ml-auto text-xs font-bold ${remaining === 0 && totalPence > 0 ? "text-green-600" : remaining < 0 ? "text-red-600" : "text-gray-400"}`}>
              {totalPence <= 0 ? "Enter an amount above" : remaining === 0 ? "✓ Fully allocated" : remaining > 0 ? `${gbp(remaining)} left to allocate` : `${gbp(-remaining)} over — reduce a row`}
            </span>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-400">
        Funding backs ventures and projects · Donating supports causes outright.{" "}
        <Link to="/fund-vs-donate" className="font-semibold text-primary-600 hover:text-primary-700">What's the difference?</Link>
      </p>

      {/* Review + continue */}
      <div className="mt-4 rounded-xl border bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Total contribution</span>
          <span className="text-lg font-bold text-gray-900">{totalPence > 0 ? gbp(totalPence) : "—"}</span>
        </div>
        <button
          type="button" onClick={() => setDone(true)}
          disabled={mode === "single" ? !singleValid : !splitValid}
          className="mt-3 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
        >
          {mode === "single" ? "Continue with this cause →" : "Continue with this split →"}
        </button>
        <p className="mt-1 text-center text-[11px] text-gray-400">
          {mode === "single"
            ? (singleValid ? `${levelLabel(singleLevel)} · ${placeName(singleLevel, singlePlace) || "…"} · ${singleMode === "FUND" ? "Fund" : "Donate"}` : "Choose an amount and a destination to continue.")
            : (splitValid ? "Every pound is allocated. Ready when you are." : "Allocate the full amount across your destinations to continue.")}
        </p>
      </div>
    </div>
  );
}
