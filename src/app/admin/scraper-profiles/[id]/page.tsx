"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/app/components/Navbar";
import ScraperArchiveDialog from "@/components/admin/ScraperArchiveDialog";
import ScraperCommandGuide from "@/components/admin/ScraperCommandGuide";
import ScraperProfileForm, { ScraperProfileFormPayload } from "@/components/admin/ScraperProfileForm";
import ScraperProfileStats from "@/components/admin/ScraperProfileStats";
import ScraperRecoveryPanel from "@/components/admin/ScraperRecoveryPanel";
import ScraperWarmupPanel from "@/components/admin/ScraperWarmupPanel";
import type { DevtoolsStatus, DevtoolsTarget, ScraperProfile, ScraperProfileDetailResponse } from "@/lib/scraperProfiles";

async function parseApiResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") || "application/json";
    if (!contentType.toLowerCase().includes("application/json")) {
        const preview = (await response.text()).slice(0, 160);
        throw new Error(`Expected JSON but received ${contentType}. Preview: ${preview}`);
    }

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
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const profileId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);
    const [detail, setDetail] = useState<ScraperProfileDetailResponse | null>(null);
    const [targets, setTargets] = useState<DevtoolsTarget[]>([]);
    const [debugStatus, setDebugStatus] = useState<DevtoolsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [debugStatusLoading, setDebugStatusLoading] = useState(false);
    const [targetsLoading, setTargetsLoading] = useState(false);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [busyAction, setBusyAction] = useState("");

    async function refreshDetail() {
        setLoading(true);
        try {
            const nextDetail = await fetch(`/internal-api/admin/scraper-profiles/${profileId}`, { cache: "no-store" }).then((response) =>
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
            setTargets([]);
            setDebugStatus(null);
            void refreshDetail();
        }
    }, [profileId]);

    useEffect(() => {
        const syncEditFromHash = () => {
            if (typeof window === "undefined") {
                return;
            }
            setEditing(window.location.hash === "#edit");
        };

        syncEditFromHash();
        window.addEventListener("hashchange", syncEditFromHash);
        return () => window.removeEventListener("hashchange", syncEditFromHash);
    }, []);

    async function runProfileAction(path: string, body?: Record<string, unknown>) {
        setBusyAction(path);
        try {
            const response = await fetch(`/internal-api/admin/scraper-profiles/${profileId}${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (path === "/delete") {
                await parseApiResponse<{ ok: true }>(response);
                router.push("/admin/scraper-profiles");
                router.refresh();
                return;
            }

            await parseApiResponse<{ profile: ScraperProfile }>(response);
            if (path === "/recovery/start" || path === "/recovery/finish") {
                setDebugStatus(null);
                setTargets([]);
            }
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
            const payload = await fetch(`/internal-api/admin/scraper-profiles/${profileId}/devtools/targets`, { cache: "no-store" }).then((response) =>
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

    async function checkDebugStatus() {
        setDebugStatusLoading(true);
        try {
            const payload = await fetch(`/internal-api/admin/scraper-profiles/${profileId}/devtools/status`, { cache: "no-store" }).then((response) =>
                parseApiResponse<{ status: DevtoolsStatus }>(response),
            );
            setDebugStatus(payload.status);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to check DevTools status.");
        } finally {
            setDebugStatusLoading(false);
        }
    }

    async function saveEdit(payload: ScraperProfileFormPayload) {
        setBusyAction("edit");
        try {
            await fetch(`/internal-api/admin/scraper-profiles/${profileId}`, {
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

                <section className="admin-card" id="setup">
                    <div className="admin-card-header">
                        <div>
                            <h3>Setup Checklist</h3>
                            <p className="text-muted">Creating a profile only adds the app record. You still need to finish the VPS steps below before the worker can really use it.</p>
                        </div>
                    </div>
                    <div className="admin-checklist">
                        <div className="admin-checklist-step">
                            <strong>1. App record:</strong> already created for worker <code>{profile.assignedWorkerId}</code>.
                        </div>
                        <div className="admin-checklist-step">
                            <strong>2. VPS setup:</strong> run the setup commands below to create the folder and restart the worker.
                        </div>
                        <div className="admin-checklist-step">
                            <strong>3. Existing logged-in session:</strong> if this profile already works on the VPS, jump to Warmup and trigger it manually.
                        </div>
                        <div className="admin-checklist-step">
                            <strong>4. Needs login or CAPTCHA solve:</strong> use the Recovery section, then come back and run Warmup manually.
                        </div>
                    </div>
                    <div className="admin-inline-note">
                        <strong>Important:</strong> profiles in <code>pending_setup</code>, <code>warming</code>, or <code>recovering</code> do not carry normal search traffic yet. Finish the flow here first.
                    </div>
                    <div className="admin-action-row">
                        <a className="btn-secondary" href="#warmup">Go To Warmup</a>
                        <a className="btn-secondary" href="#recovery">Go To Recovery</a>
                    </div>
                </section>

                {editing ? (
                    <section id="edit">
                        <ScraperProfileForm
                            initialProfile={profile}
                            mode="edit"
                            onCancel={() => {
                                setEditing(false);
                                if (typeof window !== "undefined") {
                                    history.replaceState(null, "", window.location.pathname);
                                }
                            }}
                            onSubmit={saveEdit}
                            submitting={busyAction === "edit"}
                        />
                    </section>
                ) : null}

                <ScraperProfileStats stats={stats} />

                <ScraperRecoveryPanel
                    actionBusy={actionBusy}
                    loadingStatus={debugStatusLoading}
                    loadingTargets={targetsLoading}
                    onCheckStatus={checkDebugStatus}
                    onFinishRecovery={() => runProfileAction("/recovery/finish")}
                    onRefreshTargets={refreshTargets}
                    onStartRecovery={() => runProfileAction("/recovery/start")}
                    profile={profile}
                    recoverySteps={commandGuides.recovery}
                    status={debugStatus}
                    targets={targets}
                />

                <ScraperWarmupPanel
                    actionBusy={actionBusy}
                    onResetRisk={() => runProfileAction("/reset-risk")}
                    onStartWarmup={(warmupQuery) => runProfileAction("/warmup/start", { warmupQuery })}
                    profile={profile}
                />

                <ScraperCommandGuide steps={commandGuides.add} title="VPS Setup Commands" />

                <section className="admin-card admin-card-danger">
                    <div className="admin-card-header">
                        <div>
                            <h3>Delete Checklist</h3>
                            <p className="text-muted">Delete removes the app record only. Use the VPS cleanup commands first if you want to move or remove the real browser profile directory.</p>
                        </div>
                    </div>
                    <div className="admin-checklist">
                        <div className="admin-checklist-step">
                            <strong>1. Stop using the profile:</strong> make sure it is not your active worker session.
                        </div>
                        <div className="admin-checklist-step">
                            <strong>2. VPS cleanup:</strong> copy and run the cleanup commands below if you want to move the directory out of service first.
                        </div>
                        <div className="admin-checklist-step">
                            <strong>3. App delete:</strong> after that, click Delete Profile to remove the database record.
                        </div>
                    </div>
                </section>
                <ScraperCommandGuide steps={commandGuides.cleanup} title="VPS Cleanup Commands" />
                <ScraperArchiveDialog actionBusy={actionBusy} onDelete={() => runProfileAction("/delete")} profile={profile} />

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
