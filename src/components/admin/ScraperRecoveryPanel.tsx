"use client";

import { useMemo, useState } from "react";
import { DevtoolsStatus, DevtoolsTarget, ScraperCommandStep, ScraperProfile } from "@/lib/scraperProfiles";

interface Props {
    profile: ScraperProfile;
    recoverySteps: ScraperCommandStep[];
    targets: DevtoolsTarget[];
    status: DevtoolsStatus | null;
    loadingStatus?: boolean;
    loadingTargets?: boolean;
    actionBusy?: boolean;
    onStartRecovery: () => Promise<void> | void;
    onCheckStatus: () => Promise<void> | void;
    onRefreshTargets: () => Promise<void> | void;
    onFinishRecovery: () => Promise<void> | void;
}

export default function ScraperRecoveryPanel({
    profile,
    recoverySteps,
    targets,
    status,
    loadingStatus = false,
    loadingTargets = false,
    actionBusy = false,
    onStartRecovery,
    onCheckStatus,
    onRefreshTargets,
    onFinishRecovery,
}: Props) {
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
    const tunnelPort = profile.debugTunnelPort ?? profile.browserTargetPort;
    const localDevtoolsHome = useMemo(() => `http://127.0.0.1:${tunnelPort}`, [tunnelPort]);
    const recommendedTarget = targets.find((target) => target.type === "page") ?? targets[0] ?? null;

    async function handleCopy(command: string) {
        await navigator.clipboard.writeText(command);
        setCopiedCommand(command);
        setTimeout(() => setCopiedCommand(null), 1500);
    }

    async function handleStartRecovery() {
        await onStartRecovery();
    }

    const statusMessage = useMemo(() => {
        if (!status) {
            return "Check Debug Status after you open the SSH tunnel. The backend will try the configured worker endpoint first, then fall back to the host-mapped debug port for this profile.";
        }

        if (status.reachable) {
            return `Backend reached DevTools at ${status.debugHost}:${status.debugPort}. ${status.targetCount} visible target(s) found. If your SSH tunnel is running, local Inspect links should now work on 127.0.0.1:${status.localTunnelPort}.`;
        }

        return status.error || "Backend could not reach any DevTools endpoint for this profile. Check worker health and host port mapping before refreshing targets.";
    }, [status]);

    return (
        <section className="admin-card" id="recovery">
            <div className="admin-card-header">
                <div>
                    <h3>Recovery</h3>
                    <p className="text-muted">Start recovery, run the SSH tunnel command in your terminal, refresh targets, inspect, then finish recovery. Warmup is a separate manual step below.</p>
                </div>
            </div>

            <div className="admin-checklist admin-checklist-compact">
                <div className="admin-checklist-step">
                    <strong>1. Start Recovery:</strong> move the profile into recovery mode before you touch DevTools.
                </div>
                <div className="admin-checklist-step">
                    <strong>2. Run the SSH command:</strong> copy the tunnel command below and keep that terminal open on your machine.
                </div>
                <div className="admin-checklist-step">
                    <strong>3. Check Debug Status:</strong> the backend verifies the assigned worker exposes the DevTools endpoint on the VPS.
                </div>
                <div className="admin-checklist-step">
                    <strong>4. Refresh Targets:</strong> once the worker debug endpoint is healthy, fetch the target list and build local inspect links.
                </div>
                <div className="admin-checklist-step">
                    <strong>5. Inspect locally:</strong> the Inspect button opens <code>127.0.0.1:{tunnelPort}</code> in a new tab on your machine.
                </div>
                <div className="admin-checklist-step">
                    <strong>6. Finish Recovery:</strong> once CAPTCHA/login is solved, finish here and then trigger Warmup manually.
                </div>
            </div>

            <div className="admin-recovery-actions">
                <button className="btn-primary" disabled={actionBusy} onClick={() => void handleStartRecovery()} type="button">
                    1. Start Recovery
                </button>
                <button className="btn-secondary" disabled={actionBusy || loadingStatus} onClick={() => void onCheckStatus()} type="button">
                    {loadingStatus ? "Checking..." : "3. Check Debug Status"}
                </button>
            </div>

            <div className="admin-inline-note">
                <strong>Current status:</strong> {profile.effectiveStatus}
                {" | "}
                <strong>Tunnel port:</strong> {tunnelPort}
            </div>

            <div className="admin-inline-note">
                <strong>Debug status:</strong> {status?.reachable ? "Reachable" : status ? "Not reachable" : "Not checked yet"}
                {" | "}
                {statusMessage}
            </div>

            <div className="command-guide-list">
                {recoverySteps.map((step, index) => (
                    <article className="command-guide-step" key={step.title}>
                        <div className="command-guide-meta">
                            <div>
                                <h4>{index + 1}. {step.title}</h4>
                                <p className="text-muted">{step.description}</p>
                            </div>
                            <button
                                className="btn-secondary btn-sm"
                                onClick={() => void handleCopy(step.command)}
                                type="button"
                            >
                                {copiedCommand === step.command ? "Copied" : "Copy"}
                            </button>
                        </div>
                        <pre className="command-guide-pre">{step.command}</pre>
                    </article>
                ))}
            </div>

            <div className="admin-action-row">
                <button className="btn-secondary" disabled={!status?.reachable || loadingTargets} onClick={() => void onRefreshTargets()} type="button">
                    {loadingTargets ? "Refreshing..." : "4. Refresh Targets"}
                </button>
                <a className="btn-secondary" href={localDevtoolsHome} rel="noreferrer" target="_blank">
                    Open Local DevTools Home
                </a>
                {recommendedTarget ? (
                    <a className="btn-primary" href={recommendedTarget.localInspectorUrl} rel="noreferrer" target="_blank">
                        5. Open Recommended Inspect
                    </a>
                ) : null}
            </div>

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

            <button className="btn-primary" disabled={actionBusy} onClick={() => void onFinishRecovery()} type="button">
                6. Finish Recovery
            </button>
        </section>
    );
}
