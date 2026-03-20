"use client";

import { useMemo, useState } from "react";
import { DevtoolsTarget, ScraperCommandStep, ScraperProfile } from "@/lib/scraperProfiles";

interface Props {
    profile: ScraperProfile;
    recoverySteps: ScraperCommandStep[];
    targets: DevtoolsTarget[];
    loadingTargets?: boolean;
    actionBusy?: boolean;
    onStartRecovery: () => Promise<void> | void;
    onRefreshTargets: () => Promise<void> | void;
    onFinishRecovery: (warmupQuery: string) => Promise<void> | void;
}

export default function ScraperRecoveryPanel({
    profile,
    recoverySteps,
    targets,
    loadingTargets = false,
    actionBusy = false,
    onStartRecovery,
    onRefreshTargets,
    onFinishRecovery,
}: Props) {
    const defaultWarmupQuery = useMemo(() => {
        const candidate = typeof profile.metadata.pendingWarmupQuery === "string"
            ? profile.metadata.pendingWarmupQuery
            : typeof profile.metadata.defaultWarmupQuery === "string"
                ? profile.metadata.defaultWarmupQuery
                : profile.displayName;
        return candidate;
    }, [profile.displayName, profile.metadata]);

    const [warmupQuery, setWarmupQuery] = useState(defaultWarmupQuery);

    return (
        <section className="admin-card">
            <div className="admin-card-header">
                <div>
                    <h3>Recovery</h3>
                    <p className="text-muted">Start recovery, run the SSH tunnel command in your terminal, refresh targets, inspect, then move the profile into warmup.</p>
                </div>
            </div>

            <div className="admin-recovery-actions">
                <button className="btn-primary" disabled={actionBusy} onClick={() => void onStartRecovery()} type="button">
                    Start Recovery
                </button>
                <button className="btn-secondary" disabled={loadingTargets} onClick={() => void onRefreshTargets()} type="button">
                    {loadingTargets ? "Refreshing..." : "Refresh Targets"}
                </button>
            </div>

            <div className="admin-inline-note">
                <strong>Current status:</strong> {profile.effectiveStatus}
                {" | "}
                <strong>Tunnel port:</strong> {profile.debugTunnelPort ?? profile.browserTargetPort}
            </div>

            <div className="command-guide-list">
                {recoverySteps.map((step) => (
                    <article className="command-guide-step" key={step.title}>
                        <div className="command-guide-meta">
                            <div>
                                <h4>{step.title}</h4>
                                <p className="text-muted">{step.description}</p>
                            </div>
                        </div>
                        <pre className="command-guide-pre">{step.command}</pre>
                    </article>
                ))}
            </div>

            <label className="form-group">
                <span>Warmup Query After Recovery</span>
                <input className="form-input" value={warmupQuery} onChange={(event) => setWarmupQuery(event.target.value)} />
            </label>

            <button className="btn-primary" disabled={actionBusy} onClick={() => void onFinishRecovery(warmupQuery)} type="button">
                Finish Recovery
            </button>

            <div className="admin-target-list">
                {targets.length === 0 ? (
                    <p className="text-muted">No DevTools targets loaded yet. Refresh after the SSH tunnel is running.</p>
                ) : (
                    targets.map((target) => (
                        <article className="admin-target-card" key={target.id}>
                            <div>
                                <h4>{target.title}</h4>
                                <p className="text-muted">{target.url}</p>
                            </div>
                            <a className="btn-secondary btn-sm" href={target.localInspectorUrl} rel="noreferrer" target="_blank">
                                Inspect
                            </a>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
}
