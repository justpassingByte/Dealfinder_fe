"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import ScraperArchiveDialog from "@/components/admin/ScraperArchiveDialog";
import ScraperCommandGuide from "@/components/admin/ScraperCommandGuide";
import ScraperProfileForm, { ScraperProfileFormPayload } from "@/components/admin/ScraperProfileForm";
import ScraperProfileStats from "@/components/admin/ScraperProfileStats";
import ScraperRecoveryPanel from "@/components/admin/ScraperRecoveryPanel";
import ScraperWarmupPanel from "@/components/admin/ScraperWarmupPanel";
import type { DevtoolsTarget, ScraperProfile, ScraperProfileDetailResponse } from "@/lib/scraperProfiles";

async function parseApiResponse<T>(response: Response): Promise<T> {
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
    }
    return payload as T;
}

function formatDate(value: string | null): string {
    if (!value) {
        return "Never";
    }
    return new Date(value).toLocaleString();
}

function statusClass(status: string): string {
    return `admin-status admin-status-${status}`;
}

export default function ScraperProfileDetailPage() {
    const params = useParams<{ id: string }>();
    const profileId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
    const [detail, setDetail] = useState<ScraperProfileDetailResponse | null>(null);
    const [targets, setTargets] = useState<DevtoolsTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [targetsLoading, setTargetsLoading] = useState(false);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [busyAction, setBusyAction] = useState("");

    async function refreshDetail() {
        setLoading(true);
        try {
            const nextDetail = await fetch(`/api/admin/scraper-profiles/${profileId}`, { cache: "no-store" }).then((response) =>
                parseApiResponse<ScraperProfileDetailResponse>(response),
            );
            setDetail(nextDetail);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to load scraper profile.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (profileId) {
            void refreshDetail();
        }
    }, [profileId]);

    async function runProfileAction(path: string, body?: Record<string, unknown>) {
        setBusyAction(path);
        try {
            await fetch(`/api/admin/scraper-profiles/${profileId}${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            }).then((response) => parseApiResponse<{ profile: ScraperProfile }>(response));
            await refreshDetail();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Action failed.");
        } finally {
            setBusyAction("");
        }
    }

    async function refreshTargets() {
        setTargetsLoading(true);
        try {
            const payload = await fetch(`/api/admin/scraper-profiles/${profileId}/devtools/targets`, { cache: "no-store" }).then((response) =>
                parseApiResponse<{ targets: DevtoolsTarget[] }>(response),
            );
            setTargets(payload.targets);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to load DevTools targets.");
        } finally {
            setTargetsLoading(false);
        }
    }

    async function saveEdit(payload: ScraperProfileFormPayload) {
        setBusyAction("edit");
        try {
            await fetch(`/api/admin/scraper-profiles/${profileId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).then((response) => parseApiResponse<{ profile: ScraperProfile }>(response));
            setEditing(false);
            await refreshDetail();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to save profile.");
        } finally {
            setBusyAction("");
        }
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="container admin-page">
                    <div className="loader-wrapper">
                        <div className="spinner" />
                        <p>Loading profile detail...</p>
                    </div>
                </main>
            </>
        );
    }

    if (!detail) {
        return (
            <>
                <Navbar />
                <main className="container admin-page">
                    <div className="error-box">
                        <h2>Profile not found</h2>
                        <p>{error || "The requested scraper profile could not be loaded."}</p>
                    </div>
                </main>
            </>
        );
    }

    const { profile, stats, commandGuides, recentEvents } = detail;
    const actionBusy = busyAction !== "";

    return (
        <>
            <Navbar />
            <main className="container admin-page">
                <div className="admin-page-header">
                    <div>
                        <Link className="back-link" href="/admin/scraper-profiles">
                            Back to profiles
                        </Link>
                        <h1>{profile.displayName}</h1>
                        <p className="text-muted">Worker {profile.assignedWorkerId} | mount {profile.profileMountName}</p>
                    </div>
                    <div className="admin-action-row">
                        <span className={statusClass(profile.effectiveStatus)}>{profile.effectiveStatus}</span>
                        <button className="btn-secondary" onClick={() => void refreshDetail()} type="button">
                            Refresh
                        </button>
                        <button className="btn-secondary" onClick={() => setEditing((current) => !current)} type="button">
                            {editing ? "Close Edit" : "Edit"}
                        </button>
                    </div>
                </div>

                {error ? <div className="auth-error">{error}</div> : null}

                <section className="admin-card">
                    <div className="admin-detail-grid">
                        <div>
                            <span className="admin-summary-label">Risk Score</span>
                            <strong className="admin-summary-value">{profile.riskScore}</strong>
                        </div>
                        <div>
                            <span className="admin-summary-label">Last Heartbeat</span>
                            <strong>{formatDate(profile.lastHeartbeatAt)}</strong>
                        </div>
                        <div>
                            <span className="admin-summary-label">Last Success</span>
                            <strong>{formatDate(profile.lastSuccessAt)}</strong>
                        </div>
                        <div>
                            <span className="admin-summary-label">Last CAPTCHA</span>
                            <strong>{formatDate(profile.lastCaptchaAt)}</strong>
                        </div>
                    </div>
                    {profile.notes ? <p className="admin-inline-note">{profile.notes}</p> : null}
                </section>

                {editing ? (
                    <ScraperProfileForm
                        initialProfile={profile}
                        mode="edit"
                        onCancel={() => setEditing(false)}
                        onSubmit={saveEdit}
                        submitting={busyAction === "edit"}
                    />
                ) : null}

                <ScraperProfileStats stats={stats} />

                <ScraperRecoveryPanel
                    actionBusy={actionBusy}
                    loadingTargets={targetsLoading}
                    onFinishRecovery={(warmupQuery) => runProfileAction("/recovery/finish", { warmupQuery })}
                    onRefreshTargets={refreshTargets}
                    onStartRecovery={() => runProfileAction("/recovery/start")}
                    profile={profile}
                    recoverySteps={commandGuides.recovery}
                    targets={targets}
                />

                <ScraperWarmupPanel
                    actionBusy={actionBusy}
                    onResetRisk={() => runProfileAction("/reset-risk")}
                    onStartWarmup={(warmupQuery) => runProfileAction("/warmup/start", { warmupQuery })}
                    profile={profile}
                />

                <ScraperCommandGuide steps={commandGuides.add} title="Add / Setup Commands" />
                <ScraperCommandGuide steps={commandGuides.archive} title="Archive / Cleanup Commands" />
                <ScraperArchiveDialog actionBusy={actionBusy} onArchive={() => runProfileAction("/archive")} profile={profile} />

                <section className="admin-card">
                    <div className="admin-card-header">
                        <div>
                            <h3>Recent Events</h3>
                            <p className="text-muted">Use these entries to audit status changes, risk changes, and worker activity.</p>
                        </div>
                    </div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Event</th>
                                    <th>Status</th>
                                    <th>Risk Delta</th>
                                    <th>Latency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map((event) => (
                                    <tr key={event.id}>
                                        <td>{formatDate(event.createdAt)}</td>
                                        <td>{event.eventType}</td>
                                        <td>{event.oldStatus || "N/A"} -&gt; {event.newStatus || "N/A"}</td>
                                        <td>{event.riskDelta}</td>
                                        <td>{event.latencyMs ? `${event.latencyMs} ms` : "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}
