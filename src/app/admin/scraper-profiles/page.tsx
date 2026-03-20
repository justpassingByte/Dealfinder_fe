"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import ScraperProfileForm, { ScraperProfileFormPayload } from "@/components/admin/ScraperProfileForm";
import ScraperProfileSummaryCards from "@/components/admin/ScraperProfileSummaryCards";
import ScraperProfileTable from "@/components/admin/ScraperProfileTable";
import {
    ScraperProfile,
    ScraperProfileListItem,
    ScraperProfileSummary,
} from "@/lib/scraperProfiles";

async function parseApiResponse<T>(response: Response): Promise<T> {
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error || "Request failed.");
    }
    return payload as T;
}

const emptySummary: ScraperProfileSummary = {
    totalProfiles: 0,
    runnableProfiles: 0,
    blockedProfiles: 0,
    recoveringProfiles: 0,
    warmingProfiles: 0,
    offlineProfiles: 0,
    archivedProfiles: 0,
    averageRisk: 0,
    captchaCount24h: 0,
};

function deriveSummaryFromProfiles(profiles: ScraperProfileListItem[]): ScraperProfileSummary {
    const totalRisk = profiles.reduce((sum, profile) => sum + profile.riskScore, 0);

    return {
        totalProfiles: profiles.length,
        runnableProfiles: profiles.filter((profile) => profile.isRunnable).length,
        blockedProfiles: profiles.filter((profile) => profile.effectiveStatus === "blocked").length,
        recoveringProfiles: profiles.filter((profile) => profile.effectiveStatus === "recovering").length,
        warmingProfiles: profiles.filter((profile) => profile.effectiveStatus === "warming").length,
        offlineProfiles: profiles.filter((profile) => profile.effectiveStatus === "offline").length,
        archivedProfiles: profiles.filter((profile) => profile.effectiveStatus === "archived").length,
        averageRisk: profiles.length > 0 ? Number((totalRisk / profiles.length).toFixed(2)) : 0,
        captchaCount24h: profiles.reduce((sum, profile) => sum + profile.stats.captchaCount24h, 0),
    };
}

export default function ScraperProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<ScraperProfileListItem[]>([]);
    const [summary, setSummary] = useState<ScraperProfileSummary>(emptySummary);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function refreshDashboard() {
        setLoading(true);
        try {
            const profilesPayload = await fetch("/api/admin/scraper-profiles", { cache: "no-store" }).then((response) =>
                parseApiResponse<{ profiles: ScraperProfileListItem[] }>(response),
            );

            let summaryPayload = emptySummary;
            try {
                summaryPayload = await fetch("/api/admin/scraper-profiles/summary", { cache: "no-store" }).then((response) =>
                    parseApiResponse<ScraperProfileSummary>(response),
                );
            } catch {
                summaryPayload = deriveSummaryFromProfiles(profilesPayload.profiles);
            }

            setProfiles(profilesPayload.profiles);
            setSummary(summaryPayload);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to load scraper profiles.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void refreshDashboard();
    }, []);

    async function submitProfile(payload: ScraperProfileFormPayload) {
        setSubmitting(true);
        try {
            const created = await fetch("/api/admin/scraper-profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).then((response) => parseApiResponse<{ profile: ScraperProfile }>(response));

            setFormMode(null);
            await refreshDashboard();
            router.push(`/admin/scraper-profiles/${created.profile.id}#setup`);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Failed to save profile.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <Navbar />
            <main className="container admin-page">
                <div className="admin-page-header">
                    <div>
                        <h1>Scraper Profile Dashboard</h1>
                        <p className="text-muted">Add profiles, guide operators through VPS commands, and manage recovery, warmup, and cleanup flows.</p>
                    </div>
                    <div className="admin-action-row">
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setFormMode(null);
                                void refreshDashboard();
                            }}
                            type="button"
                        >
                            Refresh
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setFormMode("create");
                            }}
                            type="button"
                        >
                            Add Profile
                        </button>
                    </div>
                </div>

                {error ? <div className="auth-error">{error}</div> : null}

                {formMode ? (
                    <ScraperProfileForm
                        mode={formMode}
                        onCancel={() => {
                            setFormMode(null);
                        }}
                        onSubmit={submitProfile}
                        submitting={submitting}
                    />
                ) : null}

                {loading ? (
                    <div className="loader-wrapper">
                        <div className="spinner" />
                        <p>Loading scraper dashboard...</p>
                    </div>
                ) : (
                    <>
                        <ScraperProfileSummaryCards summary={summary} />
                        <ScraperProfileTable profiles={profiles} />
                    </>
                )}
            </main>
        </>
    );
}
