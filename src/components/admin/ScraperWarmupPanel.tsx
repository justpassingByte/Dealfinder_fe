"use client";

import { useMemo, useState } from "react";
import { ScraperProfile } from "@/lib/scraperProfiles";

interface Props {
    profile: ScraperProfile;
    actionBusy?: boolean;
    onStartWarmup: (query: string) => Promise<void> | void;
    onResetRisk: () => Promise<void> | void;
}

export default function ScraperWarmupPanel({ profile, actionBusy = false, onStartWarmup, onResetRisk }: Props) {
    const initialQuery = useMemo(() => {
        const candidate = typeof profile.metadata.defaultWarmupQuery === "string"
            ? profile.metadata.defaultWarmupQuery
            : profile.displayName;
        return candidate;
    }, [profile.displayName, profile.metadata]);
    const [warmupQuery, setWarmupQuery] = useState(initialQuery);

    return (
        <section className="admin-card" id="warmup">
            <div className="admin-card-header">
                <div>
                    <h3>Warmup</h3>
                    <p className="text-muted">Trigger warmup manually from here. Use this for imported VPS sessions or after you finish a recovery session.</p>
                </div>
            </div>

            <div className="admin-checklist admin-checklist-compact">
                <div className="admin-checklist-step">
                    <strong>1. Pick a safe query:</strong> use a common keyword that should return normal search results.
                </div>
                <div className="admin-checklist-step">
                    <strong>2. Start Warmup manually:</strong> imported profiles stay non-runnable until you do this.
                </div>
                <div className="admin-checklist-step">
                    <strong>3. Promotion rule:</strong> the profile needs two successful warmup runs before it should be trusted as active traffic again.
                </div>
            </div>

            <div className="admin-inline-note">
                <strong>Warmup streak:</strong> {profile.warmupSuccessStreak}
                {" | "}
                <strong>Risk score:</strong> {profile.riskScore}
            </div>

            <label className="form-group">
                <span>Warmup Query</span>
                <input className="form-input" value={warmupQuery} onChange={(event) => setWarmupQuery(event.target.value)} />
            </label>

            <div className="admin-action-row">
                <button className="btn-primary" disabled={actionBusy} onClick={() => void onStartWarmup(warmupQuery)} type="button">
                    Start Warmup
                </button>
                <button className="btn-secondary" disabled={actionBusy} onClick={() => void onResetRisk()} type="button">
                    Reset Risk
                </button>
            </div>
        </section>
    );
}
